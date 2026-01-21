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
    let width = (currentPage+1)*document.querySelector('.screen-container').clientWidth>= cover.width? cover.width:(currentPage+1)*document.querySelector('.screen-container').clientWidth ;
    const maxOffsetX = Math.max(0, width - vw);

    // 🔑 distribute movement across all pages
    const progress = pageIndex / pageCount;
    const targetOffset = maxOffsetX * progress;

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

        for (let i = 0; i < grid; i++) {
            const item = page[i];
            const slot = document.createElement('div');

            slot.className = 'app-slot';
            slot.dataset.loc = 'page';
            slot.dataset.p = pageIdx;
            slot.dataset.i = i;

            if (item) {
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
