/* Initialization & Events */
function init() {
    if (typeof NProgress !== 'undefined') NProgress.configure({ showSpinner: false });
    initSidebar();
    handleRouting();
    setupShimmer();
    setupInfiniteScroll();
    setupEventListeners();
    loadSubscriptions();
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

    $('#videoQuery').on('input', function () {
        handleSearchInput();
        if ($(this).val().trim()) $('#clearSearchBtn').removeClass('hidden');
        else $('#clearSearchBtn').addClass('hidden');
    });

    $('#clearSearchBtn').on('click', () => {
        $('#videoQuery').val('').focus();
        $('#clearSearchBtn').addClass('hidden');
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
