/* Video Player */
// plyrPlayer, currentVideoObj, currentPlaylist, currentIndex, isExpanded are in globals.js


async function playVideo(video, updateUrl = true, startTime = 0) {
    const $container = $('#playerContainer');
    const $title = $('#nowPlayingTitle');
    const $uploader = $('#nowPlayingUploader');

    // 1. CANCEL PREVIOUS DOWNLOAD IF RUNNING
    if (currentVideoObj && currentVideoObj.id !== video.id && !currentVideoObj.is_offline) {
        fetch(`/cancel_download?video_id=${currentVideoObj.id}`).catch(() => { });
    }

    if (typeof NProgress !== 'undefined') NProgress.start();

    // Determine initial state: respect URL or current isExpanded
    const urlParams = new URLSearchParams(window.location.search);
    const forceFull = urlParams.get('screen') === 'full' || urlParams.get('full') === 'true' || isExpanded;

    toggleExpand(forceFull);

    $container.show();
    $title.text("Connecting...");
    $uploader.text("Please wait...");

    // Add central loading message in player (spinner only)
    $('.aspect-video').append(`
        <div id="videoLoadingOverlay" class="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-10 backdrop-blur-sm transition-all duration-300">
            <div class="w-10 h-10 border-4 border-white/10 border-t-white rounded-full animate-spin"></div>
        </div>
    `);

    // Update state immediately
    currentVideoObj = video;

    if (updateUrl) {
        const url = new URL(window.location);
        url.searchParams.set('v', video.id);

        // Only set 't' if manually requested
        if (startTime > 0) url.searchParams.set('t', startTime);
        else url.searchParams.delete('t');

        window.history.replaceState({}, '', url); // Use replaceState to keep history clean
    }

    // Sync playlist index
    const foundIdx = currentPlaylist.findIndex(v => v.id === video.id);
    if (foundIdx !== -1) currentIndex = foundIdx;

    // 2. PARALLEL FETCHES
    const dataPromise = Helper.fetchJSON(`/get_stream?video_id=${video.id}`);
    saveToHistory(video);

    // 3. FAST PATH FOR OFFLINE VIDEOS
    if (video.is_offline && video.title !== "Loading...") {
        console.log("Fast-path: Starting offline playback immediately");
        const h = video.height || 480;
        setupPlyr({
            stream_url: `/offline/${video.id}.mp4`,
            formats: [{
                url: `/offline/${video.id}.mp4`,
                quality: `Local (${h}p)`,
                height: h,
                is_local: true
            }],
            is_offline: true,
            title: video.title,
            uploader: video.uploader,
            duration: video.duration,
            is_mock: true // Mark as initial mock data
        }, video, startTime);
    }

    // 4. WAIT FOR FULL DATA
    try {
        const data = await dataPromise;
        $('#videoLoadingOverlay').addClass('opacity-0');
        setTimeout(() => $('#videoLoadingOverlay').remove(), 300);

        // RACE CONDITION CHECK
        if (!$('#playerContainer').is(':visible') || currentVideoObj.id !== video.id) {
            return;
        }

        if (data) {
            // Update state with confirmed data from server
            currentVideoObj = { ...video, ...data };
            setupPlyr(data, video, startTime);
        } else {
            if (typeof NProgress !== 'undefined') NProgress.done();
            if (!video.is_offline) {
                Helper.showToast('Gagal memutar video. Silakan coba lagi.', 'error');
            }
        }
    } catch (error) {
        if (typeof NProgress !== 'undefined') NProgress.done();
        $('#videoLoadingOverlay').remove();
        console.error("Error loading video:", error);
        Helper.showToast('Terjadi kesalahan koneksi', 'error');
    }
}

