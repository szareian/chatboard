const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const { v4: uuidV4 } = require('uuid');
const PORT = process.env.PORT || 443;
const cors = require('cors');
const { ExpressPeerServer } = require('peer');
 
const peerServer = ExpressPeerServer(server, {
    debug: true,
});

var userCount = {};

app.use(cors())
app.use('/peerjs', peerServer);

app.set('view engine', 'ejs');

app.use(express.static(__dirname + '/public'));

app.get('/left-chat-room', (req, res) => {
    res.render('left-room');
})

app.get('/', (req,res) => {
    res.redirect(`/${uuidV4()}`);
})

app.get('/:room', (req,res) => {
    res.render('room', { roomId: req.params.room });
})


io.on('connection', socket => {
    socket.on('join-room', (roomId, userId) => {
        socket.join(roomId);
        socket.to(roomId).broadcast.emit('user-connected', userId);

        // keep track of the number of users in each room
        if (userCount[roomId] == undefined){
            userCount[roomId] = 1;
        } else {
            userCount[roomId]++;
        }
        io.sockets.emit('userCount', userCount);

        socket.on('disconnect', () => {
            socket.to(roomId).broadcast.emit('user-disconnected', userId);
            
            userCount[roomId]--;

            if (userCount[roomId] == 0) {
                delete userCount[roomId];
            }
            io.sockets.emit('userCount', userCount);
        })

        socket.on('error', (error) => {
            console.log(error);   
        });
    })
})

server.listen(PORT, () => { console.log(`Server is running on ${PORT}`); })