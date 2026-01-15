let previewIdx=0;

function getOpenApp() {
    return document.querySelector('.all-apps.open');
}

function openAppPreviews() {
    previewOpen=true
    const currentApp = document.getElementById('appFrame');
    //currentApp.previewIndex=previewIdx
    //previewIdx++
    if (currentApp) {
        // Close current app smoothly
        currentApp.classList.remove('open');
        currentApp.classList.add('closing');
        setTimeout(() => {
            if (currentApp) {
                currentApp.classList.remove('closing');
                currentApp.classList.add('closed');
                currentApp.id = 'closed';
                renderAppPreviews(); // re-render previews after closing
            }
        }, 350);
    }

    const multiApps = document.getElementById('multiappsarea');
    const previewArea = document.getElementById('multiappspreviewarea');

    // Show preview overlay
    previewArea.style.display = 'flex';
    previewArea.style.opacity = '1';
    previewArea.style.pointerEvents = 'all';
    previewArea.style.zIndex = '1000';
    previewArea.classList.add('open');

    // Clicking outside closes overlay
    previewArea.addEventListener('click', (e) => {
        if (e.target === previewArea) closeAppPreviews();
    });

    function closeAppPreviews() {
        previewArea.style.opacity = '0';
        previewArea.style.pointerEvents = 'none';
        previewArea.style.zIndex = '-1';
        previewArea.classList.remove('open');
        previewArea.innerHTML = '';
    }

/*function openAppPreviews() {
    const currentApp = document.getElementById('appFrame');
    if (currentApp) {
        currentApp.classList.remove('open');
        currentApp.classList.add('closing');

        // Update the previewIndex so it is the most recent
        currentApp.previewIndex = Date.now();

        setTimeout(() => {
            if (currentApp) {
                currentApp.classList.remove('closing');
                currentApp.classList.add('closed');
                currentApp.id = 'closed';
                renderAppPreviews(); // render AFTER closing animation
            }
        }, 350);
    }

    const previewArea = document.getElementById('multiappspreviewarea');
    previewArea.style.display = 'flex';
    previewArea.style.opacity = '1';
    previewArea.style.pointerEvents = 'all';
    previewArea.style.zIndex = '1000';
    previewArea.classList.add('open');

    // Clicking outside closes
    previewArea.addEventListener('click', (e) => {
        if (e.target === previewArea) closeAppPreviews();
    });
}*/

function renderAppPreviews() {
    const multiApps = document.getElementById('multiappsarea');
    const previewArea = document.getElementById('multiappspreviewarea');

    const openApps = Array.from(multiApps.querySelectorAll('.all-apps'));

    // Assign default previewIndex if missing
    openApps.forEach((app, idx) => {
        if (!app.previewIndex) app.previewIndex = 0;
    });

    // Sort BEFORE appending to DOM to prevent flicker
    openApps.sort((a, b) => (b.previewIndex || 0) - (a.previewIndex || 0));
    //openApps.reverse()

    previewArea.innerHTML = ''; 
    let centerThisApp = true;

    openApps.forEach((app, i) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'app-wrapper';
        if (centerThisApp) {
            wrapper.classList.add('centered');
            centerThisApp = false;
        }

        // Icon
        const appId = app.classList[0].toLowerCase();
        const appData = appDB[appId];
        const icon = document.createElement('div');
        icon.className = 'preview-icon';
        icon.style.background = appData.color.includes('gradient')
            ? appData.color
            : appData.color;
        icon.innerHTML = `<i class="fas ${appData.icon}"></i>`;
        wrapper.appendChild(icon);

        // Clone iframe but make non-interactive
        const previewClone = app.cloneNode(true);
        previewClone.id = '';
        previewClone.classList.remove('closed', 'closing', 'open');
        previewClone.classList.add('preview');
        previewClone.style.pointerEvents = 'none';
        wrapper.appendChild(previewClone);

        // Overlay to block interactions
        const overlay = document.createElement('div');
        overlay.style.position = 'absolute';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.pointerEvents = 'auto';
        //overlay.style.pointerEvents = 'none'; // allow clicks to pass through
        wrapper.appendChild(overlay);

        previewArea.appendChild(wrapper);

        // After app clones and wrapper creation
wrapper.addEventListener('click', (e) => {
    e.stopPropagation();
    //alert('f')
    console.log(appId)
    const realApp = document.getElementsByClassName(app.classList[0])[0];
    if (!realApp) return;

    // Update previewIndex to bring to front
    app.previewIdx = previewIdx;
    previewIdx++

    realApp.id = 'appFrame';
    realApp.classList.remove('closed', 'closing');
    realApp.classList.add('open');

    closeAppPreviews();
});

// Now attach updateCenter globally
function updateCenter() {
    const cards = [...previewArea.querySelectorAll('.app-wrapper')];
    const centerX = previewArea.scrollLeft + previewArea.offsetWidth / 2;

    cards.forEach(card => {
        const boxCenter = card.offsetLeft + card.offsetWidth / 2;
        if (Math.abs(centerX - boxCenter) < 60) {
            card.classList.add('centered');
        } else {
            card.classList.remove('centered');
        }
    });
}

previewArea.addEventListener('scroll', () => requestAnimationFrame(updateCenter));


        makeDraggable(wrapper);
    });
}

    //previewArea.addEventListener('scroll', () => requestAnimationFrame(updateCenter));

    function closePreviewApp(wrapper) {
        const iframe = wrapper.querySelector('iframe');
        if (!iframe) return;

        const appClass = iframe.classList[0];
        const realApp = document.querySelector(`.${appClass}`);
        if (realApp) realApp.remove(); // 🔥 delete the real app

        wrapper.style.transition = 'transform 0.25s ease, opacity 0.25s ease';
        wrapper.style.transform = 'translateY(-200px) scale(0.9)';
        wrapper.style.opacity = '0';

        setTimeout(() => {
            wrapper.remove();
            checkIfNoAppsLeft();
            previewOpen=false
        }, 250);
    }

    function checkIfNoAppsLeft() {
        if (previewArea.querySelectorAll('.app-wrapper').length === 0) {
            closeAppPreviews();
        }
    }

    function makeDraggable(el) {
        let startY = 0, currentY = 0, dragged = false;
        const DRAG_THRESHOLD = 8;
        const CLOSE_THRESHOLD = 500;

        el.addEventListener('mousedown', dragStart);
        el.addEventListener('touchstart', dragStart, { passive: true });

        function dragStart(e) {
            dragged = false;
            startY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
            document.addEventListener('mousemove', dragMove);
            document.addEventListener('touchmove', dragMove, { passive: false });
            document.addEventListener('mouseup', dragEnd);
            document.addEventListener('touchend', dragEnd);
        }

        /*function updateCenter() {
    const cards = [...previewArea.querySelectorAll('.app-wrapper')];
    const centerX = previewArea.scrollLeft + previewArea.offsetWidth / 2;

    cards.forEach(card => {
        const boxCenter = card.offsetLeft + card.offsetWidth / 2;
        if (Math.abs(centerX - boxCenter) < 60) {
            card.classList.add('centered');
        } else {
            card.classList.remove('centered');
        }
    });
}*/

        function dragMove(e) {
            const y = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
            currentY = y - startY;
            if (Math.abs(currentY) > DRAG_THRESHOLD) dragged = true;
            el.style.transform = `translateY(${currentY}px) scale(1.05)`;
            el.style.opacity = 1 - Math.abs(currentY) / 400;
        }

        function dragEnd() {
            document.removeEventListener('mousemove', dragMove);
            document.removeEventListener('touchmove', dragMove);
            document.removeEventListener('mouseup', dragEnd);
            document.removeEventListener('touchend', dragEnd);

            if (Math.abs(currentY) > CLOSE_THRESHOLD) {
                closePreviewApp(el);
                return;
            }

            el.style.transition = 'transform 0.23s cubic-bezier(0.25,0.10,0.24,1.45), opacity 0.2s ease';
            el.style.transform = '';
            el.style.opacity = '';
            setTimeout(() => el.style.transition = '', 200);
        }

        // Block clicks immediately after dragging
        el.addEventListener('click', (e) => {
            if (dragged) {
                e.stopImmediatePropagation();
                e.preventDefault();
            }
        }, true);
    }

    renderAppPreviews();
    updateCenter(); // highlight the first app initially

}