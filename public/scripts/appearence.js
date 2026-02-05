//const { Polygon } = require("babylonjs");

let appIconShapes='squircle'
appIconShapes = 'circle'
let polygon = 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)'
let backgroundMove=true;

switch (appIconShapes) {
    case 'squircle':
        //document.documentElement.style.setProperty('--app-icon-border-radius', '20%');
        break;
    case 'circle':
        document.documentElement.style.setProperty('--app-icon-border-radius', '50%');
        //document.documentElement.style.setProperty('--mini-app-icon-border-radius', '25%');
        break;
    case 'hexagon':
        document.documentElement.style.setProperty('--app-icon-border-radius', '0%');
        //document.documentElement.style.setProperty('--mini-app-icon-border-radius', '0%');
        document.querySelectorAll('.app-icon').forEach(icon => {
            icon.style.clipPath = polygon;
        });
        document.querySelectorAll('.app-icon').forEach(icon => {
            icon.style.clipPath = polygon;
        });
        break;
}

