const express = require('express');
const router = express.Router();
const verifyToken = require('../../middleware/authMiddleware');
const achievementController = require('../../controller/Admin/achievementAndMissions-controller');

//token add 
router.post('/addAchievement', achievementController.addAchievement);
router.post('/addMission', achievementController.addMission);

module.exports = router;