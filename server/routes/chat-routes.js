const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');
const chatcontroller = require('../controller/chat-controller');

//add token
router.post('/', chatcontroller.createChat);
router.get('/fetchChats', chatcontroller.findUserChats);
router.get('/fetchBothUsersChat', chatcontroller.findChat);

module.exports = router;