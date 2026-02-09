import Koa from 'koa';
import Router from '@koa/router';
import cors from '@koa/cors';
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

app.use(cors());

// Silencing noisy network reset errors (common in video streaming/seeking)
app.on('error', (err, ctx) => {
    if (['ECONNRESET', 'EPIPE', 'ECANCELED', 'ERR_STREAM_PREMATURE_CLOSE'].includes(err.code)) {
        return; // Ignore these common client-side disconnect errors
    }
    console.error('Server error:', err);
});

// --- CONFIGURATION ---
const CACHE_DIR = path.join(__dirname, 'cached_videos');
const META_DIR = path.join(CACHE_DIR, 'metadata');
const SUB_DIR = path.join(CACHE_DIR, 'subtitles');
const THUMB_DIR = path.join(CACHE_DIR, 'thumbnails');
const DATA_DIR = path.join(__dirname, 'server_data');

const HISTORY_FILE = path.join(DATA_DIR, 'history.json');
const SEARCH_HISTORY_FILE = path.join(DATA_DIR, 'search_history.json');
const PLAYLISTS_FILE = path.join(DATA_DIR, 'playlists.json');
const SUBSCRIPTIONS_FILE = path.join(DATA_DIR, 'subscriptions.json');

// Ensure directories exist
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
const CACHE_VALID_TIME = 6 * 3600 * 1000; // 6 Hours
const activeDownloads = new Map();

const getCachedInfo = (videoId) => {
    if (YT_INFO_CACHE.has(videoId)) {
        const { entry, timestamp } = YT_INFO_CACHE.get(videoId);
        if (Date.now() - timestamp < CACHE_VALID_TIME) return entry;
    }
    return null;
};

const setCachedInfo = (videoId, info) => {
    YT_INFO_CACHE.set(videoId, { entry: info, timestamp: Date.now() });
    if (YT_INFO_CACHE.size > 500) {
        const oldest = [...YT_INFO_CACHE.entries()].sort((a, b) => a[1].timestamp - b[1].timestamp)[0][0];
        YT_INFO_CACHE.delete(oldest);
    }
};

const formatSize = (bytes) => {
    if (!bytes) return "";
    let s = bytes;
    for (const unit of ['B', 'KB', 'MB', 'GB']) {
        if (s < 1024) return `${s.toFixed(1)}${unit}`;
        s /= 1024;
    }
    return `${s.toFixed(1)}TB`;
};

const getLangName = (langCode) => {
    const mapping = {
        'id': 'Indonesia', 'en': 'English', 'ja': 'Japanese', 'ko': 'Korean',
        'zh': 'Chinese', 'zh-hans': 'Chinese (Simplified)', 'zh-hant': 'Chinese (Traditional)',
        'zh-tw': 'Chinese (Taiwan)', 'zh-hk': 'Chinese (Hong Kong)',
        'fr': 'French', 'es': 'Spanish', 'de': 'German', 'ru': 'Russian',
        'it': 'Italian', 'pt': 'Portuguese', 'vi': 'Vietnamese', 'th': 'Thai',
        'tr': 'Turkish', 'ar': 'Arabic', 'hi': 'Hindi', 'ms': 'Malay',
        'nl': 'Dutch', 'pl': 'Polish', 'sv': 'Swedish', 'da': 'Danish',
        'fi': 'Finnish', 'no': 'Norwegian', 'cs': 'Czech', 'el': 'Greek',
        'hu': 'Hungarian', 'ro': 'Romanian', 'sk': 'Slovak', 'uk': 'Ukrainian'
    };
    const cleanCode = langCode.split(' ')[0].split('-')[0].toLowerCase();
    let name = mapping[langCode.toLowerCase()] || mapping[cleanCode] || langCode;
    ["(Manual)", "(Auto)", "[auto]", "manual", "ASR"].forEach(tag => {
        name = name.replaceAll(tag, "").trim();
    });
    return name;
};

const runYtDlp = (args) => new Promise((resolve, reject) => {
    const p = spawn('python', ['-m', 'yt_dlp', ...args]);
    let so = '', se = '';
    p.stdout.on('data', d => so += d.toString());
    p.stderr.on('data', d => se += d.toString());
    p.on('close', code => (code === 0 || (code === 1 && so.trim())) ? resolve(so) : reject(new Error(se || 'yt-dlp failed')));
});

// Simple Body Parser Middleware
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

// --- HELPER TASKS ---

