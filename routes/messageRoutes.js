const express = require('express');
const router = express.Router();
const { createMessage, getMessages } = require('../controllers/messageController');

router.post('/message', createMessage);
router.get('/messages', getMessages);

module.exports = router;
