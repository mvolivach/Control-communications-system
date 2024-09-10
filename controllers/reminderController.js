// controllers/reminderController.js
const Reminder = require('../models/reminders');

// Метод для отримання нагадувань студента за його ID
const getReminders = async (req, res) => {
  try {
    const studentId = req.params.studentId; // Отримуємо ID студента з параметрів запиту
    const reminders = await Reminder.find({ studentId }).sort({ reminderDate: 1 }); // Знаходимо всі нагадування для даного студента та сортуємо їх за датою
    res.render('reminders', { reminders, studentId }); // Відображаємо нагадування на сторінці
  } catch (error) {
    res.status(500).send('Error retrieving reminders'); // Відправляємо повідомлення про помилку у разі невдачі
  }
};

// Метод для додавання нового нагадування
const addReminder = async (req, res) => {
  const { studentId, description, reminderDate } = req.body; // Отримуємо дані з тіла запиту
  try {
    const newReminder = new Reminder({ studentId, description, reminderDate }); // Створюємо новий об'єкт нагадування
    await newReminder.save(); // Зберігаємо нове нагадування у базу даних
    res.redirect(`/reminders/${studentId}`); // Переадресовуємо на сторінку нагадувань для даного студента
  } catch (error) {
    res.status(500).send('Error saving reminder'); // Відправляємо повідомлення про помилку у разі невдачі
  }
};

module.exports = {
  getReminders,
  addReminder
};