function setupPlyr(data, video, startTime) {
    const $title = $('#nowPlayingTitle');
    const $uploader = $('#nowPlayingUploader');
    const $downloadBtn = $('#downloadVideoBtn');

    // 0. SPEED MODE: If already playing this ID, just update labels
    if (plyrPlayer && lastPlayedId === video.id) {
        $title.text(data.title || video.title);
        $uploader.text(data.uploader || video.uploader || "YouTube");
        return;
    }

    // 1. BRAND NEW LOAD
    lastPlayedId = video.id;

    // Update Meta & Download Button
    $title.text(data.title || video.title);
    $uploader.text(data.uploader || video.uploader || "YouTube");
    document.title = `${data.title || video.title} - Video Studio`;

    if (data.is_offline) {
        let sizeInfo = "";
        const localFmt = (data.formats || []).find(f => f.is_local);
        if (localFmt && localFmt.quality) {
            sizeInfo = localFmt.quality; // "Local (480p - 30.0MB)"
        }

        const btnText = sizeInfo ? sizeInfo : 'Download MP4';
        $downloadBtn.attr('title', btnText);
        $downloadBtn.show().off('click').on('click', () => {
            const link = document.createElement('a');
            link.href = `/offline/${video.id}.mp4`;
            link.download = `${data.title || video.title}.mp4`;
            link.click();
        });
    } else {
        $downloadBtn.hide();
    }

    // RE-INITIALIZE ONLY ON NEW VIDEO
    if (plyrPlayer) {
        plyrPlayer.destroy();
    }

    const $video = $('#videoPlayer');
    $video.empty(); // Clean slate

    const qualityLabels = {};
    const sources = (data.formats || []).map(f => {
        qualityLabels[f.height] = f.quality;
        const $s = $('<source>').attr({
            src: f.url,
            type: 'video/mp4',
            size: f.height
        });
        $video.append($s);
        return { src: f.url, type: 'video/mp4', size: f.height };
    });

    if (sources.length === 0) {
        $video.append($('<source>').attr({ src: data.stream_url, type: 'video/mp4', size: 0 }));
    }

    (data.subtitles || []).forEach(sub => {
        const $t = $('<track>').attr({
            kind: 'subtitles',
            label: sub.label,
            srclang: sub.lang,
            src: sub.url,
            default: sub.lang === 'id' || sub.lang === 'en' || sub.label.includes('Indonesia')
        });
        $video.append($t);
    });

    const plyrOpts = {
        controls: [
            'play-large', 'play', 'progress', 'current-time', 'mute', 'volume',
            'captions', 'settings', 'pip', 'airplay', 'fullscreen'
        ],
        settings: ['captions', 'speed'],
        i18n: { quality: qualityLabels },
        invertTime: false,
        tooltips: { controls: true, seek: true }
    };

    plyrPlayer = new Plyr('#videoPlayer', plyrOpts);

    plyrPlayer.on('ready', () => {
        if (typeof NProgress !== 'undefined') NProgress.done();
    });

    // Update internal state
    plyrPlayer.source = {
        type: 'video',
        title: data.title || video.title,
        sources: sources.length > 0 ? sources : [{ src: data.stream_url, type: 'video/mp4', size: 0 }],
        tracks: (data.subtitles || []).filter(sub => sub.url.startsWith('/subs/')).map(sub => ({
            kind: 'subtitles',
            label: sub.label,
            srclang: sub.lang,
            src: sub.url,
            default: sub.lang === 'id' || sub.lang === 'en' || sub.label.includes('Indonesia')
        }))
    };

    // Quality labels hack
    const updateLabels = () => {
        const qualityButtons = document.querySelectorAll('.plyr__menu__container [data-plyr="quality"]');
        qualityLabels && qualityButtons.forEach(btn => {
            const val = btn.getAttribute('value');
            if (qualityLabels[val]) {
                const span = btn.querySelector('span');
                if (span && span.textContent !== qualityLabels[val]) {
                    span.textContent = qualityLabels[val];
                }
            }
        });
    };

    if (window.plyrObserver) window.plyrObserver.disconnect();
    window.plyrObserver = new MutationObserver(() => {
        if ($('#playerContainer').is(':visible')) updateLabels();
    });
    window.plyrObserver.observe(document.querySelector('#playerContainer'), { childList: true, subtree: true });

    document.removeEventListener('click', window.playerSettingsClickHandler);
    window.playerSettingsClickHandler = (e) => {
        if (e.target.closest('[data-plyr="settings"]')) setTimeout(updateLabels, 50);
    };
    document.addEventListener('click', window.playerSettingsClickHandler);

    plyrPlayer.on('ended', () => playNext());
    plyrPlayer.on('play', updatePlayPauseIcon);
    plyrPlayer.on('pause', updatePlayPauseIcon);

    // Seeking & Playback
    let hasSeekedInitial = false;
    const doInitialSeek = () => {
        const vEl = document.querySelector('video');
        if (startTime > 0 && !hasSeekedInitial && vEl) {
            hasSeekedInitial = true;
            vEl.currentTime = startTime;
        }
        plyrPlayer.play().catch(() => { });
    };

    plyrPlayer.once('loadedmetadata', doInitialSeek);
    plyrPlayer.once('playing', doInitialSeek);
    if (plyrPlayer.duration > 0) doInitialSeek();


    // Persistent State & Progress Update
    let lastSyncSec = -1;
    plyrPlayer.on('timeupdate', () => {
        const vEl = document.querySelector('video');
        if (vEl) {
            // Update Mini Progress Bar at the top of the bar
            const progress = (vEl.currentTime / vEl.duration) * 100;
            $('#miniProgressBar').css('width', `${progress}%`);

            if (!plyrPlayer.paused) {
                const curSec = Math.floor(vEl.currentTime);
                if (curSec !== lastSyncSec) {
                    // Save exactly what we're watching
                    localStorage.setItem('last_video_state', JSON.stringify({
                        id: currentVideoObj.id,
                        time: curSec,
                        timestamp: Date.now()
                    }));
                    lastSyncSec = curSec;
                }
            }
        }
    });

    if ($('#playlistView').is(':visible')) renderPlaylist();
}

