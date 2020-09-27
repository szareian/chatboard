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

app.get('/', (req, res) => {
    res.render('home');
})

app.get('/room/', (req, res) => {
    res.redirect(`/room/${uuidV4()}`);
})

app.get('/room/:room', (req, res) => {
    res.render('room', { roomId: req.params.room });
})

app.get('/*', (req, res) => {
    res.redirect('/');
})

io.on('connection', socket => {
    socket.on('join-room', (roomId, userId) => {
        // Redirect the user to the home page if room is full (i.e. 2 users in the room)
        if (userCount[roomId] == 2) {
            destination = '/';
            socket.emit('room-full', destination);
        }
        else {
            socket.join(roomId);
            socket.to(roomId).broadcast.emit('user-connected', userId);

            // keep track of the number of users in each room
            if (userCount[roomId] == undefined) {
                userCount[roomId] = 1;
            } else {
                userCount[roomId]++;
            }

            socket.on('send-chat-message', message => {
                socket.to(roomId).broadcast.emit('chat-message', message);
            })

            io.sockets.emit('userCount', userCount);

            socket.on('disconnect', () => {
                socket.to(roomId).broadcast.emit('user-disconnected', userId);

                userCount[roomId]--;

                if (userCount[roomId] == 0) {
                    delete userCount[roomId];
                }
                io.sockets.emit('userCount', userCount);

                // manually remove the userId and disconnect the socket to avoid the few seconds timeout period
                delete userId;
                socket.disconnect();
            })

            socket.on('error', (error) => {
                console.log(error);
            });
        }
    })

})

server.listen(PORT, () => { console.log(`Server is running on ${PORT}`); })