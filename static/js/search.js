/* Search Engine */
function handleSearchInput() {
    clearTimeout(suggestionDebounceTimer);
    const query = $('#videoQuery').val().trim();

    // SMART SEARCH: If not home, filter local content immediately
    if (activeSection !== 'home') {
        filterLocalContent(query);
        $('#clearSearchBtn').toggle(!!query);
        $('#suggestionsDropdown').hide();
        return;
    }

    if (!query) {
        showSearchHistory();
        $('#clearSearchBtn').hide();
        return;
    }
    $('#clearSearchBtn').show();

    suggestionDebounceTimer = setTimeout(async () => {
        const data = await Helper.fetchJSON(`/search_suggestions?q=${encodeURIComponent(query)}`);
        if (data) renderSuggestions(data.suggestions, false);
    }, 300);
}

async function showSearchHistory() {
    const data = await Helper.fetchJSON('/list_search_history');
    if (data && data.results?.length > 0) {
        renderSuggestions(data.results.slice(0, 8), true);
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
    if (e.key === 'Escape') {
        $('#suggestionsDropdown').hide();
        return;
    }
    if (e.key === 'Enter') {
        const $items = $('.suggestion-item');
        if ($('#suggestionsDropdown').is(':visible') && selectedIndex >= 0) {
            e.preventDefault();
            selectSuggestion($items.eq(selectedIndex).find('span').text());
        } else {
            $('#suggestionsDropdown').hide();
            // Only trigger server search if we are on Home
            if (activeSection === 'home') {
                searchVideos();
            } else {
                // Already filtered via input, just hide keyboard/focus
                $('#videoQuery').blur();
            }
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

async function searchVideos(customQuery = null, displayName = null, updateUrl = true) {
    const query = customQuery || $('#videoQuery').val();
    if (displayName) $('#videoQuery').val(displayName);

    if (query && query.trim() !== "") {
        $('#clearSearchBtn').show();
    } else {
        $('#clearSearchBtn').hide();
    }

    if (!query || isFetching) return;

    if (updateUrl) {
        const url = new URL(window.location);
        url.searchParams.set('page', 'home');
        url.searchParams.set('q', query);
        if (displayName) {
            url.searchParams.set('uploader', displayName);
        } else {
            url.searchParams.delete('uploader');
        }
        url.searchParams.delete('p');
        url.searchParams.delete('t'); // Clear timestamp on new search
        window.history.pushState({}, '', url);
    }

    currentQuery = query;
    currentOffset = 1;
    renderedVideoIds.clear();
    showSection('home', null, false);
    $('#resultsGrid').empty();

    document.title = `Cari: ${displayName || query} - Video Studio`;

    try {
        isFetching = true;
        $('#loading').removeClass('hidden');

        if (!query.startsWith('http')) {
            Helper.post('/save_search_history', { query }, { hideProgress: true });
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

            // SMART LINK REPAIR
            if (data.found_channel_id && displayName) {
                if (pendingRepairPlaylist) {
                    Helper.post('/update_playlist_channel_by_uploader', {
                        playlist_name: pendingRepairPlaylist,
                        uploader: displayName,
                        channel_id: data.found_channel_id
                    }, { hideProgress: true });
                    pendingRepairPlaylist = null;
                }
            }
        }
    } finally {
        isFetching = false;
        $('#loading').addClass('hidden');
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
    pendingRepairPlaylist = (activeSection === 'playlist') ? $('#currentPlaylistName').text() : null;
    if (channelId && channelId !== 'undefined' && channelId !== 'null' && channelId !== '') {
        searchVideos(`https://www.youtube.com/channel/${channelId}/videos`, uploaderName);
    } else if (uploaderName && uploaderName !== 'Unknown Channel' && uploaderName !== 'Channel') {
        searchVideos(`"${uploaderName}"`, uploaderName);
    }
}

async function filterLocalContent(query) {
    let targetGrid = null;

    // Check if we are in Playlist Root (List of playlists) vs Detail (Videos in a playlist)
    const isPlaylistRoot = activeSection === 'playlist' && $('#playlistList').is(':visible');

    if (activeSection === 'history') targetGrid = $('#historyGrid');
    else if (activeSection === 'offline') targetGrid = $('#offlineGrid');
    else if (activeSection === 'playlist') {
        if (isPlaylistRoot) {
            // SPECIAL CASE: Global Playlist Search
            return handleGlobalPlaylistSearch(query);
        }
        targetGrid = $('#playlistVideoGrid');
    }

    if (!targetGrid || !targetGrid.length) return;

    if (!query) {
        targetGrid.children().show();
        return;
    }

    const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 0);
    targetGrid.children('.video-card').each(function () {
        const $card = $(this);
        const title = $card.find('.video-title').text().toLowerCase();
        const uploader = $card.find('.video-uploader').text().toLowerCase();
        const textToSearch = title + " " + uploader;

        const match = terms.every(term => textToSearch.includes(term));

        if (match) {
            $card.show();
        } else {
            $card.hide();
        }
    });
}

let globalPlaylistSearchTimer;
async function handleGlobalPlaylistSearch(query) {
    clearTimeout(globalPlaylistSearchTimer);
    const $grid = $('#playlistGrid');

    if (!query) {
        // Restore original playlist list
        loadPlaylists();
        return;
    }

    globalPlaylistSearchTimer = setTimeout(async () => {
        $grid.html('<div class="col-span-full text-center py-10 opacity-50">Mencari di semua playlist...</div>');
        const data = await Helper.post('/search_playlist', { query });

        if (data && data.results && data.results.length > 0) {
            const html = data.results.map(v => {
                // Add "Found in: X" badge
                let cardHtml = Helper.renderVideoCard(v, 'playlist_search');
                // Inject badge manually since Helper is generic
                const badge = `<div class="absolute top-2 left-2 bg-blue-600/90 text-white text-[10px] px-2 py-1 rounded shadow z-10">
                                <i class="fas fa-folder mr-1"></i> ${v.found_in_playlist}
                               </div>`;
                return cardHtml.replace('<div class="video-card', `<div class="relative video-card`).replace('<div class="thumbnail-box', badge + '<div class="thumbnail-box');
            }).join('');
            $grid.html(html);
        } else {
            $grid.html('<div class="col-span-full text-center py-10 text-gray-500">Tidak ada video yang cocok di playlist manapun.</div>');
        }
    }, 300);
}
