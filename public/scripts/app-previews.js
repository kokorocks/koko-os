let previewIdx=0;

function getOpenApp() {
    return document.querySelector('.all-apps.open');
}

const previewArea = document.getElementById('multiappspreviewarea');

function updateCenter() {
    if (!previewArea) return; // safety
    const cards = [...previewArea.querySelectorAll('.app-wrapper')];
    if (!cards.length) return;

    const centerX = previewArea.scrollLeft + previewArea.offsetWidth / 2;

    cards.forEach(card => {
        const boxCenter = card.offsetLeft + card.offsetWidth / 2;
        if (Math.abs(centerX - boxCenter) < card.offsetWidth / 2) {
            card.classList.add('centered');
        } else {
            card.classList.remove('centered');
        }
    });
}

// Call this AFTER the previews are rendered
function openAppPreviews() {
    previewOpen = true;

    // ... your code to close current app ...

    renderAppPreviews();

    // --- Scroll listener ---
    previewArea.addEventListener('scroll', () => requestAnimationFrame(updateCenter));

    // --- Highlight the first card immediately ---
    requestAnimationFrame(updateCenter);
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
    previewArea.style.zIndex = '499';
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
        previewOpen = false; // ✅ ALWAYS reset state
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
    
        // --- Clone iframe (preview) ---
        const previewClone = app.cloneNode(true);
        previewClone.id = '';
        previewClone.classList.remove('closed', 'closing', 'open');
        previewClone.classList.add('preview');
        previewClone.style.pointerEvents = 'none';
        wrapper.appendChild(previewClone);
    
        // --- Overlay to block interactions ---
        const overlay = document.createElement('div');
        overlay.style.position = 'absolute';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.pointerEvents = 'auto';
        wrapper.appendChild(overlay);
    
        // --- PREVIEW ICON (move on top) ---
        const icon = document.createElement('div');
        icon.className = 'preview-icon';
        icon.style.background = appDB[app.classList[0].toLowerCase()].color;
        colorScheme==='dark' ? icon.style.backgroundImage='linear-gradient(rgb(0, 0, 0), rgb(20, 20, 25))' : icon.style.backgroundImage='linear-gradient(rgb(255, 255, 255), rgb(248, 248, 248))';
        //colorScheme==='dark' ? icon.style.boxShadow=  '0 4px 10px rgba(0,0,0,0.5)' : icon.style.boxShadow='0 4px 10px rgba(0,0,0,0.2)';
        colorScheme==='dark' ? icon.style.color=  'white' : icon.style.color='black';
        icon.innerHTML = `<i class="fas ${appDB[app.classList[0].toLowerCase()].icon}"></i>`;
        if (appDB[app.classList[0].toLowerCase()].icon && appDB[app.classList[0].toLowerCase()].icon.startsWith('img:')) {
            const img = document.createElement('img');
            img.src = appDB[app.classList[0].toLowerCase()].icon.slice(4);
            img.style.width = '100%';
            img.style.height = '100%';
            icon.appendChild(img);
        } else {
            icon.innerHTML = `<i class="fas ${appDB[app.classList[0].toLowerCase()].icon}"></i>`;
        }
        icon.style.position = 'absolute';
        icon.style.top = '-25px'; // float above iframe
        icon.style.left = '50%';
        icon.style.transform = 'translateX(-50%)';
        icon.style.zIndex = '9999';
        icon.style.pointerEvents = 'none'; // allow clicks through
        wrapper.appendChild(icon);
    
        previewArea.appendChild(wrapper);
    
        // --- Click to open real app ---
        wrapper.addEventListener('click', (e) => {
            e.stopPropagation();
            const realApp = document.getElementsByClassName(app.classList[0])[0];
            if (!realApp) return;
        
            // Update previewIndex to bring to front
            app.previewIndex = ++previewIdx;
        
            realApp.id = 'appFrame';
            realApp.classList.remove('closed', 'closing');
            realApp.classList.add('open');
        
            closeAppPreviews();
        });

    makeDraggable(wrapper);
});

}

    previewArea.addEventListener('scroll', () => requestAnimationFrame(updateCenter));

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
        const CLOSE_THRESHOLD = -250;
        const OPEN_THRESHOLD = 40;

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



        function dragMove(e) {
            const y = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
            currentY = y - startY;
            if (Math.abs(currentY) > DRAG_THRESHOLD) dragged = true;
            if (currentY < 0){
            el.style.transform = `translateY(${currentY}px) scale(1.05)`;
            el.style.opacity = 1 - Math.abs(currentY) / 400;
        }else{

            el.style.transform = `translateY(${(currentY/8.5)-2.5 > 30 ? 30 :(currentY/8.5)-2.5}px) scale(${(1 + currentY / 1000) > 1.36 ? 1.36 : (1 + currentY / 1000)})`;
            //el.style.opacity = 1 - Math.abs(currentY) / 400;
        }
        }

        function dragEnd() {
            document.removeEventListener('mousemove', dragMove);
            document.removeEventListener('touchmove', dragMove);
            document.removeEventListener('mouseup', dragEnd);
            document.removeEventListener('touchend', dragEnd);

            if (currentY < CLOSE_THRESHOLD) {
                console.log('close app')
                closePreviewApp(el);
                return;
            }
            console.log(currentY)
            if (currentY > OPEN_THRESHOLD) {
                console.log('reopen app')
                console.log(el.querySelector('iframe').classList[0])
                openApp(el.querySelector('iframe').classList[0].toLowerCase(), null, false, 0, false);
                closeAppPreviews();
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