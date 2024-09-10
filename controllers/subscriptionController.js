// controllers/subscriptionController.js
const webpush = require('web-push');
const Subscription = require('../models/subscription');

const publicVapidKey = 'BPvlkng_iP-bcObGeB8ECti0z9pSEc8uXJLHL4QqdsLnjmXC28kn_TzmMf8NDBXfCwS0vlNhsvx--hRfPhAn_7Y';
const privateVapidKey = '8tBV1QuI_6lwJtWsuL4XmmrLpbAz1ONZV7ohkR4jiuo';

webpush.setVapidDetails('mailto:test@test.com', publicVapidKey, privateVapidKey);

const subscriptions = [];

const saveSubscription = async (subscription) => {
  const newSubscription = new Subscription(subscription);
  await newSubscription.save();
  subscriptions.push(subscription);
};

const sendNotification = (subscription, payload) => {
  webpush.sendNotification(subscription, payload).catch(err => console.error(err));
};

module.exports = {
  subscriptions,
  saveSubscription,
  sendNotification
};
