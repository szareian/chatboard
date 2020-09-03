const socket = io('/')
const myPeer = new Peer(undefined, {
    path: '/peerjs',
    host: '/',
    port: '443',
})

call_end_btn = document.getElementById('call_end_btn');
var mediaStream;
var numUsers;
const peers = {};

// Video Conferencnig variables
const remoteVideo = document.querySelector('video.video_guest');
const myVideo = document.querySelector('video.video_local');
myVideo.muted = true; // mute ourselves

// Text messaging feature variables
const sendContainer = document.getElementById('send-container');
const messageInput = document.getElementById("message-input");
const messageContainer = document.querySelector('.msg_card_body');

socket.on('chat-message', message => {
    appendMessage(message, 'other_messages');
    // console.log(data.message);
})

sendContainer.addEventListener('submit', e => {
    e.preventDefault();
    const message = messageInput.value;

    // Append messages sent by You
    appendMessage(`${message}`, 'my_messages');

    // Emit the messages to the other users
    socket.emit('send-chat-message', message);

    // blank the message box
    messageInput.value = '';
})


function appendMessage(message, type) {
    var time = new Date().toLocaleTimeString();

    const messageEl = document.createElement('div');
    if (type == "my_messages") {
        messageEl.setAttribute('class', 'd-flex justify-content-start mb-4');
        messageEl.innerHTML = document.getElementById('my_msg').innerHTML;
        messageEl.getElementsByClassName('text_content')[0].innerText = message;
        messageEl.querySelector('span.msg_time').innerHTML = time;
    }
    else {
        messageEl.setAttribute('class', 'd-flex justify-content-end mb-4');
        messageEl.innerHTML = document.getElementById('other_msg').innerHTML;
        messageEl.getElementsByClassName('text_content')[0].textContent = message;
        messageEl.querySelector('span.msg_time_send').innerHTML = time;
    }
    // console.log(messageEl);
    messageContainer.append(messageEl);

    // scroll down to the most recent message
    messageContainer.scrollTop = messageContainer.scrollHeight;
}

socket.on('userCount', userCount => {
    numUsers = userCount[ROOM_ID];
    switch (numUsers) {
        case 1:
            activateLocalVideo();
            break;
        case 2:
            activateMiniVideo();
            break;
        default:
            activateLocalVideo();
            break;
    }
})

navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
}).then(stream => {
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
    if (peers[userId]) {
        peers[userId].close();
    }
    // console.log('User Disconnected');
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

function addVideoStream(video, stream) {
    video.srcObject = stream;
    video.addEventListener('loadedmetadata', () => {
        video.play();
    })
}

function cameraOnOff() {
    camera = document.getElementById('videocam');
    camera.setAttribute('name', camera.name == 'camera-video' ? 'camera-video-off' : 'camera-video');

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
        track.stop();
    });

    mediaStream.srcObject = null;

    // Remove the guest video element 
    remote_guest_video = document.querySelector('.video_guest');
    remote_guest_video.remove();

    // Redirect the user to the home page
    window.location.href = '/';
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