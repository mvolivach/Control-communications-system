const { Router } = require('express');
const router = Router();
const { getEmailHistory, refreshEmailHistory } = require('../controllers/emailController');

router.get('/emails/:studentId', getEmailHistory);
router.get('/refresh-email-history/:studentId', refreshEmailHistory);

module.exports = router;
