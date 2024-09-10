const express = require('express');
const {
  getStudent, 
  deleteStudent,
  getEditStudent,
  editStudent,
  getStudents,
  getAddStudent,
  addStudent
} = require('../controllers/student-controller');

const router = express.Router();

router.get('/students/:id', getStudent);
router.delete('/students/:id', deleteStudent);
router.get('/edit/:id', getEditStudent);
router.put('/edit/:id', editStudent);
router.get('/students', getStudents);
router.get('/add-student', getAddStudent);
router.post('/add-student', addStudent);

module.exports = router;
