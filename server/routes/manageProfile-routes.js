const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');
const manageProfileController = require('../controller/manageProfile-controller');
const multer = require('multer');


const storage = multer.diskStorage({
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

router.get('/getProfileDetails',  manageProfileController.getUserDetails);
router.post('/updatePersonelDetails', manageProfileController.updatePersonelDetails);
router.post('/updateBusinessDetails', manageProfileController.updateBusinessDetails);
router.post('/updatePicture', upload.single('image'), manageProfileController.updatePicture);
router.post('/updatePassword',  manageProfileController.changePassword);

module.exports = router;