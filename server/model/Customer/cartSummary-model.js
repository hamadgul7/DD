const mongoose = require('mongoose');

const cartSummarySchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },

  discountAmount: { type: Number, default: 0 },
  orderSubtotal: { type: Number, default: 0 },
  orderTotal: { type: Number, default: 0 },
  pointsRedeemed: { type: Number, default: 0 },
  shippingCost: { type: Number, default: 0 },

}, { timestamps: true });

const CartSummary = mongoose.model('CartSummary', cartSummarySchema);
module.exports = CartSummary
