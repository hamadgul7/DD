const express = require('express');
const router = express.Router();
const multer = require('multer');
const verifyToken = require('../../middleware/authMiddleware');
const giftCardController = require('../../controller/Branch Owner/giftCard-controller');

const storage = multer.diskStorage({
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });
//add token
router.post('/addGiftCard', upload.single('imageUrl'), giftCardController.addGiftCard);
router.get('/viewGiftCardDetails',  giftCardController.viewGiftCardDetails)
router.post('/updateGiftCardDetails', upload.single('imageUrl'), giftCardController.updateGiftCardDetails);
router.get('/listBusinessGiftCards', giftCardController.listGiftCardsWithPagination);
router.post('/deleteGiftCard', giftCardController.deleteGiftCard);

module.exports = router;