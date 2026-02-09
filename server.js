// Track startup time
const startupTime = Date.now();

import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { runYtDlp, CACHE_DIR, META_DIR, SUB_DIR, THUMB_DIR, HISTORY_FILE, PLAYLISTS_FILE, SUBSCRIPTIONS_FILE, downloadProgress } from './utils.js';
import { Home } from './views/home.js';
import { Play } from './views/play.js';
import { History } from './views/history.js';
import { Offline } from './views/offline.js';
import { Playlists } from './views/playlists.js';
import { VideoCard } from './views/components.js';
import { PlaylistDetail } from './views/playlist_detail.js';

const app = new Hono();
const PORT = Number(process.env.PORT) || 8000;

// Cache untuk mencegah request duplikat
const searchCache = new Map();
const CACHE_DURATION = 30000; // 30 detik

// Static Files
app.use('/static/*', serveStatic({ root: './' }));
app.use('/offline/*', serveStatic({ root: './cached_videos', rewriteRequestPath: (path) => path.replace(/^\/offline/, '') }));
app.use('/thumb/*', serveStatic({ root: './cached_videos/thumbnails', rewriteRequestPath: (path) => path.replace(/^\/thumb/, '') }));

// Middleware: Persistent Player State and Subscriptions
app.use('*', async (c, next) => {
    const minId = c.req.query('min');

    // Load Subscriptions globally for sidebar
    const subs = await fs.readJson(SUBSCRIPTIONS_FILE).catch(() => []);
    c.set('subscriptions', subs);

    if (minId && c.req.path !== '/play') {
        let videoMeta = null;
        const metaPath = path.join(META_DIR, `${minId}.json`);

        if (await fs.pathExists(metaPath)) {
            videoMeta = await fs.readJson(metaPath);
            videoMeta.stream_url = `/offline/${minId}.webm`; // Prioritas webm
            if (!await fs.pathExists(path.join(CACHE_DIR, `${minId}.webm`))) {
                videoMeta.stream_url = `/offline/${minId}.mp4`;
            }
        } else {
            const history = await fs.readJson(HISTORY_FILE).catch(() => []);
            videoMeta = history.find(h => h.id === minId);
        }
        c.set('playingVideo', videoMeta);
        console.log(`[STATE] Active Mini-Player: ${videoMeta?.title || minId}`);
    }
    await next();
});

// Home Route
const searchVideos = async (query, subs = [], page = 1) => {
    if (!query) return [];

    // Cek cache terlebih dahulu
    const cacheKey = `${query}_${page}`;
    const cached = searchCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
        console.log(`[CACHE] Using cached results for: ${query} (page ${page})`);
        return cached.data;
    }

    try {
        const pageSize = 20;
        const start = (page - 1) * pageSize + 1;
        const end = start + pageSize - 1;

        const searchStr = query.startsWith('http') ? query : `ytsearch${end + 20}:${query}`;

        const stdout = await runYtDlp([
            '--no-warnings', '--flat-playlist', '--dump-single-json',
            '--playlist-start', start.toString(),
            '--playlist-end', end.toString(),
            searchStr
        ]);

        const info = JSON.parse(stdout);
        if (!info) return [];
        let entries = info.entries || [info];

        if (entries.length > pageSize) {
            entries = entries.slice(0, pageSize);
        }

        const results = await Promise.all(entries.map(async (entry) => {
            if (!entry || !entry.id) return null; // Validasi entry dan id

            const isOffline = await fs.pathExists(path.join(CACHE_DIR, `${entry.id}.webm`)) || await fs.pathExists(path.join(CACHE_DIR, `${entry.id}.mp4`));
            const channelId = entry.channel_id || entry.uploader_id || 'unknown';

            let thumbnail = entry.thumbnail || entry.thumbnails?.[0]?.url || '';
            if (isOffline) {
                const metaPath = path.join(META_DIR, `${entry.id}.json`);
                if (await fs.pathExists(metaPath)) {
                    const meta = await fs.readJson(metaPath);
                    thumbnail = meta.thumbnail || thumbnail;
                }
            }

            return {
                id: entry.id,
                title: entry.title || 'Untitled',
                thumbnail: thumbnail,
                uploader: entry.uploader || entry.channel || 'Unknown',
                channel_id: channelId,
                duration: entry.duration || 0,
                views: entry.view_count || 0,
                is_offline: isOffline,
                is_subscribed: subs.some(s => s.channel_id === channelId)
            };
        }));

        const filteredResults = results.filter(r => r);

        // Simpan ke cache
        searchCache.set(cacheKey, {
            data: filteredResults,
            timestamp: Date.now()
        });

        // Bersihkan cache lama (lebih dari 5 menit)
        for (const [key, value] of searchCache.entries()) {
            if (Date.now() - value.timestamp > 300000) {
                searchCache.delete(key);
            }
        }

        return filteredResults;
    } catch (e) {
        console.error(e);
        return [];
    }
};

