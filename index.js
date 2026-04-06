require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cron = require('node-cron');
const { createMessage, getMessages } = require('./controllers/messageController');
const Message = require('./models/Message');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.post('/message', createMessage);
app.get('/messages', getMessages);

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB Atlas');

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });


    cron.schedule('* * * * *', async () => {
      const now = new Date();
      const sriLankaTime = now.toLocaleString('en-GB', { timeZone: 'Asia/Colombo' });
      console.log(`[CRON] Running at ${sriLankaTime} (Sri Lanka Time)`);

      try {
        const pendingMessages = await Message.find({
          status: 'pending',
          scheduledAt: { $lte: now }
        });

        if (pendingMessages.length === 0) {
          console.log('[CRON] No pending messages to deliver');
          return;
        }

        for (const msg of pendingMessages) {
          console.log(`[DELIVERED] ${msg.message} | Scheduled: ${msg.scheduledAt.toLocaleString('en-GB', { timeZone: 'Asia/Colombo' })}`);
        }

        await Message.updateMany(
          { status: 'pending', scheduledAt: { $lte: now } },
          { $set: { status: 'delivered' } }
        );
        console.log(`[CRON] ✅ Delivered ${pendingMessages.length} message(s)`);
      } catch (err) {
        console.error('[CRON] Error:', err.message);
      }
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });
