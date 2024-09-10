const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const path = require('path');
const fs = require('fs').promises;
const cookieParser = require('cookie-parser');
const createPath = require('./helpers/create-path');
const authRoutes = require('./routes/authRoutes');
const emailRoutes = require('./routes/emailRoutes');
const fileRoutes = require('./routes/fileRoutes');
const reminderRoutes = require('./routes/reminderRoutes');
const studentRoutes = require('./routes/studentRoutes');
const telegramRoutes = require('./routes/telegramRoutes');
const audioRoutes = require('./routes/audioRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const { checkUser, requireAuth } = require('./controllers/authController');
const File = require('./models/file');

process.env.GOOGLE_APPLICATION_CREDENTIALS = 'speech.json';
const app = express();

app.use(express.static('public'));
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));
app.use(express.static('styles'));
app.use(methodOverride('_method'));
app.set('view engine', 'ejs');

app.get('/photos/:id', async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file || file.fileType !== 'photo') {
      return res.status(404).send('File not found');
    }
    res.contentType(file.contentType);
    res.send(file.data);
  } catch (error) {
    console.error('Error retrieving file:', error);
    res.status(500).send('Error retrieving file');
  }
});

const PORT = 3000;
const db = 'mongodb+srv://Maksym:volivach@cluster0.ad7qpyj.mongodb.net/?retryWrites=true&w=majority';

mongoose
  .connect(db, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true })
  .then(() => console.log('Connected to DB'))
  .catch((error) => console.log(error));

app.listen(PORT, (error) => {
  error ? console.log(error) : console.log(`listening port ${PORT}`); 
});

app.get('*', checkUser);
app.get('/', (req, res) => res.render('index'));

app.use(authRoutes);
app.use(emailRoutes);
app.use(fileRoutes);
app.use(reminderRoutes);
app.use(studentRoutes);
app.use(telegramRoutes);
app.use(audioRoutes);
app.use(subscriptionRoutes);

app.get('/', (req, res) => {
  const title = 'Home';
  res.render(createPath('index'), { title });
});

// 404 error page
app.use((req, res) => {
  const title = 'Error Page';
  res.status(404).render(createPath('error'), { title });
});
