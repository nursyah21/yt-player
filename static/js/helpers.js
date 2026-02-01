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

    renderVideoCard(video, type = 'search') {
        const videoData = JSON.stringify(video).replace(/"/g, '&quot;');
        let actionBtn = '';

        if (type === 'history') {
            actionBtn = `
                <button onclick="deleteHistoryItem(event, '${video.id}')" 
                    class="absolute top-2 right-2 bg-black/80 hover:bg-red-600 text-white w-7 h-7 rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 z-30">
                    <i class="fas fa-times text-xs"></i>
                </button>`;
        } else if (type === 'offline') {
            actionBtn = `
                <button onclick="deleteOfflineItem(event, '${video.id}')" 
                    class="absolute top-2 right-2 bg-black/80 hover:bg-red-600 text-white w-7 h-7 rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 z-30">
                    <i class="fas fa-trash text-xs"></i>
                </button>`;
        } else if (type === 'playlistVideo') {
            const playlistName = $('#currentPlaylistName').text();
            actionBtn = `
                <button onclick="removeFromPlaylist(event, '${playlistName}', '${video.id}')" 
                    class="absolute top-1 right-1 bg-black/80 hover:bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 z-30">
                    <i class="fas fa-times text-[8px]"></i>
                </button>`;
        }

        const likeBtn = `
            <button onclick="openPlaylistSelector(event, ${videoData})" 
                class="absolute top-2 left-2 bg-black/80 hover:bg-blue-600 text-white w-7 h-7 rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 z-30" title="Simpan ke Playlist">
                <i class="fas fa-plus text-[8px]"></i>
            </button>`;

        return `
            <div class="video-card flex flex-col group">
                <a href="/?v=${video.id}" class="thumbnail-box mb-3 cursor-pointer relative overflow-hidden block" onclick="event.preventDefault(); playVideo(${videoData})">
                    ${actionBtn}
                    ${likeBtn}
                    <img src="${video.thumbnail}" class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105">
                    <div class="absolute bottom-2 right-2 bg-black/90 text-[10px] font-bold px-1.5 py-0.5 rounded text-gray-400">
                        ${video.duration ? this.formatTime(video.duration) : '0:00'}
                    </div>
                </a>
                <div class="px-1 flex flex-col">
                    <a href="/?v=${video.id}" class="cursor-pointer block" onclick="event.preventDefault(); playVideo(${videoData})">
                        <h3 class="font-bold text-[14px] text-white leading-tight line-clamp-2">${video.title}</h3>
                    </a>
                    <div class="mt-1.5 flex flex-col">
                        <a href="/?page=home&q=${video.channel_id ? encodeURIComponent('https://www.youtube.com/channel/' + video.channel_id + '/videos') : encodeURIComponent('"' + (video.uploader || 'Channel') + '"')}&uploader=${encodeURIComponent(video.uploader || 'Channel')}" 
                           class="text-[12px] text-gray-500 hover:text-white hover:underline transition cursor-pointer truncate max-w-[200px] block mb-0.5" 
                           onclick="event.preventDefault(); searchChannel(event, '${video.channel_id || ''}', '${(video.uploader || 'Channel').replace(/'/g, "\\'")}')">
                           ${video.uploader || 'Unknown Channel'}
                        </a>
                        <div class="text-[11px] text-gray-600 font-medium flex gap-1 items-center">
                            <span>${video.views ? this.formatViews(video.views) : '0'}x ditonton</span>
                        </div>
                    </div>
                </div>
            </div>`;
    }
};
