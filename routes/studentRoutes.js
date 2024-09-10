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
  toggleCompleteReminder,
  archiveGroup,
  unarchiveGroup,
  addGroupReminder
} = require('../controllers/studentController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/students/:id', requireAuth, getStudent);
router.delete('/students/:id', requireAuth, deleteStudent);
router.get('/edit/:id', requireAuth, getEditStudent);
router.put('/edit/:id', requireAuth, editStudent);
router.get('/students', requireAuth, getStudents);
router.get('/add-student', requireAuth, getAddStudent);
router.post('/add-student', requireAuth, addStudent);
router.post('/students/toggle-archive/:id', requireAuth, toggleArchiveStudent);
router.get('/archived', requireAuth, getArchivedStudents);
router.get('/students/:studentId/reminders', requireAuth, getReminders);
router.delete('/students/:studentId/reminders/:id', requireAuth, deleteReminder);
router.post('/students/:studentId/reminders/add', requireAuth, addReminder);
router.put('/students/:studentId/reminders/:id', toggleCompleteReminder);
router.post('/students/archive-group/:group',requireAuth, archiveGroup);
router.post('/students/unarchive-group/:group',requireAuth, unarchiveGroup);
router.post('/add-group-reminder', requireAuth, addGroupReminder);

module.exports = router;