app.get('/', async (c) => {
    const query = c.req.query('q');
    const playingVideo = c.get('playingVideo');
    const subscriptions = c.get('subscriptions');
    console.log(`[GET] Home Page${query ? ` - Search: ${query}` : ''}`);
    const results = await searchVideos(query, subscriptions, 1);
    return c.html(Home({ results, query, activePage: 'home', playingVideo, subscriptions }));
});

// Play Route
app.get('/play', async (c) => {
    const videoId = c.req.query('v');
    console.log(`[GET] Play Video: ${videoId}`);
    if (!videoId) return c.redirect('/');

    const metaPath = path.join(META_DIR, `${videoId}.json`);
    let videoData = {};

    // Cek versi webm dulu karena user ingin ukuran lebih kecil
    const webmPath = path.join(CACHE_DIR, `${videoId}.webm`);
    const mp4Path = path.join(CACHE_DIR, `${videoId}.mp4`);

    if (await fs.pathExists(webmPath) || await fs.pathExists(mp4Path)) {
        if (await fs.pathExists(metaPath)) {
            videoData = await fs.readJson(metaPath);
            videoData.stream_url = (await fs.pathExists(webmPath)) ? `/offline/${videoId}.webm` : `/offline/${videoId}.mp4`;
            videoData.is_offline = true;
        }
    }

    if (!videoData.id) {
        try {
            const stdout = await runYtDlp(['--no-warnings', '--dump-json', `https://www.youtube.com/watch?v=${videoId}`]);
            const info = JSON.parse(stdout);
            if (!info) throw new Error("Gagal mengambil informasi video.");

            // Prioritaskan format gabungan untuk streaming awal
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
                subtitles: []
            };

            // Download Thumbnail untuk History
            const thumbUrl = info.thumbnail;
            const thumbExt = '.webp';
            const thumbLocalPath = path.join(THUMB_DIR, `${videoId}${thumbExt}`);
            let localThumbUrl = thumbUrl; // Default ke URL online

            // Coba download thumbnail ke lokal
            try {
                const thumbRes = await fetch(thumbUrl);
                const thumbBuffer = await thumbRes.arrayBuffer();
                await fs.writeFile(thumbLocalPath, Buffer.from(thumbBuffer));
                localThumbUrl = `/thumb/${videoId}${thumbExt}`;
                console.log(`[THUMB] Downloaded: ${videoId}`);
            } catch (te) {
                console.error('[THUMB] Gagal download, menggunakan URL online:', te.message);
            }

            // Auto-save history dengan thumbnail lokal
            let history = await fs.readJson(HISTORY_FILE).catch(() => []);
            const histItem = {
                id: videoId,
                title: videoData.title,
                uploader: videoData.uploader,
                thumbnail: localThumbUrl, // Gunakan lokal jika berhasil
                duration: videoData.duration,
                views: videoData.views,
                channel_id: videoData.channel_id
            };
            history = [histItem, ...history.filter(h => h.id !== videoId)].slice(0, 100);
            await fs.writeJson(HISTORY_FILE, history, { spaces: 4 });


        } catch (e) {
            console.error(e);
            return c.text("Gagal memutar video.");
        }
    }

    // Get Related Videos
    const history = await fs.readJson(HISTORY_FILE).catch(() => []);
    const relatedVideos = history.filter(v => v.id !== videoId).slice(0, 10);

    // Get Subscription Status
    const subs = c.get('subscriptions');
    const isSubscribed = subs.some(s => s.channel_id === videoData.channel_id);

    // Otomatis download jika diminta dalam query
    if (c.req.query('download') === '1') {
        startBackgroundDownload(videoId);
    }

    return c.html(Play({
        ...videoData,
        relatedVideos,
        isSubscribed,
        subscriptions: subs
    }));
});

