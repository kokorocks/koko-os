isDragging = false;
let dragTimer = null;
let dragGhost = null;
let dragSrc = null; // { loc, p, i }
let overDeleteZone = false;
const HOLD_DELAY = 500;   // ms (iOS-like)
const MOVE_THRESHOLD = 60; // px
let pressTimer = null;
let pendingSlot = null;

// At the top of your file
//let dock = JSON.parse(localStorage.getItem('dock')) || [null, null, null, null];

// Source - https://stackoverflow.com/a
// Posted by Eugene Lazutkin, modified by community. See post 'Timeline' for change history
// Retrieved 2026-01-15, License - CC BY-SA 4.0

const DELETE_ZONE_HEIGHT = 50; // px from top
const deleteZone = document.getElementById('delete-zone');

function fits(item, x, y, page, items, cols, rows) {
    if (x < 0 || y < 0 || x + item.w > cols || y + item.h > rows) {
        return false;
    }

    return !items.some(o =>
        o.page === page &&
        o.id !== item.id &&
        x < o.x + o.w &&
        x + item.w > o.x &&
        y < o.y + o.h &&
        y + item.h > o.y
    );
}


function onDragIntent(e, slot) {
    e.preventDefault();          // 🔥 KILLS native drag
    e.dataTransfer.setData('text/plain', '');
    e.stopPropagation();

    // Kill native ghost
    const img = new Image();
    img.src = '';
    e.dataTransfer.setDragImage(img, 0, 0);

    // Now switch to your system
    isDragging = true;

    slot.draggable = false; // disable native dragging AFTER start

    appDrawer.classList.remove('open');
    appDrawer.style.transform = 'translateY(100%)';

    dragSrc = {
        loc: 'drawer',
        key: slot.dataset.key
    };

    const rect = slot.getBoundingClientRect();
    dragGhost = slot.cloneNode(true);
    dragGhost.className = 'dragging-clone';
    dragGhost.style.width = rect.width + 'px';
    dragGhost.style.height = rect.height + 'px';
    dragGhost.style.position = 'fixed';
    dragGhost.style.pointerEvents = 'none';
    dragGhost.style.zIndex = '9999';


    const label = dragGhost.querySelector('.app-name');
    if (label) label.style.display = 'none';

    document.body.appendChild(dragGhost);

    // From now on, ignore drag events
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
}


function startDrawerDrag(e, appKey) {
    //e.preventDefault();
    if (isDragging) return;
    

    // Close the drawer immediately
    document.getElementById('appDrawer').style.transform='translateY(100%)'
    appDrawer.classList.remove('open');

    // Fake dragSrc to behave like page app
    dragSrc = {
        loc: 'drawer', // special case
        key: appKey
    };

    // Create dragging ghost
    const rect = e.currentTarget.getBoundingClientRect();
    dragGhost = e.currentTarget.cloneNode(true);
    dragGhost.className = 'dragging-clone';
    dragGhost.style.width = rect.width + 'px';
    dragGhost.style.height = rect.height + 'px';
    dragGhost.style.position = 'fixed';
dragGhost.style.pointerEvents = 'none';
dragGhost.style.zIndex = '9999';


    const label = dragGhost.querySelector('.app-name');
    if (label) label.style.display = 'none';

    updateGhostPosition(e);
    document.body.appendChild(dragGhost);
    isDragging = true;

    if (e.type === 'mousedown') {
        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleEnd);
    }
}

function addDragEvents(slot) {
    if(!slot.classList.contains('app-drawer')){
        slot.addEventListener('touchstart', (e) => handleStart(e, slot), {passive:false});
        slot.addEventListener('touchmove', handleMove, {passive:false});
        slot.addEventListener('touchend', handleEnd);
        slot.addEventListener('mousedown', (e) => handleStart(e, slot));
    } else {
        console.log('here')
        slot.ondragstart=(e)=>onDragIntent(e, slot)
        slot.addEventListener('touchmove', handleMove, {passive:false});
        slot.addEventListener('touchend', handleEnd);
    }
}
    
