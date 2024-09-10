const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');

// Define your routes
router.post('/upload', fileController.uploadFiles, fileController.handleFileUpload);
router.get('/telegram/:studentId', fileController.getTelegramMessages);

module.exports = router;
