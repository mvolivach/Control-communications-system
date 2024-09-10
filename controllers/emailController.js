const { google } = require('googleapis');
const path = require('path');
const fs = require('fs').promises;
const { authenticate } = require('@google-cloud/local-auth');
const mongoose = require('mongoose');
const EmailHistory = require('../models/emailHistory');
const Student = require('../models/student');
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

async function getAttachments(gmail, messageId, part) {
  const attachmentId = part.body.attachmentId;
  const response = await gmail.users.messages.attachments.get({
    'userId': 'me',
    'messageId': messageId,
    'id': attachmentId,
  });
  const data = response.data.data;
  return Buffer.from(data, 'base64').toString('base64');
}

const getEmailHistory = async (req, res) => {
  const studentId = req.params.studentId;

  const student = await Student.findById(studentId);
  if (!student) {
    return res.status(404).send('Student not found');
  }

  const userEmail = student.email;

  let emailHistory = await EmailHistory.findOne({ studentId });

  if (emailHistory) {
    return res.render('messages', { messages: emailHistory.messages });
  }

  try {
    const auth = await authorize();
    const gmail = google.gmail({ version: 'v1', auth });
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
      for (const message of threadResponse.data.messages) {
        const parts = message.payload.parts || [];
        for (const part of parts) {
          if (part.filename && part.filename.length > 0 && part.mimeType.startsWith('image/')) {
            const imageData = await getAttachments(gmail, message.id, part);
            message.attachments = message.attachments || [];
            message.attachments.push({ mimeType: part.mimeType, filename: part.filename, data: imageData });
          }
        }
      }
      messages.push(...threadResponse.data.messages);
    }
    messages.sort((a, b) => a.internalDate - b.internalDate);

    await EmailHistory.create({ studentId, userEmail, messages });
    res.render('messages', { messages });
  } catch (err) {
    console.error('The API returned an error: ' + err);
    res.send('Failed to retrieve email history.');
  }
};

const refreshEmailHistory = async (req, res) => {
  const studentId = req.params.studentId;

  await EmailHistory.deleteOne({ studentId });

  await getEmailHistory(req, res);
  
};

module.exports = {
  getEmailHistory,
  refreshEmailHistory
};
