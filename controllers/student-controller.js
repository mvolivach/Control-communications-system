const Student = require('../models/student');
const Reminder = require('../models/reminder');
const createPath = require('../helpers/create-path');

const handleError = (res, error) => {
  console.log(error);
  res.render(createPath('error'), { title: 'Error' });
};

const getStudent = (req, res) => {
  const title = 'Student';
  Student
    .findById(req.params.id)
    .then(student => {
      if (student.user.toString() === req.user._id.toString()) {
        res.render(createPath('student'), { student, title });
      } else {
        res.status(403).send('Forbidden');
      }
    })
    .catch((error) => handleError(res, error));
};

const deleteStudent = (req, res) => {
  Student
    .findById(req.params.id)
    .then(student => {
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

const getEditStudent = (req, res) => {
  const title = 'Edit student';
  Student
    .findById(req.params.id)
    .then(student => {
      if (student.user.toString() === req.user._id.toString()) {
        res.render(createPath('edit-student'), { student, title });
      } else {
        res.status(403).send('Forbidden');
      }
    })
    .catch((error) => handleError(res, error));
};

const editStudent = (req, res) => {
  const { surname, patronymic, name , phone, email, group, course, certifications} = req.body;
  const { id } = req.params;
  Student
    .findById(req.params.id)
    .then(student => {
      if (student.user.toString() === req.user._id.toString()) {
        return student.updateOne({ surname, patronymic, name , phone, email, group, course, certifications});
      } else {
        res.status(403).send('Forbidden');
      }
    })
    .then((result) => res.redirect(`/students/${id}`))
    .catch((error) => handleError(res, error));
};

const getStudents = async (req, res) => {
  const title = 'Students';
  const userId = req.user._id; // Get the user ID from the authenticated user
  try {
    let students = await Student.find({ user: userId, isArchived: false }).sort({ createdAt: -1 }).lean();
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const studentsWithReminders = await Promise.all(students.map(async (student) => {
      let reminders = await Reminder.find({ studentId: student._id });
      let remindersDue = reminders.filter(reminder => new Date(reminder.reminderDate) <= today);
      student.remindersDue = remindersDue;
      student.hasDueReminders = remindersDue.length > 0;
      return student;
    }));

    res.render(createPath('students'), { students: studentsWithReminders, title });
  } catch (error) {
    handleError(res, error);
  }
};


const getAddStudent = (req, res) => {
  const title = 'Add Student';
  res.render(createPath('add-student'), { title });
};

const addStudent = (req, res) => {
  const { surname, patronymic, name, phone, email, group, course, certifications } = req.body;
  const userId = req.user._id; // Get the user ID from the authenticated user

  const student = new Student({
    surname,
    patronymic,
    name,
    phone,
    email,
    group,
    course,
    certifications,
    user: userId // Associate the student with the logged-in user
  });

  student
    .save()
    .then(() => res.redirect('/students'))
    .catch((error) => handleError(res, error));
};


const toggleArchiveStudent = (req, res) => {
  const { id } = req.params;
  Student.findById(id)
    .then(student => {
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

const getArchivedStudents = (req, res) => {
  const title = 'Archived Students';
  Student.find({ user: req.user._id, isArchived: true })
    .sort({ createdAt: -1 })
    .then(students => res.render(createPath('archived'), { students, title }))  
    .catch((error) => handleError(res, error));
};

const getReminders = (req, res) => {
  const { studentId } = req.params; // Assuming you pass the student's ID in the route parameter
  Reminder.find({ studentId: studentId })
      .then(reminders => {
          const title = 'Reminders';
          res.render(createPath('reminders'), { reminders, title, studentId }); // Assuming you have a reminders.ejs file in your views
      })
      .catch((error) => handleError(res, error));
};

const addReminder = (req, res) => {
  const { studentId } = req.params; // Get the student ID from the URL
  const { description, reminderDate } = req.body; // Get data from form fields
  const reminder = new Reminder({
      studentId: studentId,
      description: description,
      reminderDate: new Date(reminderDate),
      isCompleted: false // default value
  });

  reminder.save()
      .then(() => res.redirect(`/students/${studentId}/reminders`)) // Redirect back to the reminders page
      .catch((error) => handleError(res, error));
};

// Don't forget to export this function and add it to your module exports

const deleteReminder = (req, res) => {
  const { studentId, id } = req.params; // Get studentId and reminder ID from the URL

  Reminder.findByIdAndDelete(id)
    .then(() => res.redirect(`/students/${studentId}/reminders`)) // Redirect back to the reminders page for the student
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
};
