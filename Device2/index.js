const io = require('socket.io-client');

const serverUrl = 'http://localhost:3000';

const socket = io(serverUrl);

const deviceDetails = {
  imei: '123456',
  serialNo: 'ABC12345',
};

socket.emit('registerDevice', deviceDetails);

socket.on('registrationSuccess', (data) => {
  console.log(data.message);
});

socket.on('factoryResetNotification', (data) => {
    console.log('Received factory reset notification:', data.message);
  
  });
  socket.on('fileNotification', (data) => {
    console.log('Received file notification',data.message);
  });

