import Koa from 'koa';
import Router from '@koa/router';
import cors from '@koa/cors';
import koaStatic from 'koa-static';
import mount from 'koa-mount';
import range from 'koa-range';
import render from '@koa/ejs';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = new Koa();
const router = new Router();
const PORT = process.env.PORT || 8000;

// Enable Range requests for video seeking
app.use(range);
app.use(cors());

// Configure EJS with Layout support
render(app, {
    root: path.join(__dirname, 'views'),
    layout: 'layout',
    viewExt: 'ejs',
    cache: false,
    debug: false
});

// Silence connection resets (noisy logs)
app.on('error', (err) => {
    if (['ECONNRESET', 'EPIPE', 'ECANCELED', 'ERR_STREAM_PREMATURE_CLOSE', 'ECONNABORTED'].includes(err.code)) return;
    console.error('Server error:', err);
});

// --- CONFIGURATION ---
const CACHE_DIR = path.join(__dirname, 'cached_videos');
const META_DIR = path.join(CACHE_DIR, 'metadata');
const SUB_DIR = path.join(CACHE_DIR, 'subtitles');
const THUMB_DIR = path.join(CACHE_DIR, 'thumbnails');
const DATA_DIR = path.join(__dirname, 'server_data');

const HISTORY_FILE = path.join(DATA_DIR, 'history.json');
const PLAYLISTS_FILE = path.join(DATA_DIR, 'playlists.json');
const SUBSCRIPTIONS_FILE = path.join(DATA_DIR, 'subscriptions.json');

// Ensure directories
await fs.ensureDir(CACHE_DIR);
await fs.ensureDir(META_DIR);
await fs.ensureDir(SUB_DIR);
await fs.ensureDir(THUMB_DIR);
await fs.ensureDir(DATA_DIR);

// --- UTILITIES ---
const YT_INFO_CACHE = new Map();
const CACHE_VALID_TIME = 6 * 3600 * 1000;

const MAX_CONCURRENT_YT_DLP = 2;
let activeProcesses = 0;
const ytQueue = [];

const runYtDlp = (args) => new Promise((resolve, reject) => {
    const execute = () => {
        activeProcesses++;
        const p = spawn('python', ['-m', 'yt_dlp', ...args]);
        let so = '', se = '';
        p.stdout.on('data', d => so += d.toString());
        p.stderr.on('data', d => se += d.toString());
        p.on('close', (code) => {
            activeProcesses--;
            if (ytQueue.length > 0) ytQueue.shift()();
            if (code === 0 || (code === 1 && so.trim())) resolve(so);
            else reject(new Error(se || 'yt-dlp failed'));
        });
    };

    if (activeProcesses < MAX_CONCURRENT_YT_DLP) {
        execute();
    } else {
        ytQueue.push(execute);
    }
});

const formatSize = (bytes) => {
    if (!bytes) return "";
    let s = bytes;
    for (const unit of ['B', 'KB', 'MB', 'GB']) {
        if (s < 1024) return `${s.toFixed(1)}${unit}`;
        s /= 1024;
    }
    return `${s.toFixed(1)}TB`;
};

// --- SSR ROUTES ---

router.get('/', async (ctx) => {
    const query = ctx.query.q;
    let results = [];
    if (query) {
        try {
            const searchStr = query.startsWith('http') ? query : `ytsearch20:${query}`;
            const stdout = await runYtDlp(['--quiet', '--no-warnings', '--flat-playlist', '--dump-single-json', searchStr]);
            const info = JSON.parse(stdout);
            const entries = info.entries || [info];

            results = await Promise.all(entries.map(async (entry) => {
                if (!entry) return null;
                const isReady = await fs.pathExists(path.join(CACHE_DIR, `${entry.id}.mp4`));
                return {
                    id: entry.id,
                    title: entry.title,
                    thumbnail: entry.thumbnail || entry.thumbnails?.[0]?.url,
                    uploader: entry.uploader || entry.channel,
                    duration: entry.duration,
                    views: entry.view_count || 0,
                    is_offline: isReady
                };
            }));
            results = results.filter(r => r);
        } catch (e) { console.error(e); }
    }
    await ctx.render('home', {
        results,
        query,
        activePage: 'home',
        title: query ? `Hasil Pencarian: ${query}` : 'Beranda'
    });
});

