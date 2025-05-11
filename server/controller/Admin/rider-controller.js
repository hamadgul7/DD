const Rider = require('../../model/Rider/personelInfo-model');
const User = require('../../model/auth-model');

async function getAllRiders(req, res){
    try {
        const riders = await Rider.find();
        res.status(200).json({ success: true, data: riders });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error......', error: error.message });
    }
}

async function viewRiderDetails(req, res) {
    const { riderId } = req.query;

    try {
        const rider = await Rider.findOne({ riderId });

        if (!rider) {
            return res.status(404).json({ success: false, message: 'Rider not found' });
        }

        res.status(200).json({ success: true, data: rider });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error..............', error: error.message });
    }
}

async function approveRider(req, res){
    const { riderId } = req.body;

    try {
        const rider = await Rider.findOneAndUpdate(
            { riderId },
            { isApproved: true, status: 'Approved' },
            { new: true }
        );

        if (!rider) {
            return res.status(404).json({ success: false, message: 'Rider not found' });
        }

        const user = await User.findByIdAndUpdate(
            riderId ,
            { isApproved: true, status: 'Approved' },
            { new: true }
        );

        res.status(200).json({
            success: true,
            message: 'Rider approved successfully',
            data: rider
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
}

async function rejectRider(req, res){
    const { riderId } = req.body;

    try {
        const rider = await Rider.findOneAndUpdate(
            { riderId },
            { isApproved: false, status: 'Rejected' },
            { new: true }
        );

        if (!rider) {
            return res.status(404).json({ success: false, message: 'Rider not found' });
        }

        const user = await User.findByIdAndUpdate(
            riderId ,
            { isApproved: true, status: 'Rejected' },
            { new: true }
        );

        res.status(200).json({
            success: true,
            message: 'Rider rejected successfully',
            data: rider
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
}

module.exports = {
    getAllRiders: getAllRiders,
    viewRiderDetails: viewRiderDetails,
    approveRider: approveRider,
    rejectRider: rejectRider
}