/* =========================================
   WIDGET CONTEXT MENU SYSTEM
   ========================================= */

const contextMenu = document.getElementById('contextMenu');
const contextMenuItems = document.getElementById('contextMenuItems');
let contextMenuTarget = null; // Track which slot was right-clicked

// Available widgets
const availableWidgets = [
    {
        name: 'Clock',
        icon: 'fa-clock',
        data: { type: 'widget', app: 'clock', widget: 'clock-widget.htm', width: 2, height: 2 }
    },
    {
        name: 'Weather',
        icon: 'fa-cloud-sun',
        data: { type: 'widget', app: 'weather', widget: 'weather-widget.htm', width: 2, height: 2 }
    },
    {
        name: 'Forecast',
        icon: 'fa-calendar-alt',
        data: { type: 'widget', app: 'weather', widget: 'forecast-widget.htm', width: 2, height: 1 }
    },
    {
        name: 'Full Clock',
        icon: 'fa-clock',
        data: { type: 'widget', app: 'clock', widget: 'full-clock-widget.htm', width: 5, height: 1 }
    }
];

function showContextMenu(e, slot) {
    e.preventDefault();
    e.stopPropagation();

    // Only show on empty slots
    const item = getItem({ loc: slot.dataset.loc, p: parseInt(slot.dataset.p || 0), i: parseInt(slot.dataset.i) });
    if (item && slot.dataset.loc === 'page') {
        // Slot has content, don't show menu
        return;
    }

    contextMenuTarget = slot;
    const rect = slot.getBoundingClientRect();
    const screenRect = document.querySelector('.screen-container').getBoundingClientRect();

    // Position context menu
    contextMenu.style.left = (rect.left - screenRect.left + rect.width / 2 - 80) + 'px';
    contextMenu.style.top = (rect.top - screenRect.top + rect.height / 2 - 50) + 'px';
    contextMenu.classList.add('visible');
}

function hideContextMenu() {
    contextMenu.classList.remove('visible');
    contextMenuTarget = null;
}

function populateContextMenu() {
    contextMenuItems.innerHTML = '';
    availableWidgets.forEach(widget => {
        const item = document.createElement('div');
        item.className = 'context-menu-item';
        item.innerHTML = `<i class="fas ${widget.icon}"></i> ${widget.name}`;
        item.onclick = () => addWidgetAtSlot(widget.data);
        contextMenuItems.appendChild(item);
    });
}

function addWidgetAtSlot(widgetData) {
    if (!contextMenuTarget) return;

    const loc = contextMenuTarget.dataset.loc;
    const p = contextMenuTarget.dataset.p ? parseInt(contextMenuTarget.dataset.p) : 0;
    const i = parseInt(contextMenuTarget.dataset.i);

    // Only allow adding to page slots
    if (loc !== 'page') {
        hideContextMenu();
        return;
    }

    setItem({ loc, p, i }, widgetData);
    saveState();
    render();
    hideContextMenu();
}

// Add right-click listener to all app slots
function addContextMenuToSlots() {
    document.addEventListener('contextmenu', (e) => {
        const slot = e.target.closest('.app-slot');
        if (slot && slot.dataset.loc === 'page') {
            showContextMenu(e, slot);
        }
    });
}

// Hide context menu when clicking elsewhere
document.addEventListener('click', (e) => {
    if (!e.target.closest('.context-menu') && !e.target.closest('.app-slot')) {
        hideContextMenu();
    }
});

// Initialize context menu
populateContextMenu();

// Add context menu functionality after render
const originalRender = render;
render = function() {
    originalRender();
    addContextMenuToSlots();
};
