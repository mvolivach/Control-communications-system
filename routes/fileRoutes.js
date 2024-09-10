// fileRoutes.js
const express = require('express');
const router = express.Router();
const { getPhoto } = require('../controllers/fileController');

router.get('/photos/:id', getPhoto);

module.exports = router;
