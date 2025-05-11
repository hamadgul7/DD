const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');
const messageController = require('../controller/message-controller');

//add token
router.post('/', messageController.createMessage);
router.get('/:chatId', messageController.getMessages);
router.post('/deleteMessage', messageController.deleteMessage);

module.exports = router;