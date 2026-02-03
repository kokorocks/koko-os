/* =========================================
   2. RENDERING
   ========================================= */

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
    for (let i = 0; i < 4; i++) {
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

    animateBackground(currentPage);

    /* ---------- Drawer ---------- */
    drawerList.innerHTML = '';
    Object.keys(appDB).forEach(key => {
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
