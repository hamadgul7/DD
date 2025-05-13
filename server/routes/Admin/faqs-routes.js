const express = require('express');
const router = express.Router();
const verifyToken = require('../../middleware/authMiddleware');
const adminFAQsController = require('../../controller/Admin/faqs-controller');

//add token
router.post('/addFAQs', adminFAQsController.addFAQs);
router.get('/viewFAQs', adminFAQsController.viewFAQsWithPagination);
router.post('/updateFAQs', adminFAQsController.updateFAQs);
router.post('/deleteFAQs', adminFAQsController.deleteFAQs);


module.exports = router;