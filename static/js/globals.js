/* Global State */
let isExpanded = false;
let isMini = false;
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
let pendingRepairPlaylist = null;
let selectedIndex = -1;
let suggestionDebounceTimer;
let plyrPlayer = null;
