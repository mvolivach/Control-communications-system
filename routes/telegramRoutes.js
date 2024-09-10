// routes/telegramRoutes.js
const { Router } = require('express');
const { getTelegramMessages } = require('../controllers/fileController');

const router = Router();

router.get('/telegram/:studentId', getTelegramMessages);

module.exports = router;
