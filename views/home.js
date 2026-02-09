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
                
                .loading-indicator {
                    grid-column: 1 / -1;
                    padding: 30px 20px;
                    padding-bottom: 120px; /* Extra padding untuk mini-player */
                    text-align: center;
                    color: var(--text-dim);
                    font-weight: 600;
                    font-size: 0.9rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                }
            </style>

            <div class="grid-container" id="resultsGrid">
                ${results && results.length > 0 ? html`
                    ${results.map(video => VideoCard(video))}
                ` : ''}
                
                ${query && results && results.length > 0 ? html`
                    <div id="loadingSentinel" class="loading-indicator">
                        <span>Memuat...</span>
                    </div>
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
                        <p style="color: var(--text-dim); font-size: 0.9rem;">Cari sesuatu untuk mulai menonton</p>
                    </div>
                `}
            ` : ''}

            <script>
                (function() {
                    let currentPage = 1;
                    let isLoading = false;
                    let hasMore = true;
                    const query = '${query || ''}';
                    const sentinel = document.getElementById('loadingSentinel');
                    const grid = document.getElementById('resultsGrid');

                    if (!sentinel || !query) return;

                    const observer = new IntersectionObserver(async (entries) => {
                        const entry = entries[0];
                        if (entry.isIntersecting && !isLoading && hasMore) {
                            await loadMore();
                        }
                    }, {
                        rootMargin: '200px' // Pre-load when sentinel is 200px from viewport
                    });

                    observer.observe(sentinel);

                    async function loadMore() {
                        isLoading = true;
                        currentPage++;
                        console.log('[CLIENT] Loading page ' + currentPage);
                        
                        try {
                            const res = await fetch('/api/search?q=' + encodeURIComponent(query) + '&page=' + currentPage);
                            const html = await res.text();
                            
                            if (html.trim()) {
                                // Create a temp div to parse HTML
                                const temp = document.createElement('div');
                                temp.innerHTML = html;
                                
                                // Append each new video card before the sentinel
                                while (temp.firstChild) {
                                    grid.insertBefore(temp.firstChild, sentinel);
                                }
                                isLoading = false;
                            } else {
                                hasMore = false;
                                sentinel.style.display = 'none';
                                observer.disconnect();
                            }
                        } catch (e) {
                            console.error(e);
                            isLoading = false;
                            sentinel.innerHTML = '<span>Gagal memuat. Mencoba lagi...</span>';
                            setTimeout(loadMore, 3000);
                        }
                    }
                })();
            </script>
        `
    });
};
