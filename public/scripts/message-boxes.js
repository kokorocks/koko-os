function showSystemNotif({
    title = '',
    message = '',
    type = 'alert',
    placeholder = '',
    callback
}) {
    const notif = document.createElement('div');
    notif.className = 'system-notif';

    // 1. TOP SECTION: Icon and Text side-by-side
    const header = document.createElement('div');
    header.className = 'notif-header';

    const iconBox = document.createElement('div');
    iconBox.className = 'notif-icon-box';
    iconBox.innerHTML = type === 'alert' ? '⚠️' : type === 'confirm' ? '❓' : '📝';
    header.appendChild(iconBox);

    const content = document.createElement('div');
    content.className = 'notif-content';
    content.innerHTML = `<div class="notif-title">${title}</div>`;
    if (message) content.innerHTML += `<div class="notif-desc">${message}</div>`;
    
    header.appendChild(content);
    notif.appendChild(header);

    // 2. MIDDLE SECTION: Input (Full width, below header)
    let inputElem = null;
    if (type === 'prompt') {
        inputElem = document.createElement('input');
        inputElem.className = 'notif-input';
        inputElem.placeholder = placeholder;
        notif.appendChild(inputElem);
        setTimeout(() => inputElem.focus(), 100);
    }

    // 3. BOTTOM SECTION: Buttons (Right-aligned)
    const buttonRow = document.createElement('div');
    buttonRow.className = 'notif-buttons';

    const okBtn = document.createElement('button');
    okBtn.className = 'confirm';
    okBtn.textContent = type === 'alert' ? 'OK' : 'Confirm';
    
    const handleAction = (val) => {
        cleanup();
        if (callback) callback(val); // This sends the data back
    };

    okBtn.onclick = () => handleAction(type === 'prompt' ? inputElem.value : true);

    if (type !== 'alert') {
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'cancel';
        cancelBtn.textContent = 'Cancel';
        cancelBtn.onclick = () => handleAction(type === 'prompt' ? null : false);
        buttonRow.appendChild(cancelBtn);
    }

    buttonRow.appendChild(okBtn);
    notif.appendChild(buttonRow);

    //document.body.appendChild(notif);
    const container = document.getElementById('mainScreen')// || document.body;
    container.appendChild(notif);
    requestAnimationFrame(() => notif.classList.add('show'));

    function cleanup() {
        notif.classList.remove('show');
        setTimeout(() => notif.remove(), 300);
    }
}

// Override Globals
window.alert = (msg) => showSystemNotif({ title: String(msg), type: 'alert' });
window.confirm = (msg) => new Promise(res => showSystemNotif({ title: String(msg), type: 'confirm', callback: res }));
window.prompt = (msg, def) => new Promise(res => showSystemNotif({ title: String(msg), type: 'prompt', placeholder: def, callback: res }));