const fullscreenBtn = document.getElementById('fullscreenBtn');

fullscreenBtn.onclick = () => {
    const el = document.documentElement;
    if (!document.fullscreenElement) {
        if (el.requestFullscreen) el.requestFullscreen();
        else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
        else if (el.msRequestFullscreen) el.msRequestFullscreen();
    } else {
        if (document.exitFullscreen) document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
        else if (document.msExitFullscreen) document.msExitFullscreen();
    }
};

document.getElementById('resetBtn').onclick = () => {
    localStorage.removeItem('glass_os_state_v2');
    location.reload();
};