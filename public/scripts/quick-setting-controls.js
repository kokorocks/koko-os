document.addEventListener('click', (e) => {
    const tile = e.target.closest('.qs-tile');
    if (!tile) return;

    // TOGGLE TILE
    if (tile.classList.contains('is-toggle')) {
        const checkbox = tile.querySelector('.qs-checkbox');
        const isOn = tile.classList.toggle('active');

        if (checkbox) checkbox.checked = isOn;
        tile.setAttribute('aria-checked', isOn);

        // Optional haptic
        if (navigator.vibrate) navigator.vibrate(20);

        // Example hook
        console.log(tile.innerText.trim(), isOn ? 'ON' : 'OFF');
        return;
    }

    // NORMAL BUTTON
    console.log('Button pressed:', tile.innerText.trim());
});

// QUICK SETTINGS TOGGLE
document.querySelectorAll('.qs-tile.is-toggle').forEach(tile => {
    tile.addEventListener('click', () => {
        const checkbox = tile.querySelector('.qs-checkbox');
        checkbox.checked = !checkbox.checked;
        tile.setAttribute('aria-checked', checkbox.checked);
    });
});

// COMPACT QUICK SETTINGS (from notification shade)
document.querySelectorAll('.qs-btn-small').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        btn.classList.toggle('active');
    });
});
