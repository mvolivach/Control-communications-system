const express = require('express');
const router = express.Router();
const { uploadFiles, handleFileUpload, getTelegramMessages } = require('../controllers/telegramController');

router.post('/upload', uploadFiles, handleFileUpload);
router.get('/telegram/:studentId', getTelegramMessages);

module.exports = router;
