/* Initialization & Events */
function init() {
    if (typeof NProgress !== 'undefined') {
        NProgress.configure({ showSpinner: false, minimum: 0.1, speed: 200 });
    }
    initSidebar();
    handleRouting();
    setupInfiniteScroll();
    setupEventListeners();
    loadSubscriptions();
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

    $('#videoQuery').on('input', function () {
        handleSearchInput();
        if ($(this).val().trim()) $('#clearSearchBtn').show();
        else $('#clearSearchBtn').hide();
    });

    $('#clearSearchBtn').on('click', () => {
        $('#videoQuery').val('').focus();
        $('#clearSearchBtn').hide();
        $('#suggestionsDropdown').hide();
    });

    $('#videoQuery').on('focus', () => {
        if (!$('#videoQuery').val().trim()) showSearchHistory();
    });
    $('#videoQuery').on('keydown', handleSearchKeydown);

    $(document).on('click', (e) => {
        if (!$(e.target).closest('.search-container').length) {
            $('#suggestionsDropdown').hide();
        }
    });

    // Keyboard Shortcuts
    $(document).on('keydown', (e) => {
        const isInput = document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA';
        if (isInput || !$('#playerContainer').is(':visible') || !plyrPlayer) return;

        const v = document.querySelector('video');
        if (!v) return;

        if (e.code === 'Space') {
            e.preventDefault();
            plyrPlayer.togglePlay();
        } else if (e.code === 'ArrowRight') {
            e.preventDefault();
            v.currentTime = Math.min(v.duration, v.currentTime + 5);
        } else if (e.code === 'ArrowLeft') {
            e.preventDefault();
            v.currentTime = Math.max(0, v.currentTime - 5);
        }
    });

    $('#closePlayerBtn').on('click', closePlayer);
}

// App Start
$(init);
