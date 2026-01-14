const screen = document.getElementById('mainScreen');
const hammer = new Hammer(screen);

hammer.get('pan').set({
    direction: Hammer.DIRECTION_ALL, // vertical + horizontal
    threshold: 2
});

// ---------- STATE ----------
let activeApp = null;
let gestureActive = false;
let startTime = 0;
let lastDeltaY = 0;
let rafPending = false;

// Quick Settings / App Drawer gestures
let shadeGesture = false;
let drawerGesture = false;
let shadeCloseGesture = false;
let previewGesture = false;

const shade = document.getElementById('notifShade');
const appDrawer = document.getElementById('appDrawer');
const PREVIEW_START = 0.92; // bottom 8%
const DRAWER_START  = 0.80; // above preview

function noAppOpen() {
    return !document.querySelector('#appFrame.open');
}

hammer.on('panstart', (e) => {
    const openApp = document.querySelector('#appFrame.open');
    const yRatio = e.center.y / window.innerHeight;

    // --- APP DRAG (only bottom-most zone) ---
    if (openApp && yRatio > PREVIEW_START && !shade.classList.contains('open')) {
        activeApp = openApp;
        gestureActive = true;
        startTime = performance.now();
        lastDeltaY = 0;
        activeApp.classList.add('is-dragging');
        return;
    }

    // --- PREVIEW (beats drawer) ---
    if (noAppOpen() && yRatio > PREVIEW_START && !shade.classList.contains('open') && !drawer.classList.contains('open') && !document.getElementById('infopopup').classList.contains('open')) {
        previewGesture = true;
        return;
    }

    // --- APP DRAWER ---
    if (noAppOpen() && yRatio > DRAWER_START && !shade.classList.contains('open')) {
        drawerGesture = true;
        return;
    }

    // --- QUICK SETTINGS ---
    if (yRatio < 0.15) {
        shadeGesture = true;
        return;
    }

    // --- CLOSE SHADE ---
    if (shade.classList.contains('open') && yRatio > DRAWER_START) {
        shadeCloseGesture = true;
    }
});


// ---------- PAN MOVE ----------
hammer.on('panmove', (e) => {
    // --- App Drag ---
    if (gestureActive && activeApp) {
        // Only track upward dragging to close
        if (e.deltaY > 0) return;

        lastDeltaY = e.deltaY;

        if (!rafPending) {
            rafPending = true;
            requestAnimationFrame(updateDrag);
        }
        return;
    }

    // --- Quick Settings ---
    if (shadeGesture) {
        if (e.deltaY < 0) return; // only pull down
        const progress = Math.min(e.deltaY / (window.innerHeight * 0.35), 1);
        shade.style.transform = `translateY(${(-100 + progress * 100)}%)`;
        return;
    }

    if (shadeCloseGesture) {
        if (e.deltaY > 0) return; // only pull up
        const progress = Math.min(Math.abs(e.deltaY) / (window.innerHeight * 0.35), 1);
        shade.style.transform = `translateY(${(100 - progress * 100)}%)`;
        return;
    }

    // --- App Drawer ---
    if (drawerGesture) {
        if (e.deltaY > 0) return; // only pull up
        const progress = Math.min(Math.abs(e.deltaY) / (window.innerHeight * 0.35), 1);
        appDrawer.style.transform = `translateY(${100 - progress * 100}%)`;
        return;
    }
});

// ---------- PAN END ----------
hammer.on('panend', (e) => {
    
    // --- APP DRAG END ---
    if (gestureActive && activeApp) {
        gestureActive = false;
        activeApp.classList.remove('is-dragging');

        const velocity = e.velocityY;
        const distance = Math.abs(e.deltaY);

        if (velocity < -0.6 || distance > 120) {
            closeApp(activeApp);
        } else {
            resetAppStyles(activeApp);
        }

        activeApp.style.opacity = 1;
        activeApp = null;
        return;
    }

    // --- PREVIEW ---
    if (previewGesture) {
        if(document.getElementById('infopopup').classList.contains('open')){ document.getElementById('infopopup').classList.remove('open'); return}
        previewGesture = false;

        if (Math.abs(e.deltaY) > 80) {
            openAppPreviews?.();
        }
        return;
    }

    // --- SHADE OPEN ---
    if (shadeGesture) {
        shadeGesture = false;
        if (e.deltaY > 120) shade.classList.add('open');
        shade.style.transform = '';
        return;
    }

    // --- SHADE CLOSE ---
    if (shadeCloseGesture) {
      //if(document.getElementById('infopopup').classList.contains('open')){ document.getElementById('infopopup').classList.remove('open'); return;}
        shadeCloseGesture = false;
        if (Math.abs(e.deltaY) > 120) shade.classList.remove('open');
        shade.style.transform = '';
        return;
    }

    // --- DRAWER ---
    if (drawerGesture) {
      if(document.getElementById('infopopup').classList.contains('open')){ document.getElementById('infopopup').classList.remove('open'); return}
        drawerGesture = false;
        if (Math.abs(e.deltaY) > 120) appDrawer.classList.add('open');
        appDrawer.style.transform = '';
    }
});


// ---------- DRAG UPDATE ----------
function updateDrag() {
    rafPending = false;

    const absY = Math.abs(lastDeltaY);
    const progress = Math.min(absY / (window.innerHeight * 0.5), 1);

    const scale = 1 - progress * 0.2;
    const translateY = lastDeltaY * 0.4;
    const opacity = 1 - progress * 0.3;

    activeApp.style.transform = `translateY(${translateY}px) scale(${scale})`;
    activeApp.style.opacity = opacity;
}

// ---------- HELPERS ----------
function closeApp(app) {
    app.style.transform = 'translateY(-100vh) scale(0.5)';
    app.style.opacity = '0';

    app.classList.remove('open');
    app.classList.add('closing');

    setTimeout(() => {
        app.classList.add('closed');
        app.id = 'closed';
        resetAppStyles(app);
    }, 350);
}

function resetAppStyles(app) {
    app.style.transform = '';
    app.style.borderRadius = '';
    app.style.opacity = '';

    setTimeout(() => {
        app.classList.remove('snap-back');
    }, 300);
}

// ---------- HORIZONTAL SWIPE FOR PAGES ----------
hammer.on('swipeleft swiperight', (e) => {
    if (getOpenApp() || Math.abs(e.deltaY) > Math.abs(e.deltaX)) return;

    if (e.type === 'swipeleft' && currentPage < pages.length - 1 && !infoPopup.classList.contains('open')) {
        currentPage++;
        render();
    } else if (infoPopup.classList.contains('open')) {
        infoPopup.classList.remove('open');
    } else if (e.type === 'swiperight') {
        if (currentPage > 0) {
            currentPage--;
            render();
        } else {
            openInfo('news');
        }
    }
});
