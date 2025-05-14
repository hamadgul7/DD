const mongoose = require('mongoose');

const achievementMilestoneSchema = new mongoose.Schema({
    title: { type: String, required: true }, 
    description: { type: String }, 
    points: { type: Number, default: 0 }, 
    completed: { type: Boolean, default: false }, 
    progress: { type: Number, default: 0 }, 
    target: { type: Number, required: true }, 
    dateAchieved: { type: Date } 
});

const missionSchema = new mongoose.Schema({
    title: { type: String, required: true },                
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
  