    const screen = document.getElementById('mainScreen');
    const hammer = new Hammer(screen);
    hammer.get('swipe').set({ direction: Hammer.DIRECTION_ALL });
    hammer.get('pan').set({
      direction: Hammer.DIRECTION_VERTICAL,
      threshold: 0
    });


    const shade = document.getElementById('notifShade');
    const drawer = document.getElementById('appDrawer');
    const infoPopup = document.getElementById('infopopup');
    let appopen = document.getElementById('appFrame');

    hammer.on('swipeleft', () => {
        if(currentPage < pages.length - 1 && !isDragging && !infoPopup.classList.contains('open') && !folderModal.classList.contains('open')) {
            currentPage++;
            render();
        }
        if(infoPopup.classList.contains('open')) infoPopup.classList.remove('open');
    });

    hammer.on('swiperight', () => {
        if(currentPage > 0 && !isDragging && !folderModal.classList.contains('open')) {
            currentPage--;
            render();
        } else if(!isDragging && currentPage === 0 && !folderModal.classList.contains('open')){
            if(!infoPopup.classList.contains('open')) openInfo('news');
        }
    });

hammer.on('swipeup', (e) => {
    const startY = e.center.y - e.deltaY;

    //const appIsOpen = appopen.classList.contains('open') //appopen && appopen.isConnected;
    const openApp = getOpenApp();
    const appIsOpen = !!openApp;

    if (
        startY > window.innerHeight * 0.90 &&
        !drawer.classList.contains('open') &&
        !folderModal.classList.contains('open') &&
        !shade.classList.contains('open') &&
        !infoPopup.classList.contains('open') &&
        !appIsOpen
    ) {
        drawer.classList.add('open');
    } 
    else if (shade.classList.contains('open')) {
        closeShade();
    } 
    else if (infoPopup.classList.contains('open')) {
        infoPopup.classList.remove('open');
    } 
    else if (appIsOpen && startY > window.innerHeight * 0.95) {
        const endY = e.center.y - e.deltaY + e.deltaY; // same thing
        openAppPreviews()
                // Close app


    if(appIsOpen || document.getElementById('appFrame') !== null) {
        openAppPreviews();

        /*const currentApp = document.getElementById('appFrame');
        alert(e.velocityY)
        if (endY > window.innerHeight * 0.6 || e.velocityY < -1) {
            if(currentApp){
            // Close app
            currentApp.classList.remove('open');
            currentApp.classList.add('closing');
            //currentApp.classList.add('closed');
            // Wait for animation before removing
            setTimeout(() => {
                if (currentApp) {
                    currentApp.classList.remove('closing');
                    currentApp.classList.add('closed');
                    currentApp.id = 'closed';
                    //appopen.remove();
                    //appopen = null;
                }
            }, 350);}
            
        } else {
            currentApp.classList.remove('open');
            currentApp.classList.add('closing');
                        setTimeout(() => {
                if (currentApp) {
                    currentApp.classList.remove('closing');
                    currentApp.classList.add('closed');
                    currentApp.id = 'closed';
                    openAppPreviews();
                    //appopen.remove();
                    //appopen = null;
                }
            }, 350);
        }*/
    }}
});
        /*
        appopen.classList.remove('open');
        appopen.classList.add('closing');

        // Wait for animation before removing
        setTimeout(() => {
            if (appopen) {
                appopen.remove();
                appopen = null;
            }
        }, 350);*/
//    }
//});


hammer.on('swipedown', (e) => {
    const startY = e.center.y - e.deltaY;
    // Swipe down from top ~15% of screen
    if(startY < window.innerHeight * 0.10 && !shade.classList.contains('open') && !folderModal.classList.contains('open')) {
        shade.classList.add('open');
    } else if(drawer.classList.contains('open')) {
        closeDrawer();
    }
});