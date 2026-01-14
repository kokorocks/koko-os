const screen = document.getElementById('mainScreen');
const hammer = new Hammer(screen);

hammer.get('pan').set({
    direction: Hammer.DIRECTION_VERTICAL,
    threshold: 2
});

let activeApp = null;
let gestureActive = false;
let startTime = 0;
let lastDeltaY = 0;
let rafPending = false;

// ---------- PAN START ----------
hammer.on('panstart', (e) => {
    const openApp = document.querySelector('#appFrame.open');
    if (!openApp) return;

    // Only from bottom 10%
    if (e.center.y < window.innerHeight * 0.9) return;

    activeApp = openApp;
    gestureActive = true;
    startTime = performance.now();
    lastDeltaY = 0;

    activeApp.classList.add('is-dragging');
});

// ---------- PAN MOVE ----------
hammer.on('panmove', (e) => {
    if (!gestureActive || !activeApp) return;
    if (e.deltaY > 0) return; // only upward

    lastDeltaY = e.deltaY;

    if (!rafPending) {
        rafPending = true;
        requestAnimationFrame(updateDrag);
    }
});

function updateDrag() {
    rafPending = false;

    const absY = Math.abs(lastDeltaY);
    const progress = Math.min(absY / (window.innerHeight * 0.5), 1);

    const scale = 1 - progress * 0.2;
    const translateY = lastDeltaY * 0.4;
    //const radius = 46 + progress * 40;
    const opacity = 1 - progress * 0.3;

    activeApp.style.transform =
        `translateY(${translateY}px) scale(${scale})`;
    //activeApp.style.borderRadius = `${radius}px`;
    activeApp.style.opacity = opacity;
}

// ---------- PAN END ----------
hammer.on('panend', (e) => {
    if (!gestureActive || !activeApp) return;

    gestureActive = false;
    activeApp.classList.remove('is-dragging');

    const distance = Math.abs(e.deltaY);
    const velocity = e.velocityY;
    const duration = performance.now() - startTime;

    // HOLD → PREVIEWS
    if (
        distance > 90 &&
        duration > 280 &&
        Math.abs(velocity) < 0.45
    ) {
        resetAppStyles(activeApp);
        openAppPreviews?.();
    }
    // FLICK → CLOSE
    else if (velocity < -0.6 || distance > 260) {
        closeApp(activeApp);
    }
    // CANCEL
    else {
        resetAppStyles(activeApp);
    }
    activeApp.style.opacity = 1
    activeApp = null;
});

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
