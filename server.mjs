import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

// Folders
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

// Initialize files if not exists
const initializeFile = async (filePath, defaultValue = []) => {
    if (!(await fs.pathExists(filePath))) {
        await fs.writeJson(filePath, defaultValue, { spaces: 4 });
    }
};

await initializeFile(HISTORY_FILE);
await initializeFile(SEARCH_HISTORY_FILE);
await initializeFile(PLAYLISTS_FILE, {});
await initializeFile(SUBSCRIPTIONS_FILE);

// Static files
app.use('/static', express.static(path.join(__dirname, 'static')));
app.use('/offline', express.static(CACHE_DIR));
app.use('/subs', express.static(SUB_DIR));

app.get('/', async (req, res) => {
    const indexPath = path.join(__dirname, 'index.html');
    if (await fs.pathExists(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send('<h1>Error: File index.html tidak ditemukan</h1>');
    }
});

// Cache for YouTube info
const YT_INFO_CACHE = new Map();
const CACHE_VALID_TIME = 6 * 3600 * 1000; // 6 Hours

const getCachedInfo = (videoId) => {
    if (YT_INFO_CACHE.has(videoId)) {
        const { entry, timestamp } = YT_INFO_CACHE.get(videoId);
        if (Date.now() - timestamp < CACHE_VALID_TIME) {
            return entry;
        }
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

// Active downloads tracking
const activeDownloads = new Map();

// Helper: Format size
const formatSize = (bytes) => {
    if (!bytes) return "";
    let s = bytes;
    for (const unit of ['B', 'KB', 'MB', 'GB']) {
        if (s < 1024) return `${s.toFixed(1)}${unit}`;
        s /= 1024;
    }
    return `${s.toFixed(1)}TB`;
};

// Helper: Language names
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

// Helper: Download subtitle
async function downloadSubtitle(url, videoId, lang) {
    const localName = `${videoId}_${lang}.vtt`;
    const localPath = path.join(SUB_DIR, localName);

    if (await fs.pathExists(localPath)) {
        try {
            const content = await fs.readFile(localPath, 'utf8');
            if (content.trim().startsWith("WEBVTT")) {
                return `/subs/${localName}`;
            }
            await fs.remove(localPath);
        } catch (e) { }
    }

    try {
        const resp = await axios.get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Referer": "https://www.youtube.com/"
            },
            timeout: 10000
        });
        if (resp.status === 200 && resp.data.trim().startsWith("WEBVTT")) {
            await fs.writeFile(localPath, resp.data);
            return `/subs/${localName}`;
        }
    } catch (e) {
        console.error(`Failed to download subtitle ${lang}: ${e.message}`);
    }
    return null;
}

