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
const telegramRoutes = require('./routes/telegramRoutes');
const reminderRoutes = require('./routes/reminderRoutes');
const studentRoutes = require('./routes/studentRoutes');
const audioRoutes = require('./routes/audioRoutes');
const { checkUser, requireAuth } = require('./controllers/authController');
require('dotenv').config();
process.env.GOOGLE_APPLICATION_CREDENTIALS = 'speech.json';
const app = express();
const fileRoutes = require('./routes/fileRoutes');

app.use(express.static('public'));
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));
app.use(express.static('styles'));
app.use(methodOverride('_method'));
app.set('view engine', 'ejs');

app.use(fileRoutes);


mongoose
  .connect(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true })
  .then(() => console.log('Connected to DB'))
  .catch((error) => console.log(error));

app.listen(process.env.PORT, (error) => {
  error ? console.log(error) : console.log(`listening port ${process.env.PORT}`); 
});

app.get('*', checkUser);
app.get('/', (req, res) => res.render('index'));

// Use the routes
app.use(authRoutes);
app.use(emailRoutes);
app.use(telegramRoutes);
app.use(reminderRoutes);
app.use(studentRoutes);
app.use(audioRoutes);

app.get('/', (req, res) => {
  const title = 'Home';
  res.render(createPath('index'), { title });
});

app.use((req, res) => {
  const title = 'Error Page';
  res.status(404).render(createPath('error'), { title });
});