router.get('/play', async (ctx) => {
    const videoId = ctx.query.v;
    if (!videoId) return ctx.redirect('/');

    const metaPath = path.join(META_DIR, `${videoId}.json`);
    let videoData = {};

    if (await fs.pathExists(metaPath)) {
        videoData = await fs.readJson(metaPath);
        videoData.stream_url = `/offline/${videoId}.mp4`;
        videoData.is_offline = true;
    } else {
        try {
            const stdout = await runYtDlp(['--quiet', '--no-warnings', '--dump-json', `https://www.youtube.com/watch?v=${videoId}`]);
            const info = JSON.parse(stdout);

            const bestFormat = info.formats.find(f => f.vcodec !== 'none' && f.acodec !== 'none' && f.height <= 480) || info.formats.find(f => f.vcodec !== 'none' && f.acodec !== 'none');

            videoData = {
                id: videoId,
                title: info.title,
                uploader: info.uploader || info.channel,
                channel_id: info.channel_id,
                thumbnail: info.thumbnail,
                duration: info.duration,
                views: info.view_count,
                stream_url: bestFormat?.url,
                is_offline: false,
                subtitles: [] // simplified for initial view
            };

            // Auto-save to history
            let history = await fs.readJson(HISTORY_FILE).catch(() => []);
            const histItem = { id: videoId, title: videoData.title, uploader: videoData.uploader, thumbnail: videoData.thumbnail, duration: videoData.duration, views: videoData.views, channel_id: videoData.channel_id };
            history = [histItem, ...history.filter(h => h.id !== videoId)].slice(0, 100);
            await fs.writeJson(HISTORY_FILE, history, { spaces: 4 });

            // Trigger background download if not exists
            const downloadArgs = [
                '--format', 'best[height<=480][ext=mp4]/best',
                '--output', path.join(CACHE_DIR, `${videoId}.mp4`),
                '--quiet', '--no-warnings',
                `https://www.youtube.com/watch?v=${videoId}`
            ];

            spawn('python', ['-m', 'yt_dlp', ...downloadArgs]).on('close', async (code) => {
                if (code === 0) {
                    await fs.writeJson(metaPath, histItem, { spaces: 4 });
                }
            });

        } catch (e) {
            console.error(e);
            return ctx.body = "Gagal memutar video. Link mungkin mati atau butuh refresh.";
        }
    }

    // Get related videos from history
    const history = await fs.readJson(HISTORY_FILE).catch(() => []);
    const relatedVideos = history.filter(v => v.id !== videoId).slice(0, 10);

    await ctx.render('play', {
        ...videoData,
        relatedVideos,
        activePage: 'none',
        title: videoData.title
    });
});

router.get('/offline', async (ctx) => {
    const files = await fs.readdir(META_DIR);
    const results = [];
    for (const file of files) {
        if (file.endsWith('.json')) {
            try {
                const data = await fs.readJson(path.join(META_DIR, file));
                if (await fs.pathExists(path.join(CACHE_DIR, `${data.id}.mp4`))) {
                    results.push(data);
                }
            } catch (e) { }
        }
    }
    await ctx.render('offline', {
        results: results.reverse(),
        activePage: 'offline',
        title: 'Video Offline'
    });
});

router.get('/history', async (ctx) => {
    const results = await fs.readJson(HISTORY_FILE).catch(() => []);
    await ctx.render('history', {
        results,
        activePage: 'history',
        title: 'Histori Tontonan'
    });
});

router.post('/clear_history', async (ctx) => {
    await fs.writeJson(HISTORY_FILE, [], { spaces: 4 });
    ctx.redirect('/history');
});

router.get('/playlists', async (ctx) => {
    const results = await fs.readJson(PLAYLISTS_FILE).catch(() => ({}));
    await ctx.render('playlists', {
        results,
        activePage: 'playlist',
        title: 'Koleksi Playlist'
    });
});

router.post('/create_playlist', async (ctx) => {
    const { name } = ctx.request.body;
    if (!name) { ctx.status = 400; return; }
    let playlists = await fs.readJson(PLAYLISTS_FILE).catch(() => ({}));
    if (!playlists[name]) {
        playlists[name] = [];
        await fs.writeJson(PLAYLISTS_FILE, playlists, { spaces: 4 });
    }
    ctx.body = { status: "ok" };
});

router.get('/playlists/:name', async (ctx) => {
    const name = ctx.params.name;
    const playlists = await fs.readJson(PLAYLISTS_FILE).catch(() => ({}));
    const results = playlists[name] || [];
    await ctx.render('home', {
        results,
        query: `Playlist: ${name}`,
        activePage: 'playlist',
        title: `Playlist: ${name}`
    });
});

