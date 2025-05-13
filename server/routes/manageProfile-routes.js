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
router.post('/updateProfileDetails', upload.single('image'), manageProfileController.updateUserDetails);

module.exports = router;