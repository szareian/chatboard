const video = document.querySelector('video#my_stream');

navigator.mediaDevices.getUserMedia({
    video: true,
    audio: false
}).then(stream => {
    video.srcObject = stream;
    video.addEventListener('loadedmetadata', () => {
        video.play();
    })
})