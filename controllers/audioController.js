// controllers/audioController.js
const multer = require('multer');
const mongoose = require('mongoose');
const AudioFile = require('../models/audioFile');
const speech = require('@google-cloud/speech');
const { WaveFile } = require('wavefile');  // Додано для аналізу WAV файлів

const audioStorage = multer.memoryStorage();
// Налаштування завантаження аудіофайлів
const audioUpload = multer({
  storage: audioStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'audio/wav' || file.mimetype === 'audio/x-wav') {
      cb(null, true);
    } else {
      cb(new Error('Лише файли WAV формату підтримуються!'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 MB limit
  }
});

const uploadAudio = audioUpload.single('audioFile');

// Обробник завантаження аудіофайлу
const handleAudioUpload = async (req, res) => {
    const studentId = req.params.studentId;
  
    if (!req.file) {
      return res.status(400).send({ error: 'Не завантажено жодного аудіо!', code: 400 });
    }
  
    try {
      const wav = new WaveFile(req.file.buffer);
      if (wav.fmt.sampleRate !== 16000) {
        return res.status(400).send({ error: 'Тільки файли з частотою 16000 Hz та моноканалом дозволені! Щоб отримати файл відповідного формату перейдіть за наступним посиланням та відформатуйте свій файл: https://fconvert.com/audio/', code: 400 });
      }
  
      const client = new speech.SpeechClient();
  
      const audio = { content: req.file.buffer.toString('base64') };
      const config = {
        encoding: 'LINEAR16',
        sampleRateHertz: 16000,
        languageCode: 'uk-UA',
        enableAutomaticPunctuation: true,
      };
      const request = { audio: audio, config: config };
  
      const [response] = await client.recognize(request);
      const transcription = response.results.map(result => result.alternatives[0].transcript).join('\n');
  
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
      console.error('Помилка при завантаженні або транскрипції:', error);
      res.status(500).send({ error: error.message, code: 500 });
    }
  };

  
// Отримання конкретного аудіофайлу за ID
const getAudioFile = async (req, res) => {
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
};

// Отримання всіх аудіофайлів студента
const getAudioFilesByStudent = async (req, res) => {
    const studentId = req.params.studentId;
    try {
      const audioFiles = await AudioFile.find({ studentId: studentId });
      if (req.query.audioId) {  // Перевірка чи є запит на конкретний аудіофайл
        const audioFile = audioFiles.find(file => file._id.toString() === req.query.audioId);
        if (!audioFile) {
          return res.status(404).send('Audio file not found.');
        }
        res.set('Content-Type', 'audio/wav');
        res.send(audioFile.data);
      } else {
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
      }
    } catch (error) {
      console.error('Error retrieving audio files:', error);
      res.status(500).send('Error retrieving audio files.');
    }
  };
  
// Видалення аудіофайлу
const deleteAudioFile = async (req, res) => {
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
};

module.exports = {
  uploadAudio,
  handleAudioUpload,
  getAudioFile,
  getAudioFilesByStudent,
  deleteAudioFile
};
