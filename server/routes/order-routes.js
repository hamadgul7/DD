const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');
const orderController = require('../controller/orders-controller');

router.post('/addOrderDetails', orderController.addOrderDetails);
//add token
router.get('/getOrders',  orderController.getOrders);
router.get('/getSalespersonOrders', verifyToken, orderController.getSalespersonOrders)
router.post('/assignOrderToBranch', orderController.assignOrderToBranch);
// add token
router.post('/assignOrderToRider', orderController.assignOrderToRider);
router.post('/updateOrderStatus', verifyToken, orderController.updateOrderStatus);
router.post('/deleteOrder', verifyToken, orderController.deleteOrder)

module.exports = router;