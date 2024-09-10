const mongoose = require('mongoose');

const EmailHistorySchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  },
  userEmail: { type: String, required: true},
  messages: { type: Array, required: true },
});

module.exports = mongoose.model('EmailHistory', EmailHistorySchema);
