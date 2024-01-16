const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
  imei: {
    type: String,
    required: true,
    unique: true,
  },
  serialNo: {
    type: String,
    required: true,
    unique: true,
  },
});

const Device = mongoose.model('Device', deviceSchema);

module.exports = Device;
