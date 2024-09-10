const Student = require('../models/student');
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

const getStudents = (req, res) => {
  const title = 'Students';
  Student
    .find({ isArchived: false })
    .sort({ createdAt: -1 })
    .then(students => res.render(createPath('students'), { students, title }))
    .catch((error) => handleError(res, error));
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
};
