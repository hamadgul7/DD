const UserPoints = require('../../model/Customer/loyaltyPoints-model');
const mongoose = require('mongoose');

async function customerLoyaltyPoints(req, res){
    const { userId } = req.query;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: 'Invalid user ID format' });
    }

    try {
        const userPoints = await UserPoints.findOne({ userId });

        if (!userPoints) {
            return res.status(404).json({ message: 'Points record not found for this user' });
        }

        res.status(200).json(userPoints);
    } catch (error) {
        console.error('Error fetching user points:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

module.exports = {
    customerLoyaltyPoints: customerLoyaltyPoints
}