function requestPermission(appId, done) {
    const app = appDB[appId];
    if (!app || !Array.isArray(app.permissions) || app.permissions.length === 0) {
        done([]); // nothing to request
        return;
    }

    const granted = [];
    let i = 0;

    function next() {
        if (i >= app.permissions.length) {
            done(granted); // ✅ call the "done" function when finished
            return;
        }

        const perm = app.permissions[i++];
        const key = `permission_${appId}_${perm}`;

        // Already granted?
        if (localStorage.getItem(key) === 'granted') {
            granted.push(perm);
            next();
            return;
        }

        // Show your custom confirm/prompt UI
        showSystemNotif({
            title: `Permission request`,
            message: `Allow "${perm}" for ${app.name}?`,
            type: 'confirm',
            callback: (ok) => {
                if (ok) {
                    localStorage.setItem(key, 'granted');
                    granted.push(perm);
                }
                next(); // 🔥 continue to next permission
            }
        });
    }
    //done(granted)
    next(); // start the loop
}
