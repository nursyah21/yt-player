import { html } from 'hono/html';
import { Layout } from './layout.js';
import { VideoCard } from './components.js';
import { formatDuration, formatViews } from '../utils.js';

export const Play = (props) => {
    const {
        id, title, uploader, thumbnail, duration, views, channel_id, stream_url, is_offline,
        subtitles, relatedVideos, isSubscribed, subscriptions
    } = props;

    // Helper safely escape string for JS execution context
    const safeStr = (str) => {
        if (!str) return '';
        return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"').replace(/\n/g, '\\n');
    }

    return Layout({
        title: title,
        activePage: 'play',
        subscriptions,
        children: html`
            <div style="max-width: 1000px; margin: 0 auto;">
                <div style="position: relative; width: 100%; aspect-ratio: 16/9; background: #000; border-radius: 12px; overflow: hidden; margin-bottom: 20px; box-shadow: 0 4px 30px rgba(0,0,0,0.5);">
                    <video id="mainPlayer" 
                        poster="${thumbnail}" 
                        style="width: 100%; height: 100%; object-fit: contain;" 
                        controls autoplay playsinline>
                        <source src="${stream_url}" type="video/mp4">
                        ${subtitles && subtitles.map(sub => html`<track kind="captions" src="${sub.url}" srclang="${sub.lang}" label="${sub.name}">`)}
                        Browser Anda tidak mendukung tag video.
                    </video>
                </div>

                <div style="margin-bottom: 20px;">
                    <h1 style="font-size: 1.2rem; font-weight: 700; margin: 0 0 10px 0; line-height: 1.4;">
                        ${title}
                    </h1>
                    
                    <div style="display: flex; flex-wrap: wrap; gap: 15px; align-items: center; justify-content: space-between; margin-bottom: 15px;">
                            <div onclick="navigate('/?q=${encodeURIComponent(uploader)}')" style="display: flex; align-items: center; gap: 12px; cursor: pointer;" title="Lihat channel ${uploader}">
                                <div style="width: 40px; height: 40px; border-radius: 50%; background: var(--surface-accent); display: flex; align-items: center; justify-content: center; font-weight: 700; color: var(--text-dim);">
                                    ${(uploader || 'C').charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h3 style="margin: 0; font-size: 0.95rem; font-weight: 600;">${uploader}</h3>
                                    <p style="margin: 2px 0 0; font-size: 0.75rem; color: var(--text-dim);">${formatViews(views)} x tonton</p>
                                </div>
                            </div>
                            
                            <button onclick="toggleGlobalSub('${channel_id}', '${safeStr(uploader)}')" 
                                class="sub-btn ${isSubscribed ? 'subscribed' : ''}"
                                style="margin-left: 10px; padding: 8px 30px; border-radius: 20px; border: none; font-weight: 600; font-size: 0.85rem; cursor: pointer; transition: all 0.2s; background: ${isSubscribed ? 'var(--surface-accent)' : '#fff'}; color: ${isSubscribed ? 'var(--text-dim)' : '#000'};">
                                ${isSubscribed ? 'Disubscribe' : 'Subscribe'}
                            </button>
                        </div>
                        
                        <div style="display: flex; gap: 10px;">
                            <button onclick="openPlaylistModal('${id}', '${encodeURIComponent(title)}', '${encodeURIComponent(uploader)}', '${thumbnail}', '${duration}', '${views}', '${channel_id}')" style="background: var(--surface-accent); border: none; width: 40px; height: 40px; border-radius: 50%; color: white; cursor: pointer; display: flex; align-items: center; justify-content: center;">
                                <i class="icon icon-plus"></i>
                            </button>
                            <a href="${stream_url}" download target="_blank" style="background: var(--surface-accent); border: none; width: 40px; height: 40px; border-radius: 50%; color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; text-decoration: none;">
                                <i class="icon icon-download"></i>
                            </a>
                        </div>
                    </div>
                </div>

                <div style="border-top: 1px solid rgba(255,255,255,0.05); margin: 20px 0;"></div>

                <h3 style="font-size: 1rem; margin-bottom: 15px;">Video Terkait</h3>
                <div class="related-grid" style="display: grid; gap: 15px;">
                    ${relatedVideos && relatedVideos.length > 0 ? html`
                        ${relatedVideos.map(video => VideoCard(video))}
                    ` : html`
                         <p style="font-size: 0.8rem; color: var(--text-dim); text-align: center; padding: 20px;">Belum ada video terkait</p>
                    `}
                </div>
            </div>

            <script>
                document.addEventListener('DOMContentLoaded', function () {
                    const player = document.getElementById('mainPlayer');
                    if (player) {
                        const urlParams = new URLSearchParams(window.location.search);
                        const tParam = urlParams.get('t');
                        const savedTime = localStorage.getItem('videoTime_${id}');
                        
                        // Priority: URL Param 't' > LocalStorage > Start from 0
                        if (tParam) {
                            player.currentTime = parseFloat(tParam);
                        } else if (savedTime) {
                            player.currentTime = parseFloat(savedTime);
                        }

                        // Save time periodically
                        player.ontimeupdate = () => {
                            localStorage.setItem('videoTime_${id}', player.currentTime);
                        };

                        // Auto-play and MediaSession
                        player.play().then(() => {
                            updateMediaMetadata({
                                title: '${safeStr(title)}',
                                uploader: '${safeStr(uploader)}',
                                thumbnail: '${thumbnail}'
                            }, player);
                        }).catch(e => console.log('Autoplay blocked:', e));
                    }
                });
            </script>

            <!-- Play view specific scripts/modals removed as they are now global in Layout -->

            <style>
                #modalBackdrop.show, #playlistModal.show { display: block !important; opacity: 1; pointer-events: auto; }
                @media (min-width: 600px) { .related-grid { grid-template-columns: repeat(2, 1fr); } } 
                @media (min-width: 1000px) { .related-grid { grid-template-columns: repeat(3, 1fr); } }
            </style>
        `
    });
};
