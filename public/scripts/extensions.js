/* TODO: make this code work, 
it will give more features, 
and will add functions to the quick settings
and will allow me to add settings DIRECTLY TO THE SETTINGS APP
        */

const EXTENSIONS = ['events'];
const path = EXTENSIONS[0];
const extPath = `./extensions/${path}/config.json`;

const jsonData = await fetch(extPath).then(r => r.json());

console.log(jsonData);

for (const name of EXTENSIONS) {
    
    const extPath = `./extensions/${name}/config.json`;

    const config = await fetch(extPath).then(r => r.json());

    console.log(config);
    console.log(config.file)
    console.log(config.willChange)

    const iframe=document.getElementById('background-services')

    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    const app = iframeDoc.createElement('script');
    app.type = 'text/javascript';
    app.src = 'scripts/app-functionality.js' // to generate a path lie public/extensions/events/events.js
    app.async = config.async;     
    const script = iframeDoc.createElement('script');
    script.type = 'text/javascript';
    script.src = './extensions/'+name+'/'+config.file; // to generate a path lie public/extensions/events/events.js
    script.async = config.async; 
    
    iframeDoc.head.appendChild(app);
    iframeDoc.head.appendChild(script);

}