import { html } from 'hono/html';
import { Layout } from './layout.js';
import { VideoCard } from './components.js';

export const PlaylistDetail = (props) => {
    const { title, results, activePage, playingVideo, subscriptions } = props;

    return Layout({
        title: title,
        activePage: 'playlist',
        playingVideo,
        subscriptions,
        children: html`
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; padding: 0 5px;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <a href="/playlists" style="color: var(--text-dim);"><i class="fas fa-arrow-left"></i></a>
                    <h2 style="font-size: 1.3rem; margin: 0;">${title}</h2>
                </div>
                <span style="font-size: 0.8rem; color: var(--text-dim);">${results ? results.length : 0} Video</span>
            </div>

            <div class="grid-container">
                ${results && results.length > 0 ? html`
                    ${results.map(video => VideoCard(video))}
                ` : html`
                    <div style="text-align: center; padding: 100px 20px; opacity: 0.5; grid-column: 1 / -1;">
                        <i class="fas fa-list-ul" style="font-size: 3rem; margin-bottom: 20px; display: block;"></i>
                        <p>Playlist kosong.</p>
                    </div>
                `}
            </div>

            <style>
                .grid-container {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 15px;
                }
                @media (min-width: 600px) { .grid-container { grid-template-columns: repeat(2, 1fr); } }
                @media (min-width: 1200px) { .grid-container { grid-template-columns: repeat(3, 1fr); } }
                @media (min-width: 1600px) { .grid-container { grid-template-columns: repeat(4, 1fr); } }
            </style>
        `
    });
};
