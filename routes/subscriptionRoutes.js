// routes/subscriptionRoutes.js
const { Router } = require('express');
const subscriptionController = require('../controllers/subscriptionController');

const router = Router();

router.post('/subscribe', async (req, res) => {
  try {
    await subscriptionController.saveSubscription(req.body);
    res.status(201).json({});
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to save subscription' });
  }
});

module.exports = router;
