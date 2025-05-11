const Rider = require('../../model/Rider/personelInfo-model');
const User = require('../../model/auth-model');
const nodemailer = require("nodemailer");

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

module.exports = {
    getAllRiders: getAllRiders,
    viewRiderDetails: viewRiderDetails,
    approveRider: approveRider,
    rejectRider: rejectRider
}