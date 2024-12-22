const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');



// Initialize app and server
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*', // Allow all origins (change for production)
        methods: ['GET', 'POST']
    }
});

// Middleware
app.use(cors());
app.use(express.json()); // Parse JSON payloads
app.use(require('morgan')('dev'));

// Serve a simple API route
app.get('/api', (req, res) => {
    res.json({ message: 'Atoms Backend is Running!' });
});

// WebSocket connections
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Handle custom events (e.g., 'move', 'disconnect')
    socket.on('move', (data) => {
        console.log(`Move received from ${socket.id}:`, data);

        // Broadcast the move to all other players
        socket.broadcast.emit('update', data);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Start the server
require('dotenv').config();

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
