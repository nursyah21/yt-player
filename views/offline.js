import { html } from 'hono/html';
import { Layout } from './layout.js';
import { formatDuration } from '../utils.js';

export const Offline = (props) => {
    const { results, playingVideo, subscriptions } = props;

    return Layout({
        title: 'Video Offline',
        activePage: 'offline',
        playingVideo,
        subscriptions,
        children: html`
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; padding: 0 5px;">
                <h2 style="font-size: 1.3rem; margin: 0;">Video Offline</h2>
                <span style="font-size: 0.8rem; color: var(--text-dim);">
                    ${results ? results.length : 0} Video
                </span>
            </div>

            <div class="grid-container">
                ${results && results.length > 0 ? html`
                    ${results.map(video => html`
                        <div class="video-card" onclick="navigate('/play?v=${video.id}')">
                            <div class="thumb-container">
                                <img src="${video.thumbnail || ''}" loading="lazy">
                                <span class="duration-tag">
                                    ${formatDuration(video.duration)}
                                </span>
                                <div style="position: absolute; top: 8px; right: 8px; background: rgba(0,255,100,0.8); width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px;">
                                    <i class="fas fa-check" style="color: black;"></i>
                                </div>
                            </div>
                            <div class="video-meta">
                                <div class="channel-avatar">
                                </div>
                                <div class="video-info">
                                    <h3 class="video-title">${video.title}</h3>
                                    <div class="video-subtext">
                                        <span>${video.uploader}</span>
                                        <span class="dot"></span>
                                        <span>Offline</span>
                                    </div>
                                </div>
                                <button onclick="deleteOffline(event, '${video.id}')"
                                    style="background: none; border: none; color: var(--text-dim); padding: 5px; cursor: pointer;">
                                    <i class="fas fa-trash-alt"></i>
                                </button>
                            </div>
                        </div>
                    `)}
                ` : html`
                    <div style="text-align: center; padding: 100px 20px; opacity: 0.5; grid-column: 1 / -1;">
                        <div style="width: 80px; height: 80px; border-radius: 50%; background: #1a1a1e; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;">
                            <i class="fas fa-cloud-download-alt" style="font-size: 1.5rem;"></i>
                        </div>
                        <p>Belum ada video offline.</p>
                        <a href="/" style="color: var(--primary); font-size: 0.9rem; text-decoration: none;">Cari & Download</a>
                    </div>
                `}
            </div>

            <style>
                .grid-container {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 15px;
                    margin-bottom: 20px;
                }
                @media (min-width: 600px) { .grid-container { grid-template-columns: repeat(2, 1fr); } }
                @media (min-width: 1200px) { .grid-container { grid-template-columns: repeat(3, 1fr); } }
                @media (min-width: 1600px) { .grid-container { grid-template-columns: repeat(4, 1fr); } }
            </style>

            <script>
                async function deleteOffline(event, videoId) {
                    event.stopPropagation();
                    if (confirm('Hapus video ini dari memori offline?')) {
                        const res = await fetch('/delete_offline/' + videoId, { method: 'DELETE' });
                        if (res.ok) location.reload();
                    }
                }
            </script>
        `
    });
};
