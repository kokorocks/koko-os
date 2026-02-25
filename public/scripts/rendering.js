/* =========================================
   2. RENDERING
   ========================================= */

/**
 * RENDERING OPTIMIZATION STRATEGY:
 * 
 * This file implements efficient rendering by splitting operations into two categories:
 * 
 * 1. LAYOUT CHANGES (use render()):
 *    - Dragging/dropping apps
 *    - Adding/removing items
 *    - Creating folders
 *    - Adding widgets
 *    - Any change to page structure
 *    
 * 2. VIEW-ONLY CHANGES (use updatePageView()):
 *    - Changing pages (most common user interaction)
 *    - Swiping between pages
 *    - Clicking page dots
 *    - Scrolling through pages during app usage
 *    
 * This approach prevents expensive DOM rebuilds during smooth page transitions,
 * eliminating flickering and reducing CPU/memory usage significantly.
 * Animations still work perfectly while widgets/apps stay loaded in background pages.
 */

const slider = document.getElementById('pagesSlider');
const dockEl = document.getElementById('dock');
const drawerList = document.getElementById('drawerList');
const dotsContainer = document.getElementById('dotsContainer');
const screenEl = document.querySelector('.screen-container');
const PAGE_ANIM_DURATION = 300;
const PAGE_EASING = ' cubic-bezier(0.25, 1, 0.5, 1)';

let lastBgOffset = 0;
let bgAnim = null;

let startX = 0;
let startY = 0;

/* =========================================
   BACKGROUND IMAGE HANDLING
   ========================================= */

const bgImage = {
    width: 0,
    height: 0,
    loaded: false
};

function getPageCount() {
    return pages.length;
}

const pageEls = []; // cache page divs
const dotEls = []; // cache dot divs

function initRender() {
    // ---------- Pages ----------
    slider.innerHTML = '';
    pages.forEach((page, pageIdx) => {
        const pageDiv = document.createElement('div');
        pageDiv.className = 'page';
        pageDiv.dataset.index = pageIdx;

        const occupiedCells = new Set();

        for (let i = 0; i < grid; i++) {
            if (occupiedCells.has(i)) continue;
            
            //const item = page[i];
            if (item?.requiresDev && !isDev) continue;
            const slot = document.createElement('div');
            slot.className = 'app-slot';
            slot.dataset.loc = 'page';
            slot.dataset.p = pageIdx;
            slot.dataset.i = i;

            if (item) {
                if (typeof item === 'object' && item.type === 'widget') {
                    const width = item.width || 1;
                    const height = item.height || 1;
                    const cols = Math.sqrt(grid);

                    const currentCol = i % cols;
                    const currentRow = Math.floor(i / cols);

                    for (let h = 0; h < height; h++)
                        for (let w = 0; w < width; w++) {
                            const cellIdx = (currentRow + h) * cols + (currentCol + w);
                            if (cellIdx < grid) occupiedCells.add(cellIdx);
                        }

                    slot.style.gridColumn = `span ${width}`;
                    slot.style.gridRow = `span ${height}`;
                }
                slot.appendChild(createIcon(item));
                addDragEvents(slot);
            }

            pageDiv.appendChild(slot);
        }

        slider.appendChild(pageDiv);
        pageEls.push(pageDiv);
    });

    // ---------- Dock ----------
    dockEl.innerHTML = '';
    for (let i = 0; i < 5; i++) {
        const item = dock[i];
        const slot = document.createElement('div');
        slot.className = 'app-slot dock-app-slot';
        slot.dataset.loc = 'dock';
        slot.dataset.i = i;

        if (item) {
            slot.appendChild(createIcon(item, true));
            addDragEvents(slot);
        }

        dockEl.appendChild(slot);
    }

    // ---------- Dots ----------
    dotsContainer.innerHTML = '';
    pages.forEach((_, i) => {
        const d = document.createElement('div');
        d.className = `dot ${i === currentPage ? 'active' : ''}`;
        dotsContainer.appendChild(d);
        dotEls.push(d);
    });

    // ---------- Drawer ----------
    drawerList.innerHTML = '';
    Object.keys(appDB).forEach(key => {
        if (key.requiresDev && !isDev) return
        const slot = document.createElement('div');
        slot.className = 'app-slot app-drawer';
        slot.setAttribute('draggable', 'true');
        slot.dataset.loc = 'drawer';
        slot.dataset.key = key;

        const icon = createIcon(key);
        icon.querySelector('.app-icon').dataset.key = key;

        slot.appendChild(icon);
        addDragEvents(slot);
        drawerList.appendChild(slot);
    });

    // ---------- Bottom menu ----------
    const bottomMenu = document.querySelector('.bottom-menu');
    bottomMenu.innerHTML = '';
    Object.keys(appDB).forEach(key => {
        if (key.requiresDev && !isDev) return
        const slot = document.createElement('div');
        slot.className = 'app-slot';
        slot.dataset.loc = 'split-view';
        slot.dataset.key = key;

        const icon = createIcon(key);
        icon.querySelector('.app-icon').dataset.key = key;

        slot.appendChild(icon);
        bottomMenu.appendChild(slot);
    });

    // Apply initial positions
    slider.style.transition = 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)';
    slider.style.transform = `translateX(-${currentPage * 100}%)`;
    if (backgroundMove) animateBackground(currentPage);
}

