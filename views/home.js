import { html } from 'hono/html';
import { Layout } from './layout.js';
import { VideoCard } from './components.js';

export const Home = (props) => {
    const { results, query, activePage, playingVideo, subscriptions } = props;

    return Layout({
        title: query ? `Hasil Pencarian: ${query}` : 'Beranda',
        activePage,
        playingVideo,
        query,
        subscriptions,
        children: html`
            <style>
                .grid-container {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 15px;
                }
                @media (min-width: 600px) { .grid-container { grid-template-columns: repeat(2, 1fr); } }
                @media (min-width: 1200px) { .grid-container { grid-template-columns: repeat(3, 1fr); } }
                @media (min-width: 1600px) { .grid-container { grid-template-columns: repeat(4, 1fr); } }
                
                .load-more-btn {
                    grid-column: 1 / -1;
                    padding: 15px;
                    background: var(--surface);
                    color: var(--text-dim);
                    border: 1px solid rgba(255,255,255,0.05);
                    border-radius: 12px;
                    cursor: pointer;
                    text-align: center;
                    font-weight: 600;
                    margin-top: 20px;
                    transition: all 0.2s;
                }
                .load-more-btn:hover {
                    background: var(--surface-accent);
                    color: white;
                }
                .load-more-btn.loading {
                    opacity: 0.5;
                    pointer-events: none;
                }
            </style>

            <div class="grid-container" id="resultsGrid">
                ${results && results.length > 0 ? html`
                    ${results.map(video => VideoCard(video))}
                ` : ''}
                
                ${query && results && results.length > 0 ? html`
                    <button id="loadMoreBtn" class="load-more-btn" onclick="loadMore('${query}')">
                        Muat Lebih Banyak
                    </button>
                ` : ''}
            </div>

            ${(!results || results.length === 0) ? html`
                ${query ? html`
                    <div style="text-align: center; padding: 100px 20px; opacity: 0.5;">
                        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; margin: 0 auto 20px;">
                            <i class="icon icon-search" style="font-size: 3rem; margin-bottom: 15px; display: block;"></i>
                            <p>Video tidak ditemukan: "${query}"</p>
                        </div>
                    </div>
                ` : html`
                    <div style="text-align: center; padding: 100px 20px;">
                        <div style="width: 80px; height: 80px; border-radius: 50%; background: #1a1a1e; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;">
                            <i class="icon icon-play" style="color: var(--primary); font-size: 1.5rem; margin-left: 5px;"></i>
                        </div>
                    </div>

                `}
            ` : ''}

            <script>
                let currentPage = 1;
                async function loadMore(query) {
                    const btn = document.getElementById('loadMoreBtn');
                    btn.classList.add('loading');
                    btn.innerText = 'Memuat...';
                    
                    currentPage++;
                    
                    try {
                        const res = await fetch('/api/search?q=' + encodeURIComponent(query) + '&page=' + currentPage);
                        const html = await res.text();
                        
                        if (html.trim()) {
                            // Insert before the button
                            btn.insertAdjacentHTML('beforebegin', html);
                            btn.classList.remove('loading');
                            btn.innerText = 'Muat Lebih Banyak';
                        } else {
                            btn.style.display = 'none';
                        }
                    } catch (e) {
                        console.error(e);
                        btn.classList.remove('loading');
                        btn.innerText = 'Gagal memuat. Coba lagi.';
                    }
                }
            </script>
        `
    });
};
