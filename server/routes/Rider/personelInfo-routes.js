const express = require('express');
const multer = require('multer');
const riderController = require('../../controller/Rider/personelInfo-controller');
const verifyToken = require('../../middleware/authMiddleware');


const router = express.Router();

// Set up multer storage (temporary local storage for Cloudinary upload)
const storage = multer.diskStorage({
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// add token
router.post('/addRiderDetails', upload.fields([
  { name: 'cnicFront', maxCount: 1 },
  { name: 'cnicBack', maxCount: 1 },
  { name: 'bikeDocuments', maxCount: 1 }
]), riderController.addRiderDetails);

router.get('/listOfSalesperson', riderController.listOfSalesperson);
router.get('/riderOrdersById', riderController.riderOrdersById);
router.post('/riderOrderStatus', riderController.updateOrderStatusByRider);



module.exports = router;