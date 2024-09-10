const multer = require('multer');
const mongoose = require('mongoose');
const AudioFile = require('../models/audioFile');
const speech = require('@google-cloud/speech');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');
const { Readable, PassThrough } = require('stream');
ffmpeg.setFfmpegPath(ffmpegStatic);

const audioStorage = multer.memoryStorage();
// Налаштування завантаження аудіофайлів
const audioUpload = multer({
  storage: audioStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 
  }
});

const uploadAudio = audioUpload.single('audioFile');

// Функція для конвертації аудіо до потрібного формату
const convertAudioToWav = (buffer) => {
  return new Promise((resolve, reject) => {
    const inputStream = new Readable();
    inputStream.push(buffer);
    inputStream.push(null); 

    const outputStream = new PassThrough();
    let chunks = [];

    outputStream.on('data', (chunk) => {
      chunks.push(chunk);
    });

    ffmpeg(inputStream)
      .audioCodec('pcm_s16le')
      .audioChannels(1)
      .audioFrequency(16000)
      .format('wav')
      .on('error', (err) => reject(err))
      .on('end', () => resolve(Buffer.concat(chunks)))
      .pipe(outputStream);
  });
};

// Змінена функція handleAudioUpload, що викликає convertAudioToWav без mimeType
const handleAudioUpload = async (req, res) => {
  const studentId = req.params.studentId;

  if (!req.file) {
    return res.status(400).send({ error: 'Не завантажено жодного аудіо!', code: 400 });
  }

  try {
    const convertedBuffer = await convertAudioToWav(req.file.buffer);

    const client = new speech.SpeechClient();
    const audio = { content: convertedBuffer.toString('base64') };
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
      contentType: 'audio/wav',
      data: convertedBuffer,
      studentId: studentId,
      transcription: transcription
    });

    await newAudioFile.save();
    res.redirect(`/audioVoice/${studentId}`);
  } catch (error) {
    console.error('Помилка при завантаженні або транскрипції:', error);
  }
};

  
// Отримання конкретного аудіофайлу за ID
const getAudioFile = async (req, res) => {
  try {
    const audioId = req.params.audioId;
    const audioFile = await AudioFile.findById(audioId);

    if (!audioFile) {
      return res.status(404).send('Аудіофайл не знайдено');
    }
    res.set('Content-Type', audioFile.contentType);
    res.send(audioFile.data);
  } catch (error) {
    console.error('Помилка отримання файла', error);
    res.status(500).send('Помилка отримання файла');
  }
};

// Отримання всіх аудіофайлів студента
const getAudioFilesByStudent = async (req, res) => {
    const studentId = req.params.studentId;
    try {
      const audioFiles = await AudioFile.find({ studentId: studentId });
      if (req.query.audioId) { 
        const audioFile = audioFiles.find(file => file._id.toString() === req.query.audioId);
        if (!audioFile) {
          return res.status(404).send('Аудіофайл не знайдено');
        }
        res.set('Content-Type', 'audio/wav');
        res.send(audioFile.data);
      } else {
        if (!audioFiles.length) {
          return res.render('audioVoice', {
            studentId: studentId,
            audios: [],
            message: 'Аудіофайли не знайдено'
          });
        }
        res.render('audioVoice', {
          studentId: studentId,
          audios: audioFiles,
          message: 'Аудіофайли завантажено'
        });
      }
    } catch (error) {
      console.error('Помилка отримання файла', error);
      res.status(500).send('Помилка отримання файла');
    }
  };
  
// Видалення аудіофайлу
const deleteAudioFile = async (req, res) => {
  try {
    const audioId = req.params.audioId;
    const deletedAudio = await AudioFile.findByIdAndDelete(audioId);

    if (!deletedAudio) {
      return res.status(404).send({ message: 'Аудіофайл не знайдено' });
    }

    res.send({ message: 'Аудіофайл видалено' });
  } catch (error) {
    console.error('Помилка при видаленні', error);
    res.status(500).send({ message: 'Помилка при видаленні' });
  }
};

module.exports = {
  uploadAudio,
  handleAudioUpload,
  getAudioFile,
  getAudioFilesByStudent,
  deleteAudioFile
};