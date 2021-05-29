require("dotenv").config();
require('rootpath')(); 
const express = require('express');
const app = express(); 


const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser'); 
const cors = require('cors'); 
const errorHandler = require('_middleware/error-handler');
const morgan = require("morgan"); 
const path = require("path"); 

// const http = require('http').Server(app);
const socketio = require('socket.io');
const chatService = require('./chat/chat-service');



app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());

// allow cors requests from any origin and with credentials
app.use(cors({ origin: (origin, callback) => callback(null, true), credentials: true }));

// Logger
// app.use(morgan("dev"));

// api routes
app.use('/accounts', require('./accounts/accounts.controller'));
app.use('/pets', require('./pets/pets.controller'));
app.use('/treatments', require('./treatments/treatments.controller'));
app.use('/test', (req, res) => res.status(204).json({ success: true }));

// swagger docs route
app.use('/api-docs', require('_helpers/swagger'));

// app.use('/images', express.static(__dirname + '/images'));

app.use(
    '/images',
    express.static(path.resolve(__dirname, "images"))
);

app.use( '/chat', express.static(path.resolve(__dirname, "chat")));



// global error handler
app.use(errorHandler);

// start server
const port = process.env.NODE_ENV === 'production' ? (process.env.PORT || 80) : 4000;
const httpServer = app.listen(port, () => {
    console.log('Server listening on port ' + port);
});

let io = socketio(httpServer, {
  cors: {
    origin: "http://localhost:5200",
  },
});

io.use((socket, next, err) => {
    const jwtToken = socket.handshake.query.jwtToken;
    // console.log('token --> ', jwtToken);

    const user = socket.handshake.query.user;
    if (!user) {return};
    socket.user = JSON.parse(user);
    next();
  });



//Whenever someone connects this gets executed
io.on('connection', (socket) => {

    console.log('SOCKET ID IS', socket.id);
    console.log('USER IS', socket.user);
    console.log('Connections SIZE', io.of("/").sockets.size);
    // console.log('rooms', socket.rooms);

    socket.join(socket.user.id);

    socket.emit('messageFromServer', {data: 'Welcome to server'});

    socket.on("socket log", async (message) => {
        console.log(message)
    });

    socket.emit("usersOnline", getUsersOnline());

    socket.broadcast.emit("user connected", {
        socketId: socket.id,
        user: socket.user,
    });

    socket.on("private message", async ({ content, to }) => {
        console.log('-->' , to)
        socket.to(to).to(socket.user.id).emit("private message", {
            // Send to destination and for himself, case user have another tabs.
            content,
            from: socket.user.id,
            to: to,
            date: new Date().toUTCString()
        });

        // const conversationId = [socket.user.id, to].sort().join('-');
        await chatService.saveMessage({
            from: socket.user.id,
            to: to,
            content: content
        });
    });

    socket.on("open chat tab", async (tutor) => {
        // try to download history
        const history = await chatService.fetchConversation([socket.user.id, tutor.id]);
        socket.emit("fetch history", {
            id: tutor.id,
            history: history
        });
    });

    // Signaling
    socket.on("message", async ({message, to}) => {
        console.log('-->', message.type)
        socket.to(to).emit("messageResponse", {
            message,
            from: socket.user.id,
        });
    });
 
    //Whenever someone disconnects this piece of code executed
    socket.on('disconnect', function () {
       console.log('A user disconnected');
       console.log('Connections SIZE', io.of("/").sockets.size);
       socket.broadcast.emit("user disconnected", socket.user.id);
    });
});

// Socket functions 

function getUsersOnline() {
    const usersOnline = [];
    for (let [id, socket] of io.of("/").sockets) {
        usersOnline.push({
            socketId: id,
            user: socket.user,
        });
    }
    return usersOnline;
}

 
