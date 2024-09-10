const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const reminderSchema = new Schema({
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  description: {
    type: String,
    required: true
  },
  reminderDate: {
    type: Date,
    required: true
  },
  isCompleted: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

const Reminder = mongoose.model('Reminder', reminderSchema);
module.exports = Reminder;
