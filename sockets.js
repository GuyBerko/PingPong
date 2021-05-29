const { v4: uuidv4 } = require('uuid');

function generatRoomName() {
    var result = [];
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < 10; i++) {
        result.push(characters.charAt(Math.floor(Math.random() * charactersLength)));
    }
    return result.join('');
}

function listen(io) {
    const pingPongNameSpace = io.of('/ping-pong');

    const connectedPlayers = new Map();
    const roomsList = new Map();
    let waitingUser, waitingRoom = undefined;

    pingPongNameSpace.on('connection', (socket) => {
        let authToken = socket.handshake.auth.token;
        let roomId;

        if (!authToken) {
            authToken = uuidv4();
            pingPongNameSpace.to(socket.id).emit('new-connect', authToken);
        }

        connectedPlayers.set(authToken, socket.id);

        socket.on('ready', () => {
            if (!waitingUser) {
                waitingUser = authToken;
                waitingRoom = generatRoomName();
                roomId = waitingRoom;
                socket.join(waitingRoom);
            } else {
                socket.join(waitingRoom);
                pingPongNameSpace.in(waitingRoom).emit('startGame', connectedPlayers.get(waitingUser));
                roomsList.set(waitingRoom, { primery: connectedPlayers.get(waitingUser), secondary: socket.id });
                roomId = waitingRoom;
                waitingUser = undefined;
                waitingRoom = undefined;
            }
        });

        socket.on('paddleMove', (paddleData) => {
            socket.to(roomId).emit('paddleMove', paddleData);
        });

        socket.on('ballMove', (ballData) => {
            socket.to(roomId).emit('ballMove', ballData);
        });

        socket.on('disconnect', () => {
            const roomPlayers = roomsList.get(roomId);
            if (!roomPlayers) return;

            const secondPlayer = (roomPlayers.primery !== socket.id) ? roomPlayers.primery : roomPlayers.secondary;

            pingPongNameSpace.to(secondPlayer).emit('game-over');

            connectedPlayers.delete(authToken);
            roomsList.delete(roomId);
            socket.leave(roomId);
        });
    });
}

module.exports = {
    listen
}