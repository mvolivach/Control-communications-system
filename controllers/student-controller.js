const Student = require('../models/student');
const Reminder = require('../models/reminders');
const createPath = require('../helpers/create-path');

const handleError = (res, error) => {
  console.log(error);
  res.render(createPath('error'), { title: 'Error' });
};

const getStudent = (req, res) => {
  const title = 'Student';
  Student
    .findById(req.params.id)
    .then(student => res.render(createPath('student'), { student, title }))
    .catch((error) => handleError(res, error));
}

const deleteStudent = (req, res) => {
  Student
  .findByIdAndDelete(req.params.id)
  .then((result) => {
    res.sendStatus(200);
  })
  .catch((error) => handleError(res, error));
}

const getEditStudent = (req, res) => {
  const title = 'Edit student';
  Student
    .findById(req.params.id)
    .then(student => res.render(createPath('edit-student'), { student, title }))
    .catch((error) => handleError(res, error));
}

const editStudent = (req, res) => {
  const { surname, patronymic, name , phone, email, group, course, certifications} = req.body;
  const { id } = req.params;
  Student
    .findByIdAndUpdate(req.params.id, { surname, patronymic, name , phone, email, group, course, certifications})
    .then((result) => res.redirect(`/students/${id}`))
    .catch((error) => handleError(res, error));
}

const getStudents = async (req, res) => {
  const title = 'Students';
  try {
    let students = await Student.find({ isArchived: false }).sort({ createdAt: -1 }).lean();
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize today's date for comparison

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
}


const getAddStudent = (req, res) => {
  const title = 'Add Student';
  res.render(createPath('add-student'), { title });
}

const addStudent = (req, res) => {
  const { surname, patronymic, name, phone, email, group, course, certifications } = req.body;
  const student = new Student({ surname, patronymic, name , phone, email, group, course, certifications});
  student
    .save()
    .then((result) => res.redirect('/students'))
    .catch((error) => handleError(res, error));
}

const toggleArchiveStudent = (req, res) => {
  const { id } = req.params;
  Student.findById(id)
    .then(student => {
      student.isArchived = !student.isArchived;
      student.save()
        .then(() => res.redirect('/students'))
        .catch(error => handleError(res, error));
    })
    .catch((error) => handleError(res, error));
}

const getArchivedStudents = (req, res) => {
  const title = 'Archived Students';
  Student.find({ isArchived: true })
    .sort({ createdAt: -1 })
    .then(students => res.render(createPath('archived'), { students, title }))  
    .catch((error) => handleError(res, error));
}

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


// Function to delete a specific reminder
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
