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
    closeDrawer();
    if(appDB[id] && appDB[id].app) {
        console.log('opening app:', id)
        if(document.getElementsByClassName(appDB[id].name).length === 0) { // Prevent multiple instances
            console.log('creating iframe for app:', id)

        let el=document.createElement('iframe');
        el.src='apps/'+appDB[id].app || 'app-placeholder.htm';
        /*el.style.position='absolute';
        el.style.top='0';
        el.style.left='0';
        el.style.width='100%';
        el.style.height='100%';
        el.style.border='none';
        el.style.zIndex='500';*/
        el.id='appFrame';
        el.classList.add(appDB[id].name);
        el.classList.add('all-apps')
        el.previewIndex=previewIdx
        previewIdx++
        document.getElementById('multiappsarea').appendChild(el);
        appopen = document.getElementById('appFrame');

        setTimeout(() => {
            el.classList.add('open');
        }, 50);}
        else {
            const el = document.getElementsByClassName(appDB[id].name)[0];
            console.log('found iframe for app:', id, el)
        if (!el) {
            console.error("No element found with class:", appDB[id].name);
            return; // safely exit
        }

            appopen = el
            el.classList.remove('closed');
            el.classList.remove('closing');
            el.classList.add('open');
            el.id = 'appFrame';
        }
    }
    else if(typeof id === 'string' && appDB[id]) alert("Opening " + appDB[id].name);
}