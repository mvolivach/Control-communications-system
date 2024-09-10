const Reminder = require('../models/reminders');
const subscriptionController = require('./subscriptionController');

const getReminders = async (req, res) => {
  try {
    const studentId = req.params.studentId;
    const reminders = await Reminder.find({ studentId }).sort({ reminderDate: 1 });
    res.render('reminders', { reminders, studentId });
  } catch (error) {
    res.status(500).send('Error retrieving reminders');
  }
};

const addReminder = async (req, res) => {
  const { studentId, description, reminderDate } = req.body;
  try {
    const newReminder = new Reminder({ studentId, description, reminderDate });
    await newReminder.save();

    // Send push notifications to all subscriptions
    const notificationPayload = JSON.stringify({
      title: 'New Reminder',
      body: description
    });

    subscriptionController.subscriptions.forEach(subscription => {
      subscriptionController.sendNotification(subscription, notificationPayload);
    });

    res.redirect(`/reminders/${studentId}`);
  } catch (error) {
    res.status(500).send('Error saving reminder');
  }
};

module.exports = {
  getReminders,
  addReminder
};
