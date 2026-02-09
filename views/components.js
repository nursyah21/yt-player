import { html } from 'hono/html';
import { formatDuration, formatViews } from '../utils.js';

export const VideoCard = (video) => html`
    <div class="video-card" onclick="navigate('/play?v=${video.id}')" style="cursor: pointer; position: relative;">
        <div class="thumb-container" style="position: relative;">
            <img src="${video.thumbnail}" loading="lazy" style="width: 100%; aspect-ratio: 16/9; object-fit: cover;">
            
            <div style="position: absolute; top: 8px; left: 8px; display: flex; gap: 5px; z-index: 5;">
                ${video.is_offline ? html`
                    <span style="background: #2ecc71; padding: 2px 8px; border-radius: 6px; font-size: 0.65rem; font-weight: 800; color: white; text-transform: uppercase; box-shadow: 0 4px 10px rgba(0,0,0,0.4); backdrop-filter: blur(4px);">Offline</span>
                ` : html`
                    <div id="card-dl-${video.id}" style="display: none; background: rgba(255, 0, 0, 0.85); padding: 2px 8px; border-radius: 6px; font-size: 0.65rem; font-weight: 800; color: white; text-transform: uppercase; backdrop-filter: blur(8px); box-shadow: 0 4px 10px rgba(255,0,0,0.3);">Downloading...</div>
                `}
            </div>

            <span class="duration-tag" style="position: absolute; bottom: 8px; right: 8px; background: rgba(0,0,0,0.8); padding: 2px 6px; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">
                ${formatDuration(video.duration)}
            </span>
        </div>
        <div class="video-meta" style="padding: 12px;">
            <div class="video-info" style="position: relative;">
                <h3 class="video-title" style="margin: 0; font-size: 0.95rem; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; padding-right: 25px;">${video.title}</h3>
                
                <button class="menu-btn" onclick="toggleMenu(event, '${video.id}')" style="position: absolute; top: 0; right: -5px; background: none; border: none; color: var(--text-dim); cursor: pointer;">
                    <i class="icon icon-more-vertical"></i>
                </button>
                
                <div id="menu-${video.id}" class="video-menu" style="display: none; position: absolute; right: 0; top: 30px; background: var(--surface-accent); border-radius: 8px; padding: 5px; z-index: 100; box-shadow: 0 10px 20px rgba(0,0,0,0.5); width: 180px;">
                    <div class="menu-item" onclick="event.stopPropagation(); toggleGlobalSub('${video.channel_id}', '${encodeURIComponent(video.uploader || '')}')" style="padding: 8px 12px; font-size: 0.85rem; display: flex; align-items: center; gap: 10px; cursor: pointer;">
                        <i class="icon ${video.is_subscribed ? 'icon-user-minus' : 'icon-user-plus'}"></i> 
                        <span>${video.is_subscribed ? 'Unsubscribe' : 'Subscribe'}</span>
                    </div>
                    <div class="menu-item" onclick="event.stopPropagation(); openPlaylistModal('${video.id}', '${encodeURIComponent(video.title)}', '${encodeURIComponent(video.uploader || '')}', '${video.thumbnail}', '${video.duration}', '${video.views}', '${video.channel_id}')" style="padding: 8px 12px; font-size: 0.85rem; display: flex; align-items: center; gap: 10px; cursor: pointer;">
                        <i class="icon icon-plus"></i> 
                        <span>Simpan ke Playlist</span>
                    </div>
                    <div class="menu-item" onclick="event.stopPropagation(); window.location.href='/play?v=${video.id}&download=1'" style="padding: 8px 12px; font-size: 0.85rem; display: flex; align-items: center; gap: 10px; cursor: pointer;">
                        <i class="icon icon-download"></i> 
                        <span>Download HQ (Kecil)</span>
                    </div>
                </div>

                <div class="video-subtext" style="margin-top: 5px; font-size: 0.8rem; color: var(--text-dim);">
                    <a href="/?q=${encodeURIComponent(video.uploader || '')}" onclick="event.stopPropagation();" style="color: var(--text-dim); text-decoration: none; display: block; margin-bottom: 2px; transition: color 0.2s;" onmouseover="this.style.color='var(--primary)'" onmouseout="this.style.color='var(--text-dim)'" title="Lihat channel ${video.uploader}">
                        ${video.uploader}
                    </a>
                    <div>${formatViews(video.views)} x tonton</div>
                </div>
            </div>
        </div>
        <script>
            (async function() {
                if ('${video.is_offline}' === 'true') return;
                try {
                    const res = await fetch('/api/download_status/${video.id}');
                    const data = await res.json();
                    if (data.status === 'downloading') {
                        const el = document.getElementById('card-dl-${video.id}');
                        if (el) el.style.display = 'block';
                    }
                } catch(e) {}
            })();
        </script>
    </div>
`;
