// fileController.js
const File = require('../models/file');

const getPhoto = async (req, res) => {
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
};

module.exports = {
  getPhoto
};
