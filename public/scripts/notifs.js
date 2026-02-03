let activeNotification = null;
let notificationQueue = [];

function showNotification(title, message, iconClass = 'fa-bell', bgColor = '#007AFF', duration = 4000) {
    // Remove existing banner notification
    if (activeNotification) {
        activeNotification.remove();
    }

    const notif = document.createElement('div');
    notif.className = 'system-notif';
    notif.innerHTML = `
        <div class="notif-icon-box" style="background: ${bgColor};">
            <i class="fas ${iconClass}"></i>
        </div>
        <div class="notif-content">
            <div class="notif-title">${title}</div>
            <div class="notif-desc">${message}</div>
        </div>
        <div class="notif-dismiss-hint">← Swipe</div>
    `;

    document.querySelector('.screen-container').appendChild(notif);
    activeNotification = notif;

    // Animation in
    setTimeout(() => notif.classList.add('show'), 10);

    // Touch handling
    let startX = 0;
    let currentX = 0;
    let isDragging = false;

    notif.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        currentX = 0;
        isDragging = true;
        notif.style.transition = 'none';
    }, { passive: true });

    notif.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        currentX = e.touches[0].clientX - startX;
        if (currentX < 0) {
            notif.style.transform = `translateX(${currentX}px)`;
        }
    }, { passive: true });

    notif.addEventListener('touchend', (e) => {
        isDragging = false;
        
        if (currentX < -80) {
            // Dismiss
            notif.style.transition = 'all 0.3s ease';
            notif.style.transform = 'translateX(-500px)';
            notif.style.opacity = '0';
            setTimeout(() => {
                if (notif.parentNode) notif.remove();
                activeNotification = null;
            }, 300);
        } else if (currentX < -30) {
            // Minimize to notification center
            notif.style.transition = 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
            notif.style.transform = 'translateY(500px) scale(0.5)';
            notif.style.opacity = '0';
            
            setTimeout(() => {
                addToNotificationCenter(title, message, iconClass, bgColor);
                if (notif.parentNode) notif.remove();
                activeNotification = null;
            }, 400);
        } else {
            // Reset
            notif.style.transition = 'all 0.3s ease';
            notif.style.transform = 'translateX(0)';
        }
    }, { passive: true });

    notif.addEventListener('click', (e) => {
        if (Math.abs(currentX) < 20 && !isDragging) {
            console.log('Notification clicked:', title);
            notif.remove();
            activeNotification = null;
        }
    });

    // Auto dismiss after duration
    if (duration) {
        setTimeout(() => {
            if (activeNotification === notif) {
                notif.style.transition = 'all 0.3s ease';
                notif.style.transform = 'translateX(-500px)';
                notif.style.opacity = '0';
                setTimeout(() => {
                    if (notif.parentNode) notif.remove();
                    activeNotification = null;
                }, 300);
            }
        }, duration);
    }
}

function addToNotificationCenter(title, message, iconClass, bgColor) {
    const notifSection = document.querySelector('.notif-section-compact');
    if (!notifSection) return;

    const notifEl = document.createElement('div');
    notifEl.className = 'glass-notif';
    notifEl.innerHTML = `
        <div class="notif-icon-box" style="background: ${bgColor};">
            <i class="fas ${iconClass}"></i>
        </div>
        <div class="notif-content">
            <div class="notif-title">${title}</div>
            <div class="notif-desc">${message}</div>
        </div>
        <div class="notif-time">now</div>
    `;

    notifEl.addEventListener('click', () => {
        console.log('Notification center item clicked:', title);
        notifEl.remove();
    });

    notifSection.appendChild(notifEl);
    document.getElementById('notifShade').classList.add('has-notif');
}

// Remove test notification - comment out when done testing
//showNotification('Download Complete', 'Maps v2.0 installed successfully', 'fa-download', '#34C759', 3000);