async function downloadSubtitle(url, videoId, lang) {
    const localName = `${videoId}_${lang}.vtt`;
    const localPath = path.join(SUB_DIR, localName);

    if (await fs.pathExists(localPath)) {
        try {
            const content = await fs.readFile(localPath, 'utf8');
            if (content.trim().startsWith("WEBVTT")) return `/subs/${localName}`;
            await fs.remove(localPath);
        } catch (e) { }
    }

    try {
        const resp = await fetch(url);
        const text = await resp.text();
        if (text.trim().startsWith("WEBVTT")) {
            await fs.writeFile(localPath, text);
            return `/subs/${localName}`;
        }
    } catch (e) { console.error(`Sub error ${lang}:`, e.message); }
    return null;
}

async function extractSubtitles(info) {
    const subtitles = [];
    const videoId = info.id;
    const preferredLangs = ['id', 'en', 'ko', 'ja', 'ms', 'zh'];
    const captions = info.subtitles || {};
    const processedLangs = new Set();

    const addSub = async (cLang, cInfo) => {
        const vttSub = cInfo.find(s => s.ext === 'vtt')?.url;
        if (vttSub) {
            const localUrl = await downloadSubtitle(vttSub, videoId, cLang);
            if (localUrl) {
                const lbl = getLangName(cLang);
                subtitles.push({ lang: cLang, url: localUrl, label: lbl });
                processedLangs.add(cLang.split('-')[0].toLowerCase());
                return true;
            }
        }
        return false;
    };

    for (const lang of preferredLangs) {
        const sortedKeys = Object.keys(captions).sort((a, b) => a.length - b.length);
        for (const cLang of sortedKeys) {
            if (cLang.split('-')[0].toLowerCase() === lang && !processedLangs.has(lang)) {
                await addSub(cLang, captions[cLang]);
            }
        }
    }

    if (subtitles.length < 10) {
        for (const [cLang, cInfo] of Object.entries(captions)) {
            if (!processedLangs.has(cLang.split('-')[0].toLowerCase())) {
                if (await addSub(cLang, cInfo)) {
                    if (subtitles.length >= 15) break;
                }
            }
        }
    }
    return subtitles;
}

async function refreshMetaTask(videoId, metaPath) {
    try {
        const stdout = await runYtDlp(['--quiet', '--no-warnings', '--dump-json', `https://www.youtube.com/watch?v=${videoId}`]);
        const info = JSON.parse(stdout);
        const meta = await fs.readJson(metaPath);

        meta.subtitles = await extractSubtitles(info);
        meta.views = info.view_count || meta.views || 0;
        if (!meta.channel_id && info.channel_id) meta.channel_id = info.channel_id;

        const remoteThumb = info.thumbnail || meta.thumbnail_remote;
        if (remoteThumb && remoteThumb.startsWith('http')) {
            meta.thumbnail_remote = remoteThumb;
            try {
                const resp = await fetch(remoteThumb);
                if (resp.ok) {
                    const ext = remoteThumb.includes('.webp') ? 'webp' : 'jpg';
                    const localFilename = `${videoId}.${ext}`;
                    await fs.writeFile(path.join(THUMB_DIR, localFilename), Buffer.from(await resp.arrayBuffer()));
                    meta.thumbnail = `/offline/thumbnails/${localFilename}`;
                }
            } catch (e) { }
        }

        await fs.writeJson(metaPath, meta, { spaces: 4 });

        // Sync history & playlists
        const syncChannelId = async (file) => {
            if (await fs.pathExists(file)) {
                let data = await fs.readJson(file);
                let updated = false;
                const processArr = (arr) => arr.forEach(item => {
                    if (item.id === videoId && !item.channel_id && meta.channel_id) {
                        item.channel_id = meta.channel_id;
                        updated = true;
                    }
                });
                if (Array.isArray(data)) processArr(data);
                else Object.values(data).forEach(arr => processArr(arr));
                if (updated) await fs.writeJson(file, data, { spaces: 4 });
            }
        };
        await syncChannelId(HISTORY_FILE);
        await syncChannelId(PLAYLISTS_FILE);
    } catch (e) { console.error(`Background refresh failed for ${videoId}:`, e.message); }
}

