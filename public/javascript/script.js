const socket = io('/')
const videoGrid = document.getElementById('video-grid')
const myPeer = new Peer(undefined, {
    path: '/peerjs',
    host: '/',
    port: '443',
    // debug: 3,
})

const myVideo = document.querySelector('video.mini_video')
myVideo.muted = true // mute ourselves

const peers = {}

navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
}).then( stream => {
    addVideoStream(myVideo, stream)

    myPeer.on('call', call => {
        call.answer(stream)
        // if(!myVideo){
        //     console.log(myVideo);
            
        // }
        const myVideo = document.querySelector('video.video_guest')
        call.on('stream', userVideoStream => {
            addVideoStream(myVideo, userVideoStream)
        })
    })

    socket.on('user-connected', userId => {
        connectToNewUser(userId, stream) 
    })
})

socket.on('user-disconneted', userId => {
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
    
    call.on('stream', userVideoStream => {
        addVideoStream(video, userVideoStream)
    })

    call.on('close', () => {
        video.remove()
    })

    peers[userId] = call
}

function addVideoStream(video,stream) {
    video.srcObject = stream
    video.addEventListener('loadedmetadata', () => {
        video.play()
    })
    // video.classList.add('align-middle');
    // videoGrid.append(video)
}