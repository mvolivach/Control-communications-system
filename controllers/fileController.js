const multer = require('multer');
const mongoose = require('mongoose');
const File = require('../models/file.js');
const cheerio = require('cheerio');
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

    // Delete existing files for the student
    await File.deleteMany({ studentId: studentId });

    const filesToSave = [];

    req.files.forEach(file => {
      const extname = path.extname(file.originalname).toLowerCase();
      const isHtml = extname === '.html';
      const isJpg = extname === '.jpg';

      if (isHtml || isJpg) {
        const fileType = isHtml ? 'html' : 'photo';
        filesToSave.push({
          filename: file.originalname,
          contentType: file.mimetype,
          data: file.buffer,
          studentId: studentId,
          fileType: fileType
        });
      }
    });

    if (filesToSave.length === 0) {
      return res.status(400).send('No valid files found to upload.');
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
  
    try {
      const files = await File.find({ studentId: req.params.studentId });
      if (files.length === 0) {
        throw new Error('No files found for the provided student ID');
      }
  
      files.forEach(file => {
        if (file.fileType === 'html' && path.extname(file.filename).toLowerCase() === '.html') {
          const fileContent = file.data.toString('utf8');
          const $ = cheerio.load(fileContent);
  
          $('.message.default.clearfix').each((i, elem) => {
            const fromName = $(elem).find('.from_name').text().trim();
            const date = $(elem).find('.date.details').attr('title').split(' ')[0];
            const text = $(elem).find('.text').html();
            let photos = [];
  
            $(elem).find('.media_wrap .photo_wrap').each((i, photoElem) => {
              const photoSrc = $(photoElem).find('img').attr('src');
              const photoHref = $(photoElem).attr('href');
              const photoFile = files.find(f => f.filename === path.basename(photoSrc));
              if (photoFile) {
                photos.push({ src: `/photos/${photoFile._id}`, href: `/photos/${photoFile._id}` });
              }
            });
  
            messages.push({ fromName, date, text, photos });
          });
        }
      });
  
    } catch (err) {
      console.error('Failed to retrieve files:', err);
      error = err.message;
    }
  
    res.render('telegram', { messages, error });
  };
module.exports = {
  uploadFiles,
  handleFileUpload,
  getTelegramMessages
};
