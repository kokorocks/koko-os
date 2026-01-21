isDragging = false;
let dragTimer = null;
let dragGhost = null;
let dragSrc = null; // { loc, p, i }
let overDeleteZone = false;
// Add these with your other let variables
let longPressTimer = null;

const HOLD_DURATION = 500; // ms to hold before drag starts
const DRAG_THRESHOLD = 10; // pixels to move before cancelling the hold (allows scrolling)

// At the top of your file
//let dock = JSON.parse(localStorage.getItem('dock')) || [null, null, null, null];

// Source - https://stackoverflow.com/a
// Posted by Eugene Lazutkin, modified by community. See post 'Timeline' for change history
// Retrieved 2026-01-15, License - CC BY-SA 4.0

var mouseDown = 0;
document.body.onmousedown = function() { 
  ++mouseDown;
}
document.body.onmouseup = function() {
  --mouseDown;
}

const DELETE_ZONE_HEIGHT = 50; // px from top
const deleteZone = document.getElementById('delete-zone');


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

    const label = dragGhost.querySelector('.app-name');
    if (label) label.style.display = 'none';

    document.body.appendChild(dragGhost);

    // From now on, ignore drag events
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
}

// APP DRAGGING WITH ONDRAGSTART (like drawer)
function onAppDragStart(e, slot) {
    e.preventDefault();
    e.dataTransfer.effectAllowed = 'move';
    
    // Kill native ghost
    const img = new Image();
    img.src = '';
    e.dataTransfer.setDragImage(img, 0, 0);

    isDragging = true;

    // Haptic feedback
    if(navigator.vibrate) navigator.vibrate(50);

    // Close drawer on drag
    appDrawer.classList.remove('open');
    appDrawer.style.transform = 'translateY(100%)';

    // Set drag source
    const loc = slot.dataset.loc;
    const p = slot.dataset.p ? parseInt(slot.dataset.p) : 0;
    const i = parseInt(slot.dataset.i);
    dragSrc = { loc, p, i };

    // Create ghost
    const rect = slot.getBoundingClientRect();
    dragGhost = slot.cloneNode(true);
    dragGhost.className = 'dragging-clone';
    dragGhost.style.width = rect.width + 'px';
    dragGhost.style.height = rect.height + 'px';
    dragGhost.style.position = 'fixed';
    dragGhost.style.pointerEvents = 'none';
    dragGhost.style.zIndex = '9999';

    const label = dragGhost.querySelector('.app-name');
    if(label) label.style.display = 'none';

    document.body.appendChild(dragGhost);
    slot.style.opacity = '0';
    
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
}

function handleAppDrag(e) {
    if (!isDragging) return;
    e.preventDefault();
    updateGhostPosition(e);
}

