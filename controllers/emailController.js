// controllers/emailController.js
const { google } = require('googleapis');
const path = require('path');
const fs = require('fs').promises;
const { authenticate } = require('@google-cloud/local-auth');
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

const os = require('os');

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

  if (os.platform() !== 'win32') {
    await fs.chmod(TOKEN_PATH, 0o400);
  } else {
    console.log('Setting file permissions on Windows may require additional steps or different commands.');
  }
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
    res.render('messages', { messages });
  } catch (err) {
    console.error('The API returned an error: ' + err);
    res.send('Failed to retrieve email history.');
  }
};

module.exports = {
  getEmailHistory
};