let bgCoverWidth = 0;
let bgCoverHeight = 0;
let pixelsPerPage = 0;

function initBackground() {
    const bg = getComputedStyle(screenEl).backgroundImage;
    const match = /url\(["']?(.*?)["']?\)/.exec(bg);
    if (!match) return;

    const img = new Image();
    img.onload = () => {
        const vw = screenEl.clientWidth;
        const vh = screenEl.clientHeight;

        // compute scale to cover screen
        const scale = Math.max(vw / img.naturalWidth, vh / img.naturalHeight);
        bgCoverWidth = img.naturalWidth * scale;
        bgCoverHeight = img.naturalHeight * scale;

        const maxIndex = Math.max(1, pages.length - 1);
        const bgExtra = Math.max(0, bgCoverWidth - vw);
        pixelsPerPage = bgExtra / maxIndex;

        // apply initial background
        bgLayer.style.backgroundImage = `url(${match[1]})`;
        bgLayer.style.width = `${bgCoverWidth}px`;
        bgLayer.style.height = `${bgCoverHeight}px`;
        bgLayer.style.transform = `translateX(0px)`;
    };
    img.src = match[1];
}


/* =========================================
   LIGHTWEIGHT PAGE VIEW UPDATE
   Updates only what's necessary when changing pages
   ========================================= */

function updatePageView(page) {
    // Only update: slider position, background, and dots
    // Does NOT re-render apps/widgets/dock/drawer
    
    currentPage = page;
    
    // Update slider position
    slider.style.transition = `transform ${PAGE_ANIM_DURATION}ms${PAGE_EASING}`;
    slider.style.transform = `translateX(-${page * 100}%)`;
    
    // Animate background
    if (backgroundMove) animateBackground(page);
    
    // Update dot indicators (only)
    dotEls.forEach((dot, idx) => {
        dot.classList.toggle('active', idx === page);
    });
    
    screenEl.style.pointerEvents = 'none';
    setTimeout(() => {
        screenEl.style.pointerEvents = '';
    }, PAGE_ANIM_DURATION);
}

function switchPage(page) {
    updatePageView(page);
}




function loadBackgroundImageSize(element, cb) {
    const bg = getComputedStyle(element).backgroundImage;
    const match = /url\(["']?(.*?)["']?\)/.exec(bg);
    if (!match) return;

    const img = new Image();
    img.onload = () => {
        bgImage.width = img.naturalWidth;
        bgImage.height = img.naturalHeight;
        bgImage.loaded = true;
        cb?.();
    };
    img.src = match[1];
}

function getCoverSize(imgW, imgH, viewW, viewH) {
    const scale = Math.max(viewW / imgW, viewH / imgH);
    return {
        width: imgW * scale,
        height: imgH * scale
    };
}

function animateBackground(pageIndex) {
    if (!bgImage.loaded) return;

    const pageCount = Math.max(1, getPageCount() - 1);

    const vw = screenEl.clientWidth;
    const vh = screenEl.clientHeight;

    const cover = getCoverSize(
        bgImage.width,
        bgImage.height,
        vw,
        vh
    );
    const maxIndex = Math.max(1, getPageCount() - 1);

    // how much background CAN scroll
    const bgExtra = Math.max(0, cover.width - vw);
    
    // how much scrolling pages WANT
    const pageScrollWidth = maxIndex * vw;
    
    // final allowed background travel
    const totalTravel = Math.min(bgExtra, pageScrollWidth);
    
    // pixels per page
    const pixelsPerPage = totalTravel / maxIndex;
    
    // final offset
    const targetOffset = pageIndex * pixelsPerPage;
    //render()

    screenEl.style.backgroundSize =
        `${cover.width}px ${cover.height}px`;

    if (bgAnim) bgAnim.cancel();

    bgAnim = screenEl.animate(
        [
            { backgroundPosition: `-${lastBgOffset}px center` },
            { backgroundPosition: `-${targetOffset}px center` }
        ],
        {
            duration: PAGE_ANIM_DURATION,
            easing: PAGE_EASING,
            fill: 'forwards'
        }
    );

    lastBgOffset = targetOffset;
}



/* =========================================
   RENDER FUNCTION
   ========================================= */

function render() {

    /* ---------- Pages ---------- */
    slider.innerHTML = '';
    pages.forEach((page, pageIdx) => {
        const pageDiv = document.createElement('div');
        pageDiv.className = 'page';

        // Track which cells are occupied by multi-cell widgets
        const occupiedCells = new Set();

        for (let i = 0; i < grid; i++) {
            // Skip cells covered by multi-cell widgets
            if (occupiedCells.has(i)) {
                continue;
            }

            const item = page[i];
            const slot = document.createElement('div');

            slot.className = 'app-slot';
            slot.dataset.loc = 'page';
            slot.dataset.p = pageIdx;
            slot.dataset.i = i;

            if (item) {
                // Check if item is a multi-cell widget
                if (typeof item === 'object' && item.type === 'widget') {
                    const width = item.width || 1;
                    const height = item.height || 1;
                    const cols = Math.sqrt(grid); // assuming square grid (e.g., 4x5)
                    
                    // Mark occupied cells
                    const currentCol = i % cols;
                    const currentRow = Math.floor(i / cols);
                    
                    for (let h = 0; h < height; h++) {
                        for (let w = 0; w < width; w++) {
                            const cellIdx = (currentRow + h) * cols + (currentCol + w);
                            if (cellIdx < grid) {
                                occupiedCells.add(cellIdx);
                            }
                        }
                    }
                    
                    slot.style.gridColumn = `span ${width}`;
                    slot.style.gridRow = `span ${height}`;
                }

                slot.appendChild(createIcon(item));
                addDragEvents(slot);
            }

            pageDiv.appendChild(slot);
        }

        slider.appendChild(pageDiv);
    });

    /* ---------- Dock ---------- */
    dockEl.innerHTML = '';
    for (let i = 0; i < 5; i++) { // REMEMBER: dock size is found here
        const item = dock[i];
        const slot = document.createElement('div');

        slot.className = 'app-slot dock-app-slot';
        slot.dataset.loc = 'dock';
        slot.dataset.i = i;

        if (item) {
            slot.appendChild(createIcon(item, true));
            addDragEvents(slot);
        }

        dockEl.appendChild(slot);
    }

    /* ---------- Dots ---------- */
    dotsContainer.innerHTML = '';
    pages.forEach((_, i) => {
        const d = document.createElement('div');
        d.className = `dot ${i === currentPage ? 'active' : ''}`;
        dotsContainer.appendChild(d);
    });

    /* ---------- Page Slide ---------- */
    
    slider.style.transform =
        `translateX(-${currentPage * 100}%)`;

    if (backgroundMove) animateBackground(currentPage);

    /* ---------- Drawer ---------- */
    drawerList.innerHTML = '';
    Object.keys(appDB).forEach(key => {
        //console.log(appDB[key].requiresDev)
        if (appDB[key].requiresDev && !isDev) return;
        const slot = document.createElement('div');

        slot.className = 'app-slot app-drawer';
        slot.setAttribute('draggable', 'true');
        slot.dataset.loc = 'drawer';
        slot.dataset.key = key;

        const icon = createIcon(key);
        icon.querySelector('.app-icon').dataset.key = key;

        slot.appendChild(icon);
        addDragEvents(slot);

        drawerList.appendChild(slot);
    });

    //drawerList.innerHTML = '';
    document.querySelector('.bottom-menu')
    Object.keys(appDB).forEach(key => {
        const slot = document.createElement('div');
        //const slot = document.querySelector('.bottom-menu')

        slot.className = 'app-slot';
        //slot.setAttribute('draggable', 'true');
        slot.dataset.loc = 'split-view';
        slot.dataset.key = key;

        const icon = createIcon(key);
        icon.querySelector('.app-icon').dataset.key = key;

        slot.appendChild(icon);
        //addDragEvents(slot);

        document.querySelector('.bottom-menu').appendChild(slot);
    });
    
}

/* =========================================
   INIT
   ========================================= */

loadBackgroundImageSize(screenEl, () => {
    animateBackground(currentPage);
});

window.addEventListener('resize', () => {
    animateBackground(currentPage);
});

document.getElementById('dotsContainer').addEventListener('click', e => {
    if (e.target.classList.contains('dot')) {
        const index = Array.from(dotEls).indexOf(e.target);
        if (index !== -1) {
            updatePageView(index);
        }
    }
});