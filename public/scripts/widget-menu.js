/* =========================================
   WIDGET CONTEXT MENU SYSTEM
   ========================================= */

const contextMenu = document.getElementById('contextMenu');
const contextMenuItems = document.getElementById('contextMenuItems');
let contextMenuTarget = null; // Track which slot was right-clicked

// Available widgets
const availableWidgets = [
    { name: 'Clock', icon: 'fa-clock', data: { type: 'widget', app: 'clock', widget: 'clock-widget.htm', width: 2, height: 2 } },
    { name: 'Weather', icon: 'fa-cloud-sun', data: { type: 'widget', app: 'weather', widget: 'weather-widget.htm', width: 2, height: 2 } },
    { name: 'Forecast', icon: 'fa-calendar-alt', data: { type: 'widget', app: 'weather', widget: 'forecast-widget.htm', width: 2, height: 1 } },
    { name: 'Full Clock', icon: 'fa-clock', data: { type: 'widget', app: 'clock', widget: 'full-clock-widget.htm', width: 5, height: 1 } }
];

/* ---------------- SHOW / HIDE ---------------- */
function showContextMenu(e, slot) {
    e.preventDefault();
    e.stopPropagation();

    const item = getItem({ loc: slot.dataset.loc, p: parseInt(slot.dataset.p || 0), i: parseInt(slot.dataset.i) });
    if (item && slot.dataset.loc === 'page') return; // Only empty slots

    contextMenuTarget = slot;
    const rect = slot.getBoundingClientRect();
    const screenRect = document.querySelector('.screen-container').getBoundingClientRect();

    contextMenu.style.left = `${rect.left - screenRect.left + rect.width/2 - 80}px`;
    contextMenu.style.top = `${rect.top - screenRect.top + rect.height/2 - 50}px`;
    contextMenu.classList.add('visible');
}

function hideContextMenu() {
    contextMenu.classList.remove('visible');
    contextMenuTarget = null;
}

/* ---------------- POPULATE ---------------- */
function populateContextMenu() {
    contextMenuItems.innerHTML = '';
    availableWidgets.forEach(widget => {
        const item = document.createElement('div');
        item.className = 'context-menu-item';
        item.innerHTML = `<i class="fas ${widget.icon}"></i> ${widget.name}`;
        item.onclick = () => {
            addWidgetAtSlot(widget.data);
        };
        contextMenuItems.appendChild(item);
    });
}

/* ---------------- ADD WIDGET ---------------- */
function addWidgetAtSlot(widgetData) {
    if (!contextMenuTarget) return;
    const loc = contextMenuTarget.dataset.loc;
    const p = parseInt(contextMenuTarget.dataset.p || 0);
    const i = parseInt(contextMenuTarget.dataset.i);

    if (loc !== 'page') {
        hideContextMenu();
        return;
    }

    setItem({ loc, p, i }, widgetData);
    saveState();
    render();
    hideContextMenu();
}

/* ---------------- ATTACH LISTENERS ---------------- */
function addContextMenuToSlots() {
    // Right-click listener
    document.addEventListener('contextmenu', e => {
        const slot = e.target.closest('.app-slot');
        if (slot && slot.dataset.loc === 'page') {
            showContextMenu(e, slot);
        }
    });

    // Click anywhere else hides menu
    document.getElementById('mainScreen').addEventListener('click', e => {
        
            hideContextMenu();
        
    });

    // ESC key hides menu
    document.addEventListener('keydown', e => {
        if (e.key === "Escape") hideContextMenu();
    });
}

/* ---------------- INITIALIZE ---------------- */
populateContextMenu();
addContextMenuToSlots();

/* ---------------- OVERRIDE RENDER ---------------- */
const originalRender = render;
render = function() {
    originalRender();
    // No need to re-add listeners, they are global
};
