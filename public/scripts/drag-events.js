    let isDragging = false;
    let dragTimer = null;
    let dragGhost = null;
    let dragSrc = null; // { loc, p, i }

    function addDragEvents(slot) {
        slot.addEventListener('touchstart', (e) => handleStart(e, slot), {passive:false});
        slot.addEventListener('touchmove', handleMove, {passive:false});
        slot.addEventListener('touchend', handleEnd);
        slot.addEventListener('mousedown', (e) => handleStart(e, slot));
    }

    function handleStart(e, slot) {
        dragTimer = setTimeout(() => {
            isDragging = true;
            // Determine location
            const loc = slot.dataset.loc; // 'page', 'dock', 'folder'
            const p = slot.dataset.p ? parseInt(slot.dataset.p) : 0;
            const i = parseInt(slot.dataset.i);

            dragSrc = { loc, p, i };
            
            if(navigator.vibrate) navigator.vibrate(50);
            
            const rect = slot.getBoundingClientRect();
            dragGhost = slot.cloneNode(true);
            dragGhost.className = 'dragging-clone';
            dragGhost.style.width = rect.width + 'px';
            dragGhost.style.height = rect.height + 'px';
            
            // Remove text from ghost for cleaner look
            const label = dragGhost.querySelector('.app-name');
            if(label) label.style.display = 'none';

            updateGhostPosition(e);
            document.body.appendChild(dragGhost);
            slot.style.opacity = '0'; 

            if(e.type === 'mousedown') {
                window.addEventListener('mousemove', handleMove);
                window.addEventListener('mouseup', handleEnd);
            }

        }, 400); 
    }
const topGuard = document.getElementById('top-guard');
const bottomGuard = document.getElementById('bottom-guard');

    function handleMove(e) {
        if (!isDragging) {
            const x = e.touches ? e.touches[0].clientX : e.clientX;
            const y = e.touches ? e.touches[0].clientY : e.clientY;
            const dist = Math.hypot(x - startX, y - startY);
        
            if (dist > 8) clearTimeout(dragTimer); // allow slight movement
            return;
        }

        e.preventDefault();
        updateGhostPosition(e);

        // DRAG OUT OF FOLDER LOGIC
        if (dragSrc.loc === 'folder' && folderModal.classList.contains('open')) {
            const folderRect = folderInner.getBoundingClientRect();
            const x = e.touches ? e.touches[0].clientX : e.clientX;
            const y = e.touches ? e.touches[0].clientY : e.clientY;

            // If dragged outside the folder box, close modal
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
            dragGhost.style.left = (x - dragGhost.offsetWidth / 2) + 'px';
            dragGhost.style.top = (y - dragGhost.offsetHeight / 2) + 'px';
        }

        // Page Switching
        const now = Date.now();
        if (now - lastEdgeSwitchTime > 600 && !folderModal.classList.contains('open')) {
            if (x < EDGE_MARGIN && currentPage > 0) {
                currentPage--;
                lastEdgeSwitchTime = now;
                slider.style.transform = `translateX(-${currentPage * 100}%)`;
            } else if (x > window.innerWidth - EDGE_MARGIN && currentPage < pages.length - 1) {
                currentPage++;
                lastEdgeSwitchTime = now;
                slider.style.transform = `translateX(-${currentPage * 100}%)`;
            }
        }
    }

    function handleEnd(e) {
        clearTimeout(dragTimer);
        if(!isDragging) return;
        
        isDragging = false;
        dragGhost.style.display = 'none'; // hide to peek below
        
        const x = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
        const y = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;
        dragGhost.style.display = 'none';
        const elBelow = document.elementFromPoint(x, y);
        dragGhost.style.display = '';
 
        
        dragGhost.remove();
        dragGhost = null;

        // Restore opacities
        document.querySelectorAll('.app-slot').forEach(s => s.style.opacity = '1');

        if(elBelow) {
            const targetSlot = elBelow.closest('.app-slot');
            if(targetSlot) {
                const tgtLoc = targetSlot.dataset.loc;
                const tgtP = targetSlot.dataset.p ? parseInt(targetSlot.dataset.p) : 0;
                const tgtI = parseInt(targetSlot.dataset.i);

                handleDrop(dragSrc, { loc: tgtLoc, p: tgtP, i: tgtI });
            } else {
                // Dropped on empty space in modal or page?
                // If dropped on "page" background but not a slot, we could try to find the nearest empty slot, 
                // but for grid systems, dropping "on" a slot is best. 
                // If dragging out of folder and dropped on empty page area:
                if (dragSrc.loc === 'folder' && !folderModal.classList.contains('open')) {
                   // Find first empty slot on current page
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

    function getItem(ref) {
        if(ref.loc === 'page') return pages[ref.p][ref.i];
        if(ref.loc === 'dock') return dock[ref.i];
        if(ref.loc === 'folder') {
            const folder = pages[currentOpenFolder.p][currentOpenFolder.i];
            return folder.apps[ref.i];
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

        // 🔥 CASE 1: Folder empty → remove it
        if (folderSlot.apps.length === 0) {
            pages[currentOpenFolder.p][currentOpenFolder.i] = null;
            folderModal.classList.remove('open');
            currentOpenFolder = null;
        }

        // 🔥 CASE 2: Folder has ONE app → unwrap it
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

        saveState();
        render();
        // If we moved something out of a folder, re-render folder modal if open
        if (src.loc === 'folder' && folderModal.classList.contains('open')) {
             openFolder(pages[currentOpenFolder.p][currentOpenFolder.i], true);
        }
    }