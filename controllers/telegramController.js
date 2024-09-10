const multer = require('multer');
const mongoose = require('mongoose');
const File = require('../models/file.js');
const path = require('path');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const uploadFiles = upload.array('files', 1000);

const handleFileUpload = async (req, res) => {
  const studentId = req.query.studentId;

  if (!req.files || req.files.length === 0) {
    return res.status(400).send('No files uploaded.');
  }

  if (!studentId) {
    return res.status(400).send('Student ID is required.');
  }

  try {
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).send('Invalid student ID.');
    }

    const filesToSave = [];
    for (const file of req.files) {
      const extname = path.extname(file.originalname).toLowerCase();
      const isJson = extname === '.json';

      if (isJson) {
        const existingFile = await File.findOne({ studentId: studentId, filename: file.originalname });
        if (!existingFile || (existingFile && existingFile.data.toString('utf8') !== file.buffer.toString('utf8'))) {
          const fileType = 'json';
          filesToSave.push({
            filename: file.originalname,
            contentType: file.mimetype,
            data: file.buffer,
            studentId: studentId,
            fileType: fileType
          });
        }
      }
    }

    if (filesToSave.length === 0) {
      return res.status(400).send('No new or modified files found to upload.');
    }

    await File.insertMany(filesToSave);
    res.redirect('back');
  } catch (error) {
    console.error('Error saving files to database:', error);
    res.status(500).send('Error saving files to database');
  }
};

const getTelegramMessages = async (req, res) => {
  let messages = [];
  let error = null;
  let messageSet = new Set(); 

  try {
    const files = await File.find({ studentId: req.params.studentId });
    if (files.length === 0) {
      throw new Error('No files found for the provided student ID');
    }

    files.forEach(file => {
      if (file.fileType === 'json' && path.extname(file.filename).toLowerCase() === '.json') {
        const fileContent = file.data.toString('utf8');
        const jsonData = JSON.parse(fileContent);

        jsonData.messages.forEach(message => {
          const fromName = message.from;
          const dateTime = new Date(message.date).toISOString().split('T');
          const date = dateTime[0];
          const time = dateTime[1].split('.')[0];
          const text = message.text || '';
          let photos = [];

          if (message.photo) {
            const photoFile = files.find(f => f.filename === path.basename(message.photo));
            if (photoFile) {
              photos.push({ src: `/photos/${photoFile._id}`, href: `/photos/${photoFile._id}` });
            }
          }

          const messageId = `${fromName}-${date}-${time}-${text}`; 
          if (!messageSet.has(messageId)) {
            messageSet.add(messageId); 
            messages.push({ fromName, date, time, text, photos });
          }
        });
      }
    });

  } catch (err) {
    console.error('Failed to retrieve files:', err);
    error = err.message;
  }

  res.render('telegram', { messages, error });
};

const deleteChatHistory = async (req, res) => {
  const studentId = req.params.studentId;

  if (!studentId) {
    return res.status(400).send('Student ID is required.');
  }

  if (!mongoose.Types.ObjectId.isValid(studentId)) {
    return res.status(400).send('Invalid student ID.');
  }

  try {
    const result = await File.deleteMany({ studentId: studentId, fileType: 'json' });
    if (result.deletedCount === 0) {
      return res.status(404).send('No chat history found to delete.');
    }

    res.send(`Deleted ${result.deletedCount} chat history record(s) successfully.`);
  } catch (error) {
    console.error('Error deleting chat history:', error);
    res.status(500).send('Failed to delete chat history');
  }
};

module.exports = {
  uploadFiles,
  handleFileUpload,
  getTelegramMessages,
  deleteChatHistory 
};
