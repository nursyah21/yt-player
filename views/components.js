import { html } from 'hono/html';
import { formatDuration, formatViews } from '../utils.js';

export const VideoCard = (video) => html`
    <div class="video-card" onclick="navigate('/play?v=${video.id}')" style="cursor: pointer; position: relative;">
        <div class="thumb-container">
            <img src="${video.thumbnail}" loading="lazy">
            <span class="duration-tag">
                ${formatDuration(video.duration)}
            </span>
        </div>
        <div class="video-meta">
            <div class="video-info">
                <h3 class="video-title">${video.title}</h3>
                
                <button class="menu-btn" onclick="toggleMenu(event, '${video.id}')">
                    <i class="icon icon-more-vertical"></i>
                </button>
                
                <div id="menu-${video.id}" class="video-menu" style="display: none;">
                    <div class="menu-item" onclick="event.stopPropagation(); toggleGlobalSub('${video.channel_id}', '${encodeURIComponent(video.uploader || '')}')">
                        <i class="icon ${video.is_subscribed ? 'icon-user-minus' : 'icon-user-plus'}"></i> 
                        <span>${video.is_subscribed ? 'Unsubscribe' : 'Subscribe'}</span>
                    </div>
                    <div class="menu-item" onclick="event.stopPropagation(); openPlaylistModal('${video.id}', '${encodeURIComponent(video.title)}', '${encodeURIComponent(video.uploader || '')}', '${video.thumbnail}', '${video.duration}', '${video.views}', '${video.channel_id}')">
                        <i class="icon icon-plus"></i> 
                        <span>Simpan ke Playlist</span>
                    </div>
                    <div class="menu-item" onclick="event.stopPropagation(); window.location.href='/play?v=${video.id}&download=1'">
                        <i class="icon icon-download"></i> 
                        <span>Download</span>
                    </div>
                </div>

                <div class="video-subtext">
                    <span onclick="event.stopPropagation(); navigate('/?q=${encodeURIComponent(video.uploader || '')}')" style="cursor: pointer;" title="Lihat channel ${video.uploader}">
                        ${video.uploader}
                    </span>
                    <span>${formatViews(video.views)} x tonton</span>
                </div>
            </div>
        </div>
    </div>
`;