async function downloadVideoAndMeta(videoId, videoInfo) {
    const baseName = path.join(CACHE_DIR, videoId);
    const finalMp4 = `${baseName}.mp4`;
    const metaPath = path.join(META_DIR, `${videoId}.json`);

    const remoteThumb = videoInfo.thumbnail;
    if (remoteThumb && !remoteThumb.startsWith('/offline/')) {
        try {
            const resp = await fetch(remoteThumb);
            if (resp.ok) {
                const ext = remoteThumb.includes('.webp') ? 'webp' : 'jpg';
                const localFilename = `${videoId}.${ext}`;
                await fs.writeFile(path.join(THUMB_DIR, localFilename), Buffer.from(await resp.arrayBuffer()));
                videoInfo.thumbnail = `/offline/thumbnails/${localFilename}`;
            }
        } catch (e) { }
    }

    const args = [
        '-m', 'yt_dlp',
        '--format', 'best[height<=480][ext=mp4]/bestvideo[height<=480][ext=mp4]+bestaudio[ext=m4a]/best[height<=480]/best',
        '--output', `${baseName}.%(ext)s`,
        '--quiet', '--no-warnings',
        '--concurrent-fragments', '2',
        `https://www.youtube.com/watch?v=${videoId}`
    ];

    console.log(`[Download] spawning yt-dlp for ID: ${videoId}`);
    const dProcess = spawn('python', args);
    let dStderr = '';
    dProcess.stderr.on('data', d => dStderr += d.toString());

    activeDownloads.set(videoId, { process: dProcess, cancelled: false });

    dProcess.on('close', async (code) => {
        const state = activeDownloads.get(videoId);
        if (code === 0 && (!state || !state.cancelled)) {
            if (await fs.pathExists(finalMp4)) {
                await fs.writeJson(metaPath, videoInfo, { spaces: 4 });
                console.log(`[Download] SUCCESS: ${videoId}`);
            }
        } else {
            console.error(`[Download] FAIL/CANCEL: ${videoId}`);
            for (const ext of ['.mp4', '.m4a', '.webm', '.part', '.ytdl']) {
                await fs.remove(baseName + ext).catch(() => { });
            }
        }
        activeDownloads.delete(videoId);
    });
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
        const stdout = await runYtDlp(['--quiet', '--no-warnings', '--flat-playlist', `--playlist-items`, `${offset}:${parseInt(offset) + limit - 1}`, '--ignore-errors', '--dump-single-json', query]);
        const info = JSON.parse(stdout);
        const entries = info.entries || [info];

        const baseUploader = info.uploader || info.channel || info.title;
        const baseChannelId = info.channel_id || info.uploader_id;

        const results = await Promise.all(entries.map(async (entry) => {
            if (!entry) return null;
            const videoId = entry.id;
            const metaPath = path.join(META_DIR, `${videoId}.json`);
            const isReady = await fs.pathExists(path.join(CACHE_DIR, `${videoId}.mp4`)) && await fs.pathExists(metaPath);

            let h = entry.height;
            if (isReady) {
                try { h = (await fs.readJson(metaPath)).height || h; } catch (e) { }
            }

            return {
                title: entry.title,
                thumbnail: entry.thumbnails?.[0]?.url || entry.thumbnail,
                uploader: entry.uploader || entry.channel || baseUploader,
                channel_id: entry.channel_id || entry.uploader_id || baseChannelId,
                duration: entry.duration,
                id: videoId,
                views: entry.view_count || 0,
                height: h,
                is_offline: isReady
            };
        }));

        let foundChannelId = (query.startsWith('ytsearch') && query.includes('"') && results[0]) ? results[0].channel_id : null;
        ctx.body = { results: results.filter(r => r), found_channel_id: foundChannelId };
    } catch (e) {
        ctx.status = 400;
        ctx.body = { detail: e.message };
    }
});

