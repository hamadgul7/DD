const express = require('express');
const router = express.Router();
const verifyToken = require('../../middleware/authMiddleware');
const purchasedGiftCardController = require('../../controller/Customer/purchasedGiftCard-controller');

router.post('/purchaseAndSendGiftCard', purchasedGiftCardController.purchaseAndSendGiftCard);

module.exports = router;