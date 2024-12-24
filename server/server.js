const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

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

// Serve static files from the 'client' directory
app.use(express.static(path.join(__dirname, '..', 'client')));  // <-- Serve static files from the client folder

// Serve the index.html for the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'client', 'index.html')); // Go back one directory and then serve index.html
});

// Serve a simple API route
app.get('/api', (req, res) => {
    res.json({ message: 'Atoms Backend is Running! and FAST!!!' });
});



// WebSocket connections
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Handle custom events (e.g., 'move', 'disconnect')
    socket.on('move', (data) => {
        console.log(`Move received from ${socket.id}:`, data);
        socket.broadcast.emit('update', data);
    });

    // Handle mouse click events
    socket.on('mouseClick', (data) => {
        console.log('Mouse clicked at:', data);
        socket.broadcast.emit('updateAtoms', data); // Broadcast the atom data to all other clients
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
