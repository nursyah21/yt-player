import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import fs from 'fs-extra';
import path from 'path';
import { runYtDlp, CACHE_DIR, META_DIR, SUB_DIR, THUMB_DIR, HISTORY_FILE, PLAYLISTS_FILE, SUBSCRIPTIONS_FILE } from './utils.js';
import { Home } from './views/home.js';
import { Play } from './views/play.js';
import { History } from './views/history.js';
import { Offline } from './views/offline.js';
import { Playlists } from './views/playlists.js';
import { VideoCard } from './views/components.js';
import { PlaylistDetail } from './views/playlist_detail.js';

const app = new Hono();
const PORT = Number(process.env.PORT) || 8000;

// Static Files
app.use('/static/*', serveStatic({ root: './' }));
app.use('/offline/*', serveStatic({ root: './cached_videos', rewriteRequestPath: (path) => path.replace(/^\/offline/, '') }));

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
            videoMeta.stream_url = `/offline/${minId}.mp4`;
        } else {
            const history = await fs.readJson(HISTORY_FILE).catch(() => []);
            videoMeta = history.find(h => h.id === minId);
        }
        c.set('playingVideo', videoMeta);
    }
    await next();
});

// Home Route
// Home Route
const searchVideos = async (query, subs = [], page = 1) => {
    if (!query) return [];
    try {
        const pageSize = 20;
        const start = (page - 1) * pageSize + 1;
        const end = start + pageSize - 1;

        // Use a larger range for ytsearch to ensure we get results, as ytsearchN is strict
        const searchStr = query.startsWith('http') ? query : `ytsearch${end + 20}:${query}`;

        const stdout = await runYtDlp([
            '--quiet', '--no-warnings', '--flat-playlist', '--dump-single-json',
            '--playlist-start', start.toString(),
            '--playlist-end', end.toString(),
            searchStr
        ]);

        const info = JSON.parse(stdout);
        let entries = info.entries || [info];

        if (entries.length > pageSize) {
            entries = entries.slice(0, pageSize);
        }

        const results = await Promise.all(entries.map(async (entry) => {
            if (!entry) return null;
            const isReady = await fs.pathExists(path.join(CACHE_DIR, `${entry.id}.mp4`));
            const channelId = entry.channel_id || entry.uploader_id;
            return {
                id: entry.id,
                title: entry.title,
                thumbnail: entry.thumbnail || entry.thumbnails?.[0]?.url,
                uploader: entry.uploader || entry.channel,
                channel_id: channelId,
                duration: entry.duration,
                views: entry.view_count || 0,
                is_offline: isReady,
                is_subscribed: subs.some(s => s.channel_id === channelId)
            };
        }));
        return results.filter(r => r);
    } catch (e) {
        console.error(e);
        return [];
    }
};

app.get('/', async (c) => {
    const query = c.req.query('q');
    const playingVideo = c.get('playingVideo');
    const subscriptions = c.get('subscriptions');
    const results = await searchVideos(query, subscriptions, 1);
    return c.html(Home({ results, query, activePage: 'home', playingVideo, subscriptions }));
});

// Play Route
app.get('/play', async (c) => {
    const videoId = c.req.query('v');
    if (!videoId) return c.redirect('/');

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
                subtitles: []
            };

            // Auto-save history
            let history = await fs.readJson(HISTORY_FILE).catch(() => []);
            const histItem = { id: videoId, title: videoData.title, uploader: videoData.uploader, thumbnail: videoData.thumbnail, duration: videoData.duration, views: videoData.views, channel_id: videoData.channel_id };
            history = [histItem, ...history.filter(h => h.id !== videoId)].slice(0, 100);
            await fs.writeJson(HISTORY_FILE, history, { spaces: 4 });

        } catch (e) {
            console.error(e);
            return c.text("Gagal memutar video.");
        }
    }

    // Get Related Videos (from history for now as in old server)
    const history = await fs.readJson(HISTORY_FILE).catch(() => []);
    const relatedVideos = history.filter(v => v.id !== videoId).slice(0, 10);

    // Get Subscription Status
    const subs = c.get('subscriptions');
    const isSubscribed = subs.some(s => s.channel_id === videoData.channel_id);

    return c.html(Play({
        ...videoData,
        relatedVideos,
        isSubscribed,
        subscriptions: subs
    }));
});

