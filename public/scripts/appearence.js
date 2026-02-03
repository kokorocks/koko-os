let appIconShapes='squircle'
appIconShapes = 'circle'

let backgroundMove=true;

switch (appIconShapes) {
    case 'squircle':
        //document.documentElement.style.setProperty('--app-icon-border-radius', '20%');
        break;
    case 'circle':
        document.documentElement.style.setProperty('--app-icon-border-radius', '50%');
        break;
    case 'hexagon':
        document.documentElement.style.setProperty('--app-icon-border-radius', '0%');
        document.querySelectorAll('.app-icon').forEach(icon => {
            icon.style.clipPath = 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)';
        });
        break;
}

