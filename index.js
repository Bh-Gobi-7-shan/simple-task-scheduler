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
      try {
        const now = new Date();
        const pendingMessages = await Message.find({
          status: 'pending',
          scheduledAt: { $lte: now }
        });

        for (const msg of pendingMessages) {
          console.log(`[DELIVERED] ${msg.scheduledAt.toISOString()} - ${msg.message}`);
        }

        if (pendingMessages.length > 0) {
          await Message.updateMany(
            { status: 'pending', scheduledAt: { $lte: now } },
            { $set: { status: 'delivered' } }
          );
          console.log(`[CRON] Delivered ${pendingMessages.length} message(s)`);
        }
      } catch (err) {
        console.error('[CRON] Error:', err.message);
      }
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });
