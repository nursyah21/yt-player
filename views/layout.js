import { html } from 'hono/html';

export const Layout = (props) => {
    const { title, activePage, playingVideo, query, children, subscriptions } = props;

    return html`<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
    <title>${title || 'YT-Studio'}</title>
    <link rel="shortcut icon" href="/static/favicon.ico" type="image/x-icon">
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <meta name="referrer" content="no-referrer">
    <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
    <style>
        :root {
            --bg: #0a0a0c; --surface: #16161a; --surface-accent: #23232a;
            --primary: #ff0000ff; --primary-glow: rgba(88, 101, 242, 0.3);
            --text-main: #ffffff; --text-dim: #a0a0ab;
            --bottom-nav-height: 70px; --safe-area-inset-bottom: env(safe-area-inset-bottom);
        }
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        body { margin: 0; padding: 0; background: var(--bg); color: var(--text-main); font-family: 'Outfit', sans-serif; overflow-x: hidden; display: flex; flex-direction: column; min-height: 100vh; }
        header { position: sticky; top: 0; z-index: 100; background: rgba(10, 10, 12, 0.85); backdrop-filter: blur(20px); padding: 15px 20px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(255, 255, 255, 0.05); }
        .logo { font-weight: 700; font-size: 1.2rem; letter-spacing: -0.5px; background: linear-gradient(135deg, #fff 0%, #a0a0ab 100%); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; cursor: pointer; }
        .search-trigger { background: var(--surface); padding: 8px 15px; border-radius: 20px; display: flex; align-items: center; gap: 10px; color: var(--text-dim); font-size: 0.9rem; flex: 1; margin: 0 15px; border: 1px solid rgba(255, 255, 255, 0.03); }
        .app-container { display: flex; min-height: 80vh; }
        .mobile-only { display: none; }
        .desktop-only { display: block; }
        .desktop-sidebar { 
            display: none; width: 240px; background: rgba(22, 22, 26, 0.95); backdrop-filter: blur(20px); 
            border-right: 1px solid rgba(255, 255, 255, 0.05); position: fixed; top: 70px; bottom: 0; 
            padding: 20px 0; z-index: 1000; transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); 
            transform: translateX(-100%); overflow-y: auto; scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.1) transparent;
        }
        .desktop-sidebar::-webkit-scrollbar { width: 5px; }
        .desktop-sidebar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .desktop-sidebar.open { display: block; transform: translateX(0); }
        .side-nav-item { display: flex; align-items: center; gap: 15px; padding: 12px 20px; border-radius: 12px; color: var(--text-dim); text-decoration: none; margin-bottom: 5px; transition: all 0.2s; font-weight: 500; font-size: 0.9rem; }
        .side-nav-item i { font-size: 1.1rem; width: 24px; text-align: center; }
        .side-nav-item:hover { background: var(--surface); color: white; }
        .side-nav-item.active { background: var(--surface-accent); color: var(--primary); }
        main { padding: 15px; padding-bottom: calc(20px + var(--safe-area-inset-bottom)); flex: 1; transition: margin-left 0.3s; }
        
        @media (max-width: 991px) {
            .mobile-only { display: block; cursor: pointer; }
            .desktop-only { display: none; }
            .logo { background: none; -webkit-text-fill-color: initial; }
            .desktop-sidebar { display: block; z-index: 2000; } 
            
            /* Overlay when sidebar open on mobile */
            .sidebar-overlay {
                position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                background: rgba(0,0,0,0.5); z-index: 1500;
                backdrop-filter: blur(4px);
            }
        }
        
        /* Toast Notification Styles */
        #toast-container {
            position: fixed; top: 20px; right: 20px; z-index: 9999;
            display: flex; flex-direction: column; gap: 10px; pointer-events: none;
        }
        .toast {
            background: var(--surface-accent); color: white; padding: 12px 24px;
            border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            font-size: 0.9rem; font-weight: 500;
            display: flex; align-items: center; gap: 10px;
            transform: translateX(120%); transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            pointer-events: auto;
        }
        .toast.show { transform: translateX(0); }
        .toast-info i { color: #3498db; }
        .toast-success i { color: #2ecc71; }
        .toast-error i { color: #e74c3c; }
        
        /* Bottom nav removed */
        
        .video-card { background: var(--surface); border-radius: 16px; margin-bottom: 18px; border: 1px solid rgba(255, 255, 255, 0.03); transition: transform 0.2s; position: relative; }
        .video-card:active { transform: scale(0.98); }
        .thumb-container { position: relative; width: 100%; aspect-ratio: 16/9; background: #111; border-radius: 16px 16px 0 0; overflow: hidden; }
        .thumb-container img { width: 100%; height: 100%; object-fit: cover; }
        .duration-tag { position: absolute; bottom: 8px; right: 8px; background: rgba(0, 0, 0, 0.8); padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; font-weight: 600; }
        .video-meta { padding: 12px 0; display: flex; gap: 12px; }
        .video-info { flex: 1; min-width: 0; position: relative; }
        .video-title { font-size: 1rem; font-weight: 600; line-height: 1.4; margin-bottom: 4px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; padding-right: 24px; color: #fff; }
        .video-subtext { font-size: 0.85rem; color: var(--text-dim); display: flex; flex-direction: column; gap: 2px; }
        .video-subtext span:hover { color: #fff; }
        .dot { width: 3px; height: 3px; background: currentColor; border-radius: 50%; opacity: 0.5; }
        @media (min-width: 768px) { main { max-width: 600px; margin: 0 auto; } }
        @media (min-width: 992px) { 
            header { padding: 15px 40px; } 
            .search-trigger { max-width: 500px; margin: 0 auto; } 
            .desktop-sidebar { display: block; transform: translateX(0); background: rgba(22, 22, 26, 0.5); z-index: 90; } 
            main { margin-left: 240px; padding: 30px 40px; max-width: none; } 
            nav.bottom-nav { display: none; } 
            .mobile-only { display: none; }
            .desktop-only { display: block; }
            .logo { background: linear-gradient(135deg, #fff 0%, #a0a0ab 100%); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
        }
        @media (min-width: 1400px) { main { max-width: 1400px; margin-right: auto; } }
        /* Mini Player */
        /* Mini Player Overlay (Bottom Bar Style) */
        .mini-player-overlay { 
            position: fixed; 
            bottom: 0;
            left: 0; 
            right: 0; 
            background: rgba(10, 10, 12, 0.98); 
            backdrop-filter: blur(20px);
            display: flex; 
            align-items: center; 
            gap: 12px; 
            padding: 8px 15px; 
            padding-bottom: calc(8px + var(--safe-area-inset-bottom));
            z-index: 999; 
            box-shadow: 0 -5px 25px rgba(0, 0, 0, 0.5); 
            border-top: 1px solid rgba(255, 255, 255, 0.08); 
            cursor: pointer; 
            transition: all 0.3s ease;
        }
        .mini-player-thumb { width: 45px; height: 45px; border-radius: 6px; object-fit: cover; flex-shrink: 0; }
        .mini-player-info { flex: 1; min-width: 0; }
        .mini-player-info h4 { margin: 0; font-size: 0.9rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #fff; }
        .mini-player-info p { margin: 1px 0 0; font-size: 0.75rem; color: var(--text-dim); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .mini-player-ctrl { width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; color: #fff; border-radius: 50%; transition: background 0.2; }
        .mini-player-ctrl:hover { background: rgba(255,255,255,0.1); }
        .mini-player-ctrl.close { color: var(--text-dim); }
        
        @media (min-width: 992px) { 
            .mini-player-overlay { 
                left: 240px; /* Offset by sidebar width */
                border-left: 1px solid rgba(255, 255, 255, 0.08);
            } 
        }
        .suggestions-dropdown { position: absolute; top: 100%; left: 0; right: 0; background: var(--surface); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; margin-top: 5px; z-index: 1000; overflow: hidden; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5); }
        .suggestion-item { padding: 12px 15px; cursor: pointer; display: flex; align-items: center; gap: 12px; font-size: 0.9rem; color: var(--text-dim); transition: all 0.2s; }
        .suggestion-item:hover, .suggestion-item.selected { background: var(--surface-accent); color: white; }
    </style>
</head>
<body x-data="{ sidebarOpen: false }">
    <header>
        <div class="logo">
            <span class="desktop-only" onclick="navigate('/')">YT-Studio</span>
            <span class="mobile-only" @click="sidebarOpen = !sidebarOpen">
                <i class="fas" :class="sidebarOpen ? 'fa-times' : 'fa-bars'" style="font-size: 1.2rem; color: white;"></i>
            </span>
        </div>
        <div class="search-container" style="flex: 1; margin: 0 15px; position: relative; max-width: 600px;" 
             x-data="{
                 query: '${query || ''}',
                 suggestions: [],
                 selectedIndex: -1,
                 showSuggestions: false,
                 async fetchSuggestions() {
                     if (!this.query.trim()) { this.suggestions = []; this.showSuggestions = false; return; }
                     try {
                         const res = await fetch('/api/suggestions?q=' + encodeURIComponent(this.query));
                         this.suggestions = await res.json();
                         this.showSuggestions = this.suggestions.length > 0;
                         this.selectedIndex = -1;
                     } catch (e) { this.suggestions = []; }
                 },
                 selectSuggestion(suggestion) { navigate('/?q=' + encodeURIComponent(suggestion)); },
                 handleKeydown(e) {
                     if (!this.showSuggestions || this.suggestions.length === 0) return;
                     if (e.key === 'ArrowDown') { e.preventDefault(); this.selectedIndex = (this.selectedIndex + 1) % this.suggestions.length; }
                     else if (e.key === 'ArrowUp') { e.preventDefault(); this.selectedIndex = (this.selectedIndex - 1 + this.suggestions.length) % this.suggestions.length; }
                     else if (e.key === 'Enter' && this.selectedIndex >= 0) { e.preventDefault(); this.selectSuggestion(this.suggestions[this.selectedIndex]); }
                 }
             }" @click.outside="showSuggestions = false">
            <form action="/" method="GET" class="search-trigger">
                <i class="fas fa-search"></i>
                <input type="text" x-ref="searchInput" name="q" x-model="query" @input.debounce.300ms="fetchSuggestions()" @keydown="handleKeydown($event)" placeholder="Cari video..." autocomplete="off" style="background:none; border:none; outline:none; color:inherit; width:100%; font-family:inherit;">
                <i class="fas fa-times" x-show="query.length > 0" @click="query = ''; $refs.searchInput.focus()" style="cursor: pointer; padding: 5px; color: var(--text-dim);"></i>
            </form>
            <div class="suggestions-dropdown" x-show="showSuggestions" x-transition style="display: none;">
                <template x-for="(suggestion, index) in suggestions" :key="index">
                    <div class="suggestion-item" :class="{ 'selected': index === selectedIndex }" @click="selectSuggestion(suggestion)">
                        <i class="fas fa-search opacity-30"></i>
                        <span x-text="suggestion"></span>
                    </div>
                </template>
            </div>
        </div>
        <div class="header-actions" style="display: flex; gap: 15px; align-items: center;"></div>
    </header>

    <div id="toast-container"></div>

    <div class="app-container">
        <div class="sidebar-overlay" x-show="sidebarOpen" x-transition.opacity @click="sidebarOpen = false" style="display: none;"></div>
        <aside class="desktop-sidebar" :class="sidebarOpen ? 'open' : ''">
            <div style="padding: 0 10px; margin-bottom: 20px;">
                <a href="/" class="side-nav-item ${activePage === 'home' ? 'active' : ''}"><i class="fas fa-home"></i><span>Beranda</span></a>
                <a href="/playlists" class="side-nav-item ${activePage === 'playlist' ? 'active' : ''}"><i class="fas fa-list-ul"></i><span>Playlist</span></a>
                <a href="/history" class="side-nav-item ${activePage === 'history' ? 'active' : ''}"><i class="fas fa-history"></i><span>Histori</span></a>
                <a href="/offline" class="side-nav-item ${activePage === 'offline' ? 'active' : ''}"><i class="fas fa-download"></i><span>Offline</span></a>
            </div>

            ${subscriptions && subscriptions.length > 0 ? html`
                <div style="padding: 0 10px;">
                    <div style="padding: 0 12px; margin-bottom: 8px; font-size: 0.75rem; font-weight: 600; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.5px;">Langganan</div>
                    ${subscriptions.map(sub => html`
                        <a href="/?q=${encodeURIComponent(sub.uploader)}" class="side-nav-item" title="${sub.uploader}">
                            <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${sub.uploader}</span>
                        </a>
                    `)}
                </div>
            ` : html`
                 <div style="padding: 0 10px;">
                     <div style="padding: 0 12px; margin-bottom: 8px; font-size: 0.75rem; font-weight: 600; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.5px;">Langganan</div>
                     <div class="side-nav-item" style="opacity: 0.5; font-size: 0.85rem;">Belum ada langganan</div>
                 </div>
            `}
            <div style="height: ${playingVideo ? '100px' : '20px'};"></div>
        </aside>

        <main>${children}</main>
    </div>

    ${playingVideo && activePage !== 'play' ? html`
    <div class="mini-player-overlay" onclick="location.href='/play?v=${playingVideo.id}&t=' + Math.floor(document.getElementById('bgPlayer')?.currentTime || 0)">
        <div style="width: 50px; height: 50px; border-radius: 6px; overflow: hidden; background: #000; flex-shrink: 0;">
            <video id="bgPlayer" src="${playingVideo.stream_url}" autoplay playsinline style="width: 100%; height: 100%; object-fit: cover;"></video>
        </div>
        <div class="mini-player-info">
            <h4>${playingVideo.title}</h4>
            <p>${playingVideo.uploader}</p>
        </div>
        <div class="mini-player-ctrl" onclick="event.stopPropagation(); const p = document.getElementById('bgPlayer'); if(p.paused) { p.play(); this.querySelector('i').className = 'fas fa-pause'; } else { p.pause(); this.querySelector('i').className = 'fas fa-play'; }">
            <i class="fas fa-pause"></i>
        </div>
        <div class="mini-player-ctrl close" onclick="event.stopPropagation(); const u = new window.URL(location.href); u.searchParams.delete('min'); localStorage.removeItem('videoTime_${playingVideo.id}'); location.href = u.pathname + u.search;">
            <i class="fas fa-times"></i>
        </div>
    </div>
    <script>
        document.addEventListener('DOMContentLoaded', function () {
            const player = document.getElementById('bgPlayer');
            if (player) {
                const savedTime = localStorage.getItem('videoTime_${playingVideo.id}');
                if (savedTime) player.currentTime = parseFloat(savedTime);
                
                player.ontimeupdate = () => { localStorage.setItem('videoTime_${playingVideo.id}', player.currentTime); };
                
                const playVideo = () => {
                    player.play().then(() => {
                        updateMediaMetadata({
                            title: '${safeStr(playingVideo.title)}',
                            uploader: '${safeStr(playingVideo.uploader)}',
                            thumbnail: '${playingVideo.thumbnail}'
                        }, player);
                    }).catch(() => { 
                        const playIcon = document.querySelector('.mini-player-ctrl i.fa-pause'); 
                        if (playIcon) playIcon.className = 'fas fa-play'; 
                    });
                };

                playVideo();
            }
        });
    </script>` : ''}

    <script>
        window.navigate = function (url) {
            const urlParams = new window.URLSearchParams(window.location.search);
            const minId = urlParams.get('min');
            const targetPath = url.split('?')[0];
            const isPlayPage = targetPath === '/play' || targetPath.endsWith('/play');
            if (minId && !url.includes('min=') && !isPlayPage) {
                const separator = url.includes('?') ? '&' : '?';
                url = url + separator + 'min=' + minId;
            }
            location.href = url;
        };
        (function () {
            const urlParams = new window.URLSearchParams(window.location.search);
            const minId = urlParams.get('min') || (window.location.pathname === '/play' ? urlParams.get('v') : null);
            if (minId) {
                document.addEventListener('DOMContentLoaded', function () {
                    document.querySelectorAll('a').forEach(function (link) {
                        const href = link.getAttribute('href');
                        if (!href || !href.startsWith('/') || href.includes('min=')) return;
                        const targetPath = href.split('?')[0];
                        const isPlayPage = targetPath === '/play' || targetPath.endsWith('/play');
                        if (!isPlayPage) {
                            const separator = href.includes('?') ? '&' : '?';
                            link.setAttribute('href', href + separator + 'min=' + minId);
                        }
                    });
                    document.querySelectorAll('form').forEach(function (form) {
                        const method = form.getAttribute('method');
                        if (method && method.toUpperCase() === 'GET' && !form.querySelector('input[name="min"]')) {
                            const input = document.createElement('input');
                            input.type = 'hidden'; input.name = 'min'; input.value = minId;
                            form.appendChild(input);
                        }
                    });
                });
            }
        })();

        // MediaSession API for background playback
        window.updateMediaMetadata = function(video, playerElement) {
            if (!('mediaSession' in navigator)) return;

            navigator.mediaSession.metadata = new MediaMetadata({
                title: video.title,
                artist: video.uploader,
                artwork: [
                    { src: video.thumbnail, sizes: '512x512', type: 'image/png' }
                ]
            });

            const actionHandlers = [
                ['play', () => { playerElement.play(); }],
                ['pause', () => { playerElement.pause(); }],
                ['seekbackward', (details) => { playerElement.currentTime = Math.max(playerElement.currentTime - (details.seekOffset || 10), 0); }],
                ['seekforward', (details) => { playerElement.currentTime = Math.min(playerElement.currentTime + (details.seekOffset || 10), playerElement.duration); }],
                ['previoustrack', null],
                ['nexttrack', null]
            ];

                for (const [action, handler] of actionHandlers) {
                try {
                    navigator.mediaSession.setActionHandler(action, handler);
                } catch (error) {
                    console.log(\`The media session action "\${action}" is not supported yet.\`);
                }
            }
        };

        // Global functions for Menu, Subscription, and Playlist
        window.activeMenuId = null;

        window.toggleMenu = function(event, videoId) {
            event.stopPropagation();
            const menuId = 'menu-' + videoId;
            const menu = document.getElementById(menuId);
            
            // Close other open menus
            document.querySelectorAll('.video-menu').forEach(m => {
                if (m.id !== menuId) m.style.display = 'none';
            });

            if (menu) {
                const isVisible = menu.style.display === 'block';
                menu.style.display = isVisible ? 'none' : 'block';
                window.activeMenuId = isVisible ? null : menuId;
            }
        };

        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.menu-btn') && !e.target.closest('.video-menu')) {
                document.querySelectorAll('.video-menu').forEach(m => m.style.display = 'none');
                window.activeMenuId = null;
            }
        });

        window.toggleGlobalSub = async function(channelId, uploader) {
            if (!channelId || channelId === 'undefined') return alert('Channel ID tidak tersedia.');
            try {
                await fetch('/toggle_subscription', {
                    method: 'POST',
                    body: JSON.stringify({ channel_id: channelId, uploader }),
                    headers: { 'Content-Type': 'application/json' }
                });
                location.reload();
            } catch (e) {
                console.error(e);
                showToast('Gagal mengubah status langganan.', 'error');
            }
        };

        window.showToast = function(message, type = 'info') {
            const container = document.getElementById('toast-container');
            const toast = document.createElement('div');
            toast.className = 'toast toast-' + type;
            const icon = type === 'success' ? 'fa-check-circle' : (type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle');
            toast.innerHTML = '<i class="fas ' + icon + '"></i> <span>' + message + '</span>';
            container.appendChild(toast);
            
            // Trigger animation
            setTimeout(() => toast.classList.add('show'), 10);
            
            // Auto-hide
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        };

        window.currentVideoForPlaylist = null;
        window.openPlaylistModal = async function(id, title, uploader, thumbnail, duration, views, channelId) {
            window.currentVideoForPlaylist = { id, title: decodeURIComponent(title), uploader: decodeURIComponent(uploader), thumbnail, duration, views, channel_id: channelId };
            
            // Show loading or fetch directly
            try {
                const res = await fetch('/api/playlists');
                const playlists = await res.json();
                let html = '';
                if (Object.keys(playlists).length === 0) {
                    html = '<p style="padding: 20px; text-align: center; opacity: 0.5;">Belum ada playlist.</p>';
                } else {
                    for (const name in playlists) {
                        html += \`
                            <div class="playlist-select-item" onclick="saveToGlobalPlaylist('\${name.replace(/'/g, "\\\\'")}')">
                                <i class="fas fa-list-ul"></i>
                                <span>\${name}</span>
                            </div>
                        \`;
                    }
                }
                document.getElementById('globalPlaylistModalList').innerHTML = html;
                document.getElementById('globalPlaylistModal').classList.add('show');
                document.getElementById('globalModalBackdrop').classList.add('show');
                
                // Close menu
                if (window.activeMenuId) {
                    document.getElementById(window.activeMenuId).style.display = 'none';
                    window.activeMenuId = null;
                }
            } catch (e) {
                console.error(e);
                showToast('Gagal memuat playlist.', 'error');
            }
        };

        window.saveToGlobalPlaylist = async function(playlistName) {
            if (!window.currentVideoForPlaylist) return;
            try {
                const res = await fetch('/add_to_playlist', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ playlistName, video: window.currentVideoForPlaylist })
                });
                if (res.ok) {
                    hideGlobalModal();
                    showToast('Berhasil disimpan ke ' + playlistName, 'success');
                }
            } catch (e) {
                console.error(e);
                showToast('Gagal menyimpan ke playlist.', 'error');
            }
        };

        window.hideGlobalModal = function() {
            document.getElementById('globalPlaylistModal').classList.remove('show');
            document.getElementById('globalModalBackdrop').classList.remove('show');
            window.currentVideoForPlaylist = null;
        };
    </script>

    <!-- Global Playlist Modal -->
    <div id="globalModalBackdrop" onclick="hideGlobalModal()" style="display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); z-index: 2000; backdrop-filter: blur(5px);"></div>
    <div id="globalPlaylistModal" style="display: none; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 90%; max-width: 400px; background: var(--surface); border-radius: 24px; z-index: 2001; overflow: hidden; border: 1px solid rgba(255,255,255,0.05); box-shadow: 0 20px 50px rgba(0,0,0,0.5);">
        <div style="padding: 20px; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: center;">
            <h3 style="margin: 0; font-size: 1.1rem;">Simpan ke...</h3>
            <i class="fas fa-times" onclick="hideGlobalModal()" style="cursor: pointer; opacity: 0.5;"></i>
        </div>
        <div id="globalPlaylistModalList" style="max-height: 300px; overflow-y: auto; padding: 10px;"></div>
    </div>
    <style>
        /* Menu Button Styles */
        .menu-btn {
            background: none; border: none; color: var(--text-dim); padding: 6px; cursor: pointer; border-radius: 50%; transition: all 0.2s;
            position: absolute; top: 0; right: -8px; z-index: 10;
        }
        .menu-btn:hover { background: var(--surface-accent); color: white; }
        
        .video-menu {
            position: absolute; top: 35px; right: 0; background: var(--surface); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 6px; z-index: 100; box-shadow: 0 10px 30px rgba(0,0,0,0.5); overflow: hidden; width: 180px;
        }
        
        .menu-item {
            padding: 10px 14px; font-size: 0.9rem; color: var(--text-dim); cursor: pointer; display: flex; align-items: center; gap: 12px; border-radius: 8px; transition: all 0.2s;
        }
        .menu-item:hover { background: var(--surface-accent); color: white; }
        .menu-item i { width: 18px; text-align: center; }
        
        /* Playlist Modal Styles (Global) */
        .playlist-select-item { padding: 15px; display: flex; align-items: center; gap: 15px; border-radius: 12px; cursor: pointer; transition: background 0.2s; color: var(--text-dim); }
        .playlist-select-item:hover { background: var(--surface-accent); color: white; }
        .playlist-select-item i { color: var(--primary); }
        #globalModalBackdrop, #globalPlaylistModal { opacity: 0; transition: opacity 0.2s ease-in-out; pointer-events: none; visibility: hidden; }
        #globalModalBackdrop.show, #globalPlaylistModal.show { display: block !important; opacity: 1; pointer-events: auto; visibility: visible; }
    </style>
</body>
</html>`;
};