function cleanupEmptyPages() {
    // Never remove the last remaining page
    for (let i = pages.length - 1; i >= 0; i--) {
        const page = pages[i];
        const hasApps = page.some(item => item !== null);
        if (!hasApps && pages.length > 1) {
            pages.splice(i, 1);
            
            // Fix currentPage if needed
            if (currentPage >= pages.length) {
                currentPage = pages.length - 1;
            }
        }
    }
}

cleanupEmptyPages()

function beginDrag(e, slot) {
    if (e.cancelable) e.preventDefault();

    if (!pendingSlot) return;

    isDragging = true;
    pendingSlot = null;

    if (navigator.vibrate) navigator.vibrate(30);

    const loc = slot.dataset.loc;
    const p = slot.dataset.p ? parseInt(slot.dataset.p) : 0;
    const i = parseInt(slot.dataset.i);
    dragSrc = { loc, p, i };

    const rect = slot.getBoundingClientRect();
    dragGhost = slot.cloneNode(true);
    dragGhost.className = 'dragging-clone';
    dragGhost.style.width = rect.width + 'px';
    dragGhost.style.height = rect.height + 'px';
    dragGhost.style.position = 'fixed';
    dragGhost.style.pointerEvents = 'none';
    dragGhost.style.zIndex = '9999';
    dragGhost.style.left = '-9999px';
    dragGhost.style.top = '-9999px';

    const label = dragGhost.querySelector('.app-name');
    if (label) label.style.display = 'none';

    updateGhostPosition(e);
    document.body.appendChild(dragGhost);
    slot.style.opacity = '0';

}


function handleStart(e, slot) {
    //if (e.cancelable) e.preventDefault();

    startX = e.touches ? e.touches[0].clientX : e.clientX;
    startY = e.touches ? e.touches[0].clientY : e.clientY;

    pendingSlot = slot;
    isDragging = false;

    // Start intent timer
    pressTimer = setTimeout(() => {
        beginDrag(e, slot);
    }, HOLD_DELAY);

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleEnd);
}


//const topGuard = document.getElementById('top-guard');
//const bottomGuard = document.getElementById('bottom-guard');

function handleMove(e) {
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    const y = e.touches ? e.touches[0].clientY : e.clientY;

    // BEFORE drag starts → check intent
    if (!isDragging) {
        const dx = Math.abs(x - startX);
        const dy = Math.abs(y - startY);

        if (dx > MOVE_THRESHOLD || dy > MOVE_THRESHOLD) {
            clearTimeout(pressTimer);
            pendingSlot = null; // treat as scroll / tap
        }
        return;
    }

    if (e.cancelable) e.preventDefault();
    updateGhostPosition(e);

    if (dragSrc.loc === 'folder' && folderModal.classList.contains('open')) {
        const folderPager = document.getElementById('folderPager');
        if (folderPager) {
            const folderRect = folderPager.getBoundingClientRect();
            const x = e.touches ? e.touches[0].clientX : e.clientX;
            const y = e.touches ? e.touches[0].clientY : e.clientY;
            // If dragged outside the folder box, close modal
            if (x < folderRect.left || x > folderRect.right || y < folderRect.top || y > folderRect.bottom) {
                folderModal.classList.remove('open');
            }
        }
    }
}

    function cancelDrag() {
        clearTimeout(dragTimer);
        dragTimer = null;
        isDragging = false;
    }

    let lastEdgeSwitchTime = 0;
    const EDGE_MARGIN = 40;

    function updateGhostPosition(e) {
        const x = e.touches ? e.touches[0].clientX : e.clientX;
        const y = e.touches ? e.touches[0].clientY : e.clientY;

        if (dragGhost) {
            dragGhost.style.left = (x - dragGhost.offsetWidth / 3) + 'px';
            dragGhost.style.top = (y - dragGhost.offsetHeight / 3) + 'px';
        }

        overDeleteZone = y < DELETE_ZONE_HEIGHT;
       
        if (deleteZone) {
            deleteZone.classList.toggle('active', overDeleteZone);
        }

        // Page Switching
        const now = Date.now();
        if (now - lastEdgeSwitchTime > 600 && !folderModal.classList.contains('open')) {
            if (x < EDGE_MARGIN && currentPage > 0) {
                currentPage--;
                lastEdgeSwitchTime = now;
                slider.style.transform = `translateX(-${currentPage * 100}%)`;
                render()
            } else if (x > window.innerWidth - EDGE_MARGIN && currentPage < 12) {
                // If dragging beyond last page → create one
                if (currentPage === pages.length - 1 && pages.length<13) {
                    pages.push(new Array(grid).fill(null)); // empty page
                }

                
                currentPage++;
                lastEdgeSwitchTime = now;
                slider.style.transform = `translateX(-${currentPage * 100}%)`;
                render()
            }

            }
        }

