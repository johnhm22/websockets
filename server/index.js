import express from 'express';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3500;

const app = express();

app.use(express.static(path.join(__dirname, 'public')));

const expressServer = app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});

const io = new Server(expressServer, {
  cors: {
    origin:
      process.env.NODE_ENV === 'production'
        ? false
        : ['http://localhost:5500', 'http://127.0.0.1:5500'],
  },
});

// Listening on the connection event for incoming sockets
io.on('connection', (socket) => {
  // Upon connection - only to user
  socket.emit('message', 'Welcome to chat app');

  io.emit('initial message', `${socket.id.substring(0, 5)} has joined`);

  // Upon connection - to all others
  socket.broadcast.emit(
    'message',
    `${socket.id.substring(0, 5)} has connected`,
  );

  // Listening for a message event
  socket.on('chat message', (data) => {
    io.emit('message', `${socket.id.substring(0, 5)}: ${data}`);
  });

  // When user disconnects - to all others
  socket.on('disconnect', () => {
    socket.broadcast.emit(
      'message',
      `User ${socket.id.substring(0, 5)} disconnected`,
    );
  });

  // Listen for activity
  socket.on('activity', (name) => {
    socket.broadcast.emit('activity', name);
  });
});

// httpServer.listen(3500, () => console.log('listening on port 3500'));
