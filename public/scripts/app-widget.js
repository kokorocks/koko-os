// Global z-index tracker
let highestZIndex = 100;
const container = document.getElementById('mainScreen') || document.body; // Fallback to body if container isn't found
let isDraggingAW = false;

function lockToContainer(widget) {
    const wRect = widget.getBoundingClientRect();
    const cRect = container.getBoundingClientRect();

    widget.style.transform = 'none';
    widget.style.left = (wRect.left - cRect.left) + 'px';
    widget.style.top  = (wRect.top  - cRect.top ) + 'px';
}

// FIX 1: Safer coordinate extraction for mobile touch events
function getClientX(e) {
    if (e.clientX !== undefined) return e.clientX;
    if (e.touches && e.touches.length > 0) return e.touches[0].clientX;
    if (e.changedTouches && e.changedTouches.length > 0) return e.changedTouches[0].clientX;
    return 0;
}

function getClientY(e) {
    if (e.clientY !== undefined) return e.clientY;
    if (e.touches && e.touches.length > 0) return e.touches[0].clientY;
    if (e.changedTouches && e.changedTouches.length > 0) return e.changedTouches[0].clientY;
    return 0;
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

        <div class="widget-box" style="height: 100%; width: 100%; position: relative;">
            <div class="drag-handle" style="cursor: grab;">
                <div class="wdot"></div>
                <div class="wdot"></div>
                <div class="wdot"></div>
            </div>
            <iframe class="content-iframe" srcdoc="${html}" style="width: 100%; height: 100%; border: none;"></iframe>
        </div>

        <div class="resize-handle resize-left">
            <svg viewBox="0 0 40 40"><path d="M35 15 A22 22 0 0 0 15 35" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/></svg>
        </div>
        <div class="resize-handle resize-right">
            <svg viewBox="0 0 40 40"><path d="M5 15 A22 22 0 0 1 25 35" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/></svg>
        </div>
    `;
    
    const iframe = widget.querySelector('.content-iframe');
    iframe.style.cssText += css;

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

    // Z-index management
    const bringToFront = () => widget.style.zIndex = ++highestZIndex;
    widget.addEventListener('mousedown', bringToFront);
    widget.addEventListener('touchstart', bringToFront, { passive: true });

    closeBtn.onclick = () => widget.remove();

    minBtn.onclick = () => {
        widget.classList.toggle('minimized');
        minBtn.textContent = widget.classList.contains('minimized') ? '+' : '−';
    };

    // DRAG START
    const dragStart = e => {
        if (!draggable) return;
        isDraggingAW = true;

        // Prevent text selection/highlighting on start
        if (e.cancelable) e.preventDefault(); 
        e.stopPropagation();

        lockToContainer(widget);

        const wRect = widget.getBoundingClientRect();
        const cRect = container.getBoundingClientRect();

        const clientX = getClientX(e);
        const clientY = getClientY(e);

        grabOffsetX = clientX - wRect.left;
        grabOffsetY = clientY - wRect.top;

        startL = wRect.left - cRect.left;
        startY = wRect.top  - cRect.top;

        mode = 'drag';
        widget.classList.add('interacting');
        
        // FIX 2: Disable iframe pointer events so it doesn't swallow touch moves
        iframe.style.pointerEvents = 'none';
    };

    drag.addEventListener('mousedown', dragStart);
    drag.addEventListener('touchstart', dragStart, { passive: false });

    // RESIZE RIGHT
    const resizeRightStart = e => {
        if (!resizable) return;
        if (e.cancelable) e.preventDefault();
        resizeR.style.opacity = 1

        lockToContainer(widget);

        startX = getClientX(e);
        startY = getClientY(e);
        startW = widget.offsetWidth;
        startH = widget.offsetHeight;

        mode = 'resize-right';
        widget.classList.add('interacting');
        iframe.style.pointerEvents = 'none';
        e.stopPropagation();
    };

    resizeR.addEventListener('mousedown', resizeRightStart);
    resizeR.addEventListener('touchstart', resizeRightStart, { passive: false });

    // RESIZE LEFT
    const resizeLeftStart = e => {
        if (!resizable) return;
        if (e.cancelable) e.preventDefault();
        resizeL.style.opacity = 1

        lockToContainer(widget);

        startX = getClientX(e);
        startY = getClientY(e);
        startW = widget.offsetWidth;
        startH = widget.offsetHeight;
        startL = widget.offsetLeft;

        mode = 'resize-left';
        widget.classList.add('interacting');
        iframe.style.pointerEvents = 'none';
        e.stopPropagation();
    };

    resizeL.addEventListener('mousedown', resizeLeftStart);
    resizeL.addEventListener('touchstart', resizeLeftStart, { passive: false });

    // Double click to show controls
    widget.querySelector('.widget-box').addEventListener('', () => {
        controls.style.display = (controls.style.display === 'flex') ? 'none' : 'flex';
    });

    // MOVE – both mouse and touch
    const onMove = e => {
        if (!mode) return;
        
        // FIX 3: CRITICAL FOR MOBILE! 
        // Prevents the browser from natively scrolling the page when you swipe to move the widget
        if (e.cancelable) {
            e.preventDefault();
        }
        
        isDraggingAW = true;

        const cRect = container.getBoundingClientRect();
        const clientX = getClientX(e);
        const clientY = getClientY(e);

        if (mode === 'drag') {
            const newLeft = clientX - cRect.left - grabOffsetX;
            const newTop = clientY - cRect.top - grabOffsetY;

            const maxLeft = cRect.width - widget.offsetWidth;
            const maxTop = cRect.height - widget.offsetHeight;

            widget.style.left = Math.min(Math.max(0, newLeft), maxLeft) + 'px';
            widget.style.top = Math.min(Math.max(0, newTop), maxTop) + 'px';
        }

        if (mode === 'resize-right') {
            let newW = startW + (clientX - startX);
            let newH = startH + (clientY - startY);

            const currentLeft = widget.offsetLeft;
            const currentTop = widget.offsetTop;
            const availW = cRect.width - currentLeft;
            const availH = cRect.height - currentTop;

            const finalW = Math.min(Math.max(MIN_W, newW), MAX_W, availW);
            const finalH = Math.min(Math.max(MIN_H, newH), MAX_H, availH);

            widget.style.width = finalW + 'px';
            widget.style.height = finalH + 'px';
            resizeR.style.opacity = 1
        }

        if (mode === 'resize-left') {
            const dx = clientX - startX;
            const maxLeftShift = -startL;
            const clampedDx = Math.max(dx, maxLeftShift);

            let newW = startW - clampedDx;
            resizeL.style.opacity = 1

            if (newW < MIN_W) {
                newW = MIN_W;
            }

            const finalW = Math.min(newW, MAX_W);
            widget.style.left = (startL + (startW - finalW)) + 'px';
            widget.style.width = finalW + 'px';

            let newH = startH + (clientY - startY);
            const availH = cRect.height - widget.offsetTop;
            widget.style.height = Math.min(Math.max(MIN_H, newH), MAX_H, availH) + 'px';
        }
    };

    // Note: { passive: false } is required here so e.preventDefault() works!
    document.addEventListener('mousemove', onMove);
    document.addEventListener('touchmove', onMove, { passive: false });

    // END – both mouse and touch
    const onEnd = () => {
        if (!mode) return; // Only trigger if we were actually interacting
        isDraggingAW = false;
        mode = null;
        widget.classList.remove('interacting');
        
        // Restore iframe pointer events
        iframe.style.pointerEvents = 'auto';
    };

    document.addEventListener('mouseup', onEnd);
    document.addEventListener('touchend', onEnd);
    document.addEventListener('touchcancel', onEnd); // Failsafe for mobile
};

// Example
createWidget("<div style='display:flex; flex-direction:column; align-items:center; justify-content:flex-start; height:100%; padding-top:20px; font-family:sans-serif;'><h1 style='margin:0; font-weight:400;'>00:16.46</h1><p style='color:#888; font-size:12px; margin-top:5px;'>High-quality</p><div style='width:80%; height:40px; margin:20px 0; background:repeating-linear-gradient(90deg, #b0d1eb, #b0d1eb 3px, transparent 3px, transparent 6px); opacity:0.6;'></div><div style='width:90%; background:#fff; box-shadow:0 4px 15px rgba(0,0,0,0.05); padding:15px; border-radius:15px; text-align:left;'><h4 style='margin:0 0 10px 0;'>AI Speech Recognition</h4><p style='margin:0; font-size:14px; color:#333;'>hi everyone great to be here today <b>i'm super</b></p></div></div>");