router.get('/get_stream', async (ctx) => {
    const { video_id: videoId } = ctx.query;
    const localFile = path.join(CACHE_DIR, `${videoId}.mp4`);
    const metaPath = path.join(META_DIR, `${videoId}.json`);

    let meta = {};
    if (await fs.pathExists(metaPath)) {
        try { meta = await fs.readJson(metaPath); } catch (e) { }
    }

    if (await fs.pathExists(localFile)) {
        const h = meta.height || 480;
        const size = (await fs.stat(localFile)).size;
        const localFormat = { url: `/offline/${videoId}.mp4`, quality: `Local (${h}p - ${formatSize(size)})`, height: h, is_local: true };

        const cachedOnline = getCachedInfo(videoId);
        const otherFormats = [];
        if (cachedOnline) {
            (cachedOnline.formats || []).forEach(f => {
                if (f.url && f.acodec !== 'none' && f.vcodec !== 'none' && (f.height || 0) !== h) {
                    otherFormats.push({ url: f.url, quality: `${f.height}p (${formatSize(f.filesize || f.filesize_approx)})`, height: f.height, is_local: false });
                }
            });
        }

        if (!cachedOnline || !meta.subtitles || (meta.views || 0) === 0) refreshMetaTask(videoId, metaPath);

        ctx.body = {
            stream_url: localFormat.url,
            formats: [localFormat, ...otherFormats.sort((a, b) => b.height - a.height)],
            is_offline: true,
            status: "playing",
            subtitles: (meta.subtitles || []).filter(s => s.url?.startsWith('/subs/')),
            title: meta.title, uploader: meta.uploader, channel_id: meta.channel_id,
            duration: meta.duration, views: meta.views || 0
        };
        return;
    }

    try {
        let onlineInfo = getCachedInfo(videoId);
        if (!onlineInfo) {
            const stdout = await runYtDlp(['--quiet', '--no-warnings', '--dump-json', `https://www.youtube.com/watch?v=${videoId}`]);
            onlineInfo = JSON.parse(stdout);
            setCachedInfo(videoId, onlineInfo);
        }

        const formats = (onlineInfo.formats || [])
            .filter(f => f.url && f.acodec !== 'none' && f.vcodec !== 'none')
            .map(f => ({ url: f.url, quality: `${f.height}p (${formatSize(f.filesize || f.filesize_approx) || "Stream"})`, height: f.height || 0, is_local: false }))
            .sort((a, b) => b.height - a.height);

        // Remove duplicates by height
        const uniqueFormats = [];
        const seenH = new Set();
        for (const f of formats) { if (!seenH.has(f.height)) { uniqueFormats.push(f); seenH.add(f.height); } }

        if (!activeDownloads.has(videoId)) {
            setTimeout(async () => {
                const subs = await extractSubtitles(onlineInfo);
                await downloadVideoAndMeta(videoId, {
                    id: videoId, title: onlineInfo.title, uploader: onlineInfo.uploader || onlineInfo.channel,
                    duration: onlineInfo.duration, thumbnail: onlineInfo.thumbnail, subtitles: subs,
                    views: onlineInfo.view_count, channel_id: onlineInfo.channel_id
                });
            }, 2000);
        }

        ctx.body = {
            stream_url: uniqueFormats[0]?.url,
            formats: uniqueFormats,
            is_offline: false,
            status: "fetching_to_offline",
            subtitles: [],
            title: onlineInfo.title, uploader: onlineInfo.uploader, channel_id: onlineInfo.channel_id,
            duration: onlineInfo.duration, views: onlineInfo.view_count || 0
        };
    } catch (e) {
        ctx.status = 400;
        ctx.body = { detail: "Gagal mengambil aliran video" };
    }
});

router.get('/cancel_download', (ctx) => {
    const { video_id: videoId } = ctx.query;
    if (activeDownloads.has(videoId)) {
        const state = activeDownloads.get(videoId);
        state.cancelled = true;
        if (state.process) state.process.kill();
        ctx.body = { status: "cancelling", id: videoId };
    } else ctx.body = { status: "not_running" };
});

router.get('/get_video_meta/:videoId', async (ctx) => {
    const metaPath = path.join(META_DIR, `${ctx.params.videoId}.json`);
    ctx.body = (await fs.pathExists(metaPath)) ? await fs.readJson(metaPath) : {};
});

router.get('/list_offline', async (ctx) => {
    const results = [];
    if (await fs.pathExists(META_DIR)) {
        const files = (await fs.readdir(META_DIR)).sort().reverse();
        for (const file of files) {
            if (file.endsWith('.json')) {
                try {
                    const v = await fs.readJson(path.join(META_DIR, file));
                    if (await fs.pathExists(path.join(CACHE_DIR, `${v.id}.mp4`))) results.push(v);
                } catch (e) { }
            }
        }
    }
    ctx.body = { results };
});

router.delete('/delete_offline/:videoId', async (ctx) => {
    const { videoId } = ctx.params;
    await Promise.all([
        fs.remove(path.join(CACHE_DIR, `${videoId}.mp4`)),
        fs.remove(path.join(CACHE_DIR, `${videoId}.mp4.part`)),
        fs.remove(path.join(META_DIR, `${videoId}.json`))
    ]);
    ctx.body = { status: "success" };
});