// Helper: Extract subtitles
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
            if (cLang.split('-')[0].toLowerCase() === lang && !processedLangs.has(cLang.split('-')[0].toLowerCase())) {
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

// Helper: Refresh Meta Task
async function refreshMetaTask(videoId, metaPath) {
    try {
        const args = ['-m', 'yt_dlp', '--quiet', '--no-warnings', '--dump-json', `https://www.youtube.com/watch?v=${videoId}`];
        const stdout = await new Promise((resolve, reject) => {
            const p = spawn('python', args);
            let so = '';
            let se = '';
            p.stdout.on('data', d => so += d.toString());
            p.stderr.on('data', d => se += d.toString());
            p.on('close', code => code === 0 ? resolve(so) : reject(new Error(se || 'yt-dlp failed')));
        });
        const info = JSON.parse(stdout);
        const meta = await fs.readJson(metaPath);

        meta.subtitles = await extractSubtitles(info);
        meta.views = info.view_count || meta.views || 0;
        if (!meta.channel_id && info.channel_id) {
            meta.channel_id = info.channel_id || info.uploader_id;
        }

        const remoteThumb = info.thumbnail || meta.thumbnail_remote;
        if (remoteThumb && remoteThumb.startsWith('http')) {
            meta.thumbnail_remote = remoteThumb;
            try {
                const resp = await fetch(remoteThumb);
                if (resp.ok) {
                    const ext = remoteThumb.includes('.webp') ? 'webp' : 'jpg';
                    const localFilename = `${videoId}.${ext}`;
                    const localPath = path.join(THUMB_DIR, localFilename);
                    const buffer = Buffer.from(await resp.arrayBuffer());
                    await fs.writeFile(localPath, buffer);
                    meta.thumbnail = `/offline/thumbnails/${localFilename}`;
                }
            } catch (e) { }
        }

        await fs.writeJson(metaPath, meta, { spaces: 4 });

        // Sync history/playlists
        if (await fs.pathExists(HISTORY_FILE)) {
            const hist = await fs.readJson(HISTORY_FILE);
            let updated = false;
            hist.forEach(item => {
                if (item.id === videoId && !item.channel_id && meta.channel_id) {
                    item.channel_id = meta.channel_id;
                    updated = true;
                }
            });
            if (updated) await fs.writeJson(HISTORY_FILE, hist, { spaces: 4 });
        }

        if (await fs.pathExists(PLAYLISTS_FILE)) {
            const pl = await fs.readJson(PLAYLISTS_FILE);
            let updated = false;
            Object.values(pl).forEach(videos => {
                videos.forEach(item => {
                    if (item.id === videoId && !item.channel_id && meta.channel_id) {
                        item.channel_id = meta.channel_id;
                        updated = true;
                    }
                });
            });
            if (updated) await fs.writeJson(PLAYLISTS_FILE, pl, { spaces: 4 });
        }
    } catch (e) {
        console.error(`Background refresh failed for ${videoId}: ${e.message}`);
    }
}

// Helper: Download video and meta
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
                const localPath = path.join(THUMB_DIR, localFilename);
                const buffer = Buffer.from(await resp.arrayBuffer());
                await fs.writeFile(localPath, buffer);
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

    console.log(`[Download] spawning yt-dlp via Python for ID: ${videoId}`);
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
            } else {
                console.error(`[Download] FAILED: ${videoId} - File not found at ${finalMp4}`);
            }
        } else {
            if (state?.cancelled) {
                console.log(`[Download] CANCELLED: ${videoId}`);
            } else {
                console.error(`[Download] ERROR: ${videoId} exited with code ${code}. Stderr: ${dStderr}`);
            }
            for (const ext of ['.mp4', '.m4a', '.webm', '.part', '.ytdl']) {
                const fPart = baseName + ext;
                if (await fs.pathExists(fPart)) await fs.remove(fPart).catch(() => { });
            }
        }
        activeDownloads.delete(videoId);
    });
}

// Routes
app.post('/extract', async (req, res) => {
    let { query, offset = 1 } = req.body;
    const limit = 20;

    if (!query.startsWith("http://") && !query.startsWith("https://")) {
        query = `ytsearch${offset + limit - 1}:${query}`;
    }

    console.log(`[Extract] Query: ${query}, Offset: ${offset}`);

    const args = [
        '-m', 'yt_dlp',
        '--quiet', '--no-warnings', '--flat-playlist',
        '--playlist-items', `${offset}:${parseInt(offset) + limit - 1}`,
        '--ignore-errors', '--dump-single-json',
        query
    ];

    try {
        const stdout = await new Promise((resolve, reject) => {
            const p = spawn('python', args);
            let so = '';
            let se = '';
            p.stdout.on('data', d => so += d.toString());
            p.stderr.on('data', d => se += d.toString());
            p.on('close', code => {
                if (code === 0 || (code === 1 && so.trim())) {
                    resolve(so);
                } else {
                    reject(new Error(se || `yt-dlp failed with code ${code}`));
                }
            });
        });

        if (!stdout.trim()) {
            return res.json({ results: [], found_channel_id: null });
        }

        const info = JSON.parse(stdout);
        const results = [];
        const entries = info.entries || [info];

        const baseUploader = info.uploader || info.channel || info.title;
        const baseChannelId = info.channel_id || info.uploader_id || (info.webpage_url?.includes('channel') ? info.id : null);

        for (const entry of entries) {
            if (entry) {
                const videoId = entry.id;
                const metaPath = path.join(META_DIR, `${videoId}.json`);
                const isReady = await fs.pathExists(path.join(CACHE_DIR, `${videoId}.mp4`)) && await fs.pathExists(metaPath);

                let h = entry.height;
                if (isReady) {
                    try {
                        const m = await fs.readJson(metaPath);
                        if (m.height) h = m.height;
                    } catch (e) { }
                }

                results.push({
                    "title": entry.title,
                    "thumbnail": entry.thumbnails?.[0]?.url || entry.thumbnail,
                    "uploader": entry.uploader || entry.channel || baseUploader,
                    "channel_id": entry.channel_id || entry.uploader_id || baseChannelId,
                    "duration": entry.duration,
                    "id": videoId,
                    "views": entry.view_count || 0,
                    "height": h,
                    "is_offline": isReady
                });
            }
        }

        let foundChannelId = null;
        if (query.startsWith('ytsearch') && query.includes('"')) {
            if (results.length > 0 && results[0].channel_id) foundChannelId = results[0].channel_id;
        }

        res.json({ results, found_channel_id: foundChannelId });
    } catch (e) {
        console.error(`[Extract] Error: ${e.message}`);
        res.status(400).json({ detail: e.message });
    }
});