function handleEnd(e) {
    clearTimeout(pressTimer);
    pendingSlot = null;

    clearTimeout(dragTimer);
    if (!isDragging) return;
    
    isDragging = false;

    // 1. Force Ghost Hidden so we can see what's underneath
    if(dragGhost) dragGhost.style.display = 'none';

    // 2. Detect what is under the finger
    const x = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
    const y = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;
    const elBelow = document.elementFromPoint(x, y);

    // 3. Clean up ghost
    if(dragGhost) {
        dragGhost.remove();
        dragGhost = null;
    }
    document.querySelectorAll('.app-slot').forEach(s => s.style.opacity = '1');

    // 4. Handle Delete Zone
    if (overDeleteZone) {
        deleteZone.classList.remove('active');
        overDeleteZone = false;
        if (dragSrc.loc !== 'drawer') {
            setItem(dragSrc, null);
            cleanupEmptyPages();
            saveState();
            render();
        }
        return;
    }

    // 5. Handle Drop
    if (elBelow) {
        const targetSlot = elBelow.closest('.app-slot');
        if (targetSlot) {
            const tgtLoc = targetSlot.dataset.loc;
            const tgtP = targetSlot.dataset.p ? parseInt(targetSlot.dataset.p) : 0;
            const tgtI = parseInt(targetSlot.dataset.i);

            handleDrop(dragSrc, { loc: tgtLoc, p: tgtP, i: tgtI });
        } else {
            // Logic for dropping on empty page space
            if (dragSrc.loc === 'folder' && !folderModal.classList.contains('open')) {
                let emptyIdx = pages[currentPage].findIndex(x => x === null);
                
                // If no empty slot on current page, create a new page and drop there
                if (emptyIdx === -1 && pages.length < 13) {
                    pages.push(new Array(grid).fill(null));
                    currentPage = pages.length - 1;
                    slider.style.transform = `translateX(-${currentPage * 100}%)`;
                    emptyIdx = 0;
                }
                
                // Drop the app
                if (emptyIdx !== -1) {
                    handleDrop(dragSrc, { loc: 'page', p: currentPage, i: emptyIdx });
                }
            }
        }
    }

    window.removeEventListener('mousemove', handleMove);
    window.removeEventListener('mouseup', handleEnd);
    window.removeEventListener('touchmove', handleMove);
    window.removeEventListener('touchend', handleEnd);
}
function getItem(ref) {
    if (ref.loc === 'page') return pages[ref.p] ? pages[ref.p][ref.i] : null;
    if (ref.loc === 'dock') return dock[ref.i] || null; // Force null if undefined
    if (ref.loc === 'folder') {
        if (!currentOpenFolder) return null;
        const folder = pages[currentOpenFolder.p][currentOpenFolder.i];
        return folder ? folder.apps[ref.i] : null;
    }
    return null;
}

function setItem(ref, val) {
    if(ref.loc === 'page') pages[ref.p][ref.i] = val;
    else if(ref.loc === 'dock') dock[ref.i] = val;
    else if (ref.loc === 'folder') {
        const folderSlot = pages[currentOpenFolder.p][currentOpenFolder.i];
        if (!folderSlot || folderSlot.type !== 'folder') return;

        if (val === null) {
            // Remove app from folder
            const removed = folderSlot.apps.splice(ref.i, 1)[0];

            // Folder empty → remove it
            if (folderSlot.apps.length === 0) {
                pages[currentOpenFolder.p][currentOpenFolder.i] = null;
                folderModal.classList.remove('open');
                currentOpenFolder = null;
            }

            // Folder has ONE app → unwrap it
            else if (folderSlot.apps.length === 1) {
                pages[currentOpenFolder.p][currentOpenFolder.i] = folderSlot.apps[0];
                folderModal.classList.remove('open');
                currentOpenFolder = null;
            }

            return removed; // <-- return removed app
        } else {
            folderSlot.apps[ref.i] = val;
        }
    }
}


