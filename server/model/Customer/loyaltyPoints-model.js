
const mongoose = require('mongoose');

const pointHistorySchema = new mongoose.Schema({
    type: { type: String },
    description: { type: String },
    points: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    expiresAfterDays: { type: Number, default: null }, 
    expiryDate: { 
        type: Date, 
        default: function() {
            return this.expiresAfterDays 
                ? new Date(this.date.getTime() + this.expiresAfterDays * 86400000) 
                : null;
        } 
    },
    isExpired: { type: Boolean, default: false }
});


const achievementMilestoneSchema = new mongoose.Schema({
    achievementId: { type: mongoose.Schema.Types.ObjectId, ref: 'Achievement', required: true },
    title: { type: String, required: true },
    description: { type: String },
    points: { type: Number, default: 0 },
    completed: { type: Boolean, default: false },
    progress: { type: Number, default: 0 },
    target: { type: Number, required: true },
    dateAchieved: { type: Date }
});
  
const missionSchema = new mongoose.Schema({
    missionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Mission' },
    title: { type: String, required: true },              
    description: { type: String },
    points: { type: Number, default: 0 },
    completed: { type: Boolean, default: false },
    target: { type: Number, required: true },
    date: { type: Date, default: Date.now }
});

const userPointSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    totalPoints: { type: Number, default: 0 },
    pointHistory: [pointHistorySchema],
    hasFirstLoginPoints: { type: Boolean, default: false },
    hasFirstPurchasePoints: { type: Boolean, default: false },
    purchaseCount: {type: Number, default: 0 },
    dailyMissions:[missionSchema],
    achievementMilestones: [achievementMilestoneSchema],
    lastMissionReset: { type: Date },
}, 

{
  timestamps: true
});

userPointSchema.pre('save', function(next) {
    const now = new Date();
    this.pointHistory.forEach(entry => {
        if (!entry.isExpired && entry.expiryDate && entry.expiryDate <= now) {
            entry.isExpired = true;
        }
    });
    this.totalPoints = this.pointHistory.reduce(
        (sum, entry) => sum + (entry.isExpired ? 0 : entry.points), 
        0
    );
    next();
});
const UserPoints = mongoose.model('UserPoints', userPointSchema);
module.exports = UserPoints; 
