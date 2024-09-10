// routes/emailRoutes.js
const { Router } = require('express');
const { getEmailHistory } = require('../controllers/emailController');

const router = Router();

router.get('/emails', getEmailHistory);

module.exports = router;