// Fungsi Download: Memaksa WebM dan download Thumbnail lokal
async function startBackgroundDownload(videoId) {
    if (downloadProgress.has(videoId)) return;

    const webmPath = path.join(CACHE_DIR, `${videoId}.webm`);
    const mp4Path = path.join(CACHE_DIR, `${videoId}.mp4`);

    if (await fs.pathExists(webmPath) || await fs.pathExists(mp4Path)) {
        downloadProgress.set(videoId, 100);
        return;
    }

    downloadProgress.set(videoId, 0.1);

    try {
        const metaPath = path.join(META_DIR, `${videoId}.json`);
        let info = null;

        // Selalu ambil metadata baru jika sedang mendownload untuk memastikan thumbnail terdownload
        const stdout = await runYtDlp(['--no-warnings', '--dump-json', `https://www.youtube.com/watch?v=${videoId}`]);
        info = JSON.parse(stdout);

        // Download Thumbnail Lokal
        const thumbUrl = info.thumbnail;
        const thumbExt = '.webp'; // Kebanyakan thumbnail YT sekarang webp
        const thumbLocalPath = path.join(THUMB_DIR, `${videoId}${thumbExt}`);

        try {
            const thumbRes = await fetch(thumbUrl);
            const thumbBuffer = await thumbRes.arrayBuffer();
            await fs.writeFile(thumbLocalPath, Buffer.from(thumbBuffer));
            console.log(`[THUMB] Downloaded: ${videoId}`);
        } catch (te) {
            console.error('[THUMB] Gagal download thumbnail:', te);
        }

        const meta = {
            id: videoId,
            title: info.title,
            uploader: info.uploader || info.channel,
            channel_id: info.channel_id,
            thumbnail: `/thumb/${videoId}${thumbExt}`, // Path lokal ke API
            duration: info.duration,
            views: info.view_count
        };
        await fs.writeJson(metaPath, meta, { spaces: 4 });

        // DOWNLOAD: Gunakan format WebM (VP9 + Opus) agar UKURAN JAUH LEBIH KECIL
        await runYtDlp([
            '--no-warnings',
            '-f', 'bestvideo[height<=480][ext=webm]+bestaudio[ext=webm]/best[height<=480][ext=webm]/best[ext=webm]/best',
            '--merge-output-format', 'webm',
            '-o', webmPath,
            `https://www.youtube.com/watch?v=${videoId}`
        ], (progress) => {
            downloadProgress.set(videoId, progress);
        });

        downloadProgress.set(videoId, 100);
    } catch (e) {
        console.error(`Download Gagal untuk ${videoId}:`, e);
        downloadProgress.delete(videoId);
    }
}

// API Routes
app.get('/api/suggestions', async (c) => {
    const q = c.req.query('q');
    if (!q) return c.json([]);
    try {
        const res = await fetch(`https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(q)}`);
        const data = await res.json();
        return c.json(data[1] || []);
    } catch (e) { return c.json([]); }
});

app.get('/api/search', async (c) => {
    const q = c.req.query('q');
    const page = Number(c.req.query('page')) || 1;
    const stats = c.get('subscriptions');
    if (!q) return c.text('');
    const results = await searchVideos(q, stats, page);
    return c.html(results.map(v => VideoCard(v)).join(''));
});

app.get('/api/download_status/:id', (c) => {
    const id = c.req.param('id');
    const progress = downloadProgress.get(id);
    if (progress === undefined) return c.json({ status: 'not_found' });
    return c.json({ status: progress >= 100 ? 'finished' : 'downloading', progress });
});

app.post('/api/download/:id', async (c) => {
    const id = c.req.param('id');
    startBackgroundDownload(id);
    return c.json({ status: 'started' });
});

