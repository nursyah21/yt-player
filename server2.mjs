import Koa from 'koa';
import Router from '@koa/router';
import koaStatic from 'koa-static';
import mount from 'koa-mount';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = new Koa();
const router = new Router();
const PORT = process.env.PORT || 8000;

// --- KONFIGURASI FOLDER ---
const CACHE_DIR = path.join(__dirname, 'cached_videos');
const META_DIR = path.join(CACHE_DIR, 'metadata');
const SUB_DIR = path.join(CACHE_DIR, 'subtitles');
const THUMB_DIR = path.join(CACHE_DIR, 'thumbnails');
const DATA_DIR = path.join(__dirname, 'server_data');

const HISTORY_FILE = path.join(DATA_DIR, 'history.json');
const SEARCH_HISTORY_FILE = path.join(DATA_DIR, 'search_history.json');
const PLAYLISTS_FILE = path.join(DATA_DIR, 'playlists.json');
const SUBSCRIPTIONS_FILE = path.join(DATA_DIR, 'subscriptions.json');

// Pastikan direktori ada
await fs.ensureDir(CACHE_DIR);
await fs.ensureDir(META_DIR);
await fs.ensureDir(SUB_DIR);
await fs.ensureDir(THUMB_DIR);
await fs.ensureDir(DATA_DIR);

const initializeFile = async (filePath, defaultValue = []) => {
    if (!(await fs.pathExists(filePath))) {
        await fs.writeJson(filePath, defaultValue, { spaces: 4 });
    }
};

await initializeFile(HISTORY_FILE);
await initializeFile(SEARCH_HISTORY_FILE);
await initializeFile(PLAYLISTS_FILE, {});
await initializeFile(SUBSCRIPTIONS_FILE);

// --- UTILITIES & CACHE ---
const YT_INFO_CACHE = new Map();
const activeDownloads = new Map();

const formatSize = (bytes) => {
    if (!bytes) return "";
    let s = bytes;
    for (const unit of ['B', 'KB', 'MB', 'GB']) {
        if (s < 1024) return `${s.toFixed(1)}${unit}`;
        s /= 1024;
    }
    return `${s.toFixed(1)}TB`;
};

// Helper untuk menjalankan yt-dlp
const runYtDlp = (args) => new Promise((resolve, reject) => {
    const p = spawn('python', ['-m', 'yt_dlp', ...args]);
    let so = '', se = '';
    p.stdout.on('data', d => so += d.toString());
    p.stderr.on('data', d => se += d.toString());
    p.on('close', code => (code === 0 || (code === 1 && so.trim())) ? resolve(so) : reject(new Error(se)));
});

// Middleware Body Parser Sederhana
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

// --- LOGIKA DOWNLOAD & SUBTITLE ---
async function downloadSubtitle(url, videoId, lang) {
    const localName = `${videoId}_${lang}.vtt`;
    const localPath = path.join(SUB_DIR, localName);
    try {
        const resp = await fetch(url);
        const text = await resp.text();
        if (text.startsWith("WEBVTT")) {
            await fs.writeFile(localPath, text);
            return `/subs/${localName}`;
        }
    } catch (e) { console.error("Sub error:", e.message); }
    return null;
}

// --- ROUTES ---

router.get('/', async (ctx) => {
    ctx.type = 'html';
    ctx.body = await fs.readFile(path.join(__dirname, 'index.html'));
});

router.post('/extract', async (ctx) => {
    let { query, offset = 1 } = ctx.request.body;
    const limit = 20;
    if (!query.startsWith("http")) query = `ytsearch${offset + limit - 1}:${query}`;

    try {
        const stdout = await runYtDlp(['--quiet', '--no-warnings', '--flat-playlist', `--playlist-items`, `${offset}:${parseInt(offset) + limit - 1}`, '--dump-single-json', query]);
        const info = JSON.parse(stdout);
        const entries = info.entries || [info];

        const results = await Promise.all(entries.map(async (entry) => {
            const isReady = await fs.pathExists(path.join(CACHE_DIR, `${entry.id}.mp4`));
            return {
                title: entry.title,
                thumbnail: entry.thumbnail || entry.thumbnails?.[0]?.url,
                uploader: entry.uploader || entry.channel,
                channel_id: entry.channel_id || entry.uploader_id,
                duration: entry.duration,
                id: entry.id,
                views: entry.view_count || 0,
                is_offline: isReady
            };
        }));
        ctx.body = { results, found_channel_id: info.channel_id || null };
    } catch (e) {
        ctx.status = 400;
        ctx.body = { detail: e.message };
    }
});

