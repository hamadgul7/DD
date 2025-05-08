const mongoose = require('mongoose');

const giftCardSchema = new mongoose.Schema(
    {   
        businessId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Business"
        },

        businessName: {
            type: String
        },

        code: {
            type: String,
            required: true,
            trim: true
        },

        minPrice: {
            type: String,
            required: true,
        },

        maxPrice: {
            type: String,
            required: true,
        },

        status: {
            type: String,
            default: 'active'
        },
        
        description: {
            type: String,
            trim: true
        },

        imagePath: {
            type: String
        }
    }, 

    { timestamps: true }
);

const GiftCard = mongoose.model('GiftCard', giftCardSchema);

module.exports = GiftCard;
