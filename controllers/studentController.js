const Student = require('../models/student');
const Reminder = require('../models/reminders');
const EmailHistory = require('../models/emailHistory');
const File = require('../models/file');
const AudioFile = require('../models/audioFile');
const createPath = require('../helpers/create-path');
const cheerio = require('cheerio');
const path = require('path');

const handleError = (res, error) => {
  console.log(error);
  res.render(createPath('error'), { title: 'Error' });
};

// Метод для отримання інформації про студента за його ID
const getStudent = async (req, res) => {
  const title = 'Student';
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).send('Student not found');
    }

    if (student.user.toString() !== req.user._id.toString()) {
      return res.status(403).send('Forbidden');
    }

    const emailHistory = await EmailHistory.findOne({ userEmail: student.email });
    const emailMessages = emailHistory ? emailHistory.messages.map(message => ({
      type: 'gmail',
      date: new Date(parseInt(message.internalDate)),
      ...message
    })) : [];


    const files = await File.find({ studentId: req.params.id });
const telegramMessages = [];
const uniqueMessages = new Set(); // Створення множини для зберігання унікальних ідентифікаторів повідомлень

files.forEach(file => {
  if (file.fileType === 'html' && path.extname(file.filename).toLowerCase() === '.html') {
    const fileContent = file.data.toString('utf8');
    const $ = cheerio.load(fileContent);

    $('.message.default.clearfix').each((i, elem) => {
      const fromName = $(elem).find('.from_name').text().trim();
      const dateTime = $(elem).find('.date.details').attr('title').split(' ');
      const date = dateTime[0]; 
      const time = dateTime[1]; 
      const text = $(elem).find('.text').html();
      let photos = [];

      $(elem).find('.media_wrap .photo_wrap').each((i, photoElem) => {
        const photoSrc = $(photoElem).find('img').attr('src');
        const photoFile = files.find(f => f.filename === path.basename(photoSrc));
        if (photoFile) {
          photos.push({ src: `/photos/${photoFile._id}`, href: `/photos/${photoFile._id}` });
        }
      });

      const messageSignature = `${fromName}-${date}-${time}-${text}`; 

      if (!uniqueMessages.has(messageSignature)) {
        uniqueMessages.add(messageSignature);
        telegramMessages.push({
          type: 'telegram',
          date: new Date(`${date.split('.').reverse().join('-')}T${time}`),
          fromName,
          text,
          photos
        });
      }
    });
  }
});

    const audioHistory = await AudioFile.find({ studentId: req.params.id }).lean();
    const audioMessages = audioHistory ? audioHistory.map(audio => ({
      type: 'audio',
      date: new Date(audio.createdAt),
      ...audio
    })) : [];

    const combinedHistories = [...emailMessages, ...telegramMessages, ...audioMessages].sort((a, b) => a.date - b.date);

    res.render(createPath('student'), {
      student,
      title,
      combinedHistories
    });
  } catch (error) {
    handleError(res, error);
  }
};

// Метод для видалення студента за його ID
const deleteStudent = (req, res) => {
  Student
    .findById(req.params.id)
    .then(student => {
      if (student.user.toString() === req.user._id.toString()) {
        return student.deleteOne();
      } else {
        res.status(403).send('Forbidden');
      }
    })
    .then(() => res.sendStatus(200))
    .catch((error) => handleError(res, error));
};

// Метод для отримання форми редагування інформації про студента
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

// Метод для редагування інформації про студента
const editStudent = (req, res) => {
  const { surname, patronymic, name, phone, email, group, course, certifications } = req.body;
  const { id } = req.params;
  Student
    .findById(req.params.id)
    .then(student => {
      if (student.user.toString() === req.user._id.toString()) {
        return student.updateOne({ surname, patronymic, name, phone, email, group, course, certifications });
      } else {
        res.status(403).send('Forbidden');
      }
    })
    .then(() => res.redirect(`/students/${id}`))
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
    user: userId 
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
    isCompleted: false 
  });

  reminder.save()
    .then(() => res.redirect(`/students/${studentId}/reminders`))
    .catch((error) => handleError(res, error));
};

// Метод для видалення нагадування
const deleteReminder = (req, res) => {
  const { studentId, id } = req.params;

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
    .then(() => res.sendStatus(200))
    .catch((error) => handleError(res, error));
};

// Метод для архівації групи студентів
const archiveGroup = async (req, res) => {
  const { group } = req.params;
  const userId = req.user._id;

  try {
      await Student.updateMany(
          { user: userId, group: group, isArchived: false }, 
          { isArchived: true }
      );
      res.redirect('/students');
  } catch (error) {
      handleError(res, error);
  }
};

// Метод для розархівації групи студентів
const unarchiveGroup = async (req, res) => {
  const { group } = req.params;
  const userId = req.user._id;

  try {
      await Student.updateMany(
          { user: userId, group: group, isArchived: true }, 
          { isArchived: false }
      );
      res.redirect('/students');
  } catch (error) {
      handleError(res, error);
  }
};

const addGroupReminder = async (req, res) => {
  const { description, reminderDate, studentIds } = req.body;

  const ids = Array.isArray(studentIds) ? studentIds : [studentIds];

  try {
    const reminders = ids.map(id => ({
      studentId: id,
      description: description,
      reminderDate: new Date(reminderDate),
      isCompleted: false
    }));

    await Reminder.insertMany(reminders);
    res.redirect('/students');
  } catch (error) {
    res.status(500).send('Error adding reminder');
  }
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
  archiveGroup,
  unarchiveGroup,
  addGroupReminder
};
