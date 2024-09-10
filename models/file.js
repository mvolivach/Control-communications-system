const mongoose = require('mongoose');
const { Schema } = mongoose;

const fileSchema = new Schema({
  filename: String,
  contentType: String,
  data: Buffer,
  uploadedAt: { type: Date, default: Date.now },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  },
  fileType: {
    type: String,
    enum: ['html', 'photo'],
    required: true
  }
});

const File = mongoose.model('File', fileSchema);

module.exports = File;