function playNext() {
    if (currentIndex < currentPlaylist.length - 1) playVideo(currentPlaylist[currentIndex + 1]);
}

function playPrev() {
    if (currentIndex > 0) playVideo(currentPlaylist[currentIndex - 1]);
}

function togglePlayPause() {
    if (!plyrPlayer) return;
    plyrPlayer.togglePlay();
}

function updatePlayPauseIcon() {
    const $icon = $('#playPauseIcon');
    if (plyrPlayer && plyrPlayer.playing) {
        $icon.removeClass('fa-play').addClass('fa-pause');
    } else {
        $icon.removeClass('fa-pause').addClass('fa-play');
    }
}

function toggleMinimize(shouldMin = null) {
    toggleExpand(false); // Map to mini bar
}

function toggleExpand(shouldExpand = null) {
    const $container = $('#playerContainer');
    const $backdrop = $('#playerBackdrop');
    const $icon = $('#expandIcon');

    isExpanded = (shouldExpand !== null) ? shouldExpand : !isExpanded;
    isMini = !isExpanded;

    if (isExpanded) {
        $container.addClass('full-view').removeClass('mini-view');
        $backdrop.show();
        setTimeout(() => $backdrop.addClass('show'), 10);
        $icon.attr('class', 'fas fa-compress-alt');
        $('body').css('overflow', 'hidden');
    } else {
        $container.removeClass('full-view').addClass('mini-view');
        $backdrop.removeClass('show');
        setTimeout(() => $backdrop.hide(), 300);
        $icon.attr('class', 'fas fa-expand-alt');
        $('body').css('overflow', 'auto');
    }

    updateScreenParam();
}

// Alias for compatibility
window.toggleMinimize = () => toggleExpand(false);

function updateScreenParam() {
    const url = new URL(window.location);
    if (isExpanded) {
        url.searchParams.set('screen', 'full');
    } else if ($('#playerContainer').is(':visible')) {
        url.searchParams.set('screen', 'min');
    } else {
        url.searchParams.delete('screen');
    }

    // Clean up old 'full' param if exists
    url.searchParams.delete('full');
    window.history.replaceState({}, '', url);
}

function closePlayer() {
    if (currentVideoObj) {
        fetch(`/cancel_download?video_id=${currentVideoObj.id}`).catch(() => { });
    }
    if (typeof NProgress !== 'undefined') NProgress.done();
    if (plyrPlayer) plyrPlayer.stop();
    $('#playerContainer').hide();
    if (isExpanded) toggleExpand(false);

    const url = new URL(window.location);
    if (url.searchParams.has('v')) {
        url.searchParams.delete('v');
        window.history.pushState({}, '', url);
    }
}

