// routes/reminderRoutes.js
const { Router } = require('express');
const { getReminders, addReminder } = require('../controllers/reminderController');

const router = Router();

router.get('/reminders/:studentId', getReminders);
router.post('/reminders', addReminder);
router.post('/subscribe', (req, res) => {
  const subscription = req.body;
  res.status(201).json({});
  req.app.locals.subscription = subscription;
});

module.exports = router;
