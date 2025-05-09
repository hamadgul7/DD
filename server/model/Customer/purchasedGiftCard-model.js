const mongoose = require('mongoose');

const purchasedGiftCardSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },

        giftCardId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'GiftCard',
            required: true
        },

        recipientName: {
            type: String,
            trim: true
        },

        recipientEmail: {
            type: String,
            trim: true,
            required: true
        },

        personalMessage: {
            type: String,
            trim: true
        },

        senderName: {
            type: String,
            trim: true
        },

        price: {
            type: Number,
            required: true
        },

        remainingAmount: {
            type: Number,
            default: 0
        },

        status: {
            type: String,
            default: 'Active'
        }
    },
    { timestamps: true }
);

const PurchasedGiftCard = mongoose.model('PurchasedGiftCard', purchasedGiftCardSchema);
module.exports = PurchasedGiftCard;
