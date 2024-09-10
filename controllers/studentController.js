const Student = require('../models/student');
const Reminder = require('../models/reminders');
const createPath = require('../helpers/create-path');

const handleError = (res, error) => {
  console.log(error);
  res.render(createPath('error'), { title: 'Error' });
};

// Метод для отримання інформації про студента за його ID
const getStudent = (req, res) => {
  const title = 'Student';
  Student
    .findById(req.params.id)
    .then(student => {
      // Перевіряємо, чи належить студент поточному користувачу
      if (student.user.toString() === req.user._id.toString()) {
        res.render(createPath('student'), { student, title });
      } else {
        res.status(403).send('Forbidden');
      }
    })
    .catch((error) => handleError(res, error));
};

// Метод для видалення студента за його ID
const deleteStudent = (req, res) => {
  Student
    .findById(req.params.id)
    .then(student => {
      // Перевіряємо, чи належить студент поточному користувачу
      if (student.user.toString() === req.user._id.toString()) {
        return student.remove();
      } else {
        res.status(403).send('Forbidden');
      }
    })
    .then((result) => {
      res.sendStatus(200);
    })
    .catch((error) => handleError(res, error));
};

// Метод для отримання форми редагування інформації про студента
const getEditStudent = (req, res) => {
  const title = 'Edit student';
  Student
    .findById(req.params.id)
    .then(student => {
      // Перевіряємо, чи належить студент поточному користувачу
      if (student.user.toString() === req.user._id.toString()) {
        res.render(createPath('edit-student'), { student, title });
      } else {
        res.status(403).send('Forbidden');
      }
    })
    .catch((error) => handleError(res, error));
};

// Метод для редагування інформації про студента
const editStudent = (req, res) => {
  const { surname, patronymic, name , phone, email, group, course, certifications} = req.body;
  const { id } = req.params;
  Student
    .findById(req.params.id)
    .then(student => {
      // Перевіряємо, чи належить студент поточному користувачу
      if (student.user.toString() === req.user._id.toString()) {
        return student.updateOne({ surname, patronymic, name , phone, email, group, course, certifications});
      } else {
        res.status(403).send('Forbidden');
      }
    })
    .then((result) => res.redirect(`/students/${id}`))
    .catch((error) => handleError(res, error));
};

// Метод для отримання списку студентів
const getStudents = async (req, res) => {
  const title = 'Students';
  const userId = req.user._id;
  try {
    let students = await Student.find({ user: userId, isArchived: false }).sort({ createdAt: -1 }).lean();
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const studentsWithReminders = await Promise.all(students.map(async (student) => {
      let reminders = await Reminder.find({ studentId: student._id });
      let remindersDue = reminders.filter(reminder => new Date(reminder.reminderDate) <= today && !reminder.isCompleted);
      student.remindersDue = remindersDue;
      student.hasDueReminders = remindersDue.length > 0;
      return student;
    }));

    res.render(createPath('students'), { students: studentsWithReminders, title });
  } catch (error) {
    handleError(res, error);
  }
};

// Метод для отримання форми додавання студента
const getAddStudent = (req, res) => {
  const title = 'Add Student';
  res.render(createPath('add-student'), { title });
};

// Метод для додавання нового студента
const addStudent = (req, res) => {
  const { surname, patronymic, name, phone, email, group, course, certifications } = req.body;
  const userId = req.user._id; 

  const student = new Student({
    surname,
    patronymic,
    name,
    phone,
    email,
    group,
    course,
    certifications,
    user: userId // Пов'язуємо студента з авторизованим користувачем
  });

  student
    .save()
    .then(() => res.redirect('/students'))
    .catch((error) => handleError(res, error));
};

// Метод для архівації або розархівації студента
const toggleArchiveStudent = (req, res) => {
  const { id } = req.params;
  Student.findById(id)
    .then(student => {
      // Перевіряємо, чи належить студент поточному користувачу
      if (student.user.toString() === req.user._id.toString()) {
        student.isArchived = !student.isArchived;
        return student.save();
      } else {
        res.status(403).send('Forbidden');
      }
    })
    .then(() => res.redirect('/students'))
    .catch((error) => handleError(res, error));
};

// Метод для отримання списку архівних студентів
const getArchivedStudents = (req, res) => {
  const title = 'Archived Students';
  Student.find({ user: req.user._id, isArchived: true })
    .sort({ createdAt: -1 })
    .then(students => res.render(createPath('archived'), { students, title }))  
    .catch((error) => handleError(res, error));
};

// Метод для отримання нагадувань для конкретного студента
const getReminders = (req, res) => {
  const { studentId } = req.params; 
  Reminder.find({ studentId: studentId })
      .then(reminders => {
          const title = 'Reminders';
          res.render(createPath('reminders'), { reminders, title, studentId }); 
      })
      .catch((error) => handleError(res, error));
};

// Метод для додавання нового нагадування
const addReminder = (req, res) => {
  const { studentId } = req.params; 
  const { description, reminderDate } = req.body; 
  const reminder = new Reminder({
      studentId: studentId,
      description: description,
      reminderDate: new Date(reminderDate),
      isCompleted: false // значення за замовчуванням
  });

  reminder.save()
      .then(() => res.redirect(`/students/${studentId}/reminders`)) 
      .catch((error) => handleError(res, error));
};

// Метод для видалення нагадування
const deleteReminder = (req, res) => {
  const { studentId, id } = req.params; // Отримуємо ID студента та нагадування з URL

  Reminder.findByIdAndDelete(id)
    .then(() => res.redirect(`/students/${studentId}/reminders`)) 
    .catch((error) => handleError(res, error));
};

// Метод для зміни статусу нагадування (виконано/не виконано)
const toggleCompleteReminder = (req, res) => {
  const { studentId, id } = req.params; 
  const { isCompleted } = req.body;

  Reminder.findById(id)
    .then(reminder => {
      if (!reminder) {
        res.status(404).send('Reminder not found');
      } else {
        reminder.isCompleted = isCompleted;
        return reminder.save();
      }
    })
    .then(() => res.sendStatus(200)) // Відправляємо статус успіху
    .catch((error) => handleError(res, error));
};

module.exports = {
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
};
