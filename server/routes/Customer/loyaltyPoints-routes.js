const express = require('express');
const router = express.Router();
const verifyToken = require('../../middleware/authMiddleware');
const loyaltyPointsController = require('../../controller/Customer/loyaltyPoints-controller');

//token add karna hai
router.get('/customerLoyaltyPoints', loyaltyPointsController.customerLoyaltyPoints);

module.exports = router;