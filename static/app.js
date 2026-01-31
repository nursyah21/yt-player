/**
 * Video Studio - Main Application Script
 * Refactored with jQuery and Helpers
 */

// Global State
let isExpanded = false;
let isSidebarOpen = true;
let currentOffset = 1;
let isFetching = false;
let currentQuery = "";
let activeSection = 'home';
let renderedVideoIds = new Set();
let currentPlaylist = [];
let currentIndex = -1;
let currentVideoObj = null;
let pendingPlaylistVideo = null;
let selectedIndex = -1;
let suggestionDebounceTimer;
let plyrPlayer = null;

// --- Helpers ---
const Helper = {
    async fetchJSON(url, options = {}) {
        try {
            const res = await fetch(url, options);
            return res.ok ? await res.json() : null;
        } catch (e) {
            console.error("API Error:", e);
            return null;
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

    // UI Helper to reduce code in rendering
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
                <div class="thumbnail-box mb-3 cursor-pointer relative overflow-hidden" onclick="playVideo(${videoData})">
                    ${actionBtn}
                    ${likeBtn}
                    <img src="${video.thumbnail}" class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105">
                    <div class="absolute bottom-2 right-2 bg-black/90 text-[10px] font-bold px-1.5 py-0.5 rounded text-gray-400">
                        ${video.duration ? this.formatTime(video.duration) : '0:00'}
                    </div>
                </div>
                <div class="px-1 flex flex-col">
                    <div class="cursor-pointer" onclick="playVideo(${videoData})">
                        <h3 class="font-bold text-[14px] text-white leading-tight line-clamp-2">${video.title}</h3>
                    </div>
                    <div class="mt-1.5 flex flex-col">
                        <span class="text-[12px] text-gray-500 hover:text-white hover:underline transition cursor-pointer truncate max-w-[200px] block mb-0.5" 
                           onclick="searchChannel(event, '${video.channel_id || ''}', '${(video.uploader || 'Channel').replace(/'/g, "\\'")}')">
                           ${video.uploader || 'Unknown Channel'}
                        </span>
                        <div class="text-[11px] text-gray-600 font-medium flex gap-1 items-center">
                            <span>${video.views ? this.formatViews(video.views) : '0'}x ditonton</span>
                        </div>
                    </div>
                </div>
            </div>`;
    }
};

// --- Initialization ---
function init() {
    initSidebar();
    handleRouting();
    setupShimmer();
    setupInfiniteScroll();
    setupEventListeners();
}

function setupShimmer() {
    let shimmerHTML = '';
    for (let i = 0; i < 8; i++) {
        shimmerHTML += `
            <div class="space-y-3">
                <div class="shimmer aspect-video"></div>
                <div class="space-y-2">
                    <div class="shimmer h-4 w-full"></div>
                    <div class="shimmer h-3 w-2/3"></div>
                </div>
            </div>`;
    }
    $('#loading').html(shimmerHTML);
}

function setupInfiniteScroll() {
    const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) loadMoreVideos();
    }, { threshold: 0.1 });
    const sentinel = document.getElementById('scrollSentinel');
    if (sentinel) observer.observe(sentinel);
}

function setupEventListeners() {
    $(window).on('resize', () => {
        const isSmall = $(window).width() <= 780;
        if (isSmall && isSidebarOpen) {
            isSidebarOpen = false;
            applySidebarState();
        } else if (!isSmall && !isSidebarOpen) {
            isSidebarOpen = true;
            applySidebarState();
        }
    });

    $('#videoQuery').on('input', handleSearchInput);
    $('#videoQuery').on('focus', () => {
        if (!$('#videoQuery').val().trim()) showSearchHistory();
    });
    $('#videoQuery').on('keydown', handleSearchKeydown);

    $(document).on('click', (e) => {
        if (!$(e.target).closest('.search-container').length) {
            $('#suggestionsDropdown').hide();
        }
    });

    // Spacebar to Play/Pause (Single Source of Truth)
    $(document).on('keydown', (e) => {
        const isInput = document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA';

        if (e.code === 'Space' && !isInput && $('#playerContainer').is(':visible') && plyrPlayer) {
            e.preventDefault();
            plyrPlayer.togglePlay();
        }
    });

    // Close Player Button
    $('#closePlayerBtn').on('click', closePlayer);
}

// --- Sidebar Logic ---
function initSidebar() {
    isSidebarOpen = $(window).width() > 780;
    applySidebarState();
}

function toggleSidebar() {
    isSidebarOpen = !isSidebarOpen;
    applySidebarState();
}

function applySidebarState() {
    const isSmall = $(window).width() <= 780;
    const $sidebar = $('#sidebar');
    const $mainContent = $('#mainContent');
    const $overlay = $('#sidebarOverlay');

    if (isSidebarOpen) {
        $sidebar.css('transform', 'translateX(0)');
        if (!isSmall) $mainContent.removeClass('full-width');
        if (isSmall) {
            $sidebar.addClass('show-mobile');
            $overlay.removeClass('hidden');
            setTimeout(() => $overlay.addClass('opacity-100'), 10);
        }
    } else {
        $sidebar.css('transform', 'translateX(-240px)');
        $mainContent.addClass('full-width');
        if (isSmall) {
            $sidebar.removeClass('show-mobile');
            $overlay.removeClass('opacity-100');
            setTimeout(() => $overlay.addClass('hidden'), 300);
        }
    }
}

// --- Routing ---
async function handleRouting() {
    const params = new URLSearchParams(window.location.search);
    const page = params.get('page');
    const q = params.get('q');
    const uploader = params.get('uploader');
    const v = params.get('v');
    const p = params.get('p');
    const pl = params.get('pl');
    const full = params.get('full');

    if (v) {
        await playVideo({ id: v, title: "Loading...", thumbnail: "" }, false);
    }

    if (q) {
        $('#videoQuery').val(q);
        await searchVideos(q, uploader, false);
    } else if (page === 'playlist' && p) {
        await showSection('playlist', null, false);
        await showPlaylistDetail(p, false);
    } else if (page) {
        await showSection(page, null, false);
    } else if (!v) {
        await showSection('home', null, false);
    }

    // Handle extra states from URL
    if (pl === 'open') {
        renderPlaylist();
        $('#playlistView').show();
        $('#playlistBtn').addClass('text-blue-500');
    }
    if (full === 'true' && !isExpanded) {
        toggleExpand();
    }
}


window.addEventListener('popstate', handleRouting);

// --- Sections ---
async function showSection(sectionId, element, updateUrl = true) {
    activeSection = sectionId;
    $('.sidebar-item').removeClass('active');

    const $targetItem = element ? $(element) : $(`.sidebar-item[onclick*="'${sectionId}'"]`);
    $targetItem.addClass('active');

    $('#homeSection, #historySection, #offlineSection, #playlistSection').addClass('hidden-section');
    $(`#${sectionId}Section`).removeClass('hidden-section');

    if (sectionId === 'history') await loadHistory();
    if (sectionId === 'offline') await loadOffline();
    if (sectionId === 'playlist') await loadPlaylists();

    if (updateUrl) {
        const url = new URL(window.location);
        url.searchParams.set('page', sectionId);
        url.searchParams.delete('q');
        url.searchParams.delete('uploader');
        url.searchParams.delete('p');
        window.history.pushState({}, '', url);
    }

    if ($(window).width() <= 780 && isSidebarOpen) toggleSidebar();
}

// --- Search & Suggestions ---
function handleSearchInput() {
    clearTimeout(suggestionDebounceTimer);
    const query = $('#videoQuery').val().trim();
    if (!query) {
        showSearchHistory();
        return;
    }
    suggestionDebounceTimer = setTimeout(async () => {
        const data = await Helper.fetchJSON(`/search_suggestions?q=${encodeURIComponent(query)}`);
        if (data) renderSuggestions(data.suggestions, false);
    }, 300);
}

async function showSearchHistory() {
    const data = await Helper.fetchJSON('/list_search_history');
    if (data && data.results?.length > 0) {
        renderSuggestions(data.results, true);
    } else {
        $('#suggestionsDropdown').hide();
    }
}

function renderSuggestions(list, isHistory) {
    if (!list?.length) {
        $('#suggestionsDropdown').hide();
        return;
    }
    const html = list.map(item => `
        <div class="suggestion-item ${isHistory ? 'history-item' : ''}" onclick="selectSuggestion('${item.replace(/'/g, "\\'")}')">
            <i class="fas ${isHistory ? 'fa-history' : 'fa-search'}"></i>
            <span>${item}</span>
            ${isHistory ? `<i class="fas fa-times delete-history" onclick="deleteHistoryQuery(event, '${item.replace(/'/g, "\\'")}')"></i>` : ''}
        </div>`).join('');
    $('#suggestionsDropdown').html(html).show();
    selectedIndex = -1;
}

window.selectSuggestion = (val) => {
    $('#videoQuery').val(val);
    $('#suggestionsDropdown').hide();
    searchVideos();
};

window.deleteHistoryQuery = async (event, query) => {
    event.stopPropagation();
    const ok = await Helper.fetchJSON(`/delete_search_history?q=${encodeURIComponent(query)}`, { method: 'DELETE' });
    if (ok) showSearchHistory();
};

function handleSearchKeydown(e) {
    if (e.key === 'Enter') {
        const $items = $('.suggestion-item');
        if ($('#suggestionsDropdown').is(':visible') && selectedIndex >= 0) {
            e.preventDefault();
            selectSuggestion($items.eq(selectedIndex).find('span').text());
        } else {
            $('#suggestionsDropdown').hide();
            searchVideos();
        }
        return;
    }

    const $items = $('.suggestion-item');
    if ($('#suggestionsDropdown').is(':visible') && $items.length) {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            selectedIndex = (selectedIndex + 1) % $items.length;
            $items.removeClass('selected').eq(selectedIndex).addClass('selected');
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            selectedIndex = (selectedIndex - 1 + $items.length) % $items.length;
            $items.removeClass('selected').eq(selectedIndex).addClass('selected');
        }
    }
}

// --- Videos ---
async function searchVideos(customQuery = null, displayName = null, updateUrl = true) {
    const query = customQuery || $('#videoQuery').val();
    if (displayName) $('#videoQuery').val(displayName);
    if (!query || isFetching) return;

    if (updateUrl) {
        const url = new URL(window.location);
        url.searchParams.set('page', 'home');
        url.searchParams.set('q', query);
        if (displayName) url.searchParams.set('uploader', displayName);
        url.searchParams.delete('p');
        window.history.pushState({}, '', url);
    }

    currentQuery = query;
    currentOffset = 1;
    renderedVideoIds.clear();
    showSection('home', null, false);
    $('#resultsGrid').empty();
    $('#loading').removeClass('hidden');

    try {
        isFetching = true;
        if (!query.startsWith('http')) {
            Helper.post('/save_search_history', { query });
        }
        const data = await Helper.post('/extract', { query, offset: currentOffset });
        if (data?.results) {
            const valid = data.results.filter(v => v.duration && v.duration !== "00:00");
            valid.forEach(v => {
                if (!renderedVideoIds.has(v.id)) {
                    $('#resultsGrid').append(Helper.renderVideoCard(v, 'search'));
                    renderedVideoIds.add(v.id);
                }
            });
            updatePlaylist(valid, false);
            currentOffset += data.results.length;
        }
    } finally {
        $('#loading').addClass('hidden');
        isFetching = false;
    }
}

async function loadMoreVideos() {
    if (isFetching || activeSection !== 'home' || !currentQuery) return;
    isFetching = true;
    $('#infiniteLoader').removeClass('hidden');
    try {
        const data = await Helper.post('/extract', { query: currentQuery, offset: currentOffset });
        if (data?.results) {
            const valid = data.results.filter(v => v.duration && v.duration !== "00:00");
            valid.forEach(v => {
                if (!renderedVideoIds.has(v.id)) {
                    $('#resultsGrid').append(Helper.renderVideoCard(v, 'search'));
                    renderedVideoIds.add(v.id);
                }
            });
            updatePlaylist(valid, true);
            currentOffset += data.results.length;
        }
    } finally {
        isFetching = false;
        $('#infiniteLoader').addClass('hidden');
    }
}

function searchChannel(event, channelId, uploaderName) {
    event.stopPropagation();
    if (channelId) searchVideos(`https://www.youtube.com/channel/${channelId}/videos`, uploaderName);
}

// --- Player ---
async function playVideo(video, updateUrl = true) {
    const $container = $('#playerContainer');
    const $playerEl = $('#videoPlayer');
    const $title = $('#nowPlayingTitle');
    const $uploader = $('#nowPlayingUploader');

    $container.show();
    $title.text("Connecting...");
    $uploader.text("Please wait...");
    currentVideoObj = video;

    // Initialize Plyr if not exists
    if (!plyrPlayer) {
        plyrPlayer = new Plyr('#videoPlayer', {
            controls: [
                'play-large', 'play', 'progress', 'current-time', 'mute', 'volume',
                'captions', 'settings', 'pip', 'airplay', 'fullscreen'
            ],
            settings: ['captions', 'quality', 'speed'],
            invertTime: false,
            tooltips: { controls: true, seek: true }
        });

        plyrPlayer.on('ended', () => playNext());
    }

    if (updateUrl) {
        const url = new URL(window.location);
        url.searchParams.set('v', video.id);
        window.history.pushState({}, '', url);
    }

    const data = await Helper.fetchJSON(`/get_stream?video_id=${video.id}`);
    if (data?.stream_url) {
        // Update metadata from stream response (more accurate)
        if (data.title) video.title = data.title;
        if (data.thumbnail) video.thumbnail = data.thumbnail;
        if (data.uploader) video.uploader = data.uploader;
        if (data.duration) video.duration = data.duration;
        if (data.views) video.views = data.views;

        $title.text(video.title);
        $uploader.text(video.uploader || "YouTube");

        const tracks = (data.subtitles || []).map(sub => ({
            kind: 'subtitles',
            label: sub.label,
            srclang: sub.lang,
            src: sub.url,
            default: sub.lang === 'id' || sub.lang === 'en'
        }));

        plyrPlayer.source = {
            type: 'video',
            title: video.title,
            sources: [{ src: data.stream_url, type: 'video/mp4' }],
            tracks: tracks
        };

        plyrPlayer.play().catch(() => {
            // Plyr handles interaction better, but fallback if needed
        });

        saveToHistory(video);
        currentIndex = currentPlaylist.findIndex(v => v.id === video.id);
        if ($('#playlistView').is(':visible')) renderPlaylist();
    } else {
        alert("Gagal memutar video.");
    }
}

function playNext() {
    if (currentIndex < currentPlaylist.length - 1) playVideo(currentPlaylist[currentIndex + 1]);
}

function playPrev() {
    if (currentIndex > 0) playVideo(currentPlaylist[currentIndex - 1]);
}

function toggleExpand() {
    const $container = $('#playerContainer');
    const $backdrop = $('#playerBackdrop');
    const $icon = $('#expandIcon');
    isExpanded = !isExpanded;

    if (isExpanded) {
        $container.addClass('full-view');
        $backdrop.show();
        setTimeout(() => $backdrop.addClass('show'), 10);
        $icon.attr('class', 'fas fa-compress-alt');
        $('body').css('overflow', 'hidden');
    } else {
        $container.removeClass('full-view');
        $backdrop.removeClass('show');
        setTimeout(() => $backdrop.hide(), 300);
        $icon.attr('class', 'fas fa-expand-alt');
        $('body').css('overflow', 'auto');
    }

    // Sync URL
    const url = new URL(window.location);
    if (isExpanded) {
        url.searchParams.set('full', 'true');
    } else {
        url.searchParams.delete('full');
    }
    window.history.replaceState({}, '', url);
}

function closePlayer() {
    if (plyrPlayer) {
        plyrPlayer.stop();
    } else {
        $('#videoPlayer')[0].pause();
    }

    $('#playerContainer').hide();
    if (isExpanded) toggleExpand();

    const url = new URL(window.location);
    if (url.searchParams.has('v')) {
        url.searchParams.delete('v');
        window.history.pushState({}, '', url);
    }
}


// --- History & Offline ---
async function saveToHistory(video) {
    Helper.post('/save_history', {
        id: video.id,
        title: video.title || "Unknown Title",
        thumbnail: video.thumbnail || "",
        uploader: video.uploader || "Unknown Channel",
        duration: video.duration || 0,
        views: video.views || 0,
        is_offline: video.is_offline || false
    });
}

async function loadHistory() {
    $('#historyGrid').html('<div class="col-span-full text-center py-20 opacity-30">Memuat histori...</div>');
    const data = await Helper.fetchJSON('/list_history');
    if (data?.results?.length) {
        $('#historyEmpty').addClass('hidden');
        $('#historyGrid').html(data.results.map(v => Helper.renderVideoCard(v, 'history')).join(''));
        updatePlaylist(data.results, false);
    } else {
        $('#historyGrid').empty();
        $('#historyEmpty').removeClass('hidden');
    }
}

async function deleteHistoryItem(event, videoId) {
    event.stopPropagation();
    if (confirm('Hapus dari histori?')) {
        const res = await fetch(`/delete_history/${videoId}`, { method: 'DELETE' });
        if (res.ok) loadHistory();
    }
}

async function clearHistory() {
    if (confirm('Bersihkan semua histori dari server?')) {
        const res = await fetch('/clear_history', { method: 'POST' });
        if (res.ok) loadHistory();
    }
}

async function loadOffline() {
    $('#offlineGrid').html('<div class="col-span-full text-center py-20 opacity-30">Memeriksa koleksi...</div>');
    const data = await Helper.fetchJSON('/list_offline');
    if (data?.results?.length) {
        $('#offlineEmpty').addClass('hidden');
        $('#offlineGrid').html(data.results.map(v => Helper.renderVideoCard(v, 'offline')).join(''));
        updatePlaylist(data.results, false);
    } else {
        $('#offlineGrid').empty();
        $('#offlineEmpty').removeClass('hidden');
    }
}

async function deleteOfflineItem(event, videoId) {
    event.stopPropagation();
    if (confirm('Hapus dari offline?')) {
        const res = await fetch(`/delete_offline/${videoId}`, { method: 'DELETE' });
        if (res.ok) loadOffline();
    }
}

// --- Playlists ---
function updatePlaylist(videos, append = false) {
    currentPlaylist = append ? [...currentPlaylist, ...videos] : [...videos];
    if ($('#playlistView').is(':visible')) renderPlaylist();
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
            <div class="playlist-item ${isActive ? 'active' : ''}" onclick="playVideo(${videoData})">
                <img src="${video.thumbnail}">
                <div class="playlist-info">
                    <div class="playlist-title">${video.title}</div>
                    <div class="playlist-uploader">${video.uploader || 'Channel'}</div>
                </div>
            </div>`;
    }).join('');
    $('#playlistView').html(html);
    const $active = $('#playlistView .active');
    if ($active.length) $active[0].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

$(init);