app.get('/get_stream', async (req, res) => {
    const { video_id: videoId } = req.query;
    console.log(`[Stream] Request for ID: ${videoId}`);
    const localFile = path.join(CACHE_DIR, `${videoId}.mp4`);
    const metaPath = path.join(META_DIR, `${videoId}.json`);

    let existingMeta = {};
    if (await fs.pathExists(metaPath)) {
        try { existingMeta = await fs.readJson(metaPath); } catch (e) { }
    }

    if (await fs.pathExists(localFile)) {
        console.log(`[Stream] Serving local file for ID: ${videoId}`);
        const h = existingMeta.height || 480;
        const sizeBytes = (await fs.stat(localFile)).size;
        const localFormat = {
            url: `/offline/${videoId}.mp4`,
            quality: `Local (${h}p - ${formatSize(sizeBytes)})`,
            height: h,
            is_local: true
        };

        const cachedOnline = getCachedInfo(videoId);
        const otherFormats = [];
        if (cachedOnline) {
            (cachedOnline.formats || []).forEach(f => {
                if (f.url && f.acodec !== 'none' && f.vcodec !== 'none') {
                    const oh = f.height || 0;
                    if (oh !== localFormat.height) {
                        otherFormats.push({
                            url: f.url,
                            quality: `${oh}p (${formatSize(f.filesize || f.filesize_approx)})`,
                            height: oh,
                            is_local: false
                        });
                    }
                }
            });
        }

        if (!cachedOnline || !existingMeta.subtitles || (existingMeta.views || 0) === 0) {
            refreshMetaTask(videoId, metaPath);
        }

        return res.json({
            stream_url: localFormat.url,
            formats: [localFormat, ...otherFormats.sort((a, b) => b.height - a.height)],
            is_offline: true,
            status: "playing",
            subtitles: (existingMeta.subtitles || []).filter(s => s.url?.startsWith('/subs/')),
            title: existingMeta.title || 'Unknown',
            uploader: existingMeta.uploader || 'Unknown',
            channel_id: existingMeta.channel_id,
            duration: existingMeta.duration,
            views: existingMeta.views || 0
        });
    }

    let onlineInfo = getCachedInfo(videoId);
    if (!onlineInfo) {
        try {
            console.log(`[Stream] Fetching online info for: ${videoId}`);
            const args = ['-m', 'yt_dlp', '--quiet', '--no-warnings', '--dump-json', `https://www.youtube.com/watch?v=${videoId}`];
            const stdout = await new Promise((resolve, reject) => {
                const p = spawn('python', args);
                let so = '';
                let se = '';
                p.stdout.on('data', d => so += d.toString());
                p.stderr.on('data', d => se += d.toString());
                p.on('close', code => code === 0 ? resolve(so) : reject(new Error(se || 'yt-dlp failed')));
            });
            onlineInfo = JSON.parse(stdout);
            setCachedInfo(videoId, onlineInfo);
        } catch (e) {
            return res.status(400).json({ detail: "Gagal mengambil aliran video" });
        }
    }

    const availableFormats = (onlineInfo.formats || [])
        .filter(f => f.url && f.acodec !== 'none' && f.vcodec !== 'none')
        .map(f => ({
            url: f.url,
            quality: `${f.height || 0}p (${formatSize(f.filesize || f.filesize_approx) || "Stream"})`,
            height: f.height || 0,
            is_local: false
        }))
        .sort((a, b) => b.height - a.height);

    const uniqueFormats = [];
    const seenHeights = new Set();
    for (const f of availableFormats) {
        if (!seenHeights.has(f.height)) {
            uniqueFormats.push(f);
            seenHeights.add(f.height);
        }
    }

    if (!activeDownloads.has(videoId)) {
        console.log(`[Download] Scheduling background download for ID: ${videoId}`);
        (async () => {
            try {
                // Give the browser a small head start (2 seconds) before starting heavy background download
                await new Promise(r => setTimeout(r, 2000));

                console.log(`[Download] Starting background download for ID: ${videoId}`);
                const bgSubs = await extractSubtitles(onlineInfo);
                const videoInfoToSave = {
                    id: videoId,
                    title: onlineInfo.title,
                    thumbnail: onlineInfo.thumbnail,
                    uploader: onlineInfo.uploader || onlineInfo.channel,
                    channel_id: onlineInfo.channel_id || onlineInfo.uploader_id,
                    duration: onlineInfo.duration,
                    views: onlineInfo.view_count || 0,
                    is_offline: true,
                    subtitles: bgSubs
                };
                await downloadVideoAndMeta(videoId, videoInfoToSave);
            } catch (e) {
                console.error(`Background process error: ${e.message}`);
                activeDownloads.delete(videoId);
            }
        })();
    }

    res.json({
        stream_url: uniqueFormats[0]?.url,
        formats: uniqueFormats,
        is_offline: false,
        status: "fetching_to_offline",
        subtitles: [],
        title: onlineInfo.title,
        uploader: onlineInfo.uploader || onlineInfo.channel,
        channel_id: onlineInfo.channel_id,
        duration: onlineInfo.duration,
        views: onlineInfo.view_count || 0
    });
});