app.post('/toggle_subscription', async (c) => {
    const { channel_id, uploader } = await c.req.json();
    let subs = await fs.readJson(SUBSCRIPTIONS_FILE).catch(() => []);
    const idx = subs.findIndex(s => s.channel_id === channel_id);
    if (idx > -1) subs.splice(idx, 1);
    else subs.push({ channel_id, uploader });
    await fs.writeJson(SUBSCRIPTIONS_FILE, subs, { spaces: 4 });
    return c.json({ status: "ok" });
});

app.get('/api/playlists', async (c) => {
    const playlists = await fs.readJson(PLAYLISTS_FILE).catch(() => ({}));
    return c.json(playlists);
});

app.post('/add_to_playlist', async (c) => {
    const { playlistName, video } = await c.req.json();
    let playlists = await fs.readJson(PLAYLISTS_FILE).catch(() => ({}));
    if (playlists[playlistName]) {
        if (!playlists[playlistName].find(v => v.id === video.id)) {
            playlists[playlistName].push(video);
            await fs.writeJson(PLAYLISTS_FILE, playlists, { spaces: 4 });
        }
    }
    return c.json({ status: "ok" });
});

// Pages
app.get('/history', async (c) => {
    const history = await fs.readJson(HISTORY_FILE).catch(() => []);
    return c.html(History({ results: history, playingVideo: c.get('playingVideo'), subscriptions: c.get('subscriptions') }));
});

app.post('/clear_history', async (c) => {
    await fs.writeJson(HISTORY_FILE, [], { spaces: 4 });
    return c.redirect('/history');
});

app.get('/offline', async (c) => {
    const files = await fs.readdir(CACHE_DIR).catch(() => []);
    const results = [];
    const ids = new Set();
    for (const file of files) {
        if (file.endsWith('.mp4') || file.endsWith('.webm')) {
            const id = file.split('.')[0];
            if (ids.has(id)) continue;
            ids.add(id);
            const metaPath = path.join(META_DIR, `${id}.json`);
            if (await fs.pathExists(metaPath)) {
                const meta = await fs.readJson(metaPath);
                meta.is_offline = true;
                results.push(meta);
            }
        }
    }
    return c.html(Offline({ results, playingVideo: c.get('playingVideo'), subscriptions: c.get('subscriptions') }));
});

app.delete('/delete_offline/:id', async (c) => {
    const id = c.req.param('id');
    try {
        await fs.remove(path.join(CACHE_DIR, `${id}.mp4`));
        await fs.remove(path.join(CACHE_DIR, `${id}.webm`));
        await fs.remove(path.join(THUMB_DIR, `${id}.webp`));
        await fs.remove(path.join(META_DIR, `${id}.json`));
        return c.json({ status: 'ok' });
    } catch (e) { return c.json({ status: 'error' }, 500); }
});

app.get('/playlists', async (c) => {
    const playlists = await fs.readJson(PLAYLISTS_FILE).catch(() => ({}));
    return c.html(Playlists({ results: playlists, playingVideo: c.get('playingVideo'), subscriptions: c.get('subscriptions') }));
});

app.post('/create_playlist', async (c) => {
    const { name } = await c.req.json();
    const playlists = await fs.readJson(PLAYLISTS_FILE).catch(() => ({}));
    if (!playlists[name]) {
        playlists[name] = [];
        await fs.writeJson(PLAYLISTS_FILE, playlists, { spaces: 4 });
    }
    return c.json({ status: 'ok' });
});

app.get('/playlists/:name', async (c) => {
    const name = c.req.param('name');
    const playlists = await fs.readJson(PLAYLISTS_FILE).catch(() => ({}));
    return c.html(PlaylistDetail({ title: name, results: playlists[name] || [], playingVideo: c.get('playingVideo'), subscriptions: c.get('subscriptions') }));
});

const localIp = getLocalIp();
const startupDuration = ((Date.now() - startupTime) / 1000).toFixed(4);
console.log(`run on http://localhost:${PORT} | http://${localIp}:${PORT}`);
console.log(`took ${startupDuration}s`);

serve({ fetch: app.fetch, port: PORT });

function getLocalIp() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) return iface.address;
        }
    }
    return '127.0.0.1';
}
