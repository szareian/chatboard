const socket = io('/')
const myPeer = new Peer(undefined, {
    path: '/peerjs',
    host: '/',
    port: '443',
})

socket.on('userCount', userCount => {
    switch (userCount) {
        case 1:
            activateLocalVideo();
            break;
        case 2:
            activateMiniVideo();
        default:
            activateMiniVideo();
            break;
    }
})

const myVideo = document.querySelector('video.video_local');
var mediaStream;
myVideo.muted = true; // mute ourselves

const peers = {};

navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
}).then( stream => {
    mediaStream = stream;
    addVideoStream(myVideo, stream)

    myPeer.on('call', call => {
        call.answer(stream)
        const remoteVideo = document.querySelector('video.video_guest')
        call.on('stream', userVideoStream => {
            addVideoStream(remoteVideo, userVideoStream)
        })
    })

    socket.on('user-connected', userId => {
        connectToNewUser(userId, stream) 
    })
})

socket.on('user-disconnected', userId => {
    if(peers[userId]){
        peers[userId].close()
    }
})

myPeer.on('open', id => {
    socket.emit('join-room', ROOM_ID, id)
})

// connect a new user and send our current stream to them
function connectToNewUser(userId, stream) {
    const call = myPeer.call(userId, stream)
    const video = document.querySelector('video.video_guest')
    
    if (video.classList.contains('deactive')) {
        video.classList.remove('deactive');        
    }

    call.on('stream', userVideoStream => {
        addVideoStream(video, userVideoStream)
    })

    call.on('close', () => {
        video.classList.add('deactive'); 
    })

    peers[userId] = call
}

function addVideoStream(video,stream) {
    video.srcObject = stream
    video.addEventListener('loadedmetadata', () => {
        video.play()
    })
}

function cameraOnOff() {
    camera = document.getElementById('videocam');
    camera.setAttribute('name', camera.name == 'camera-video'? 'camera-video-off': 'camera-video');

    mediaStream.getVideoTracks()[0].enabled = !mediaStream.getVideoTracks()[0].enabled
}

function micOnOff() {
    mic = document.getElementById('mic');
    mic.setAttribute('name', mic.name == 'mic' ? 'mic-mute' : 'mic');

    mediaStream.getAudioTracks()[0].enabled = !mediaStream.getAudioTracks()[0].enabled
}

var activateVideo = () => {
    if (!myVideo.classList.contains('active')) {
        myVideo.classList.add('active');
    }
}

var activateLocalVideo = () => {
    if (myVideo.classList.contains('mini_video')) {
        myVideo.classList.remove('mini_video');
    }
    activateVideo();
}

var activateMiniVideo = () => {
    myVideo.classList.add('mini_video');
    activateVideo();
}
