const video = document.querySelector('video#my_stream');
const newRoombtn = document.querySelector('sl-button');

navigator.mediaDevices.getUserMedia({
    video: true,
    audio: false
}).then(stream => {
    video.srcObject = stream;
    video.addEventListener('loadedmetadata', () => {
        video.play();
    })
})

var openNewRoom = () => {
    newRoombtn.setAttribute("loading", "");
    // Redirect the user to a new chat room page
    window.location.href = '/room';
}