const Reminder = require('../models/reminders');

// Метод для отримання нагадувань студента за його ID
const getReminders = async (req, res) => {
  try {
    const studentId = req.params.studentId; 
    const reminders = await Reminder.find({ studentId }).sort({ reminderDate: 1 }); 
    res.render('reminders', { reminders, studentId });
  } catch (error) {
    res.status(500).send('Error retrieving reminders');
  }
};

// Метод для додавання нового нагадування
const addReminder = async (req, res) => {
  const { studentId, description, reminderDate } = req.body; 
  try {
    const newReminder = new Reminder({ studentId, description, reminderDate });
    await newReminder.save(); 
    res.redirect(`/reminders/${studentId}`); 
  } catch (error) {
    res.status(500).send('Error saving reminder'); 
  }
};

module.exports = {
  getReminders,
  addReminder
};
