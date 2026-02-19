
function closeAppPreviews() {
    const previewArea = document.getElementById('multiappspreviewarea');
    previewArea.style.opacity = '0';
    previewArea.style.pointerEvents = 'none';
    previewArea.style.zIndex = '550';
    previewArea.classList.remove('open');
    previewArea.innerHTML = '';
    previewOpen = false; // ✅ ALWAYS reset state
}


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
                        
            colorScheme==='dark' ? mini.style.backgroundImage=  'linear-gradient(rgb(0, 0, 0), rgb(20, 20, 25))' : mini.style.backgroundImage='linear-gradient(rgb(255, 255, 255), rgb(248, 248, 248))';
            //colorScheme==='dark' ? icon.style.boxShadow=  '0 4px 10px rgba(0,0,0,0.5)' : icon.style.boxShadow='0 4px 10px rgba(0,0,0,0.2)';
            colorScheme==='dark' ? mini.style.color=  'white' : mini.style.color='black';
            //mini.style.background = app.color;
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
        iframe.style.userSelect = 'none'
        //iframe.allow='scripted;camera;microphone;clipboard-read;clipboard-write;';

        container.appendChild(iframe);

        let widgetClickTime = 0;
        container.addEventListener('mousedown', () => widgetClickTime = Date.now());

        container.addEventListener('dblclick', e => {
            if (!isDragging && (Date.now() - widgetClickTime) < 300) {
                cancelDrag();
                e.preventDefault();
                e.stopPropagation();
                if (app && app.app) openApp(appId)//, document.querySelector('.bottom-menu').classList.contains('open'));
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
        img.style.width = '70%';
        img.style.height = '70%';
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

/*function openApp(id, data, splitView = false, change=0, transition = true) {
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
        console.log(appDB[id].permissions ? appDB[id].permissions.join(';') + ';' : '')
        permissionsVar = requestPermission(appDB[id], appDB[id].permissions)
        
        el.allow = permissionsVar //appDB[id].permissions ? appDB[id].permissions.join(';') + ';' : '';
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
    if(transition) el.style.transform = 'translateY(25vh) scale(0.4)';
    transition ? el.style.opacity = '0' : el.style.opacity = '1';

    // 🔥 FORCE REFLOW (this is the missing piece)
    if(transition) el.offsetHeight;

    // ---------- ANIMATE IN ----------
    el.style.transition = '';
    console.log('open app with transition:', transition);
    transition ? el.classList.add('open') : el.classList.add('open-no-transition');
    transition ? el.style.transform = '' : el.style.transform = 'translateY(0) scale(1)';
    el.style.opacity = '';
}*/
// Global tracker object

function openApp(id, data, splitView = false, change = 0, transition = true) {
    closeAppPreviews();
    cancelDrag();

    document.getElementById('appDrawer').style.transform = 'translateY(100%)';

    if (!appDB[id] || !appDB[id].app) return;

    let el; 
    const sanitizedName = appDB[id].name.replace(/\s+/g, '-');

    // Initialize tracker array for this app
    if (!window.appTracker[id]) window.appTracker[id] = [];

    requestPermission(id, function done(grantedPermissions) {
        const permissionsVar = grantedPermissions.length
            ? grantedPermissions.join('; ') + ';'
            : '';

        const existing = document.getElementsByClassName(sanitizedName)[0];

        if (!existing) {
            el = document.createElement('iframe');
            el.src = 'apps/' + appDB[id].app;
            el.id = 'appFrame';
            el.classList.add(sanitizedName, 'all-apps');
            el.previewIndex = previewIdx++;
            el.allow = permissionsVar;

            if (splitView) {
                el.id = 'splitAppFrame';
                document.querySelector('.bottom-menu').appendChild(el);
            } else {
                document.getElementById('multiappsarea').appendChild(el);
            }

            // --- INJECT MONITOR ---
            el.addEventListener('load', () => {
                try {
                    const win = el.contentWindow;
                    const doc = el.contentDocument || win.document;

                        // Create a new script element using the iframe's document context
                    const script = iframeDoc.createElement("script");
                    script.type = "text/javascript";

                    // Set the source (src) to the external JavaScript file URL
                    script.src = "app-functionality.js"; // Replace with the actual path

                    // Append the script element to the iframe's head or body
                    iframeDoc.head.appendChild(script);

                    const log = (msg) => {
                        window.appTracker[id].push({
                            time: Date.now(),
                            message: msg
                        });
                        // Optional: also log to console
                        console.log(`App ${id}: ${msg}`);
                    };

                    log('Tracker injected!');

                    // --- XHR tracking ---
                    const origXhr = win.XMLHttpRequest.prototype.open;
                    win.XMLHttpRequest.prototype.open = function(method, url) {
                        log(`XHR Request -> ${method} ${url}`);
                        return origXhr.apply(this, arguments);
                    };

                    // --- fetch tracking ---
                    const origFetch = win.fetch;
                    win.fetch = function(...args) {
                        log(`fetch Request -> ${args[0]}`);
                        return origFetch.apply(this, args);
                    };

                    // --- LocalStorage tracking ---
                    ['setItem','removeItem','clear'].forEach(fn => {
                        const origLS = win.localStorage[fn];
                        win.localStorage[fn] = function(...args) {
                            log(`localStorage.${fn} -> ${JSON.stringify(args)}`);
                            return origLS.apply(this, args);
                        };
                        const origSS = win.sessionStorage[fn];
                        win.sessionStorage[fn] = function(...args) {
                            log(`sessionStorage.${fn} -> ${JSON.stringify(args)}`);
                            return origSS.apply(this, args);
                        };
                    });

                    // --- Monitor dynamic DOM changes ---
                    const observer = new win.MutationObserver(muts => {
                        muts.forEach(m => {
                            if (m.type === 'childList') {
                                m.addedNodes.forEach(n => {
                                    if (n.tagName) {
                                        const tag = n.tagName.toLowerCase();
                                        if (['img','script','video'].includes(tag)) log(`Element added: <${tag}> src=${n.src||''}`);
                                        else log(`Element added: <${tag}>`);
                                    }
                                });
                            }
                            if (m.type === 'attributes') log(`Attribute changed: ${m.target.tagName}[${m.attributeName}]`);
                        });
                    });
                    observer.observe(doc.body, { childList:true, subtree:true, attributes:true });

                    // --- Intercept eval/Function calls ---
                    const origEval = win.eval;
                    win.eval = function(code) {
                        log(`eval called -> ${code.slice(0,100)}`);
                        return origEval.call(this, code);
                    };
                    const OrigFunction = win.Function;
                    win.Function = function(...args) {
                        log(`Function constructor called -> ${args.join('; ')}`);
                        return new OrigFunction(...args);
                    };

                } catch (err) {
                    console.error('Error injecting tracker:', err);
                }
            });

        } else {
            el = existing;
            el.id = 'appFrame';
            el.classList.remove('closed', 'closing');
        }

        appopen = el;

        // ---------- FORCE START STATE ----------
        el.style.transition = 'none';
        if (transition) el.style.transform = 'translateY(25vh) scale(0.4)';
        el.style.opacity = transition ? '0' : '1';
        if (transition) el.offsetHeight;

        el.style.transition = '';
        transition ? el.classList.add('open') : el.classList.add('open-no-transition');
        transition ? el.style.transform = '' : el.style.transform = 'translateY(0) scale(1)';
        el.style.opacity = '';
    });
}



function isAppOpen(id) {
    const sanitizedName = appDB[id].name.replace(/\s+/g, '-');
    const appFrames = document.getElementsByClassName(sanitizedName);
    if (appFrames.length === 0) return false;
    const appFrame = appFrames[0];
    return !appFrame.classList.contains('closed') && !appFrame.classList.contains('closing');
}