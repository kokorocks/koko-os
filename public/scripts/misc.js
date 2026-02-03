const drawer = document.getElementById('appDrawer');
let infoPopup = document.getElementById('infopopup')
function closeShade() { shade.classList.remove('open'); }
function closeDrawer() { drawer.classList.remove('open'); document.getElementById('appDrawer').style.transform='translateY(100%)'}

function toggleShadeState() {
    const shadeCompact = document.getElementById('shade-compact');
    const shadeExpanded = document.getElementById('shade-expanded');
    
    if (shadeState === 'compact') {
        // Switch to expanded
        shadeState = 'expanded';
        shadeCompact.classList.remove('active');
        shadeExpanded.classList.add('active');
    } else {
        // Switch to compact
        shadeState = 'compact';
        shadeExpanded.classList.remove('active');
        shadeCompact.classList.add('active');
    }
}

function updateRootVars() {
    const root = document.documentElement;
    const w = window.innerWidth;
    const h = window.innerHeight;

    const cols = w > 600 ? 5 : 4; // more columns on bigger screens
    const rows = h > 800 ? 6 : 5; 
    root.style.setProperty('--grid-cols', cols);
    root.style.setProperty('--grid-rows', rows);
}

// Run on load
//updateRootVars();

// Update on resize
//window.addEventListener('resize', updateRootVars);


function openInfo(type) {
    let contentHTML = '';
    for(let index in info[type]){
        const item = info[type][index];
        const iconHTML = item.icon.includes('fa-') ? `<i class="fas ${item.icon}"></i>` : `<img src="${item.icon}" />`;
        contentHTML += `
        <a href="${item.url}" class="news">
            <div class="news-header">${iconHTML}<div class="news-title">${item.title}</div></div>
            <div class="news-content">${item.content}</div>
            <img class="news-preview" src="${item.thumbnail}" />
        </a>`;
    }
    infoPopup.innerHTML = contentHTML;
    infoPopup.classList.add('open');
}

/* =========================================
   5. FOLDER MODAL
   ========================================= */
const folderModal = document.getElementById('folderModal');
const folderPages = document.getElementById('folderPages');
const folderDots = document.getElementById('folderDots');
const folderPager = document.getElementById('folderPager');

let currentFolderPage = 0;
const ITEMS_PER_PAGE = 12; // 3 columns x 4 rows

function openFolder(folderData, isRefresh = false) {
    // Find location of this folder for saving state
    if(!isRefresh) {
        let found = false;
        pages.forEach((p, pIdx) => {
            p.forEach((item, iIdx) => {
                if(item === folderData) {
                    currentOpenFolder = { p: pIdx, i: iIdx };
                    found = true;
                }
            });
        });
        if(!found) return;
    }

    // Reset to first page
    currentFolderPage = 0;
    folderPages.innerHTML = '';
    folderDots.innerHTML = '';
    
    // Calculate number of pages needed
    const totalItems = folderData.apps.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    
    // Create pages
    for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
        const page = document.createElement('div');
        page.className = 'folder-page';
        
        const startIdx = pageIdx * ITEMS_PER_PAGE;
        const endIdx = Math.min(startIdx + ITEMS_PER_PAGE, totalItems);
        
        for (let i = startIdx; i < endIdx; i++) {
            const appId = folderData.apps[i];
            const slot = document.createElement('div');
            slot.className = 'app-slot';
            slot.dataset.loc = 'folder';
            slot.dataset.i = i;
            slot.dataset.p = currentOpenFolder.p;
            
            const appIcon = createIcon(appId);
            slot.appendChild(appIcon);
            addDragEvents(slot);
            
            page.appendChild(slot);
        }
        
        folderPages.appendChild(page);
    }
    
    // Create pagination dots
    for (let i = 0; i < totalPages; i++) {
        const dot = document.createElement('div');
        dot.className = `folder-dot ${i === 0 ? 'active' : ''}`;
        dot.onclick = () => goToFolderPage(i);
        folderDots.appendChild(dot);
    }
    
    if(!isRefresh) folderModal.classList.add('open');
}

function goToFolderPage(pageIdx) {
    currentFolderPage = pageIdx;
    const offset = pageIdx * 100;
    folderPages.style.transform = `translateX(-${offset}%)`;
    
    // Update dots
    document.querySelectorAll('.folder-dot').forEach((dot, idx) => {
        dot.classList.toggle('active', idx === pageIdx);
    });
}

folderModal.onclick = (e) => {
    if(e.target === folderModal) folderModal.classList.remove('open');
}

setInterval(() => {
    const d = new Date();
    document.getElementById('clockTime').innerText = 
        d.getHours() + ':' + String(d.getMinutes()).padStart(2,'0');
}, 1000);

render();

// Source - https://stackoverflow.com/a
// Posted by Walid Ajaj
// Retrieved 2026-01-15, License - CC BY-SA 3.0

/*document.addEventListener("dragstart", function( event ) {
    var img = new Image();
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=';
    event.dataTransfer.setDragImage(img, 0, 0);
}, false);
*/