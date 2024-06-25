import { createServer } from 'http';
import { Server } from 'socket.io';

const httpServer = createServer();

const io = new Server(httpServer, {
  cors: {
    origin:
      process.env.NODE_ENV === 'production'
        ? false
        : ['http://localhost:5500', 'http://127.0.0.1:5500'],
  },
});

io.on('connection', (socket) => {
  socket.on('chat message', (data) => {
    io.emit('message', `${socket.id.substring(0, 5)}: ${data}`);
  });
  socket.on('chat message', () => {
    console.log('a user connected');
  });
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

httpServer.listen(3500, () => console.log('listening on port 3500'));