function handleAppDragEnd(e) {
    if (!isDragging) return;
    isDragging = false;

    if(dragGhost) dragGhost.style.display = 'none';

    const x = e.clientX;
    const y = e.clientY;
    const elBelow = document.elementFromPoint(x, y);

    if(dragGhost) {
        dragGhost.remove();
        dragGhost = null;
    }
    document.querySelectorAll('.app-slot').forEach(s => s.style.opacity = '1');

    // Handle delete zone
    if (overDeleteZone) {
        deleteZone.classList.remove('active');
        overDeleteZone = false;
        if (dragSrc.loc !== 'drawer') {
            setItem(dragSrc, null);
            cleanupEmptyPages();
            saveState();
            render();
        }
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleEnd);
        return;
    }

    // Handle drop
    if (elBelow) {
        const targetSlot = elBelow.closest('.app-slot');
        if (targetSlot) {
            const tgtLoc = targetSlot.dataset.loc;
            const tgtP = targetSlot.dataset.p ? parseInt(targetSlot.dataset.p) : 0;
            const tgtI = parseInt(targetSlot.dataset.i);

            handleDrop(dragSrc, { loc: tgtLoc, p: tgtP, i: tgtI });
        } else {
            if (dragSrc.loc === 'folder' && !folderModal.classList.contains('open')) {
                const emptyIdx = pages[currentPage].findIndex(x => x === null);
                if (emptyIdx !== -1) {
                    handleDrop(dragSrc, { loc: 'page', p: currentPage, i: emptyIdx });
                }
            }
        }
    }
    
    window.removeEventListener('mousemove', handleMove);
    window.removeEventListener('mouseup', handleEnd);
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
        // Make app slots draggable using ondragstart (like drawer)
        slot.draggable = true;
        slot.ondragstart = (e) => onAppDragStart(e, slot);
        slot.ondrag = handleAppDrag;
        slot.ondragend = handleAppDragEnd;
        
        // Keep touch events as fallback for mobile
        slot.addEventListener('touchstart', (e) => handleStart(e, slot), {passive:false});
        slot.addEventListener('touchmove', handleMove, {passive:false});
        slot.addEventListener('touchend', handleEnd);
    } else {
        console.log('here')
        slot.draggable = true;
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

function initiateDrag(e, slot) {
    isDragging = true;

    // Haptic Feedback (crucial for mobile feel)
    if (navigator.vibrate) navigator.vibrate(50);

    // Close drawer if open
    document.getElementById('appDrawer').style.transform = 'translateY(100%)';
    appDrawer.classList.remove('open');

    // Set Data Source
    const loc = slot.dataset.loc;
    const p = slot.dataset.p ? parseInt(slot.dataset.p) : 0;
    const i = parseInt(slot.dataset.i);
    dragSrc = { loc, p, i };

    // Create Ghost
    const rect = slot.getBoundingClientRect();
    dragGhost = slot.cloneNode(true);
    dragGhost.className = 'dragging-clone';
    
    // Styling the ghost
    dragGhost.style.width = rect.width + 'px';
    dragGhost.style.height = rect.height + 'px';
    dragGhost.style.position = 'fixed';
    dragGhost.style.zIndex = '9999';
    dragGhost.style.pointerEvents = 'none'; // Critical: lets events pass through to element below
    dragGhost.style.opacity = '0.9';
    dragGhost.style.transform = 'scale(1.1)'; // Slight pop effect
    dragGhost.style.transition = 'none'; // No lag during move

    // Hide label for cleaner look
    const label = dragGhost.querySelector('.app-name');
    if (label) label.style.display = 'none';

    // Position immediately
    updateGhostPosition(e);
    document.body.appendChild(dragGhost);

    // Hide original
    slot.style.opacity = '0';
}

function handleStart(e, slot) {
    // 1. Reset states
    isDragging = false;
    clearTimeout(longPressTimer);
    
    // 2. Record initial touch position
    if (e.touches) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
    } else {
        startX = e.clientX;
        startY = e.clientY;
    }

    // 3. Start the Long Press Timer
    longPressTimer = setTimeout(() => {
        // If this runs, the user held down long enough -> Start Drag
        initiateDrag(e, slot); 
    }, HOLD_DURATION);

    // 4. Bind move/end events immediately to track the gesture
    if (e.type === 'touchstart') {
        window.addEventListener('touchmove', handleMove, { passive: false });
        window.addEventListener('touchend', handleEnd);
    } else {
        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleEnd);
    }
}

//const topGuard = document.getElementById('top-guard');
//const bottomGuard = document.getElementById('bottom-guard');

function handleMove(e) {
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    const y = e.touches ? e.touches[0].clientY : e.clientY;

    // A. Logic BEFORE drag starts (waiting for long press)
    if (!isDragging) {
        const diffX = Math.abs(x - startX);
        const diffY = Math.abs(y - startY);

        // If user moves finger significantly before timer fires, 
        // assume they are scrolling or swiping pages -> CANCEL DRAG TIMER
        if (diffX > DRAG_THRESHOLD || diffY > DRAG_THRESHOLD) {
            clearTimeout(longPressTimer);
        }
        return; // Allow native scrolling
    }

    // B. Logic DURING drag
    if (e.cancelable) e.preventDefault(); // Stop screen from scrolling while dragging app
    updateGhostPosition(e);

    // Drag out of folder logic (Keep your existing logic here)
    if (dragSrc.loc === 'folder' && folderModal.classList.contains('open')) {
        const folderRect = folderInner.getBoundingClientRect();
        if (x < folderRect.left || x > folderRect.right || y < folderRect.top || y > folderRect.bottom) {
            folderModal.classList.remove('open');
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
    // 1. Always clear the hold timer
    clearTimeout(longPressTimer);

    // 2. Clean up listeners
    window.removeEventListener('mousemove', handleMove);
    window.removeEventListener('mouseup', handleEnd);
    window.removeEventListener('touchmove', handleMove);
    window.removeEventListener('touchend', handleEnd);

    // 3. Was this just a click? (No drag happened)
    if (!isDragging) {
        // Reset opacity just in case
        document.querySelectorAll('.app-slot').forEach(s => s.style.opacity = '1');
        
        // --- PUT YOUR APP OPENING LOGIC HERE ---
        // e.g., clickHandler(e.target);
        alert('App opened!');
        return;
    }

    // 4. Drag Cleanup (Your existing logic)
    isDragging = false;
    
    if (dragGhost) {
        dragGhost.remove();
        dragGhost = null;
    }
    document.querySelectorAll('.app-slot').forEach(s => s.style.opacity = '1');

    // ... (Rest of your drop logic remains identical) ...
    
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
                const emptyIdx = pages[currentPage].findIndex(x => x === null);
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

/*function handleEnd(e) {
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
                const emptyIdx = pages[currentPage].findIndex(x => x === null);
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
}*/
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
            folderSlot.apps.splice(ref.i, 1);

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