const express = require('express');
const {
  getStudent, 
  deleteStudent,
  getEditStudent,
  editStudent,
  getStudents,
  getAddStudent,
  addStudent,
  toggleArchiveStudent,
  getArchivedStudents,
  getReminders,
  deleteReminder,
  addReminder,
} = require('../controllers/student-controller');

const router = express.Router();

router.get('/students/:id', getStudent);
router.delete('/students/:id', deleteStudent);
router.get('/edit/:id', getEditStudent);
router.put('/edit/:id', editStudent);
router.get('/students', getStudents);
router.get('/add-student', getAddStudent);
router.post('/add-student', addStudent);
router.post('/students/toggle-archive/:id', toggleArchiveStudent);
router.get('/archived', getArchivedStudents);
router.get('/students/:studentId/reminders', getReminders);
router.delete('/students/:studentId/reminders/:id', deleteReminder);

router.post('/students/:studentId/reminders/add', addReminder);

module.exports = router;
