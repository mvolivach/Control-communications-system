// routes/audioRoutes.js
const { Router } = require('express');
const {
  uploadAudio,
  handleAudioUpload,
  getAudioFile,
  getAudioFilesByStudent,
  deleteAudioFile
} = require('../controllers/audioController');

const router = Router();

router.post('/upload-audio/:studentId', uploadAudio, handleAudioUpload);
router.get('/audio/:audioId', getAudioFile);
router.get('/audioVoice/:studentId', getAudioFilesByStudent);
router.delete('/audio/:audioId', deleteAudioFile);

module.exports = router;
