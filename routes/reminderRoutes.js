const { Router } = require('express');
const { getReminders, addReminder } = require('../controllers/reminderController');

const router = Router();

router.get('/reminders/:studentId', getReminders);
router.post('/reminders', addReminder);

module.exports = router;