app.get('/cancel_download', (req, res) => {
    const { video_id: videoId } = req.query;
    if (activeDownloads.has(videoId)) {
        const state = activeDownloads.get(videoId);
        state.cancelled = true;
        if (state.process) state.process.kill();
        return res.json({ status: "cancelling", id: videoId });
    }
    res.json({ status: "not_running" });
});

app.get('/get_video_meta/:videoId', async (req, res) => {
    const metaPath = path.join(META_DIR, `${req.params.videoId}.json`);
    if (await fs.pathExists(metaPath)) {
        return res.json(await fs.readJson(metaPath));
    }
    res.json({});
});

app.get('/list_offline', async (req, res) => {
    const videos = [];
    if (await fs.pathExists(META_DIR)) {
        const files = (await fs.readdir(META_DIR)).sort().reverse();
        for (const file of files) {
            if (file.endsWith('.json')) {
                try {
                    const v = await fs.readJson(path.join(META_DIR, file));
                    if (await fs.pathExists(path.join(CACHE_DIR, `${v.id}.mp4`))) {
                        videos.push(v);
                    }
                } catch (e) { }
            }
        }
    }
    res.json({ results: videos });
});

app.delete('/delete_offline/:videoId', async (req, res) => {
    const { videoId } = req.params;
    try {
        await Promise.all([
            fs.remove(path.join(CACHE_DIR, `${videoId}.mp4`)),
            fs.remove(path.join(CACHE_DIR, `${videoId}.mp4.part`)),
            fs.remove(path.join(META_DIR, `${videoId}.json`))
        ]);
        res.json({ status: "success" });
    } catch (e) {
        res.status(500).json({ detail: e.message });
    }
});

app.post('/save_history', async (req, res) => {
    const item = req.body;
    if (item.duration === 0 && item.views === 0) return res.json({ status: "ignored" });
    try {
        let history = await fs.readJson(HISTORY_FILE);
        history = history.filter(h => h.id !== item.id);
        history.unshift(item);
        history = history.slice(0, 100);
        await fs.writeJson(HISTORY_FILE, history, { spaces: 4 });
        res.json({ status: "success" });
    } catch (e) {
        res.status(500).json({ detail: e.message });
    }
});

app.get('/list_history', async (req, res) => {
    try {
        const data = await fs.readJson(HISTORY_FILE);
        res.json({ results: data.filter(h => !(h.duration === 0 && (h.views || 0) === 0)) });
    } catch (e) {
        res.json({ results: [] });
    }
});

app.delete('/delete_history/:videoId', async (req, res) => {
    try {
        let history = await fs.readJson(HISTORY_FILE);
        history = history.filter(h => h.id !== req.params.videoId);
        await fs.writeJson(HISTORY_FILE, history, { spaces: 4 });
        res.json({ status: "success" });
    } catch (e) {
        res.status(500).json({ detail: e.message });
    }
});

