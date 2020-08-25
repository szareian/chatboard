const socket = io('/')
const myPeer = new Peer(undefined, {
    path: '/peerjs',
    host: '/',
    port: '443',
})

const remoteVideo = document.querySelector('video.video_guest');
const myVideo = document.querySelector('video.video_local');
myVideo.muted = true; // mute ourselves

call_end_btn = document.getElementById('call_end_btn');
var mediaStream;
const peers = {};

socket.on('userCount', userCount => {
    numUsers = userCount[ROOM_ID];
    switch (numUsers) {
        case 1:
            // console.log('One user');

            call_end_btn.setAttribute("disabled", "disabled");
            activateLocalVideo();
            break;
        case 2:
            // console.log('Two users');
            // if (document.getElementById('call_end_btn').clicked == true) {
            //     userCount = 1;
            //     console.log("button clicked with user count: ", userCount);

            // }

            call_end_btn.removeAttribute('disabled');
            activateMiniVideo();
            break;
        default:
            // console.log('Default user');

            call_end_btn.setAttribute("disabled", "disabled");
            activateLocalVideo();
            break;
    }

    console.log("user Count: ", numUsers);

})

navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
}).then( stream => {
    mediaStream = stream;
    addVideoStream(myVideo, stream);

    myPeer.on('call', call => {
        call.answer(stream);
        call.on('stream', userVideoStream => {
            addVideoStream(remoteVideo, userVideoStream);
        })
    })

    socket.on('user-connected', userId => {
        connectToNewUser(userId, stream);
    })
})

socket.on('user-disconnected', userId => {
    if(peers[userId]){
        peers[userId].close();
    }
    console.log('User Disconnected');
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

    peers[userId] = call;
}

function addVideoStream(video,stream) {
    video.srcObject = stream;
    video.addEventListener('loadedmetadata', () => {
        video.play();
    })
}

function cameraOnOff() {
    camera = document.getElementById('videocam');
    camera.setAttribute('name', camera.name == 'camera-video'? 'camera-video-off': 'camera-video');
    
    mediaStream.getVideoTracks()[0].enabled = !mediaStream.getVideoTracks()[0].enabled;
}

function micOnOff() {
    mic = document.getElementById('mic');
    mic.setAttribute('name', mic.name == 'mic' ? 'mic-mute' : 'mic');
    
    mediaStream.getAudioTracks()[0].enabled = !mediaStream.getAudioTracks()[0].enabled;
}

var exitRoom = () => {
    // Remove all tracks and set the srcObject to null
    mediaStream.getTracks().forEach((track) => {
        console.log('track: ', track);

        track.stop();
    });

    mediaStream.srcObject = null;
    // Remove the guest video element 
    remote_guest_video = document.querySelector('.video_guest');
    remote_guest_video.remove();

    // set the number of users to one
    // socket.on('userCount', userCount => {
    //     userCount = 1;
    //     console.log("User Count inside exitRoom:", userCount);
        
    // })

    // Disable the call_end button
    call_end_btn.setAttribute("disabled", "disabled");

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