/* Playlist Management */
function updatePlaylist(videos, append = false) {
    currentPlaylist = append ? [...currentPlaylist, ...videos] : [...videos];

    const isFullView = $('#playerContainer').hasClass('full-view');
    const $view = $('#playlistView');

    if (isFullView && currentPlaylist.length > 0) {
        $view.show();
        $('#playlistBtn').addClass('text-blue-500');
        renderPlaylist();
    } else if ($view.is(':visible')) {
        renderPlaylist();
    }
}

async function createPlaylistFromUI() {
    const $input = $('#newPlaylistInput');
    const name = $input.val().trim();
    if (!name) return;
    const res = await Helper.post('/create_playlist', { name });
    if (res) { $input.val(''); loadPlaylists(); }
}

async function loadPlaylists() {
    $('#playlistList').removeClass('hidden');
    $('#playlistDetail').addClass('hidden');
    $('#playlistGrid').html('<div class="col-span-full text-center py-20 opacity-30 text-xs">Memuat koleksi playlist Anda...</div>');

    const playlists = await Helper.fetchJSON('/list_playlists');
    if (!playlists) return;
    const names = Object.keys(playlists);

    if (!names.length) {
        $('#playlistGrid').html(`
            <div class="col-span-full flex flex-col items-center justify-center py-32 opacity-80 text-gray-500">
                <div class="w-20 h-20 bg-[#111] rounded-full flex items-center justify-center mb-4 border border-[#222]">
                    <i class="fas fa-folder-open text-3xl opacity-50"></i>
                </div>
                <p class="text-sm font-bold text-white mb-1">Koleksi Masih Kosong</p>
                <p class="text-xs text-gray-500">Buat playlist baru di atas untuk mulai.</p>
            </div>`);
        return;
    }

    const html = names.map(name => `
        <div class="playlist-card" onclick="showPlaylistDetail('${name.replace(/'/g, "\\'")}')">
            <button onclick="deletePlaylist(event, '${name.replace(/'/g, "\\'")}')" class="playlist-delete-btn">
                <i class="fas fa-times text-[8px]"></i>
            </button>
            <div class="playlist-icon-box"><i class="fas fa-list-ul text-blue-500 text-base"></i></div>
            <h3 class="playlist-name">${name}</h3>
            <p class="playlist-count">${playlists[name].length} video</p>
        </div>`).join('');
    $('#playlistGrid').html(html);
}

async function openPlaylistSelector(event, video = null) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    pendingPlaylistVideo = video || currentVideoObj;
    if (!pendingPlaylistVideo?.id || pendingPlaylistVideo.id === 'Loading...') {
        alert("Pilih video atau tunggu pemuatan selesai.");
        return;
    }

    $('#playlistModal').css('display', 'flex');
    $('#playlistOptions').html('<div class="text-center py-8 opacity-50 text-xs">Memuat daftar playlist...</div>');

    const playlists = await Helper.fetchJSON('/list_playlists');
    if (!playlists) return;
    const names = Object.keys(playlists);

    if (!names.length) {
        $('#playlistOptions').html(`
            <div class="text-center py-6 text-gray-500">
                <i class="fas fa-folder-open text-2xl mb-2 opacity-50"></i>
                <p class="text-xs">Belum ada playlist.</p>
            </div>`);
    } else {
        const html = names.map(name => `
            <div class="playlist-option group" onclick="addToCustomPlaylist('${name.replace(/'/g, "\\'")}')">
                <div class="w-8 h-8 rounded bg-[#222] flex items-center justify-center group-hover:bg-blue-600 transition text-gray-400 group-hover:text-white">
                    <i class="fas fa-list-ul text-[8px]"></i>
                </div>
                <span class="truncate font-bold text-xs text-gray-300 group-hover:text-white transition">${name}</span>
            </div>`).join('');
        $('#playlistOptions').html(html);
    }
}

async function addToCustomPlaylist(name) {
    if (!pendingPlaylistVideo) return;
    const res = await Helper.post('/add_to_playlist', { playlist_name: name, video: pendingPlaylistVideo });
    if (res) {
        alert(`Disimpan ke "${name}"`);
        closePlaylistModal();
        if (activeSection === 'playlist') loadPlaylists();
    }
}

