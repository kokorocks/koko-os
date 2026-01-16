
/*
<video id="videoPlayer" controls muted src="your_video_file.mp4" style="display:none;"></video>
<canvas id="canvas" style="display:none;"></canvas>
<img id="lastFrameImage" alt="Last frame of video">
<button onclick="captureLastFrame()">Capture Last Frame</button>
 */

function captureLastFrame(vid='videoPlayer') {
    const video = document.getElementById('videoPlayer');
    const canvas = document.getElementById('canvas');
    //const img = document.getElementById('lastFrameImage');

    if (!video.src) {
        console.error("Video source is not set.");
        return;
    }

    // Wait for the video metadata to load so duration is available
    video.addEventListener('loadeddata', function handleLoadedData() {
        video.removeEventListener('loadeddata', handleLoadedData); // Remove the listener once done

        // Seek to the end of the video
        video.currentTime = video.duration;
    });

    // Wait until the video has sought to the requested time (the end)
    video.addEventListener('seeked', function handleSeeked() {
        video.removeEventListener('seeked', handleSeeked); // Remove the listener once done

        // Set canvas dimensions to match the video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw the current video frame onto the canvas
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert the canvas image to a data URL and display it in the <img> tag
        src = canvas.toDataURL('image/png');
        const c=document.getElementById('screen-container')
        c.style.backgroundImage='url('+src+')'
        
        // Optional: ensure the video remains at the last frame and is paused
        video.remove();
    });

    // If the video is already loaded and seekable, immediately seek to the end
    if (video.readyState >= 2) { // HTMLMediaElement.HAVE_CURRENT_DATA or greater
        video.currentTime = video.duration;
    }
}
