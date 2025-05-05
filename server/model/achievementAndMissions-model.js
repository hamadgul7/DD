const mongoose = require('mongoose');

const achievementMilestoneSchema = new mongoose.Schema({
    title: { type: String, required: true }, // Title of the milestone (e.g., "5 Purchases")
    description: { type: String }, // Optional description of the milestone
    points: { type: Number, default: 0 }, // Points awarded for completing the milestone
    completed: { type: Boolean, default: false }, // Whether the milestone is completed
    progress: { type: Number, default: 0 }, // The current progress towards the milestone (e.g., 3 out of 5 purchases)
    target: { type: Number, required: true }, // Target number (e.g., 5 purchases for "5 Purchases" milestone)
    dateAchieved: { type: Date } // Date when the milestone was achieved
});

const missionSchema = new mongoose.Schema({
    title: { type: String, required: true },                 // e.g., "Daily Login"
    description: { type: String },
    points: { type: Number, default: 0 },
    target: { type: Number, required: true },
    isDaily: { type: Boolean, default: true }
  }, 
  {
    timestamps: true
});
  
const Achievement = mongoose.model('Achievement', achievementMilestoneSchema);
const Mission = mongoose.model('Mission', missionSchema);

module.exports = { Achievement, Mission };
  