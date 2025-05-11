const express = require('express');
const router = express.Router();
const verifyToken = require('../../middleware/authMiddleware');
const riderController = require('../../controller/Admin/rider-controller');

//add token
router.get('/getAllRiders', riderController.getAllRiders);
router.get('/viewRiderDetails', riderController.viewRiderDetails);
router.post('/approveRider', riderController.approveRider);
router.post('/rejectRider', riderController.rejectRider);
router.post('/deleteRider', riderController.deleteRider);

module.exports = router;