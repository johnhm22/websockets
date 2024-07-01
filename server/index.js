import express from 'express';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3500;
const ADMIN = 'Admin';

const app = express();

app.use(express.static(path.join(__dirname, 'public')));

const expressServer = app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});

// state
const UsersState = {
  users: [],
  setUsers: function (newUsersArray) {
    this.users = newUsersArray;
  },
};

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
  socket.emit('message', buildMsg(ADMIN, 'Welcome to chat app'));

  io.emit('initial message', `${socket.id.substring(0, 5)} has joined`);

  socket.on('enterRoom', ({ name, room }) => {
    // leave previous room
    const prevRoom = getUser(socket.id);
    if (prevRoom) {
      socket.leave(prevRoom);
      io.to(prevRoom).emit(
        'message',
        buildMsg(ADMIN, `${name} has left the room`),
      );
    }

    // Removes user from list of users if it exists and then adds it with latest room
    const user = activateUser(socket.id, name, room);

    // cannot update previous room user list until state update in activate user
    if (prevRoom) {
      io.to(prevRoom).emit('userList', {
        users: getUsersInRoom(prevRoom),
      });
    }
    //join room
    socket.join(user.room);

    // to user who joined
    socket.emit(
      'message',
      buildMsg(ADMIN, `You have joined the ${user.room} chat room`),
    );

    // to everyone else in the room
    socket.broadcast
      .to(user.room)
      .emit(
        'message',
        buildMsg(ADMIN, `User ${socket.id.substring(0, 5)} connected`),
      );

    // update user list for room
    io.to(user.room).emit('userList', {
      users: getUsersInRoom(user.room),
    });

    // update rooms list for everyone
    io.emit('roomList', {
      rooms: getAllActiveRooms(),
    });
  });

  // When user disconnects - to all others
  socket.on('disconnect', () => {
    // we get the user leaving
    const user = getUser(socket.id);
    // remove the leaving user from state
    userLeavesApp(socket.id);
    if (user) {
      // a broadcast from Admin to all remaining users in the room
      //this is sent to everyone left in the room; the user has already left
      io.to(user.room).emit(
        'message',
        buildMsg(ADMIN, `${user.name} has left the room`),
      );
      // update the users in the room
      io.to(user.room).emit('userList', {
        users: getUsersInRoom(user.room),
      });
      //update rooms list as the user who left may have been the last to leave in which case the room is no longer active
      io.emit('roomList', {
        rooms: getAllActiveRooms(),
      });
    }
    console.log(`User ${socket.id} disconnected`);
  });

  // Upon connection - to all others
  socket.broadcast.emit(
    'message',
    `${socket.id.substring(0, 5)} has connected`,
  );

  // Listening for a message event
  socket.on('chat message', ({ name, text }) => {
    const { room } = getUser(socket.id);
    if (room) {
      io.to(room).emit('message', buildMsg(name, text));
    }
  });

  // Listen for activity - this tells everyone else in the room if a user is typing
  socket.on('activity', (name) => {
    const { room } = getUser(socket.id);
    if (room) {
      //broadcast sends the message to all except the socket owner
      socket.broadcast.to(room).emit('activity', name);
    }
  });
});

const buildMsg = (name, text) => {
  return {
    name,
    text,
    time: new Intl.DateTimeFormat('default', {
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
    }).format(new Date()),
  };
};

// User functions
const activateUser = (id, name, room) => {
  const user = { id, name, room };
  UsersState.setUsers([
    ...UsersState.users.filter((user) => user.id !== id),
    user,
  ]);
  return user;
};

const userLeavesApp = (id) => {
  UsersState.setUsers(UsersState.users.filter((user) => user.id !== id));
};

const getUser = (id) => {
  return UsersState.users.find((user) => user.id === id);
};

// filters through all users and returns array of users in room argument
const getUsersInRoom = (room) => {
  return UsersState.users.filter((user) => user.room === room);
};

/* returns an array of all rooms where users are present.
map through all users and return Set of rooms. Using a Set means that a room only features once
Then convert Set to array and return the array of active rooms
*/
const getAllActiveRooms = (users) => {
  return Array.from(new Set(UsersState.users.map((user) => user.room)));
};
