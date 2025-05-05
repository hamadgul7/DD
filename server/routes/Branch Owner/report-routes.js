const express = require('express');
const reportsController = require('../../controller/Branch Owner/reports-controller');
const verifyToken = require('../../middleware/authMiddleware')
const router = express.Router();

//Token add karna hai
router.get('/weeklySalesReports', reportsController.weeklySalesReports);
router.get('/monthlySalesReports', reportsController.monthlySalesReports);
router.get('/yearlySalesReports', reportsController.yearlySalesReports);

router.get('/weeklyRevenueReports', reportsController.weeklyRevenueReports);
router.get('/monthlyRevenueReports', reportsController.monthlyRevenueReports);
router.get('/yearlyRevenueReports', reportsController.yearlyRevenueReports);

router.get('/dailyTrendingProducts', reportsController.dailyTrendingProducts);
router.get('/weeklyTrendingProducts', reportsController.weeklyTrendingProducts);
router.get('/monthlyTrendingProducts', reportsController.monthlyTrendingProducts)

module.exports = router;