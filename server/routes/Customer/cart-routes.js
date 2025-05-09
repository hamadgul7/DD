const express = require('express');
const customerCartController = require('../../controller/Customer/cart-controller');
const verifyToken = require('../../middleware/authMiddleware')
const router = express.Router();

router.get('/viewCart', verifyToken, customerCartController.viewCart);
router.post('/addToCart', verifyToken, customerCartController.addToCart);
// token add
router.post('/createDiscountSummary', customerCartController.createDiscountSummary);
router.get('/viewDiscountSummary', customerCartController.viewDiscountSummary);
router.post('/updateProductQuantityInCart', verifyToken, customerCartController.updateProductQuantityInCart);
router.post('/deleteCartProduct', verifyToken, customerCartController.deleteProductFromCart);
router.post('/emptyCart', verifyToken, customerCartController.emptyCart);


module.exports = router;