router.post('/save_history', async (ctx) => {
    const item = ctx.request.body;
    if (item.duration === 0 && (item.views || 0) === 0) { ctx.body = { status: "ignored" }; return; }
    try {
        let history = await fs.readJson(HISTORY_FILE);
        history = [item, ...history.filter(h => h.id !== item.id)].slice(0, 100);
        await fs.writeJson(HISTORY_FILE, history, { spaces: 4 });
        ctx.body = { status: "success" };
    } catch (e) { ctx.status = 500; ctx.body = { detail: e.message }; }
});

router.get('/list_history', async (ctx) => {
    try {
        const data = await fs.readJson(HISTORY_FILE);
        ctx.body = { results: data.filter(h => !(h.duration === 0 && (h.views || 0) === 0)) };
    } catch (e) { ctx.body = { results: [] }; }
});

router.delete('/delete_history/:videoId', async (ctx) => {
    try {
        let history = await fs.readJson(HISTORY_FILE);
        history = history.filter(h => h.id !== ctx.params.videoId);
        await fs.writeJson(HISTORY_FILE, history, { spaces: 4 });
        ctx.body = { status: "success" };
    } catch (e) { ctx.status = 500; ctx.body = { detail: e.message }; }
});

router.post('/clear_history', async (ctx) => {
    try { await fs.writeJson(HISTORY_FILE, [], { spaces: 4 }); ctx.body = { status: "success" }; }
    catch (e) { ctx.status = 500; ctx.body = { detail: e.message }; }
});

router.get('/search_suggestions', async (ctx) => {
    const { q } = ctx.query;
    if (!q) { ctx.body = { suggestions: [] }; return; }
    try {
        const res = await fetch(`https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(q)}`);
        const data = await res.json();
        ctx.body = { suggestions: data[1] };
    } catch (e) { ctx.body = { suggestions: [] }; }
});

router.get('/list_search_history', async (ctx) => {
    try { ctx.body = { results: await fs.readJson(SEARCH_HISTORY_FILE) }; }
    catch (e) { ctx.body = { results: [] }; }
});

router.post('/save_search_history', async (ctx) => {
    const q = ctx.request.body.query?.trim();
    if (q) {
        try {
            let hist = await fs.readJson(SEARCH_HISTORY_FILE);
            hist = [q, ...hist.filter(h => h !== q)].slice(0, 8);
            await fs.writeJson(SEARCH_HISTORY_FILE, hist, { spaces: 4 });
            ctx.body = { status: "success" };
        } catch (e) { ctx.body = { status: "error" }; }
    } else ctx.body = { status: "ignored" };
});

router.delete('/delete_search_history', async (ctx) => {
    try {
        let hist = await fs.readJson(SEARCH_HISTORY_FILE);
        hist = hist.filter(h => h !== ctx.query.q);
        await fs.writeJson(SEARCH_HISTORY_FILE, hist, { spaces: 4 });
        ctx.body = { status: "success" };
    } catch (e) { ctx.body = { status: "error" }; }
});

router.get('/list_playlists', async (ctx) => {
    try { ctx.body = await fs.readJson(PLAYLISTS_FILE); }
    catch (e) { ctx.body = {}; }
});

router.post('/add_to_playlist', async (ctx) => {
    const { playlist_name: name, video } = ctx.request.body;
    if (!name?.trim()) { ctx.status = 400; ctx.body = { detail: "Name required" }; return; }
    try {
        const pl = await fs.readJson(PLAYLISTS_FILE);
        if (!pl[name]) pl[name] = [];
        pl[name] = [video, ...pl[name].filter(v => v.id !== video.id)];
        await fs.writeJson(PLAYLISTS_FILE, pl, { spaces: 4 });
        ctx.body = { status: "success" };
    } catch (e) { ctx.status = 500; ctx.body = { detail: e.message }; }
});

router.post('/create_playlist', async (ctx) => {
    const { name } = ctx.request.body;
    if (!name?.trim()) { ctx.status = 400; ctx.body = { detail: "Name required" }; return; }
    try {
        const pl = await fs.readJson(PLAYLISTS_FILE);
        if (!pl[name]) {
            pl[name] = [];
            await fs.writeJson(PLAYLISTS_FILE, pl, { spaces: 4 });
        }
        ctx.body = { status: "success" };
    } catch (e) { ctx.status = 500; ctx.body = { detail: e.message }; }
});

router.delete('/delete_playlist/:name', async (ctx) => {
    const { name } = ctx.params;
    try {
        const pl = await fs.readJson(PLAYLISTS_FILE);
        if (pl[name]) {
            delete pl[name];
            await fs.writeJson(PLAYLISTS_FILE, pl, { spaces: 4 });
            ctx.body = { status: "success" };
        } else {
            ctx.status = 404;
            ctx.body = { detail: "Playlist not found" };
        }
    } catch (e) { ctx.status = 500; ctx.body = { detail: e.message }; }
});

