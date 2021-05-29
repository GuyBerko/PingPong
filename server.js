const http = require('http');
const io = require('socket.io');

const apiServer = require('./api');

const httpServer = http.createServer(apiServer);
const socketServer = io(httpServer, {
    cors: {
        origin: 'http://localhost:8080',
        methods: ["GET", "POST"]
    }
});

const sockets = require('./sockets');

const PORT = 3000;

httpServer.listen(PORT); 

console.log(`listening on port ${PORT}`);


sockets.listen(socketServer);