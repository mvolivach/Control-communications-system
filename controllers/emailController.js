const { google } = require('googleapis');
const path = require('path');
const fs = require('fs').promises;
const { authenticate } = require('@google-cloud/local-auth');
const NodeCache = require('node-cache');

const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

// Створення кешу з часом життя токену (наприклад, 1 година)
const tokenCache = new NodeCache({ stdTTL: 3600 });

// Завантаження збережених облікових даних, якщо вони існують у кеші
async function loadSavedCredentialsIfExist() {
  const cachedCredentials = tokenCache.get('credentials');
  if (cachedCredentials) {
    return google.auth.fromJSON(cachedCredentials);
  }
  return null;
}

// Збереження облікових даних користувача у кеші
async function saveCredentials(client) {
  const content = await fs.readFile(CREDENTIALS_PATH);
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = {
    type: 'authorized_user',
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  };
  tokenCache.set('credentials', payload);
}

// Авторизація користувача
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

// Отримання вкладень з повідомлення
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

// Отримання історії листування по email
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
    messages.sort((a, b) => a.internalDate - b.internalDate);
    res.render('messages', { messages });
  } catch (err) {
    console.error('The API returned an error: ' + err);
    res.send('Failed to retrieve email history.');
  }
};

module.exports = {
  getEmailHistory
};
