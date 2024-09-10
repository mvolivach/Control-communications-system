const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const { google } = require('googleapis');
const { authenticate } = require('@google-cloud/local-auth');
const path = require('path');
const fs = require('fs').promises;
const studentRoutes = require('./routes/student-routes');
const createPath = require('./helpers/create-path');
const authRoutes = require('./routes/authRoutes');
const cookieParser = require('cookie-parser');
const { requireAuth, checkUser } = require('./middleware/authMiddleware');
process.env.GOOGLE_APPLICATION_CREDENTIALS='speech.json'
const app = express();
app.use(express.static('public'));
app.use(express.json());
app.get('/telegram', (req, res) => {
    res.render('telegram'); 
});



app.use(cookieParser());
const multer = require('multer');
const cheerio = require('cheerio');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.use(express.static('public'));


app.set('view engine', 'ejs');

const PORT = 3000;
const db = 'mongodb+srv://Maksym:volivach@cluster0.ad7qpyj.mongodb.net/?retryWrites=true&w=majority';

mongoose
  .connect(db, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex:true })
  .then((res) => console.log('Connected to DB'))
  .catch((error) => console.log(error));

app.listen(PORT, (error) => {
  error ? console.log(error) : console.log(`listening port ${PORT}`);
});



app.use(express.urlencoded({ extended: false }));
app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));
app.use(express.static('styles'));
app.use(methodOverride('_method'));

app.get('*', checkUser);
app.get('/', (req, res) => res.render('index'));
app.use(authRoutes);



const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

async function loadSavedCredentialsIfExist() {
  try {
    const content = await fs.readFile(TOKEN_PATH);
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
}

async function saveCredentials(client) {
  const content = await fs.readFile(CREDENTIALS_PATH);
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: 'authorized_user',
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  await fs.writeFile(TOKEN_PATH, payload);
}

async function authorize() {
  let client = await loadSavedCredentialsIfExist();
  if (!client) {
    client = await authenticate({
      scopes: SCOPES,
      keyfilePath: CREDENTIALS_PATH,
    });
    if (client.credentials) {
      await saveCredentials(client);
    }
  }
  return client;
}

app.get('/emails', async (req, res) => {
  const userEmail = req.query.email;
  const auth = await authorize();
  const gmail = google.gmail({ version: 'v1', auth });
  try {
    const response = await gmail.users.threads.list({
      'userId': 'me',
      'q': `to:${userEmail} OR from:${userEmail}`,
    });
    const threads = response.data.threads || [];
    const messages = [];

    for (const thread of threads) {
      const threadResponse = await gmail.users.threads.get({
        'userId': 'me',
        'id': thread.id,
      });
      messages.push(...threadResponse.data.messages);
    }
    res.render('messages', { messages });
  } catch (err) {
    console.error('The API returned an error: ' + err);
    res.send('Failed to retrieve email history.');
  }
});


const File = require('./models/file.js');

app.post('/upload', upload.single('htmlFile'), async (req, res) => {
  const studentId = req.query.studentId;
  
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  if (!studentId) {
    return res.status(400).send('Student ID is required.');
  }

  try {
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).send('Invalid student ID.');
    }

    const newFile = new File({
      filename: req.file.originalname,
      contentType: req.file.mimetype,
      data: req.file.buffer,
      studentId: studentId 
    });

    const savedFile = await newFile.save();

    res.redirect(`/files/${savedFile._id}`);
  } catch (error) {
    res.status(500).send('Error saving file to database');
  }
});


