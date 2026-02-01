/* Helper Utilities */
const Helper = {
    async fetchJSON(url, options = {}) {
        if (!options.hideProgress && typeof NProgress !== 'undefined') NProgress.start();
        try {
            const res = await fetch(url, options);
            return res.ok ? await res.json() : null;
        } catch (e) {
            console.error("API Error:", e);
            return null;
        } finally {
            if (!options.hideProgress && typeof NProgress !== 'undefined') NProgress.done();
        }
    },

    async post(url, data) {
        return this.fetchJSON(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
    },

    formatTime(sec) {
        if (!sec) return "0:00";
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return m + ":" + (s < 10 ? "0" + s : s);
    },

    formatViews(n) {
        if (!n) return "0";
        if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + "jt";
        if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + "rb";
        return n.toString();
    },

    toggleVideoMenu(event) {
        event.stopPropagation();
        const $btn = $(event.currentTarget);
        const $menu = $btn.next('.video-context-menu');

        const $subItem = $menu.find('.sub-menu-item');
        if ($subItem.length && window.subscribedChannels) {
            const cid = $subItem.attr('data-channel-id');
            const up = $subItem.attr('data-uploader');
            const isSubbed = (cid && window.subscribedChannels[cid]) || window.subscribedChannels[up];
            $subItem.find('span').text(isSubbed ? 'Unsubscribe' : 'Subscribe');
        }

        // Close others
        $('.video-context-menu').not($menu).removeClass('show');
        $menu.toggleClass('show');
    },

    renderVideoCard(video, type = 'search') {
        const videoData = JSON.stringify(video).replace(/"/g, '&quot;');

        let menuItems = `
            <div class="video-menu-item" onclick="event.stopPropagation(); openPlaylistSelector(event, ${videoData})">
                <i class="fas fa-plus"></i>
                <span>Simpan ke Playlist</span>
            </div>
            <div class="video-menu-item sub-menu-item" data-channel-id="${video.channel_id || ''}" data-uploader="${(video.uploader || 'Channel').replace(/'/g, "\\'")}" onclick="event.stopPropagation(); toggleSubscription('${video.channel_id || ''}', '${(video.uploader || 'Channel').replace(/'/g, "\\'")}')">
                <i class="fas fa-bell"></i>
                <span>Subscribe</span>
            </div>`;

        if (type === 'history') {
            menuItems += `
                <div class="video-menu-item danger" onclick="event.stopPropagation(); deleteHistoryItem(event, '${video.id}')">
                    <i class="fas fa-times"></i>
                    <span>Hapus dari Histori</span>
                </div>`;
        } else if (type === 'offline') {
            menuItems += `
                <div class="video-menu-item danger" onclick="event.stopPropagation(); deleteOfflineItem(event, '${video.id}')">
                    <i class="fas fa-trash"></i>
                    <span>Hapus Offline</span>
                </div>`;
        } else if (type === 'playlistVideo') {
            const playlistName = $('#currentPlaylistName').text();
            menuItems += `
                <div class="video-menu-item danger" onclick="event.stopPropagation(); removeFromPlaylist(event, '${playlistName}', '${video.id}')">
                    <i class="fas fa-minus-circle"></i>
                    <span>Hapus dari Playlist</span>
                </div>`;
        }

        return `
            <div class="video-card flex flex-col group">
                <div class="thumbnail-box mb-3 relative overflow-hidden block">
                    <a href="/?v=${video.id}" class="w-full h-full block cursor-pointer" onclick="event.preventDefault(); playVideo(${videoData})">
                        <img src="${video.thumbnail}" class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105">
                        <div class="absolute bottom-2 right-2 bg-black/90 text-[10px] font-bold px-1.5 py-0.5 rounded text-gray-400">
                            ${video.duration ? this.formatTime(video.duration) : '0:00'}
                        </div>
                    </a>
                </div>
                <div class="px-1 flex items-start gap-2">
                    <div class="flex flex-col flex-1 min-w-0">
                        <a href="/?v=${video.id}" class="cursor-pointer block" onclick="event.preventDefault(); playVideo(${videoData})">
                            <h3 class="video-title font-bold text-[14px] text-white leading-tight line-clamp-2">${video.title}</h3>
                        </a>
                        <div class="mt-1 flex flex-col">
                            <a href="/?page=home&q=${video.channel_id ? encodeURIComponent('https://www.youtube.com/channel/' + video.channel_id + '/videos') : encodeURIComponent('"' + (video.uploader || 'Channel') + '"')}&uploader=${encodeURIComponent(video.uploader || 'Channel')}" 
                               class="video-uploader text-[12px] text-gray-500 hover:text-white hover:underline transition cursor-pointer truncate max-w-[200px] block" 
                               onclick="event.preventDefault(); searchChannel(event, '${video.channel_id || ''}', '${(video.uploader || 'Channel').replace(/'/g, "\\'")}')">
                               ${video.uploader || 'Unknown Channel'}
                            </a>
                            <div class="text-[11px] text-gray-600 font-medium flex gap-1 items-center mt-0.5">
                                <span>${video.views ? this.formatViews(video.views) : '0'}x ditonton</span>
                            </div>
                        </div>
                    </div>
                    <div class="video-menu-container">
                        <button class="video-menu-btn" onclick="Helper.toggleVideoMenu(event)">
                            <i class="fas fa-ellipsis-v"></i>
                        </button>
                        <div class="video-context-menu">
                            ${menuItems}
                        </div>
                    </div>
                </div>
            </div>`;
    }
};

// Global context menu (right click) support
$(document).on('contextmenu', '.video-card', function (e) {
    e.preventDefault();
    const $btn = $(this).find('.video-menu-btn');
    if ($btn.length) {
        $btn.click(); // Trigger the three-dots menu
    }
});

// Global click listener to close menus
$(document).on('click', function (e) {
    if (!$(e.target).closest('.video-menu-container').length) {
        $('.video-context-menu').removeClass('show');
    }
});
