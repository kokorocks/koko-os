    const drawer = document.getElementById('appDrawer');
    function closeShade() { shade.classList.remove('open'); }
    function closeDrawer() { drawer.classList.remove('open'); }
    
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
