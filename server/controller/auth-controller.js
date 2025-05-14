const User = require('../model/auth-model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createToken } = require('../config/jwt');
const secretKey = "DiverseDen";
const { Business } = require('../model/Branch Owner/business-model');
const UserPoints = require('../model/Customer/loyaltyPoints-model');
const { Mission, Achievement } = require('../model/achievementAndMissions-model');

async function signup(req, res) {
  const { firstname, lastname, email, role, phone, password } = req.body;
  
  try {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "Email Already Taken" });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const user = new User({
          firstname, 
          lastname, 
          email, 
          role, 
          phone, 
          password: hashedPassword,
      });

      const newUser = await user.save();

      res.status(201).json({
        user: newUser,
        message: "User created successfully",
      });
  } 
  catch (error) {
    res.status(400).json({ message: error.message });
  }
};

async function login(req, res){
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User Not Found" });

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(400).json({ message: "Invalid Password" });

    const { password: _, ...userInfo } = user.toObject();
    const token = createToken(user._id);

    if (user.role === "Customer") {
      let userPoints = await UserPoints.findOne({ userId: user._id });

      const allMissions = await Mission.find();
      const allAchievements = await Achievement.find();
      const now = new Date();

      if (!userPoints) {
      
        const dailyMissions = allMissions.map(m => ({
          missionId: m._id,
          title: m.title,
          description: m.description,
          points: m.points,
          target: m.target,
          completed: false,
          progress: 0,
          date: now
        }));

        const achievementMilestones = allAchievements.map(a => ({
          achievementId: a._id,
          title: a.title,
          description: a.description,
          points: a.points,
          target: a.target,
          completed: false,
          progress: 0
        }));

        userPoints = new UserPoints({
          userId: user._id,
          totalPoints: 50,
          hasFirstLoginPoints: true,
          pointHistory: [{
            type: "login",
            description: "First login",
            points: 50,
            date: now
          }],
          dailyMissions,
          achievementMilestones,
          lastMissionReset: now
        });

        await userPoints.save();

      } else {
        // Award first login points if not already awarded
        if (!userPoints.hasFirstLoginPoints) {
          userPoints.totalPoints += 50;
          userPoints.hasFirstLoginPoints = true;
          userPoints.pointHistory.push({
            type: "login",
            description: "First login",
            points: 50,
            date: now
          });
        }

        // Reset daily missions if a new day has started
        const lastReset = userPoints.lastMissionReset || now;
        if (now.toDateString() !== lastReset.toDateString()) {
          userPoints.dailyMissions = userPoints.dailyMissions.map(m => ({
            ...m.toObject(),
            completed: false,
            progress: 0,
            date: now
          }));
          userPoints.lastMissionReset = now;
        }

        // Append new missions if added after userPoints was created
        const existingMissionIds = userPoints.dailyMissions.map(m => m.missionId.toString());
        const newMissions = allMissions.filter(m => !existingMissionIds.includes(m._id.toString()));
        newMissions.forEach(m => {
          userPoints.dailyMissions.push({
            missionId: m._id,
            title: m.title,
            description: m.description,
            points: m.points,
            target: m.target,
            completed: false,
            progress: 0,
            date: now
          });
        });

        // Append new achievements
        const existingAchievementIds = userPoints.achievementMilestones.map(a => a.achievementId.toString());
        const newAchievements = allAchievements.filter(a => !existingAchievementIds.includes(a._id.toString()));
        newAchievements.forEach(a => {
          userPoints.achievementMilestones.push({
            achievementId: a._id,
            title: a.title,
            description: a.description,
            points: a.points,
            target: a.target,
            completed: false,
            progress: 0
          });
        });

        await userPoints.save();
      }
    }

    res.status(201).json({
      user: userInfo,
      token,
      message: "Login Successful"
    });

  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
}

async function verifyTokenRefresh(req, res) {
  const token = req.header("Authorization")?.split(" ")[1];

  if (!token) {
      return res.status(401).json({
          message: "Access Denied! Unauthorized user"
      });
  }

  try {
      const decoded = jwt.decode(token);
      if (!decoded) {
          return res.status(400).json({ message: "Invalid token." });
      }

      if (decoded.exp * 1000 < Date.now()) {
          return res.status(401).json({ message: "Token has expired." });
      }

      const verified = jwt.verify(token, secretKey);
      req.user = verified;
      const userId = req.user.id;
      const user = await User.findOne({ _id: userId });

      if (!user) {
          return res.status(404).json({ message: "No user Found!" });
      }

      const { password: _, ...userInfo } = user.toObject();

      // userInfo.hasMainBranch = false;

      // if (user.role === "branch owner") {
      //     const business = await Business.findOne({ user: user._id }).populate("branches");

      //     if (business) {
      //         userInfo.hasMainBranch = business.branches.some(branch => branch.isMainBranch === true);
      //     }
      // }

      res.status(201).json({
          user: userInfo, 
          message: "User Data.."
      });
  } catch (error) {
      res.status(400).json({ message: error.message });
  }


}

module.exports = {
  signup: signup,
  login: login,
  verifyTokenRefresh: verifyTokenRefresh,
};