function closePlaylistModal() { $('#playlistModal').hide(); pendingPlaylistVideo = null; }

function promptCreatePlaylist() {
    const name = prompt("Nama Playlist Baru:");
    if (name?.trim()) addToCustomPlaylist(name.trim());
}

async function deletePlaylist(event, name) {
    event.stopPropagation();
    if (confirm(`Hapus playlist "${name}"?`)) {
        const ok = await Helper.fetchJSON(`/delete_playlist/${name}`, { method: 'DELETE' });
        if (ok !== null) loadPlaylists();
    }
}

async function showPlaylistDetail(name, updateUrl = true) {
    $('#currentPlaylistName').text(name);
    $('#playlistList').addClass('hidden');
    $('#playlistDetail').removeClass('hidden');
    $('#playlistVideoGrid').html('<div class="col-span-full text-center py-20 opacity-30">Memuat...</div>');

    if (updateUrl) {
        const url = new URL(window.location);
        url.searchParams.set('page', 'playlist');
        url.searchParams.set('p', name);
        window.history.pushState({}, '', url);
    }

    const playlists = await Helper.fetchJSON('/list_playlists');
    const videos = playlists ? (playlists[name] || []) : [];

    if (!videos.length) {
        $('#playlistVideoGrid').html('<div class="col-span-full text-center py-20 opacity-30 text-xs text-gray-500">Playlist ini kosong.</div>');
    } else {
        $('#playlistVideoGrid').html(videos.map(v => Helper.renderVideoCard(v, 'playlistVideo')).join(''));
        updatePlaylist(videos, false);
    }
}

async function removeFromPlaylist(event, playlistName, videoId) {
    event.stopPropagation();
    if (confirm('Hapus dari playlist?')) {
        const ok = await Helper.fetchJSON(`/delete_from_playlist/${playlistName}/${videoId}`, { method: 'DELETE' });
        if (ok !== null) showPlaylistDetail(playlistName);
    }
}

function backToPlaylists() {
    const url = new URL(window.location);
    url.searchParams.delete('p');
    window.history.pushState({}, '', url);
    loadPlaylists();
}

function togglePlaylist() {
    const $view = $('#playlistView');
    const $btn = $('#playlistBtn');
    const url = new URL(window.location);

    if ($view.is(':visible')) {
        $view.hide();
        $btn.removeClass('text-blue-500');
        url.searchParams.delete('pl');
    } else {
        renderPlaylist();
        $view.show();
        $btn.addClass('text-blue-500');
        url.searchParams.set('pl', 'open');
    }
    window.history.replaceState({}, '', url);
}

function renderPlaylist() {
    const html = currentPlaylist.map((video, index) => {
        const isActive = index === currentIndex;
        const videoData = JSON.stringify(video).replace(/"/g, '&quot;');
        return `
            <div class="playlist-item ${isActive ? 'active' : ''}">
                <a href="/?v=${video.id}" onclick="event.preventDefault(); playVideo(${videoData})" class="block flex-shrink-0">
                    <img src="${video.thumbnail}">
                </a>
                <div class="playlist-info">
                    <a href="/?v=${video.id}" onclick="event.preventDefault(); playVideo(${videoData})" class="playlist-title block hover:text-blue-400 transition mb-0.5 text-inherit no-underline">
                        ${video.title}
                    </a>
                    <a href="/?page=home&q=${video.channel_id ? encodeURIComponent('https://www.youtube.com/channel/' + video.channel_id + '/videos') : encodeURIComponent('"' + (video.uploader || 'Channel') + '"')}&uploader=${encodeURIComponent(video.uploader || 'Channel')}"
                       class="playlist-uploader block" onclick="event.preventDefault(); searchChannel(event, '${video.channel_id || ''}', '${(video.uploader || 'Channel').replace(/'/g, "\\'")}')">
                        ${video.uploader || 'Channel'}
                    </a>
                </div>
            </div>`;
    }).join('');
    $('#playlistView').html(html);
    const $active = $('#playlistView .active');
    if ($active.length) $active[0].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
