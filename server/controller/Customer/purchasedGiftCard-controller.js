const PurchasedGiftCard = require('../../model/Customer/purchasedGiftCard-model');
const GiftCard = require('../../model/Branch Owner/giftCard-model');
const nodemailer = require('nodemailer'); 
require("dotenv").config();
const crypto = require('crypto');


async function purchaseAndSendGiftCard(req, res){
    try {
        const {
            userId,
            giftCardId,
            recipientName,
            recipientEmail,
            personalMessage,
            senderName,
            price
        } = req.body;

    
        const giftCard = await GiftCard.findById(giftCardId);
        if (!giftCard) {
            return res.status(404).json({ message: 'Gift card not found.' });
        }

        const redeemCode = crypto.randomBytes(6).toString('hex');


        const newPurchase = new PurchasedGiftCard({
            userId,
            giftCardId,
            recipientName,
            recipientEmail,
            personalMessage,
            senderName,
            price,
            remainingAmount: price,
            redeemCode: redeemCode
        });

        const savedGiftCard = await newPurchase.save();

      
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
            to: recipientEmail,
            subject: `🎁 You've received a gift card from ${senderName || 'someone'}!`,
            html: `
                <h2>Hi ${recipientName || 'there'},</h2>
                <p><strong>${senderName || 'A friend'}</strong> has sent you a gift card worth <strong>RS.${price}</strong>!</p>
                ${personalMessage ? `<p><strong>Message:</strong> ${personalMessage}</p>` : ''}
                <p><strong>Gift Card Redeem Code:</strong> <code>${redeemCode}</code></p>
                <p><strong>Recipient Email:</strong> <code>${recipientEmail}</code></p>
                <p>To redeem your gift card, you will need <strong>gift card Redeem code</strong> you received this on.</p>
                <p>You can use this gift card at our store. 🎉</p>
                <p><strong>Store Name: Diverse Den</strong></p>
                <p>Status: <strong>Active</strong></p>
                <hr>
                <p><em>This is an automated message. Please do not reply.</em></p>
            `
        };

        await transporter.sendMail(mailOptions);

        res.status(201).json({
            message: 'Gift card purchased and email sent to recipient.',
            giftCard: savedGiftCard
        });

    } catch (error) {
        console.error('Gift card purchase error:', error);
        res.status(500).json({ message: 'Failed to process gift card.', error: error.message });
    }
}

async function getUserGiftCard(req, res) {
    try {
    const { userId } = req.query;

    const purchasedGiftCards = await PurchasedGiftCard.find({ userId })
        .populate('giftCardId') 
        .exec();

    if (!purchasedGiftCards.length) {
        return res.status(404).json({ message: 'No gift cards found for this user.' });
    }

    res.status(200).json({
        success: true,
        data: purchasedGiftCards
    });
    } catch (error) {
        console.error('Error fetching purchased gift cards:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}

async function useGiftCard(req, res){
    try {
        const { redeemCode } = req.query;

        if (!redeemCode) {
            return res.status(400).json({ message: 'Redeem code is required.' });
        }

   
        const purchasedCard = await PurchasedGiftCard.findOne({ redeemCode: redeemCode.trim() })
            .populate('giftCardId');

        if (!purchasedCard) {
            return res.status(404).json({ message: 'Invalid or expired redeem code.' });
        }

        return res.status(200).json({
            message: 'Valid gift card found.',
            giftCardDetails: purchasedCard
        });

    } catch (error) {
        console.error('Gift card validation error:', error);
        return res.status(500).json({ message: 'Server error.', error: error.message });
    }

}

module.exports = {
    purchaseAndSendGiftCard: purchaseAndSendGiftCard,
    getUserGiftCard: getUserGiftCard,
    useGiftCard: useGiftCard
}