app.get('/telegram/:studentId', async (req, res) => {
  let messages = [];
  let error = null;

  try {
    const file = await File.findOne({ studentId: req.params.studentId });
    if (!file) {
      throw new Error('File not found for the provided student ID');
    }

    const fileContent = file.data.toString('utf8');
    const $ = cheerio.load(fileContent);

    $('.message.default.clearfix').each((i, elem) => {
      const fromName = $(elem).find('.from_name').text().trim();
      const date = $(elem).find('.date.details').attr('title').split(' ')[0];
      const text = $(elem).find('.text').html();
      messages.push({ fromName, date, text });
    });
  } catch (err) {
    console.error('Failed to retrieve file:', err);
    error = err.message;
  }

  res.render('telegram', { messages, error });
});
app.use(studentRoutes);

const AudioFile = require('./models/audioFile');
const audioStorage = multer.memoryStorage();
const audioUpload = multer({
  storage: audioStorage,
  fileFilter: (req, file, cb) => {
    // Accept audio files only
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed!'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 
  }
});

app.post('/upload-audio/:studentId', audioUpload.single('audioFile'), async (req, res) => {
  const studentId = req.params.studentId;

  if (!req.file) {
    return res.status(400).render('audio', { message: 'Не завантажено жодного аудіо!', audioId: null, studentId: studentId });
  }


  const client = new speech.SpeechClient();

  try {

    const audio = {
      content: req.file.buffer.toString('base64')
    };
    const config = {
      encoding: 'LINEAR16',  
      sampleRateHertz: 16000,  
      languageCode: 'uk-UA',
      enableAutomaticPunctuation: true,
    };
    const request = {
      audio: audio,
      config: config,
    };


    const [response] = await client.recognize(request);
    const transcription = response.results
      .map(result => result.alternatives[0].transcript)
      .join('\n');

    const newAudioFile = new AudioFile({
      filename: req.file.originalname,
      contentType: req.file.mimetype,
      data: req.file.buffer,
      studentId: studentId,
      transcription: transcription 
    });

    await newAudioFile.save();


    res.redirect(`/audioVoice/${studentId}`);
  } catch (error) {
    console.error('Failed to save audio file or transcribe:', error);
    res.status(500).render('audio', { message: 'Error uploading audio file: ' + error.message, audioId: null, studentId: studentId });
  }
});

app.get('/audio/:audioId', async (req, res) => {
  try {
    const audioId = req.params.audioId;

    const audioFile = await AudioFile.findById(audioId);

    if (!audioFile) {
      return res.status(404).send('Audio file not found.');
    }


    res.set('Content-Type', audioFile.contentType);
    res.send(audioFile.data);
  } catch (error) {
    console.error('Failed to retrieve the audio file:', error);
    res.status(500).send('Error retrieving the audio file.');
  }
});



app.get('/audioVoice/:studentId', async (req, res) => {
  const studentId = req.params.studentId;

  try {

    const audioFiles = await AudioFile.find({ studentId: studentId });
    if (!audioFiles.length) {

      return res.render('audioVoice', {
        studentId: studentId,
        audios: [],
        message: 'No audio files found.'
      });
    }

    res.render('audioVoice', {
      studentId: studentId,
      audios: audioFiles,
      message: 'Audio files loaded.'
    });

  } catch (error) {
    console.error('Error retrieving audio files:', error);
    res.render('audioVoice', {
      studentId: studentId,
      audios: [],
      message: 'Error retrieving audio files.'
    });
  }
});

app.delete('/audio/:audioId', async (req, res) => {
  try {
    const audioId = req.params.audioId;
    const deletedAudio = await AudioFile.findByIdAndDelete(audioId);

    if (!deletedAudio) {
      return res.status(404).send({ message: 'Audio file not found.' });
    }

    res.send({ message: 'Audio file deleted successfully.' });
  } catch (error) {
    console.error('Failed to delete the audio file:', error);
    res.status(500).send({ message: 'Error deleting the audio file.' });
  }
});


const speech = require('@google-cloud/speech');

app.get('/', (req, res) => {
  const title = 'Home';
  res.render(createPath('index'), { title });
});

app.use((req, res) => {
  const title = 'Error Page';
  res.status(404).render(createPath('error'), { title });
});
