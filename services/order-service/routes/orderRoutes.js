require('dotenv').config();
const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const paymentController = require('../controllers/paymentController');
const itemController = require('../controllers/itemController');

router.post('/checkout', orderController.checkout);
router.get('/', orderController.getMyOrders);
router.post('/validate-ticket', itemController.validateTicket);
router.get('/:id', orderController.getOrderById);
router.post('/:id/pay', paymentController.pay);
router.get('/:id/ticket', itemController.getETicket);

module.exports = router;