router.get('/api/playlists', async (ctx) => {
    const playlists = await fs.readJson(PLAYLISTS_FILE).catch(() => ({}));
    ctx.body = playlists;
});

router.post('/add_to_playlist', async (ctx) => {
    const { playlistName, video } = ctx.request.body;
    if (!playlistName || !video) { ctx.status = 400; return; }
    let playlists = await fs.readJson(PLAYLISTS_FILE).catch(() => ({}));
    if (playlists[playlistName]) {
        // Prevent duplicates
        if (!playlists[playlistName].find(v => v.id === video.id)) {
            playlists[playlistName].push(video);
            await fs.writeJson(PLAYLISTS_FILE, playlists, { spaces: 4 });
        }
    }
    ctx.body = { status: "ok" };
});

router.get('/subscriptions', async (ctx) => {
    const results = await fs.readJson(SUBSCRIPTIONS_FILE).catch(() => []);
    await ctx.render('subscriptions', {
        results,
        activePage: 'subs',
        title: 'Langganan Saya'
    });
});

// --- API ---
router.get('/api/suggestions', async (ctx) => {
    const q = ctx.query.q;
    if (!q) { ctx.body = []; return; }
    try {
        const res = await fetch(`https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(q)}`);
        const data = await res.json();
        ctx.body = data[1] || [];
    } catch (e) {
        ctx.body = [];
    }
});

router.post('/toggle_subscription', async (ctx) => {
    const { channel_id, uploader } = ctx.request.body;
    let subs = await fs.readJson(SUBSCRIPTIONS_FILE).catch(() => []);
    const idx = subs.findIndex(s => s.channel_id === channel_id);
    if (idx > -1) subs.splice(idx, 1);
    else subs.push({ channel_id, uploader });
    await fs.writeJson(SUBSCRIPTIONS_FILE, subs, { spaces: 4 });
    ctx.body = { status: "ok" };
});

router.delete('/delete_offline/:id', async (ctx) => {
    const id = ctx.params.id;
    await fs.remove(path.join(CACHE_DIR, `${id}.mp4`)).catch(() => { });
    await fs.remove(path.join(META_DIR, `${id}.json`)).catch(() => { });
    ctx.body = { status: "ok" };
});

// Persistent Video State Middleware
app.use(async (ctx, next) => {
    const minId = ctx.query.min;
    // Don't show mini-player if we are on the play page (avoids double player)
    if (minId && ctx.path !== '/play') {
        let videoMeta = null;
        const metaPath = path.join(META_DIR, `${minId}.json`);

        if (await fs.pathExists(metaPath)) {
            videoMeta = await fs.readJson(metaPath);
            videoMeta.stream_url = `/offline/${minId}.mp4`;
        } else {
            // Try to find in history or fetch briefly
            const history = await fs.readJson(HISTORY_FILE).catch(() => []);
            videoMeta = history.find(h => h.id === minId);

            if (!videoMeta) {
                try {
                    const stdout = await runYtDlp(['--quiet', '--no-warnings', '--dump-json', `https://www.youtube.com/watch?v=${minId}`]);
                    const info = JSON.parse(stdout);
                    videoMeta = {
                        id: minId,
                        title: info.title,
                        uploader: info.uploader || info.channel,
                        thumbnail: info.thumbnail,
                        stream_url: info.formats.find(f => f.vcodec !== 'none' && f.acodec !== 'none' && f.height <= 480)?.url
                    };
                } catch (e) { }
            }
        }
        ctx.state.playingVideo = videoMeta;
    }
    await next();
});

// Simple Body Parser
app.use(async (ctx, next) => {
    if (ctx.method === 'POST') {
        const body = await new Promise(res => {
            let data = '';
            ctx.req.on('data', chunk => data += chunk);
            ctx.req.on('end', () => res(data));
        });
        try { ctx.request.body = JSON.parse(body); } catch (e) { ctx.request.body = {}; }
    }
    await next();
});

app.use(router.routes()).use(router.allowedMethods());
app.use(mount('/static', koaStatic(path.join(__dirname, 'static'))));
app.use(mount('/offline', koaStatic(CACHE_DIR)));

app.listen(PORT, '0.0.0.0', () => {
    console.log(`running on http://localhost:${PORT}`);
});
