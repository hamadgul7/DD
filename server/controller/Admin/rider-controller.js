const Rider = require('../../model/Rider/personelInfo-model');
const User = require('../../model/auth-model');
const nodemailer = require("nodemailer");

async function getAllRiders(req, res){
    const { pageNo, limit } = req.query;

    try {
        const pageNumber = parseInt(pageNo) || 1;
        const pageLimit = parseInt(limit) || 10;

        if (pageNumber < 1 || pageLimit < 1) {
            return res.status(400).json({ message: "Page number and limit must be positive integers" });
        }

        const skip = (pageNumber - 1) * pageLimit;

        const riders = await Rider.find().skip(skip).limit(pageLimit);
        const totalRiders = await Rider.countDocuments();
        const totalPages = Math.ceil(totalRiders / pageLimit);

        const nextPage = pageNumber < totalPages ? pageNumber + 1 : null;
        const previousPage = pageNumber > 1 ? pageNumber - 1 : null;

        res.status(200).json({
            success: true,
            data: riders,
            meta: {
                totalItems: totalRiders,
                totalPages,
                currentPage: pageNumber,
                pageLimit,
                nextPage,
                previousPage
            },
            message: "Riders retrieved successfully"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
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

        const riderDetails = await User.findByIdAndUpdate(
            riderId ,
            { isApproved: true, status: 'Approved' },
            { new: true }
        );

        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            },
            tls: { rejectUnauthorized: false }
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: riderDetails.email, // replace with the correct rider email variable
            subject: "Rider Approval - Diverse Den",
            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                    <h2>Congratulations!</h2>
                    <p>Your application to become a rider at <strong>Diverse Den</strong> has been approved.</p>
                    <p>You can now start accepting delivery assignments and manage your rider dashboard.</p>                  
                    <p><strong>Best Regards,</strong><br>Diverse Den Team</p>
                </div>
            `
        };
        await transporter.sendMail(mailOptions);

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

        const riderDetails = await User.findByIdAndUpdate(
            riderId ,
            { isApproved: true, status: 'Rejected' },
            { new: true }
        );

        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            },
            tls: { rejectUnauthorized: false }
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: riderDetails.email, // replace with the correct rider email variable
            subject: "Rider Application Status - Diverse Den",
            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                    <h2>Hello,</h2>
                    <p>We appreciate your interest in becoming a rider with <strong>Diverse Den</strong>.</p>
                    <p>After reviewing your application, we regret to inform you that it has not been approved at this time.</p>
                    <p>You are welcome to apply again in the future if circumstances change.</p>
                    <p><strong>Best Regards,</strong><br>Diverse Den Team</p>
                </div>
            `
        };
        await transporter.sendMail(mailOptions);


        res.status(200).json({
            success: true,
            message: 'Rider rejected successfully',
            data: rider
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
}

async function deleteRider(req, res){
    const { riderId } = req.body;

    try {
        const deletedRider = await Rider.findOneAndDelete({ riderId });

        const riderDetails = await User.findByIdAndUpdate(
            riderId ,
            { isApproved: false, status: '', isDetailsAdded: false },
            { new: true }
        );

        if (!deletedRider) {
            return res.status(404).send('Rider not found');
        }

        res.send('Rider deleted successfully');
    } catch (err) {
        res.status(500).send('Server Error');
    }
}

module.exports = {
    getAllRiders: getAllRiders,
    viewRiderDetails: viewRiderDetails,
    approveRider: approveRider,
    rejectRider: rejectRider,
    deleteRider: deleteRider
}