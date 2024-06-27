const socket = io('http://localhost:3500');

const activity = document.querySelector('.activity');
const msgInput = document.querySelector('input');

const sendMessage = (e) => {
  e.preventDefault();

  if (msgInput.value) {
    socket.emit('chat message', msgInput.value);
    msgInput.value = '';
  } else {
    console.log('there is no input value');
  }
  msgInput.focus();
};

document.querySelector('form').addEventListener('submit', sendMessage);

// Display an h2 of new user connection in index.html
socket.on('initial message', (data) => {
  const h2 = document.querySelector('h2');
  h2.textContent = data;
  setTimeout(() => {
    h2.textContent = '';
  }, 5000);
});

//Listen for messages
socket.on('message', (data) => {
  activity.textContent = '';
  const li = document.createElement('li');
  li.textContent = data;
  document.querySelector('ul').appendChild(li);
});

msgInput.addEventListener('keypress', () => {
  socket.emit('activity', socket.id.substring(0, 5));
});

let activityTimer;
socket.on('activity', (name) => {
  activity.textContent = `${name} is typing...`;

  // Clear after 2 seconds
  setTimeout(() => {
    activity.textContent = '';
  }, 2000);
});
