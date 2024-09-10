const mongoose = require('mongoose');

const audioFileSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  contentType: {
    type: String,
    required: true
  },
  data: {
    type: Buffer,
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  },
  transcription: String
});

const AudioFile = mongoose.model('AudioFile', audioFileSchema);

module.exports = AudioFile;
