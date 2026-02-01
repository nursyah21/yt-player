/* History & Offline */
async function saveToHistory(video) {
    Helper.post('/save_history', {
        id: video.id,
        title: video.title || "Unknown Title",
        thumbnail: video.thumbnail || "",
        uploader: video.uploader || "Unknown Channel",
        channel_id: video.channel_id || "",
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
        // Sort Alphabetically by Title
        const sorted = data.results.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
        $('#offlineEmpty').addClass('hidden');
        $('#offlineGrid').html(sorted.map(v => Helper.renderVideoCard(v, 'offline')).join(''));
        updatePlaylist(sorted, false);
    } else {
        $('#offlineGrid').empty();
        $('#offlineEmpty').removeClass('hidden');
    }
}

async function deleteOfflineItem(event, videoId) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
    }

    // Gunakan setTimeout agar dialog confirm tidak memblokir penanganan event klik
    setTimeout(async () => {
        if (confirm('Hapus dari penyimpanan offline?')) {
            const res = await fetch(`/delete_offline/${videoId}`, { method: 'DELETE' });
            if (res.ok) loadOffline();
        }
    }, 10);
}

async function deleteHistoryItem(event, videoId) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
    }

    setTimeout(async () => {
        if (confirm('Hapus dari histori tontonan?')) {
            const res = await fetch(`/delete_history/${videoId}`, { method: 'DELETE' });
            if (res.ok) loadHistory();
        }
    }, 10);
}
