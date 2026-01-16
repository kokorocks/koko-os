const drawer = document.getElementById('appDrawer');
let infoPopup = document.getElementById('infopopup')
function closeShade() { shade.classList.remove('open'); }
function closeDrawer() { drawer.classList.remove('open'); document.getElementById('appDrawer').style.transform='translateY(100%)'}

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
const folderInner = document.getElementById('folderInner');

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

    folderInner.innerHTML = '';
    
    folderData.apps.forEach((appId, idx) => {
        const slot = document.createElement('div');
        slot.className = 'app-slot';
        slot.dataset.loc = 'folder';
        slot.dataset.i = idx;
        // No P index needed for folder items, but we need the slot to work
        
        const appIcon = createIcon(appId);
        slot.appendChild(appIcon);
        addDragEvents(slot);
        
        folderInner.appendChild(slot);
    });

    if(!isRefresh) folderModal.classList.add('open');
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