// API: Suggestions
app.get('/api/suggestions', async (c) => {
    const q = c.req.query('q');
    if (!q) return c.json([]);
    try {
        const res = await fetch(`https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(q)}`);
        const data = await res.json();
        return c.json(data[1] || []);
    } catch (e) {
        return c.json([]);
    }
});

app.get('/api/search', async (c) => {
    const q = c.req.query('q');
    const page = Number(c.req.query('page')) || 1;
    const subscriptions = c.get('subscriptions');
    if (!q) return c.text('');

    const results = await searchVideos(q, subscriptions, page);
    if (!results || results.length === 0) return c.text('');

    const htmlStr = results.map(video => VideoCard(video)).join('');
    return c.html(htmlStr);
});

// API: Toggle Subscription
app.post('/toggle_subscription', async (c) => {
    const { channel_id, uploader } = await c.req.json();
    let subs = await fs.readJson(SUBSCRIPTIONS_FILE).catch(() => []);
    const idx = subs.findIndex(s => s.channel_id === channel_id);
    if (idx > -1) subs.splice(idx, 1);
    else subs.push({ channel_id, uploader });
    await fs.writeJson(SUBSCRIPTIONS_FILE, subs, { spaces: 4 });
    return c.json({ status: "ok" });
});

// API: Playlists
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

// Placeholder for other pages
// History
app.get('/history', async (c) => {
    const history = await fs.readJson(HISTORY_FILE).catch(() => []);
    const playingVideo = c.get('playingVideo');
    const subscriptions = c.get('subscriptions');
    return c.html(History({ results: history, playingVideo, subscriptions }));
});

app.post('/clear_history', async (c) => {
    await fs.writeJson(HISTORY_FILE, [], { spaces: 4 });
    return c.redirect('/history');
});

// Offline
app.get('/offline', async (c) => {
    const files = await fs.readdir(CACHE_DIR).catch(() => []);
    const mp4Files = files.filter(f => f.endsWith('.mp4'));
    const results = [];

    for (const file of mp4Files) {
        const id = file.replace('.mp4', '');
        const metaPath = path.join(META_DIR, `${id}.json`);
        if (await fs.pathExists(metaPath)) {
            const meta = await fs.readJson(metaPath);
            meta.is_offline = true;
            results.push(meta);
        }
    }

    const playingVideo = c.get('playingVideo');
    const subscriptions = c.get('subscriptions');
    return c.html(Offline({ results, playingVideo, subscriptions }));
});

app.delete('/delete_offline/:id', async (c) => {
    const id = c.req.param('id');
    try {
        await fs.remove(path.join(CACHE_DIR, `${id}.mp4`));
        await fs.remove(path.join(META_DIR, `${id}.json`));

        const thumbs = await fs.readdir(THUMB_DIR).catch(() => []);
        const thumb = thumbs.find(t => t.startsWith(id + '.'));
        if (thumb) await fs.remove(path.join(THUMB_DIR, thumb));

        const subs = await fs.readdir(SUB_DIR).catch(() => []);
        const relatedSubs = subs.filter(s => s.startsWith(id + '.'));
        for (const sub of relatedSubs) await fs.remove(path.join(SUB_DIR, sub));

        return c.json({ status: 'ok' });
    } catch (e) {
        return c.json({ status: 'error', message: e.message }, 500);
    }
});

// Playlists
app.get('/playlists', async (c) => {
    const playlists = await fs.readJson(PLAYLISTS_FILE).catch(() => ({}));
    const playingVideo = c.get('playingVideo');
    const subscriptions = c.get('subscriptions');
    return c.html(Playlists({ results: playlists, playingVideo, subscriptions }));
});

app.post('/create_playlist', async (c) => {
    const { name } = await c.req.json();
    if (!name) return c.json({ status: 'error' }, 400);

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
    const results = playlists[name] || [];
    const playingVideo = c.get('playingVideo');
    const subscriptions = c.get('subscriptions');
    return c.html(PlaylistDetail({ title: name, results, playingVideo, subscriptions }));
});

console.log(`Server running on http://localhost:${PORT}`);

serve({
    fetch: app.fetch,
    port: PORT
});