app.post('/clear_history', async (req, res) => {
    try {
        await fs.writeJson(HISTORY_FILE, [], { spaces: 4 });
        res.json({ status: "success" });
    } catch (e) {
        res.status(500).json({ detail: e.message });
    }
});

app.get('/search_suggestions', async (req, res) => {
    const { q } = req.query;
    if (!q) return res.json({ suggestions: [] });
    try {
        const resp = await axios.get(`https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(q)}`);
        res.json({ suggestions: resp.data[1] });
    } catch (e) {
        res.json({ suggestions: [] });
    }
});

app.get('/list_search_history', async (req, res) => {
    try { res.json({ results: await fs.readJson(SEARCH_HISTORY_FILE) }); }
    catch (e) { res.json({ results: [] }); }
});

app.post('/save_search_history', async (req, res) => {
    const q = req.body.query?.trim();
    if (!q) return res.json({ status: "ignored" });
    try {
        let hist = await fs.readJson(SEARCH_HISTORY_FILE);
        hist = [q, ...hist.filter(h => h !== q)].slice(0, 8);
        await fs.writeJson(SEARCH_HISTORY_FILE, hist, { spaces: 4 });
        res.json({ status: "success" });
    } catch (e) { res.json({ status: "error" }); }
});

app.delete('/delete_search_history', async (req, res) => {
    const { q } = req.query;
    try {
        let hist = await fs.readJson(SEARCH_HISTORY_FILE);
        hist = hist.filter(h => h !== q);
        await fs.writeJson(SEARCH_HISTORY_FILE, hist, { spaces: 4 });
        res.json({ status: "success" });
    } catch (e) { res.json({ status: "error" }); }
});

app.get('/list_playlists', async (req, res) => {
    try { res.json(await fs.readJson(PLAYLISTS_FILE)); }
    catch (e) { res.json({}); }
});

app.post('/add_to_playlist', async (req, res) => {
    const { playlist_name: name, video } = req.body;
    if (!name?.trim()) return res.status(400).json({ detail: "Name required" });
    try {
        const pl = await fs.readJson(PLAYLISTS_FILE);
        if (!pl[name]) pl[name] = [];
        pl[name] = [video, ...pl[name].filter(v => v.id !== video.id)];
        await fs.writeJson(PLAYLISTS_FILE, pl, { spaces: 4 });
        res.json({ status: "success" });
    } catch (e) { res.status(500).json({ detail: e.message }); }
});

app.post('/update_playlist_meta', async (req, res) => {
    const { playlist_name: name, video } = req.body;
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
        res.json({ status: "success" });
    } catch (e) { res.json({ status: "error" }); }
});

app.post('/update_playlist_channel_by_uploader', async (req, res) => {
    const { playlist_name: name, uploader, channel_id: cid } = req.body;
    if (!name || !uploader || !cid) return res.json({ status: "ignored" });
    try {
        const pl = await fs.readJson(PLAYLISTS_FILE);
        if (pl[name]) {
            let count = 0;
            const target = uploader.replaceAll('"', '');
            pl[name].forEach(v => {
                if ((v.uploader === target || v.uploader === uploader) && !v.channel_id) {
                    v.channel_id = cid;
                    count++;
                }
            });
            if (count > 0) await fs.writeJson(PLAYLISTS_FILE, pl, { spaces: 4 });
            return res.json({ status: "repaired", count });
        }
        res.json({ status: "no_change" });
    } catch (e) { res.json({ status: "error" }); }
});

app.get('/list_subscriptions', async (req, res) => {
    try { res.json({ results: await fs.readJson(SUBSCRIPTIONS_FILE) }); }
    catch (e) { res.json({ results: [] }); }
});

app.post('/toggle_subscription', async (req, res) => {
    const { channel_id: cid, uploader } = req.body;
    try {
        let subs = await fs.readJson(SUBSCRIPTIONS_FILE);
        const idx = subs.findIndex(s => s.channel_id === cid);
        if (idx > -1) {
            subs.splice(idx, 1);
            await fs.writeJson(SUBSCRIPTIONS_FILE, subs, { spaces: 4 });
            return res.json({ status: "unsubscribed" });
        } else {
            subs.push({ channel_id: cid, uploader });
            await fs.writeJson(SUBSCRIPTIONS_FILE, subs, { spaces: 4 });
            return res.json({ status: "subscribed" });
        }
    } catch (e) { res.status(500).json({ detail: e.message }); }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
