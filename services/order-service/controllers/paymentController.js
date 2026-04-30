require('dotenv').config()
const axios = require('axios')
const Order = require('../models/Order')
const OrderItem = require('../models/OrderItem')
const Payment = require('../models/Payment')

const pay = async (req, res) => {
    try {
        const user_id = req.headers['x-user-id']
        if (!user_id) return res.status(401).json({ message: 'Unauthorized' })

        const order_id = req.params.id
        if (!order_id) return res.status(400).json({ message: 'Bad request' })

        const method = req.body.method

        const order = await Order.findById(order_id)
        if (!order) return res.status(404).json({ message: 'Order not found' })
        if (order.user_id !== parseInt(user_id)) return res.status(403).json({ message: 'Forbidden' })
        if (order.status !== 'pending') {
            if (order.status === 'paid') {
                return res.status(400).json({ message: 'Order is already paid' })
            }
            return res.status(400).json({ message: 'Order is already canceled' })
        }

        const amount = order.total_price
        const payment_result = await Payment.create({ order_id, amount, method })
        await Order.updateStatus(order_id, 'paid')

        return res.status(201).json({ message: 'Payment success', payment_id: payment_result })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: 'Internal server error' })
    }
}

module.exports = { pay }