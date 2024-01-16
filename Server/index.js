const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const multer = require('multer');
const Device = require('./Device');
const dotenv = require('dotenv');
dotenv.config();
const fs = require('fs');
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

mongoose.connect(process.env.MONGO_URI);
const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

io.on('connection', (socket) => {
  socket.on('registerDevice', async (deviceDetails) => {
    const { imei, serialNo } = deviceDetails;

    const existingDevice = await Device.findOne({ $or: [{ imei }, { serialNo }] });

    if (!existingDevice) {
      const newDevice = new Device(deviceDetails);
      newDevice.save();
      socket.join(imei); 
      socket.emit('registrationSuccess', { message: 'Device registered successfully' });
    } else {
      console.log(`Device with IMEI ${imei} or serial number ${serialNo} connected.`);
    }

    socket.on('disconnect', () => {
      console.log(`Device with IMEI ${imei} disconnected.`);
      io.to(imei).emit('deviceDisconnected', { message: `Device with IMEI ${imei} is disconnected.` });
    });
  });
});

app.use(bodyParser.json());

app.post('/send-file', upload.single('file'), async (req, res) => {
  try {
    const { imei_no } = req.body;
    const file = req.file;

    const device = await Device.findOne({ imei: imei_no });
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    if (file) {
      const fileContent = file.buffer.toString('base64');
      const fileName = 'public/receivedFile.jpg';
      fs.writeFileSync(fileName, Buffer.from(fileContent, 'base64'));

      io.to(imei_no).emit('fileNotification', { message: 'File received' });
    }

    res.status(200).json({ success: true, message: 'File sent successfully' });
  } catch (error) {
    console.error('Error during file transfer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/factory-reset', async (req, res) => {
  try {
    const { imei_no } = req.body;

    const device = await Device.findOne({ imei: imei_no });
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    io.to(imei_no).emit('factoryResetNotification', { message: 'Reset your device' });

    res.status(200).json({ success: true, message: 'Factory reset notification sent successfully' });
  } catch (error) {
    console.error('Error during factory reset:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
