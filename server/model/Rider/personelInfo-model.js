const mongoose = require('mongoose');

const riderSchema = new mongoose.Schema(
    {
        riderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        name: { type: String },
        contactNo: { type: String },
        CNIC: { type: String },
        city: { type: String },
        bikeNo: { type: String },
        CNICFrontPath: { type: String },
        CNICBackPath: { type: String },
        motorCycleDocPath: { type: String },
        isApproved: { type: Boolean, default: false },
        status: {
            type: String,
            default: 'Pending'
        }

    }, 
    { timestamps: true }
);

const Rider = mongoose.model('Rider', riderSchema);
module.exports = Rider;
