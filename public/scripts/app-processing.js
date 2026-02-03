function createIcon(itemData, isDock = false) {
    // ------------------ FOLDER ------------------
    if (typeof itemData === 'object' && itemData.type === 'folder') {
        const icon = document.createElement('div');
        icon.className = 'app-icon';
        icon.style.background = itemData.color || 'var(--folder-bg)';
        icon.style.backdropFilter = 'blur(10px)';

        const grid = document.createElement('div');
        grid.className = 'folder-grid';

        // Tiny icons preview
        itemData.apps.slice(0, 4).forEach(appId => {
            const mini = document.createElement('div');
            mini.className = 'mini-icon';
            const app = appDB[appId];

            // Check for image icon
            if (app.icon && app.icon.startsWith('img:')) {
                const img = document.createElement('img');
                img.src = app.icon.slice(4);
                img.style.width = '100%';
                img.style.height = '100%';
                mini.appendChild(img);
            } else {
                mini.innerHTML = `<i class="fas ${app.icon}"></i>`;
            }

            mini.style.background = app.color;
            grid.appendChild(mini);
        });

        icon.appendChild(grid);

        const name = document.createElement('div');
        name.className = 'app-name';
        name.innerText = 'Folder';

        const wrapper = document.createDocumentFragment();
        wrapper.appendChild(icon);
        if (!isDock) wrapper.appendChild(name);

        icon.onclick = e => {
            if (!isDragging) {
                cancelDrag();
                e.stopPropagation();
                openFolder(itemData);
            }
        };

        return wrapper;
    }

    // ------------------ WIDGET ------------------
    if (typeof itemData === 'object' && itemData.type === 'widget') {
        const appId = itemData.app;
        const app = appDB[appId];

        const container = document.createElement('div');
        container.className = 'widget-container';

        const iframe = document.createElement('iframe');
        iframe.className = 'widget-iframe';
        iframe.src = 'widgets/' + itemData.widget;
        iframe.style.border = 'none';
        iframe.style.background = 'transparent';
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.pointerEvents = 'none';

        container.appendChild(iframe);

        let widgetClickTime = 0;
        container.addEventListener('mousedown', () => widgetClickTime = Date.now());

        container.addEventListener('click', e => {
            if (!isDragging && (Date.now() - widgetClickTime) < 300) {
                cancelDrag();
                e.preventDefault();
                e.stopPropagation();
                if (app && app.app) openApp(appId, document.querySelector('.bottom-menu').classList.contains('open'));
                else console.log('Widget for ' + appId + ' has no associated app');
            }
        });

        const wrapper = document.createDocumentFragment();
        wrapper.appendChild(container);
        return wrapper;
    }

    // ------------------ REGULAR APP ------------------
    const id = itemData;
    const app = appDB[id];
    const icon = document.createElement('div');
    icon.className = 'app-icon';

    // Custom image support
    if (app.icon && app.icon.startsWith('img:')) {
        const img = document.createElement('img');
        img.src = app.icon.slice(4);
        img.style.width = '60%';
        img.style.height = '60%';
        img.style.userSelect = 'none';
        //img.style.pointerEvents = 'auto'; // <-- allow events to bubble to parent
        img.draggable = false;


        icon.appendChild(img);
    } else {
        icon.innerHTML = `<i class="fas ${app.icon}"></i>`;
    }

    // Background
    if (app.color){
    if (app.color.includes('gradient')) icon.style.background = app.color;
    else icon.style.backgroundColor = app.color;}
    else {
        colorScheme==='dark' ? icon.style.backgroundImage=  'linear-gradient(rgb(0, 0, 0), rgb(20, 20, 25))' : icon.style.backgroundImage='linear-gradient(rgb(255, 255, 255), rgb(248, 248, 248))';
        colorScheme==='dark' ? icon.style.boxShadow=  '0 4px 10px rgba(0,0,0,0.5)' : icon.style.boxShadow='0 4px 10px rgba(0,0,0,0.2)';
        colorScheme==='dark' ? icon.style.color=  'white' : icon.style.color='black';
    }
    if (app.installing) icon.classList.add('installing');

    const name = document.createElement('div');
    name.className = 'app-name icon-label';
    if (itemData.type !== 'dock') name.innerText = app.name;

    const wrapper = document.createDocumentFragment();
    wrapper.appendChild(icon);
    if (!isDock) wrapper.appendChild(name);

    icon.onclick = e => {
        if (!isDragging) {
            cancelDrag();
            e.stopPropagation();
            if (isAppOpen(id)) {
                closeApp(id);
                const folder = getFolder(id);
                if (folder) {
                    const index = folder.apps.indexOf(id);
                    if (index > -1) folder.apps.splice(index, 1);
                    updateFolder(folder);
                }
            } else openApp(id, document.querySelector('.bottom-menu').classList.contains('open'));
        }
    };

    return wrapper;
}

function openApp(id, data, splitView = false, change=0) {
    console.log(id)
    cancelDrag();
    console.log(splitView)

    document.getElementById('appDrawer').style.transform = 'translateY(100%)';

    if (!appDB[id] || !appDB[id].app) return;

    let el;

    // ---------- CREATE ----------
    const sanitizedName = appDB[id].name.replace(/\s+/g, '-');
    if (document.getElementsByClassName(sanitizedName).length === 0) {
        el = document.createElement('iframe');
        el.src = 'apps/' + appDB[id].app;
        el.id = 'appFrame';
        el.classList.add(sanitizedName, 'all-apps');
        el.previewIndex = previewIdx++;
        if (splitView){
            el.id = 'splitAppFrame';
            document.querySelector('.bottom-menu').appendChild(el);
        }else{
            document.getElementById('multiappsarea').appendChild(el);
        }
    }
    // ---------- REOPEN ----------
    else {
        el = document.getElementsByClassName(sanitizedName)[0];
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

function isAppOpen(id) {
    const sanitizedName = appDB[id].name.replace(/\s+/g, '-');
    const appFrames = document.getElementsByClassName(sanitizedName);
    if (appFrames.length === 0) return false;
    const appFrame = appFrames[0];
    return !appFrame.classList.contains('closed') && !appFrame.classList.contains('closing');
}