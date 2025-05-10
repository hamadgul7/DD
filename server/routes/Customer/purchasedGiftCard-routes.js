const express = require('express');
const router = express.Router();
const verifyToken = require('../../middleware/authMiddleware');
const purchasedGiftCardController = require('../../controller/Customer/purchasedGiftCard-controller');

//add token
router.post('/purchaseAndSendGiftCard', purchasedGiftCardController.purchaseAndSendGiftCard);
router.post('/getUserGiftCards', purchasedGiftCardController.getUserGiftCard);
router.get('/useGiftCard', purchasedGiftCardController.useGiftCard);

module.exports = router;