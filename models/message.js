// models/message.js
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    fromName: String,
    date: Date,
    text: String
});

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
