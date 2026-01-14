if(!gestures){
    const re = document.querySelector('.appsbar');
    console.log(re);

    re.outerHTML = `
        <div id="buttons">
        <i class="fa-solid fa-play" style="transform: rotate(180deg); color: #B197FC;"></i>
        <!--i class="fa-regular fa-circle" style="color: #B197FC;"></i-->
        <i class="fa-solid fa-circle" style="color: #B197FC;"></i>
        <i class="fa-solid fa-square" style="color: #B197FC;" onclick='openAppPreviews()'></i>
        </div>
    `;
    document.querySelector('.dock').style.bottom = '25px'
}
