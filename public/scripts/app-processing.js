function createIcon(itemData, isDock=false) {
    if (typeof itemData === 'object' && itemData.type === 'folder') {
        // Folder
        const icon = document.createElement('div');
        icon.className = 'app-icon';
        icon.style.background = 'var(--folder-bg)';
        icon.style.backdropFilter = 'blur(10px)';
        
        const grid = document.createElement('div');
        grid.className = 'folder-grid';
        
        // Render Tiny Icons
        itemData.apps.slice(0, 4).forEach(appId => {
            const mini = document.createElement('div');
            mini.className = 'mini-icon';
            const app = appDB[appId];
            mini.style.background = app.color;
            mini.innerHTML = `<i class="fas ${app.icon}"></i>`;
            grid.appendChild(mini);
        });
        
        icon.appendChild(grid);
        
        const name = document.createElement('div');
        name.className = 'app-name';
        name.innerText = 'Folder';
        
        const wrapper = document.createDocumentFragment();
        wrapper.appendChild(icon);
        if(!isDock) wrapper.appendChild(name);
        
        icon.onclick = (e) => {
            if(!isDragging) {
                cancelDrag();
                e.stopPropagation();
                openFolder(itemData);
            }
        };
        return wrapper;
    } else {
        // Regular App
        const id = itemData;
        const app = appDB[id];
        
        const icon = document.createElement('div');
        icon.className = 'app-icon';
        if(app.color.includes('gradient')) icon.style.background = app.color;
        else icon.style.backgroundColor = app.color;
        
        icon.innerHTML = `<i class="fas ${app.icon}"></i>`;
        
        const name = document.createElement('div');
        name.className = 'app-name';
        name.className = 'app-name icon-label'; // added class for dock hiding
        if(itemData.type !== 'dock') name.innerText = app.name;
        const wrapper = document.createDocumentFragment();
        wrapper.appendChild(icon);
        if(!isDock) wrapper.appendChild(name);
        icon.onclick = (e) => {
            if(!isDragging) {
                e.stopPropagation();
                openApp(id);
            }
        };
        return wrapper;
    }
}

function openApp(id) {
    cancelDrag();

    document.getElementById('appDrawer').style.transform = 'translateY(100%)';

    if (!appDB[id] || !appDB[id].app) return;

    let el;

    // ---------- CREATE ----------
    if (document.getElementsByClassName(appDB[id].name).length === 0) {
        el = document.createElement('iframe');
        el.src = 'apps/' + appDB[id].app;
        el.id = 'appFrame';
        el.classList.add(appDB[id].name, 'all-apps');
        el.previewIndex = previewIdx++;
        document.getElementById('multiappsarea').appendChild(el);
    }
    // ---------- REOPEN ----------
    else {
        el = document.getElementsByClassName(appDB[id].name)[0];
        el.id = 'appFrame';
        el.classList.remove('closed', 'closing');
    }

    appopen = el;

    // ---------- FORCE START STATE ----------
    el.style.transition = 'none';
    el.style.transform = 'translateY(25vh) scale(0.4)';
    el.style.opacity = '0';

    // 🔥 FORCE REFLOW (this is the missing piece)
    el.offsetHeight;

    // ---------- ANIMATE IN ----------
    el.style.transition = '';
    el.classList.add('open');
    el.style.transform = '';
    el.style.opacity = '';
}