router.delete('/delete_from_playlist/:name/:videoId', async (ctx) => {
    const { name, videoId } = ctx.params;
    try {
        const pl = await fs.readJson(PLAYLISTS_FILE);
        if (pl[name]) {
            pl[name] = pl[name].filter(v => v.id !== videoId);
            await fs.writeJson(PLAYLISTS_FILE, pl, { spaces: 4 });
            ctx.body = { status: "success" };
        } else {
            ctx.status = 404;
            ctx.body = { detail: "Playlist not found" };
        }
    } catch (e) { ctx.status = 500; ctx.body = { detail: e.message }; }
});

router.post('/search_playlist', async (ctx) => {
    const { query } = ctx.request.body;
    if (!query) { ctx.body = { results: [] }; return; }
    try {
        const playlists = await fs.readJson(PLAYLISTS_FILE);
        const results = [];
        const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 0);
        for (const [name, videos] of Object.entries(playlists)) {
            for (const v of videos) {
                const text = (v.title + " " + (v.uploader || "")).toLowerCase();
                if (terms.every(t => text.includes(t))) results.push({ ...v, found_in_playlist: name });
            }
        }
        ctx.body = { results };
    } catch (e) { ctx.body = { results: [] }; }
});

router.post('/update_playlist_meta', async (ctx) => {
    const { playlist_name: name, video } = ctx.request.body;
    try {
        const pl = await fs.readJson(PLAYLISTS_FILE);
        if (pl[name]) {
            let updated = false;
            pl[name].forEach(v => {
                if (v.id === video.id) {
                    if (!v.channel_id && video.channel_id) { v.channel_id = video.channel_id; updated = true; }
                    if (!v.duration && video.duration) { v.duration = video.duration; updated = true; }
                }
            });
            if (updated) await fs.writeJson(PLAYLISTS_FILE, pl, { spaces: 4 });
        }
        ctx.body = { status: "success" };
    } catch (e) { ctx.body = { status: "error" }; }
});

router.post('/update_playlist_channel_by_uploader', async (ctx) => {
    const { playlist_name: name, uploader, channel_id: cid } = ctx.request.body;
    if (!name || !uploader || !cid) { ctx.body = { status: "ignored" }; return; }
    try {
        const pl = await fs.readJson(PLAYLISTS_FILE);
        if (pl[name]) {
            let count = 0;
            const target = uploader.replaceAll('"', '');
            pl[name].forEach(v => {
                if ((v.uploader === target || v.uploader === uploader) && !v.channel_id) { v.channel_id = cid; count++; }
            });
            if (count > 0) await fs.writeJson(PLAYLISTS_FILE, pl, { spaces: 4 });
            ctx.body = { status: "repaired", count };
        } else ctx.body = { status: "no_change" };
    } catch (e) { ctx.body = { status: "error" }; }
});

router.get('/list_subscriptions', async (ctx) => {
    try { ctx.body = { results: await fs.readJson(SUBSCRIPTIONS_FILE) }; }
    catch (e) { ctx.body = { results: [] }; }
});

router.post('/toggle_subscription', async (ctx) => {
    const { channel_id: cid, uploader } = ctx.request.body;
    try {
        let subs = await fs.readJson(SUBSCRIPTIONS_FILE);
        const idx = subs.findIndex(s => s.channel_id === cid);
        if (idx > -1) {
            subs.splice(idx, 1);
            await fs.writeJson(SUBSCRIPTIONS_FILE, subs, { spaces: 4 });
            ctx.body = { status: "unsubscribed" };
        } else {
            subs.push({ channel_id: cid, uploader });
            await fs.writeJson(SUBSCRIPTIONS_FILE, subs, { spaces: 4 });
            ctx.body = { status: "subscribed" };
        }
    } catch (e) { ctx.status = 500; ctx.body = { detail: e.message }; }
});

// --- MIDDLEWARE & STATIC ---
app.use(router.routes()).use(router.allowedMethods());
app.use(mount('/static', koaStatic(path.join(__dirname, 'static'))));
app.use(mount('/offline', koaStatic(CACHE_DIR)));
app.use(mount('/subs', koaStatic(SUB_DIR)));

app.listen(PORT, '0.0.0.0', () => {
    console.log(`running on http://localhost:${PORT}`);
});
