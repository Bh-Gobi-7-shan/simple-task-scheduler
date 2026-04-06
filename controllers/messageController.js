const Message = require('../models/Message');

// Parse "DD-MM-YYYY" and "h:mmAM/PM" into a Date object
const parseDateTime = (dateStr, timeStr) => {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return null;

  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // months are 0-indexed
  const year = parseInt(parts[2], 10);

  // Parse time like "7:00PM", "12:30AM", "7.00PM", "7.00pm"
  const timeClean = timeStr.replace('.', ':').toUpperCase().trim();
  const timeMatch = timeClean.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
  if (!timeMatch) return null;

  let hours = parseInt(timeMatch[1], 10);
  const minutes = parseInt(timeMatch[2], 10);
  const period = timeMatch[3];

  if (period === 'AM' && hours === 12) hours = 0;
  if (period === 'PM' && hours !== 12) hours += 12;

  const date = new Date(year, month, day, hours, minutes);
  if (isNaN(date.getTime())) return null;
  return date;
};

const createMessage = async (req, res) => {
  try {
    const { message, date, time } = req.body;

    if (!message || !date || !time) {
      return res.status(400).json({ error: '"message", "date", and "time" are required' });
    }

    const scheduledDate = parseDateTime(date, time);
    if (!scheduledDate) {
      return res.status(400).json({ error: 'Invalid date/time format. Use date: "DD-MM-YYYY", time: "h:mmAM/PM"' });
    }

    if (scheduledDate <= new Date()) {
      return res.status(400).json({ error: 'Scheduled date/time must be in the future' });
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
