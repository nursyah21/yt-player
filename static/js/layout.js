/* Sidebar & Layout */
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
