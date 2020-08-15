const express = require('express');
const app = express();
const cors = require('cors')
app.use(cors())
const server = require('http').Server(app);
const io = require('socket.io')(server);
const { v4: uuidV4 } = require('uuid');
const PORT = process.env.PORT || 443;
const { ExpressPeerServer } = require('peer');

const peerServer = ExpressPeerServer(server, {
    debug: true
});
app.use('/api/peerjs', peerServer);

app.set('view engine', 'ejs')
app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + "/client-side/dist/client-side"));

app.get('/api/', (req,res) => {
    res.redirect(`/api/${uuidV4()}`)
})

app.get('/api/:room', (req,res) => {
    res.render('room', { roomId: req.params.room })
})


io.on('connection', socket => {
    socket.on('join-room', (roomId, userId) => {
        socket.join(roomId)
        socket.to(roomId).broadcast.emit('user-connected', userId)
        
        socket.on('disconnect', () => {
            socket.to(roomId).broadcast.emit('user-disconneted', userId)
        })
    })
})

app.get('/', (req, res) => {
    res.sendFile(__dirname + "/client-side/dist/client-side/index.html")
});

server.listen(PORT, () => { console.log(`Server is running on ${PORT}`); })