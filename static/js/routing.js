/* Routing & Navigation */
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
        const startTime = parseInt(params.get('t')) || 0;
        await playVideo({ id: v, title: "Loading...", thumbnail: "" }, false, startTime);
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

async function showSection(sectionId, element, updateUrl = true) {
    activeSection = sectionId;
    $('.sidebar-item').removeClass('active');

    const $targetItem = element ? $(element) : $(`.sidebar-item[data-section="${sectionId}"]`);
    $targetItem.addClass('active');

    $('#homeSection, #historySection, #offlineSection, #playlistSection').addClass('hidden-section');
    $(`#${sectionId}Section`).removeClass('hidden-section');

    const sectionNames = { 'home': 'Beranda', 'history': 'Histori', 'offline': 'Offline', 'playlist': 'Playlist' };
    document.title = `${sectionNames[sectionId] || 'Video'} - Video Studio`;

    // RESET IF NAVIGATING TO HOME MANUALLY
    if (sectionId === 'home' && updateUrl) {
        currentQuery = "";
        currentOffset = 1;
        renderedVideoIds.clear();
        $('#videoQuery').val('');
        $('#clearSearchBtn').hide();
        $('#resultsGrid').html(`
            <div class="empty-state">
                <i class="fas fa-play-circle text-6xl mb-4"></i>
                <p class="text-xl">Cari video untuk memulai</p>
            </div>
        `);
    }

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
