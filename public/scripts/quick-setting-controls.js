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
