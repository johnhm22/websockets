const socket = io('http://localhost:3500');

const sendMessage = (e) => {
  e.preventDefault();
  const input = document.querySelector('input');
  if (input.value) {
    socket.emit('chat message', input.value);
    input.value = '';
  } else {
    console.log('there is no input value');
  }
  input.focus();
};

document.querySelector('form').addEventListener('submit', sendMessage);

//Listen for messages
socket.on('message', (data) => {
  const li = document.createElement('li');
  li.textContent = data;
  document.querySelector('ul').appendChild(li);
});
