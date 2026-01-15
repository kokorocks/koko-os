/* =========================================
   2. RENDERING
   ========================================= */
const slider = document.getElementById('pagesSlider');
const dockEl = document.getElementById('dock');
const drawerList = document.getElementById('drawerList');
const dotsContainer = document.getElementById('dotsContainer');
let startX = 0;
let startY = 0;

function render() {
    // 1. Pages
    slider.innerHTML = '';
    pages.forEach((page, pageIdx) => {
        const pageDiv = document.createElement('div');
        pageDiv.className = 'page';
        // Source - https://stackoverflow.com/a
        // Ensure 20 slots (4x5 grid)
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

    // 2. Dock (Now Draggable!)
    dockEl.innerHTML = '';
    for (let i = 0; i < 4; i++) {
        const item = dock[i];
        const slot = document.createElement('div');
        slot.className = 'app-slot';
        slot.dataset.loc = 'dock';
        slot.dataset.i = i;
        
        if (item) {
            const icon = createIcon(item, true);
            slot.appendChild(icon);
            addDragEvents(slot);
        }
        dockEl.appendChild(slot);
    }

    // 3. Dots
    dotsContainer.innerHTML = '';
    pages.forEach((_, i) => {
        const d = document.createElement('div');
        d.className = `dot ${i === currentPage ? 'active' : ''}`;
        dotsContainer.appendChild(d);
    });
    
    // 4. Slide Position
    slider.style.transform = `translateX(-${currentPage * 100}%)`;
    // 5. Drawer
    drawerList.innerHTML = '';
    Object.keys(appDB).forEach(key => {
        const slot = document.createElement('div');
        slot.className = 'app-slot';
        
        const icon = createIcon(key);
        slot.appendChild(icon);
    
        // Start drag from drawer
        slot.addEventListener('mousedown', (e) => startDrawerDrag(e, key));
        slot.addEventListener('touchstart', (e) => startDrawerDrag(e, key), {passive:false});
    
        drawerList.appendChild(slot);
    });
}