function handleDrop(src, tgt) {
    // Prevent drop on self
    if(src.loc === tgt.loc && src.p === tgt.p && src.i === tgt.i) return;

    const srcItem = getItem(src);
    const tgtItem = getItem(tgt);

    // Logic split based on Target Type
    
    // 1. Dropping into Folder (Reordering)

        // DRAWER → GRID
    // Inside handleDrop(src, tgt)
if (src.loc === 'drawer') {
    if (tgt.loc !== 'page' && tgt.loc !== 'dock') return;

    // Use !getItem(tgt) to catch both null AND undefined
    if (getItem(tgt)) return; 

    setItem(tgt, src.key);
    saveState();
    render();
    return;
}

    if (tgt.loc === 'folder' && src.loc === 'folder') {
        // Reorder inside folder
        const folder = pages[currentOpenFolder.p][currentOpenFolder.i];
        const item = folder.apps.splice(src.i, 1)[0];
        folder.apps.splice(tgt.i, 0, item);
        openFolder(pages[currentOpenFolder.p][currentOpenFolder.i], true);
        return; // Don't call full render
    }

    // 2. Standard Swap or Create Folder
    if (!tgtItem) {
        // Target is Empty -> Move
        setItem(tgt, srcItem);
        setItem(src, null);
    } else {
        // Target is Occupied
        if (typeof tgtItem === 'string' && typeof srcItem === 'string' && tgt.loc !== 'dock' && src.loc !== 'dock' && tgt.loc !== 'folder') {
            // App on App (Page only) -> Create Folder
            const folder = { type: 'folder', apps: [tgtItem, srcItem] };
            setItem(tgt, folder);
            setItem(src, null);
        } 
        else if (typeof tgtItem === 'object' && tgtItem.type === 'folder' && typeof srcItem === 'string') {
            // App on Folder -> Add
            tgtItem.apps.push(srcItem);
            setItem(src, null);
        }
        else {
            // Swap (e.g. Dock reordering or Page reordering)
            // Note: Can't swap a Folder into the Dock (logic choice)
            if (srcItem.type === 'folder' && tgt.loc === 'dock') return;
            
            setItem(tgt, srcItem);
            setItem(src, tgtItem);
        }
    }
        // If dragged from drawer

    //();
    saveState();
    cleanupEmptyPages()
    render();
    //render()
    // If we moved something out of a folder, re-render folder modal if open
    if (src.loc === 'folder' && folderModal.classList.contains('open')) {
         openFolder(pages[currentOpenFolder.p][currentOpenFolder.i], true);
    }
}




let presstimer;
const element = document.querySelector('.appsbar')
const holdDuration = 500; // Time in milliseconds for a "hold"

// Function to call when the hold is detected
function onHold() {
    console.log('Touch and hold detected!');
    if ('virtualKeyboard' in navigator) {
      navigator.virtualKeyboard.show();
    }

}

// Function to call on a normal tap/end
function onRelease() {
    console.log('Touch released (normal tap or after hold)');
    // Perform cleanup or other actions here
}

// Start the timer on touchstart
element.addEventListener('touchstart', function(e) {
    // Prevent default browser behavior like context menus if needed
    // e.preventDefault(); 
    pressTimer = setTimeout(onHold, holdDuration);
}, false);

// Clear the timer on touchend or touchcancel
element.addEventListener('touchend', function(e) {
    clearTimeout(pressTimer);
    onRelease();
}, false);

element.addEventListener('touchcancel', function(e) {
    clearTimeout(pressTimer);
    onRelease();
}, false);

// Optional: For desktop compatibility, you can also use mousedown/mouseup
element.addEventListener('mousedown', function(e) {
    pressTimer = setTimeout(onHold, holdDuration);
}, false);

element.addEventListener('mouseup', function(e) {
    clearTimeout(pressTimer);
}, false);
