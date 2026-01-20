const screen = document.getElementById('mainScreen');
const hammer = new Hammer(screen);

hammer.get('pan').set({
    direction: Hammer.DIRECTION_ALL,
    threshold: 5 
});

// ---------- CONFIG & STATE ----------
const SETTINGS_TRIGGER_ZONE = 0.10; // Top 10%
const DRAWER_TRIGGER_ZONE = 0.80;   // Bottom 15%
const PREVIEW_TRIGGER_ZONE = 0.92;  // Very bottom 5% (Home Bar area)
const FLICK_VELOCITY = 0.4;         

let activeGesture = null; 
let activeApp = null;
let rafPending = false;
let currentDeltaY = 0;

const shade = document.getElementById('notifShade');
const appDrawer = document.getElementById('appDrawer');
// Assuming infoPopup is defined globally elsewhere as in your previous snippets
const noAppOpen = () => !document.querySelector('#appFrame.open');
const isShadeOpen = () => shade.classList.contains('open');

// ---------- PAN START ----------
hammer.on('panstart', (e) => {
    if (isDragging) return; 

    const yRatio = e.center.y / window.innerHeight;
    const openApp = document.querySelector('#appFrame.open');

    activeGesture = null;
    activeApp = null;
    currentDeltaY = 0;

    // 1. CLOSE SHADE (If open)
    if (isShadeOpen()) {
        activeGesture = 'shade_close';
        shade.style.transition = 'none';
        return;
    }

    // 2. OPEN SHADE (Top)
    if (yRatio < SETTINGS_TRIGGER_ZONE && noAppOpen()) {
        activeGesture = 'shade_open';
        shade.style.transition = 'none';
        return;
    }
    
    // 3. APP GESTURES (Close App)
    if (openApp && yRatio > DRAWER_TRIGGER_ZONE) {
        activeGesture = 'app_close';
        activeApp = openApp;
        activeApp.classList.add('is-dragging');
        activeApp.style.transition = 'none';
        return;
    }

    // 4. HOME SCREEN BOTTOM GESTURES
    if (noAppOpen() && yRatio > DRAWER_TRIGGER_ZONE) {
        // If swipe starts at the very bottom edge, trigger Previews
        if (yRatio > PREVIEW_TRIGGER_ZONE) {
            activeGesture = 'preview_open';
        } else {
            activeGesture = 'drawer_open';
            appDrawer.style.transition = 'none';
        }
        return;
    }
});

hammer.on('swipeup', (e) => {
    alert('bruh')
    if(e.pointer===3){
        alert('screenshot')
    } else if (infoPopup.classList.contains('open')){
        infoPopup.classList.remove('open');
    }
})
// ---------- PAN MOVE ----------
hammer.on('panmove', (e) => {
    if (!activeGesture || isDragging) return;
    currentDeltaY = e.deltaY;

    if (!rafPending) {
        rafPending = true;
        requestAnimationFrame(handleDragFrame);
    }
});

// ---------- ANIMATION FRAME ----------
function handleDragFrame() {
    rafPending = false;
    const screenH = window.innerHeight;

    switch (activeGesture) {
        case 'shade_open':
            if (currentDeltaY < 0) currentDeltaY = 0;
            shade.style.transform = `translateY(calc(-100% + ${currentDeltaY}px))`;
            break;

        case 'shade_close':
            const safeDelta = Math.min(0, currentDeltaY); 
            shade.style.transform = `translateY(${safeDelta}px)`;
            break;

        case 'drawer_open':
            if (currentDeltaY > 0) currentDeltaY *= 0.2; 
            appDrawer.style.transform = `translateY(calc(100% + ${currentDeltaY}px))`;
            break;

        case 'preview_open':
            // Visual feedback: Shrink the home screen slightly as you pull up
            const previewProgress = Math.min(Math.abs(currentDeltaY) / 200, 1);
            const previewScale = 1 - (previewProgress * 0.05);
            screen.style.transform = `scale(${previewScale})`;
            screen.style.borderRadius = `${previewProgress * 30}px`;
            break;

        case 'app_close':
            if (currentDeltaY > 0) return;
            const progress = Math.min(Math.abs(currentDeltaY) / (screenH * 0.5), 1);
            const scale = 1 - (progress * 0.15);
            activeApp.style.transform = `translateY(${currentDeltaY * 0.5}px) scale(${scale})`; 
            break;
    }
}

