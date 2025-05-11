const express = require('express');
const router = express.Router();
const verifyToken = require('../../middleware/authMiddleware');
const adminFAQsController = require('../../controller/Admin/faqs-controller');

//add token
router.post('/addFAQs', adminFAQsController.addFAQs);


module.exports = router;