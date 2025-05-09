const PurchasedGiftCard = require('../../model/Customer/purchasedGiftCard-model')
const nodemailer = require('nodemailer'); 
require("dotenv").config();

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

    // Create new purchased gift card
    const newPurchase = new PurchasedGiftCard({
        userId,
        giftCardId,
        recipientName,
        recipientEmail,
        personalMessage,
        senderName,
        price,
        remainingAmount: price, // default to full amount
    });

    const savedGiftCard = await newPurchase.save();

    // Send email to recipient
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
            <p>You can use this gift card on our store. 🎉</p>
            <p><strong>Store Name: Diverse Den</strong></p>
            <p>Card Status: <strong>Active</strong></p>
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

module.exports = {
    purchaseAndSendGiftCard: purchaseAndSendGiftCard
}