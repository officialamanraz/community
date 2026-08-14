const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const path = require('path'); // Added correctly at the top
const http = require('http'); 
const { Server } = require('socket.io');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Static folder setup for uploaded images


// Express app wrapped in HTTP server
const server = http.createServer(app);

// Socket.io setup attached to server
const io = new Server(server, {
    cors: {
        origin: '*', 
        methods: ["GET", "POST"]
    }
});

// Socket.io connection logic
io.on('connection', (socket) => {
    console.log(`[SOCKET] User Connected: ${socket.id}`);

    // When user enters a room
    socket.on('join_room', (room_id) => {
        socket.join(room_id);
        console.log(`User ${socket.id} joined room: ${room_id}`);
    });

    // When user sends a message
    socket.on('send_message', (data) => {
        // Send message to everyone else in the room
        socket.to(data.room_id).emit('receive_message', data);
    });

    socket.on('disconnect', () => {
        console.log(`[SOCKET] User Disconnected: ${socket.id}`);
    });
});

// Routers
const authRouter = require('./router/sign'); 
const roomRouter = require('./router/room');
const postRouter = require('./router/post');
const commentRouter = require('./router/comment');
const likeRouter = require('./router/like');
const messageRouter = require('./router/message');
const reportRouter = require('./router/report');
const profileRouter = require('./router/profile')
const bannerRouter = require('./router/banner');
// API Routes
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/banners',bannerRouter)
app.use('/profile',profileRouter)
app.use('/sign', authRouter);
app.use('/rooms', roomRouter);
app.use('/posts', postRouter);
app.use('/comments', commentRouter);
app.use('/likes', likeRouter);
app.use('/messages', messageRouter);
app.use('/reports', reportRouter);

// Health check route
app.get('/', (req, res) => {
    res.send("Community Center API is running smoothly!");
});

// DEFINED THE PORT HERE so it doesn't crash
const PORT = process.env.PORT ;

server.listen(PORT, () => {
    console.log(`[SERVER] Running on http://localhost:${PORT}`);
});