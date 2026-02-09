import { html } from 'hono/html';
import { Layout } from './layout.js';
import { VideoCard } from './components.js';

export const History = (props) => {
    const { results, playingVideo, subscriptions } = props;

    return Layout({
        title: 'Histori Tontonan',
        activePage: 'history',
        playingVideo,
        subscriptions,
        children: html`
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; padding: 0 5px;">
                <h2 style="font-size: 1.3rem; margin: 0;">Histori Tontonan</h2>
                <form action="/clear_history" method="POST" onsubmit="return confirm('Hapus semua histori?')">
                    <button type="submit"
                        style="background: none; border: none; color: #ff4d4d; font-size: 0.8rem; font-weight: 600; cursor: pointer;">Hapus Semua</button>
                </form>
            </div>

            <div class="grid-container">
                ${results && results.length > 0 ? html`
                    ${results.map(video => VideoCard(video))}
                ` : html`
                    <div style="text-align: center; padding: 100px 20px; opacity: 0.5; grid-column: 1 / -1;">
                        <i class="fas fa-clock-rotate-left" style="font-size: 3rem; margin-bottom: 20px; display: block;"></i>
                        <p>Belum ada histori tontonan.</p>
                    </div>
                `}
            </div>

            <style>
                .grid-container {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 15px;
                }
                @media (min-width: 700px) { .grid-container { grid-template-columns: repeat(2, 1fr); } }
                @media (min-width: 1000px) { .grid-container { grid-template-columns: repeat(3, 1fr); } }
                @media (min-width: 1200px) { .grid-container { grid-template-columns: repeat(4, 1fr); } }
                @media (min-width: 1600px) { .grid-container { grid-template-columns: repeat(6, 1fr); } }
            </style>
        `
    });
};
