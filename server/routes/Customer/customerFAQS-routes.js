const express = require('express');
const verifyToken = require('../../middleware/authMiddleware')
const router = express.Router();
const customerFAQSController = require('../../controller/Customer/customerFAQS-controller');

//token add
router.get('/getQuestions', customerFAQSController.getQuestions);
router.get('/getAnswers', customerFAQSController.getAnswers);

module.exports = router;