// ---------- PAN END ----------
hammer.on('panend', (e) => {
    if (!activeGesture || isDragging) return;

    const velocity = e.velocityY;
    const distance = Math.abs(e.deltaY);
    const screenH = window.innerHeight;
    
    // Reset screen styles if they were modified by preview gesture
    screen.style.transition = 'all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1)';
    screen.style.transform = '';
    screen.style.borderRadius = '';

    shade.style.transition = 'transform 0.35s cubic-bezier(0.165, 0.84, 0.44, 1)';
    appDrawer.style.transition = 'transform 0.35s cubic-bezier(0.165, 0.84, 0.44, 1)';
    
    if (activeApp) {
        activeApp.style.transition = 'all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1)';
        activeApp.classList.remove('is-dragging');
    }

    switch (activeGesture) {
        case 'shade_open':
            if (distance > screenH * 0.3 || (velocity > FLICK_VELOCITY && e.deltaY > 0)) {
                shade.classList.add('open');
                shade.style.transform = 'translateY(0)';
            } else {
                shade.style.transform = 'translateY(-100%)';
            }
            break;

        case 'shade_close':
            if (distance > screenH * 0.2 || (velocity < -FLICK_VELOCITY && e.deltaY < 0)) {
                shade.classList.remove('open');
                shade.style.transform = 'translateY(-100%)';
            } else {
                shade.style.transform = 'translateY(0)';
            }
            break;

        case 'drawer_open':
            if ((distance > screenH * 0.2 && e.deltaY < 0) || velocity < -FLICK_VELOCITY) {
                infoPopup.classList.remove('open')
                appDrawer.classList.add('open');
                appDrawer.style.transform = 'translateY(0)';
            } else {
                appDrawer.style.transform = 'translateY(100%)';
            }
            break;

        case 'preview_open':
            // If swiped up enough, trigger the App Switcher
            if ((distance > 8) || velocity < -FLICK_VELOCITY) {
                if (typeof openAppPreviews === 'function') {
                    infoPopup.classList.remove('open')
                    openAppPreviews();
                }
            }
            break;

        case 'app_close':
            console.log('distance',distance)
            console.log('e.deltaY',e.deltaY)
            console.log('velocity',velocity)
            if ((distance > 250 && e.deltaY < 0) || velocity < -0.6) {
                closeApp(activeApp);
            } else if((distance > 100 && e.deltaY < 0) || velocity < 0){
                openAppPreviews();
                closeApp(activeApp);
            } else {
                resetAppStyles(activeApp);
            }
            break;
    }

    activeGesture = null;
    rafPending = false;
});

// (Keep your swipeleft/swiperight and helpers as they were)

// ---------- HORIZONTAL SWIPES (Home Pages) ----------
hammer.on('swipeleft swiperight', (e) => {
    
    if (activeGesture || isDragging || isShadeOpen()) return;
    
    // Prevent swipes if drawer is open
    //if (appDrawer.classList.contains('open')) return;

    if (e.type === 'swipeleft') {
        console.log('l')
        // Next Page
        if (currentPage < pages.length - 1 && !infoPopup.classList.contains('open') && noAppOpen()) {
            currentPage++;
            render();
        } else if (infoPopup.classList.contains('open') && noAppOpen()) {
            infoPopup.classList.remove('open');
        } else if(!noAppOpen()) {
            alert('forward')
        }
    } 
    else if (e.type === 'swiperight') {
        console.log('r')
        // Previous Page or Open News
        if (currentPage > 0 && noAppOpen() && !infoPopup.classList.contains('open')) {
            currentPage--;
            render();
        } else if (infoPopup.classList.contains('open') && noAppOpen()) {
            infoPopup.classList.remove('open');} else if (currentPage === 0 && !infoPopup.classList.contains('open') && noAppOpen()) {
            openInfo('news');
        } else if(!noAppOpen()) {
            alert('back')
        }
    }
});


// ---------- REUSED HELPERS ----------
function closeApp(app) {
    app.classList.remove('open');
    app.classList.add('closing');
    
    // Animate off screen
    app.style.transform = 'scale(0.8) translateY(20px)';
    app.style.opacity = '0';

    setTimeout(() => {
        app.classList.add('closed');
        app.classList.remove('closing');
        app.id = 'closed';
        resetAppStyles(app);
    }, 300);
}

function resetAppStyles(app) {
    app.style.transform = '';
    app.style.opacity = '';
    app.style.transition = '';
}