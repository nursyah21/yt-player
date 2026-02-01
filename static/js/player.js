/* Video Player */
async function playVideo(video, updateUrl = true, startTime = 0) {
    const $container = $('#playerContainer');
    const $playerEl = $('#videoPlayer');
    const $title = $('#nowPlayingTitle');
    const $uploader = $('#nowPlayingUploader');

    // CANCEL PREVIOUS DOWNLOAD IF ANY
    if (currentVideoObj && currentVideoObj.id !== video.id) {
        fetch(`/cancel_download?video_id=${currentVideoObj.id}`).catch(() => { });
    }

    $container.show();
    $title.text("Connecting...");
    $uploader.text("Please wait...");
    currentVideoObj = video;
    if (updateUrl) {
        const url = new URL(window.location);
        url.searchParams.set('v', video.id);
        if (startTime > 0) url.searchParams.set('t', startTime);
        window.history.pushState({}, '', url);
    }

    const data = await Helper.fetchJSON(`/get_stream?video_id=${video.id}`);

    // RACE CONDITION CHECK
    if (!$('#playerContainer').is(':visible') || currentVideoObj.id !== video.id) {
        return;
    }

    if (data?.stream_url) {
        if (data.title) video.title = data.title;
        if (data.thumbnail) video.thumbnail = data.thumbnail;
        if (data.uploader) video.uploader = data.uploader;
        if (data.channel_id) video.channel_id = data.channel_id;
        if (data.duration) video.duration = data.duration;
        if (data.views) video.views = data.views;

        const plIdx = currentPlaylist.findIndex(v => v.id === video.id);
        if (plIdx !== -1) {
            currentPlaylist[plIdx] = { ...currentPlaylist[plIdx], ...video };
        }

        $title.text(video.title);
        $uploader.text(video.uploader || "YouTube");
        document.title = `${video.title} - Video Studio`;

        // Missing Channel ID Repair Poll
        if (!video.channel_id) {
            setTimeout(async () => {
                const freshMeta = await Helper.fetchJSON(`/get_video_meta/${video.id}`, { hideProgress: true });
                if (freshMeta && freshMeta.channel_id) {
                    video.channel_id = freshMeta.channel_id;
                    const plIdx = currentPlaylist.findIndex(v => v.id === video.id);
                    if (plIdx !== -1) {
                        currentPlaylist[plIdx].channel_id = freshMeta.channel_id;
                        if ($('#playlistView').is(':visible')) renderPlaylist();
                    }
                }
            }, 4000);
        }

        // 1. RE-INITIALIZE PLYR BASE
        if (plyrPlayer) {
            plyrPlayer.destroy();
        }

        // 2. INJECT NEW SOURCES AND TRACKS DIRECTLY INTO DOM
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

        // 3. CREATE NEW PLYR INSTANCE
        const plyrOpts = {
            controls: [
                'play-large', 'play', 'progress', 'current-time', 'mute', 'volume',
                'captions', 'settings', 'pip', 'airplay', 'fullscreen'
            ],
            settings: ['captions', 'quality', 'speed'],
            quality: {
                default: sources.length > 0 ? sources[0].size : 0,
                options: sources.map(s => s.size),
                forced: true
            },
            i18n: { quality: qualityLabels },
            invertTime: false,
            tooltips: { controls: true, seek: true }
        };

        plyrPlayer = new Plyr('#videoPlayer', plyrOpts);

        // Update title/sources property for internal state
        plyrPlayer.source = {
            type: 'video',
            title: video.title,
            sources: sources.length > 0 ? sources : [{ src: data.stream_url, type: 'video/mp4', size: 0 }],
            tracks: (data.subtitles || []).filter(sub => sub.url.startsWith('/subs/')).map(sub => ({
                kind: 'subtitles',
                label: sub.label,
                srclang: sub.lang,
                src: sub.url,
                default: sub.lang === 'id' || sub.lang === 'en' || sub.label.includes('Indonesia')
            }))
        };

        // HACK: Force labels update via click listener on settings
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

        // Scoped observer to player container for better performance
        if (window.plyrObserver) window.plyrObserver.disconnect();
        window.plyrObserver = new MutationObserver((mutations) => {
            if ($('#playerContainer').is(':visible')) {
                updateLabels();
            }
        });
        window.plyrObserver.observe(document.querySelector('#playerContainer'), { childList: true, subtree: true });

        document.removeEventListener('click', window.playerSettingsClickHandler);
        window.playerSettingsClickHandler = (e) => {
            if (e.target.closest('[data-plyr="settings"]')) {
                setTimeout(updateLabels, 50);
            }
        };
        document.addEventListener('click', window.playerSettingsClickHandler);

        plyrPlayer.on('ended', () => playNext());

        // ROBUST SEEKING STRATEGY
        let hasSeekedInitial = false;
        const doInitialSeek = () => {
            const vEl = document.querySelector('video');
            if (startTime > 0 && !hasSeekedInitial && vEl) {
                hasSeekedInitial = true;
                vEl.currentTime = startTime;
                console.log("Native seek to:", startTime);
            }
            plyrPlayer.play().catch(() => { });
        };

        plyrPlayer.once('loadedmetadata', doInitialSeek);
        plyrPlayer.once('playing', doInitialSeek);
        if (plyrPlayer.duration > 0) doInitialSeek();


        // URL Timestamp Sync (Throttled to 10s to prevent TSS/History errors)
        plyrPlayer.off('timeupdate');
        let lastUrlUpdateSec = startTime;
        let lastSyncTime = Date.now();

        plyrPlayer.on('timeupdate', () => {
            const now = Date.now();
            const vEl = document.querySelector('video');
            if (!plyrPlayer.paused && (now - lastSyncTime > 10000) && vEl) {
                const curSec = Math.floor(vEl.currentTime);
                if (curSec !== lastUrlUpdateSec && curSec > 0) {
                    lastUrlUpdateSec = curSec;
                    lastSyncTime = now;
                    const url = new URL(window.location);
                    url.searchParams.set('t', curSec);
                    window.history.replaceState({}, '', url);
                }
            }
        });

        saveToHistory(video);
        currentIndex = currentPlaylist.findIndex(v => v.id === video.id);

        if (activeSection === 'playlist') {
            const playlistName = $('#currentPlaylistName').text();
            if (playlistName) {
                Helper.post('/update_playlist_meta', { playlist_name: playlistName, video: video });
            }
        }

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

    const url = new URL(window.location);
    if (isExpanded) {
        url.searchParams.set('full', 'true');
    } else {
        url.searchParams.delete('full');
    }
    window.history.replaceState({}, '', url);
}

function closePlayer() {
    if (currentVideoObj) {
        fetch(`/cancel_download?video_id=${currentVideoObj.id}`).catch(() => { });
    }

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
