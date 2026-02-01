/* Search Engine */
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
        if (displayName) url.searchParams.set('uploader', displayName);
        url.searchParams.delete('p');
        url.searchParams.delete('t'); // Clear timestamp on new search
        window.history.pushState({}, '', url);
    }

    currentQuery = query;
    currentOffset = 1;
    renderedVideoIds.clear();
    showSection('home', null, false);
    $('#resultsGrid').empty();

    // NProgress Loader
    NProgress.start();
    document.title = `Cari: ${displayName || query} - Video Studio`;

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

            // SMART LINK REPAIR
            if (data.found_channel_id && displayName) {
                if (pendingRepairPlaylist) {
                    Helper.post('/update_playlist_channel_by_uploader', {
                        playlist_name: pendingRepairPlaylist,
                        uploader: displayName,
                        channel_id: data.found_channel_id
                    });
                    console.log("Repairing playlist:", pendingRepairPlaylist, displayName);
                    pendingRepairPlaylist = null;
                }
            }
        }
    } finally {
        // Yield to UI thread to ensure cards are painted before stopping loader
        setTimeout(() => {
            NProgress.done();
            isFetching = false;
        }, 50);
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