router.get('/get_stream', async (ctx) => {
    const { video_id: videoId } = ctx.query;
    const localFile = path.join(CACHE_DIR, `${videoId}.mp4`);
    const metaPath = path.join(META_DIR, `${videoId}.json`);

    if (await fs.pathExists(localFile)) {
        const meta = await fs.readJson(metaPath);
        ctx.body = { ...meta, stream_url: `/offline/${videoId}.mp4`, is_offline: true, status: "playing" };
        return;
    }

    try {
        const stdout = await runYtDlp(['--quiet', '--dump-json', `https://www.youtube.com/watch?v=${videoId}`]);
        const info = JSON.parse(stdout);

        // Simpan ke cache memory
        YT_INFO_CACHE.set(videoId, info);

        const formats = info.formats
            .filter(f => f.vcodec !== 'none' && f.acodec !== 'none')
            .map(f => ({
                url: f.url,
                quality: `${f.height}p`,
                height: f.height,
                is_local: false
            })).sort((a, b) => b.height - a.height);

        ctx.body = {
            stream_url: formats[0]?.url,
            formats,
            is_offline: false,
            title: info.title,
            uploader: info.uploader,
            duration: info.duration
        };

        // Jalankan download di background (fire and forget)
        setTimeout(() => {
            const args = ['-m', 'yt_dlp', '--format', 'best[height<=480]', '--output', path.join(CACHE_DIR, `${videoId}.mp4`), `https://www.youtube.com/watch?v=${videoId}`];
            const p = spawn('python', args);
            activeDownloads.set(videoId, p);
            p.on('close', async () => {
                await fs.writeJson(metaPath, { id: videoId, title: info.title, uploader: info.uploader, duration: info.duration }, { spaces: 4 });
                activeDownloads.delete(videoId);
            });
        }, 1000);

    } catch (e) {
        ctx.status = 400;
        ctx.body = { detail: e.message };
    }
});

router.get('/list_offline', async (ctx) => {
    const files = await fs.readdir(META_DIR);
    const results = [];
    for (const file of files) {
        if (file.endsWith('.json')) {
            const data = await fs.readJson(path.join(META_DIR, file));
            if (await fs.pathExists(path.join(CACHE_DIR, `${data.id}.mp4`))) {
                results.push(data);
            }
        }
    }
    ctx.body = { results };
});

router.delete('/delete_offline/:videoId', async (ctx) => {
    const { videoId } = ctx.params;
    await Promise.all([
        fs.remove(path.join(CACHE_DIR, `${videoId}.mp4`)),
        fs.remove(path.join(META_DIR, `${videoId}.json`))
    ]);
    ctx.body = { status: "success" };
});

router.post('/save_history', async (ctx) => {
    const item = ctx.request.body;
    let history = await fs.readJson(HISTORY_FILE);
    history = [item, ...history.filter(h => h.id !== item.id)].slice(0, 100);
    await fs.writeJson(HISTORY_FILE, history, { spaces: 4 });
    ctx.body = { status: "success" };
});

router.get('/list_history', async (ctx) => {
    ctx.body = { results: await fs.readJson(HISTORY_FILE) };
});

router.get('/search_suggestions', async (ctx) => {
    const { q } = ctx.query;
    const res = await fetch(`https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(q)}`);
    const data = await res.json();
    ctx.body = { suggestions: data[1] };
});

// --- PEMASANGAN MIDDLEWARE & STATIC ---

app.use(router.routes()).use(router.allowedMethods());

// Melayani file statis dengan prefix
app.use(mount('/static', koaStatic(path.join(__dirname, 'static'))));
app.use(mount('/offline', koaStatic(CACHE_DIR)));
app.use(mount('/subs', koaStatic(SUB_DIR)));

app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Koa Server running at http://localhost:${PORT}`);
});