// Global z-index tracker
let highestZIndex = 100;
const container = document.getElementById('mainScreen');
let isDraggingAW=false;
function lockToContainer(widget) {
    const wRect = widget.getBoundingClientRect();
    const cRect = container.getBoundingClientRect();

    widget.style.transform = 'none';
    widget.style.left = (wRect.left - cRect.left) + 'px';
    widget.style.top  = (wRect.top  - cRect.top ) + 'px';
}

window.createWidget = function (
    html="<div></div>",
    x = '0px',
    y = '0px',
    width = '180px',
    height = '220px',
    minWidth = '150px',
    minHeight = '150px',
    maxWidth = 'none',
    maxHeight = 'none',
    resizable = true,
    draggable = true,
    css=''
) {
    const widget = document.createElement('div');
    widget.className = 'widget-wrapper';

    // Initial centered placement
    widget.style.left = `calc(50% + ${x})`;
    widget.style.top = y;
    widget.style.transform = 'translateX(-50%)';
    widget.style.position = 'absolute';
    widget.style.zIndex = ++highestZIndex;
    const MIN_W = parseFloat(minWidth)  || 50;
    const MIN_H = parseFloat(minHeight) || 50;
    const MAX_W = maxWidth !== 'none'  ? parseFloat(maxWidth)  : Infinity;
    const MAX_H = maxHeight !== 'none' ? parseFloat(maxHeight) : Infinity;

    Object.assign(widget.style, {
        width,
        height,
        minWidth,
        minHeight,
        maxWidth,
        maxHeight
    });

    widget.innerHTML = `
        <div class="controls-overlay">
            <button class="control-btn btn-min">−</button>
            <button class="control-btn btn-close">×</button>
        </div>

        <div class="widget-box">
            <div class="drag-handle">
                <div class="wdot"></div>
                <div class="wdot"></div>
                <div class="wdot"></div>
            </div>
            <iframe class="content-iframe" srcdoc="${html}"></iframe>
        </div>

        <div class="resize-handle resize-left">
            <svg viewBox="0 0 40 40"><path d="M35 15 A22 22 0 0 0 15 35" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/></svg>
        </div>
        <div class="resize-handle resize-right">
            <svg viewBox="0 0 40 40"><path d="M5 15 A22 22 0 0 1 25 35" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/></svg>
        </div>
    `;
    widget.querySelector('.content-iframe').style.cssText =+ css;

    container.appendChild(widget);

    const drag = widget.querySelector('.drag-handle');
    const controls = widget.querySelector('.controls-overlay');
    const closeBtn = widget.querySelector('.btn-close');
    const minBtn = widget.querySelector('.btn-min');
    const resizeL = widget.querySelector('.resize-left');
    const resizeR = widget.querySelector('.resize-right');

    if (!draggable) drag.style.display = 'none';
    if (!resizable) resizeL.style.display = resizeR.style.display = 'none';

    let mode = null;
    let startX, startY, startW, startH, startL;
    let grabOffsetX, grabOffsetY;

    widget.addEventListener('mousedown', () => {
        widget.style.zIndex = ++highestZIndex;
    });

    closeBtn.onclick = () => widget.remove();

    minBtn.onclick = () => {
        widget.classList.toggle('minimized');
        minBtn.textContent = widget.classList.contains('minimized') ? '+' : '−';
    };

    // DRAG START (FIXED)
    drag.onmousedown = e => {
        if (!draggable) return;
        isDraggingAW=true;

        e.preventDefault();       // 🔧 FIX
        e.stopPropagation();      // 🔧 FIX

        lockToContainer(widget);

        const wRect = widget.getBoundingClientRect();
        const cRect = container.getBoundingClientRect();

        grabOffsetX = e.clientX - wRect.left;
        grabOffsetY = e.clientY - wRect.top;

        startL = wRect.left - cRect.left;
        startY = wRect.top  - cRect.top;

        mode = 'drag';
        widget.classList.add('interacting');
    };

    // RESIZE RIGHT
    resizeR.onmousedown = e => {
        if (!resizable) return;

        lockToContainer(widget);

        startX = e.clientX;
        startY = e.clientY;
        startW = widget.offsetWidth;
        startH = widget.offsetHeight;

        mode = 'resize-right';
        widget.classList.add('interacting');
        e.stopPropagation();
    };

    // RESIZE LEFT
    resizeL.onmousedown = e => {
        if (!resizable) return;

        lockToContainer(widget);

        startX = e.clientX;
        startY = e.clientY;
        startW = widget.offsetWidth;
        startH = widget.offsetHeight;
        startL = widget.offsetLeft;

        mode = 'resize-left';
        widget.classList.add('interacting');
        e.stopPropagation();
    };

    // Double Click to show controls
    widget.querySelector('.widget-box').addEventListener('dblclick', () => {
        controls.style.display = (controls.style.display === 'flex') ? 'none' : 'flex';
    });

    // MOVE
// MOVE
document.addEventListener('mousemove', e => {
    if (!mode) return;
    isDraggingAW = true;

    const cRect = container.getBoundingClientRect();
    const wRect = widget.getBoundingClientRect(); // Current widget position

    if (mode === 'drag') {
        const newLeft = e.clientX - cRect.left - grabOffsetX;
        const newTop = e.clientY - cRect.top - grabOffsetY;

        // Clamp dragging within container
        const maxLeft = cRect.width - widget.offsetWidth;
        const maxTop = cRect.height - widget.offsetHeight;

        widget.style.left = Math.min(Math.max(0, newLeft), maxLeft) + 'px';
        widget.style.top = Math.min(Math.max(0, newTop), maxTop) + 'px';
    }

    if (mode === 'resize-right') {
        let newW = startW + (e.clientX - startX);
        let newH = startH + (e.clientY - startY);

        // Clamp width/height based on container edge
        const currentLeft = widget.offsetLeft;
        const currentTop = widget.offsetTop;
        const availW = cRect.width - currentLeft;
        const availH = cRect.height - currentTop;

        const finalW = Math.min(Math.max(MIN_W, newW), MAX_W, availW);
        const finalH = Math.min(Math.max(MIN_H, newH), MAX_H, availH);

        widget.style.width = finalW + 'px';
        widget.style.height = finalH + 'px';
    }

    if (mode === 'resize-left') {
        const dx = e.clientX - startX;
        
        // Calculate the maximum the left side can move (cannot go less than 0)
        const maxLeftShift = -startL; // Negative because moving left is negative dx
        const clampedDx = Math.max(dx, maxLeftShift);

        let newW = startW - clampedDx;
        
        // Ensure it doesn't shrink smaller than MIN_W
        if (newW < MIN_W) {
            newW = MIN_W;
            // No changes needed to left here, logic handled below
        }

        const finalW = Math.min(newW, MAX_W);
        // Correct Left is start position + (original width - current clamped width)
        widget.style.left = (startL + (startW - finalW)) + 'px';
        widget.style.width = finalW + 'px';

        // Vertical Resize (Bottom edge clamping)
        let newH = startH + (e.clientY - startY);
        const availH = cRect.height - widget.offsetTop;
        widget.style.height = Math.min(Math.max(MIN_H, newH), MAX_H, availH) + 'px';
    }
});

    document.addEventListener('mouseup', () => {
        isDraggingAW=false;
        mode = null;
        widget.classList.remove('interacting');
    });
};

// Example
createWidget("<div style='display:flex; flex-direction:column; align-items:center; justify-content:flex-start; height:100%; padding-top:20px; font-family:sans-serif;'><h1 style='margin:0; font-weight:400;'>00:16.46</h1><p style='color:#888; font-size:12px; margin-top:5px;'>High-quality</p><div style='width:80%; height:40px; margin:20px 0; background:repeating-linear-gradient(90deg, #b0d1eb, #b0d1eb 3px, transparent 3px, transparent 6px); opacity:0.6;'></div><div style='width:90%; background:#fff; box-shadow:0 4px 15px rgba(0,0,0,0.05); padding:15px; border-radius:15px; text-align:left;'><h4 style='margin:0 0 10px 0;'>AI Speech Recognition</h4><p style='margin:0; font-size:14px; color:#333;'>hi everyone great to be here today <b>i'm super</b></p></div></div>");
//1.5rem
//#181818
//border-color: rgb(255 255 255 / 5%);