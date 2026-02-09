import { html } from 'hono/html';
import { Layout } from './layout.js';
import { VideoCard } from './components.js';
import { formatDuration, formatViews } from '../utils.js';

export const Play = (props) => {
    const {
        id, title, uploader, thumbnail, duration, views, channel_id, stream_url, is_offline,
        subtitles, relatedVideos, isSubscribed, subscriptions
    } = props;

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
                        <source src="${stream_url}" type="${stream_url.endsWith('.webm') ? 'video/webm' : 'video/mp4'}">
                        ${subtitles && subtitles.map(sub => html`<track kind="captions" src="${sub.url}" srclang="${sub.lang}" label="${sub.name}">`)}
                    </video>
                </div>

                <div style="margin-bottom: 20px;">
                    <h1 style="font-size: 1.2rem; font-weight: 700; margin: 0 0 10px 0; line-height: 1.4;">${title}</h1>
                    
                    <div style="display: flex; flex-wrap: wrap; gap: 15px; align-items: center; justify-content: space-between; margin-bottom: 15px;">
                        <div onclick="navigate('/?q=${encodeURIComponent(uploader)}')" style="display: flex; align-items: center; gap: 12px; cursor: pointer;">
                            <div style="width: 40px; height: 40px; border-radius: 50%; background: var(--surface-accent); display: flex; align-items: center; justify-content: center; font-weight: 700;">
                                ${(uploader || 'C').charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h3 style="margin: 0; font-size: 0.95rem; font-weight: 600;">${uploader}</h3>
                                <p style="margin: 2px 0 0; font-size: 0.75rem; color: var(--text-dim);">${formatViews(views)} x tonton</p>
                            </div>
                        </div>
                        
                        <div style="display: flex; gap: 10px; align-items: center;">
                            <button onclick="toggleGlobalSub('${channel_id}', '${safeStr(uploader)}')" 
                                class="sub-btn ${isSubscribed ? 'subscribed' : ''}"
                                style="padding: 8px 20px; border-radius: 20px; border: none; font-weight: 600; font-size: 0.85rem; cursor: pointer; background: ${isSubscribed ? 'var(--surface-accent)' : '#fff'}; color: ${isSubscribed ? 'var(--text-dim)' : '#000'};">
                                ${isSubscribed ? 'Disubscribe' : 'Subscribe'}
                            </button>
                            
                            <button onclick="openPlaylistModal('${id}', '${encodeURIComponent(title)}', '${encodeURIComponent(uploader)}', '${thumbnail}', '${duration}', '${views}', '${channel_id}')" style="background: var(--surface-accent); border: none; width: 40px; height: 40px; border-radius: 50%; color: white; cursor: pointer; display: flex; align-items: center; justify-content: center;">
                                <i class="icon icon-plus"></i>
                            </button>

                            <div style="position: relative; display: flex; align-items: center; gap: 8px;">
                                <button id="dlBtn" onclick="startDownload('${id}')" style="background: ${is_offline ? 'var(--surface-accent)' : '#fff'}; border: none; width: 40px; height: 40px; border-radius: 50%; color: ${is_offline ? 'white' : '#000'}; cursor: pointer; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden;">
                                    <i class="icon icon-download" id="dlIcon"></i>
                                    <div id="dlFullProgress" style="position: absolute; bottom: 0; left: 0; height: 100%; width: 0%; background: rgba(30, 215, 96, 0.3); transition: width 0.3s;"></div>
                                </button>
                                <span id="dlText" style="font-size: 0.75rem; color: var(--text-dim); font-weight: 600; min-width: 30px; display: none;">0%</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div style="border-top: 1px solid rgba(255,255,255,0.05); margin: 20px 0;"></div>

                <h3 style="font-size: 1rem; margin-bottom: 15px;">Video Terkait</h3>
                <div class="related-grid" style="display: grid; gap: 15px;">
                    ${relatedVideos && relatedVideos.length > 0 ? relatedVideos.map(video => VideoCard(video)) : html`<p style="text-align: center; padding: 20px; opacity: 0.5;">Belum ada video terkait</p>`}
                </div>
            </div>

            <script>
                window.startDownload = async function(id) {
                    const btn = document.getElementById('dlBtn');
                    if (btn.disabled || '${is_offline}' === 'true') return;
                    try {
                        await fetch('/api/download/' + id, { method: 'POST' });
                        btn.style.opacity = '0.7';
                        checkDownloadStatus();
                    } catch (e) { console.error(e); }
                };

                async function checkDownloadStatus() {
                    const id = '${id}';
                    const icon = document.getElementById('dlIcon');
                    const text = document.getElementById('dlText');
                    const progressBg = document.getElementById('dlFullProgress');
                    const btn = document.getElementById('dlBtn');

                    try {
                        const res = await fetch('/api/download_status/' + id);
                        const data = await res.json();
                        
                        if (data.status === 'downloading' || data.status === 'finished') {
                            text.style.display = 'inline';
                            text.innerText = Math.round(data.progress) + '%';
                            progressBg.style.width = data.progress + '%';
                            
                            if (data.status === 'finished') {
                                text.style.display = 'none';
                                btn.style.background = 'var(--surface-accent)';
                                btn.style.color = 'white';
                                btn.style.opacity = '1';
                                progressBg.style.display = 'none';
                                switchToOffline();
                                return;
                            }
                            setTimeout(checkDownloadStatus, 2000);
                        }
                    } catch (e) { console.error(e); }
                }

                function switchToOffline() {
                    const player = document.getElementById('mainPlayer');
                    // Jika sudah menggunakan offline, jangan refresh
                    if (player.querySelector('source').src.includes('/offline/')) return;
                    
                    const currentTime = Math.floor(player.currentTime);
                    const url = new URL(window.location.href);
                    url.searchParams.set('t', currentTime);
                    
                    showToast('Download selesai! Me-refresh untuk menggunakan versi offline...', 'success');
                    
                    setTimeout(() => {
                        window.location.href = url.toString();
                    }, 1000);
                }

                document.addEventListener('DOMContentLoaded', () => {
                    const player = document.getElementById('mainPlayer');
                    if (player) {
                        const savedTime = localStorage.getItem('videoTime_${id}');
                        if (savedTime) player.currentTime = parseFloat(savedTime);
                        player.ontimeupdate = () => { localStorage.setItem('videoTime_${id}', player.currentTime); };
                    }
                    checkDownloadStatus();
                });
            </script>

            <style>
                @media (min-width: 600px) { .related-grid { grid-template-columns: repeat(2, 1fr); } } 
                @media (min-width: 1000px) { .related-grid { grid-template-columns: repeat(3, 1fr); } }
            </style>
        `
    });
};
