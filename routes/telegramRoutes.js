const express = require('express');
const router = express.Router();
const { uploadFiles, handleFileUpload, getTelegramMessages, deleteChatHistory } = require('../controllers/telegramController');

router.post('/upload', uploadFiles, handleFileUpload);
router.get('/telegram/:studentId', getTelegramMessages);
router.delete('/delete-history/:studentId', deleteChatHistory);  

module.exports = router;
