const express = require('express');
const router = express.Router();
const verifyToken = require('../../middleware/authMiddleware');
const subscriptionReportsController = require('../../controller/Admin/subscriptionReports-controller')

//Add Token
router.get('/weeklySubscriptionReports', subscriptionReportsController.weeklySubscriptionReports);
router.get('/monthlySubscriptionReports', subscriptionReportsController.monthlySubscriptionReports);
router.get('/yearlySubscriptionReports', subscriptionReportsController.yearlySubscriptionReports)

module.exports = router;