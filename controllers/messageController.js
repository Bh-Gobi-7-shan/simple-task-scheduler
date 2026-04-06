const Message = require('../models/Message');

const createMessage = async (req, res) => {
  try {
    const { message, scheduledAt } = req.body;

    if (!message || !scheduledAt) {
      return res.status(400).json({ error: '"message" and "scheduledAt" are required' });
    }

    const scheduledDate = new Date(scheduledAt);
    if (isNaN(scheduledDate.getTime())) {
      return res.status(400).json({ error: '"scheduledAt" must be a valid date' });
    }

    if (scheduledDate <= new Date()) {
      return res.status(400).json({ error: '"scheduledAt" must be a future date' });
    }

    const newMessage = await Message.create({ message, scheduledAt: scheduledDate });

    res.status(201).json({
      id: newMessage._id,
      message: newMessage.message,
      scheduledAt: newMessage.scheduledAt,
      status: newMessage.status,
      createdAt: newMessage.createdAt
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getMessages = async (req, res) => {
  try {
    const messages = await Message.find().sort({ scheduledAt: -1 });
    res.status(200).json(messages);
  }
  catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { createMessage, getMessages };
