//const { Polygon } = require("babylonjs");

let appIconShapes='squircle'
appIconShapes = 'circle'
let polygon = 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)'
let backgroundMove=true;
let backgroundImage = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80'
let virtual_brightness=false;
let colorScheme='dark';//'light';

//currentPage = 2

console.log(document.querySelector('.screen-container'))

const mainScreen = document.getElementById('mainScreen');
mainScreen.style.transition = 'filter 0s ease';
if (virtual_brightness) mainScreen.style.filter = 'brightness(1.1) contrast(1.04) saturate(1.08)';



if (backgroundImage) document.documentElement.style.setProperty('--background-image', `url(${backgroundImage}) center/cover no-repeat`);

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

