let isDragging = false;
let gestures=true;//false
let previewOpen=false;

/* =========================================
   1. DATA CONFIGURATION
   ========================================= */
const appDB = {
    'mail': { name: 'Mail', icon: 'fa-envelope', color: '#007AFF' },
    'cal':  { name: 'Calendar', icon: 'fa-calendar-alt', color: '#FF3B30' },
    'photos': { name: 'Photos', icon: 'fa-images', color: 'linear-gradient(to bottom right, #ff9a9e, #fad0c4)' },
    'camera': { name: 'Camera', icon: 'fa-camera', color: '#333' },
    'maps': { name: 'Maps', icon: 'fa-map-marked-alt', color: '#34C759', app: 'maps-app.htm' },
    'weather': { name: 'Weather', icon: 'fa-cloud-sun', color: '#5AC8FA', app: 'weather-app.htm' },
    'clock': { name: 'Clock', icon: 'fa-clock', color: '#000', app: 'clock-app.htm' },
    'notes': { name: 'Notes', icon: 'fa-sticky-note', color: '#FFD60A' },
    'settings': { name: 'Settings', icon: 'fa-cog', color: '#8E8E93' },
    'store': { name: 'App Store', icon: 'fa-layer-group', color: '#007AFF' },
    'browser': { name: 'Browser', icon: 'fa-globe', color: '#007AFF' },
    'music': { name: 'Music', icon: 'fa-music', color: '#FF2D55' },
    'files': { name: 'Files', icon: 'fa-folder', color: '#007AFF' },
    'health': { name: 'Health', icon: 'fa-heart', color: '#FF2D55' },
    'wallet': { name: 'Wallet', icon: 'fa-wallet', color: '#000' }
};

const defaultPages = [
    ['mail', 'cal', 'photos', 'weather', null, null, null, null, 'clock', 'notes', 'maps', 'settings', null, null, null, null, null, null, null, null],
    ['files', 'health', 'wallet', 'store', null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null]
];

const defaultDock = ['camera', 'browser', 'mail', 'music'];
const info = {
    news: {}
};

/*const info={
    'news': {
        1:{title: 'Latest News', content: 'Breaking news: New features added to Glass OS!', icon: 'fa-newspaper', url: '#', thumbnail: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=2670&auto=format&fit=crop'}, 
        2: {title: 'System Maintenance', content: 'Scheduled maintenance on June 15th.', icon: 'fa-wrench', url: '#', thumbnail: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=2670'}
    }
}*/
let savedState = JSON.parse(localStorage.getItem('glass_os_state_v2'));
let pages = savedState ? savedState.pages : JSON.parse(JSON.stringify(defaultPages));
let dock = savedState ? savedState.dock : JSON.parse(JSON.stringify(defaultDock));

let currentPage = 0;
let currentOpenFolder = null; // Stores {p, i} of current folder

function saveState() {
    localStorage.setItem('glass_os_state_v2', JSON.stringify({ pages, dock }));
}

let rows=window.getComputedStyle(document.body).getPropertyValue('--grid-rows');
let cols=window.getComputedStyle(document.body).getPropertyValue('--grid-cols');

grid=cols*rows