const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const studentSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  surname: {
    type: String,
    required: true,
  },
  patronymic: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  group: {
    type: String,
    required: true,
  },
  course: {
    type: Number,
    required: true,
  },
  certifications: {
    type: String,
    required: true,
  },
  isArchived: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

const Student = mongoose.model('Student', studentSchema);
module.exports = Student;
