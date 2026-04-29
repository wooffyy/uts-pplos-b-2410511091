require('dotenv').config()
const axios = require('axios')
const Order = require('../models/Order')
const OrderItem = require('../models/OrderItem')
const Payment = require('../models/Payment')

const checkout = async (req, res) => {
    try {
        const user_id = req.headers['x-user-id'] // ambil dulu header usernya
        if (!user_id) return res.status(401).json({ message: 'Unauthorized' })

        const event_id = req.body.event_id
        const ticket_id = req.body.ticket_id
        const quantity = req.body.quantity
        if (!event_id || !ticket_id || !quantity) return res.status(400).json({ message: 'Bad request' })

        // ambil event dan ticket lewat hit endpoint event service
        const getEvent = await axios.get(
            `${process.env.EVENT_SERVICE_URL}/events/${event_id}`, 
            { headers: { 'X-User-Id': user_id, Accept: 'application/json', }, validateStatus: () => true }
        )
        if (getEvent.status !== 200) return res.status(404).json({ message: 'Event not found' })

        const getTicket = await axios.get(
            `${process.env.EVENT_SERVICE_URL}/events/${event_id}/tickets`,
            { headers: { 'X-User-Id': user_id, Accept: 'application/json', }, validateStatus: () => true } 
        )
        if (getTicket.status !== 200) return res.status(404).json({ message: 'Ticket not found' })

        // cari ticket yang mau dibeli
        const ticket = getTicket.data.find(ticket => ticket.id == ticket_id) 
        if (!ticket) return res.status(404).json({ message: 'Ticket not found' })

        const totalPrice = ticket.price * quantity
        const updateQuota = await axios.patch(
            `${process.env.EVENT_SERVICE_URL}/tickets/${ticket_id}/reduce-quota`,
            { quantity }, { headers: { 'X-User-Id': user_id }, validateStatus: () => true }
        )
        if (updateQuota.status === 409) return res.status(409).json({ message: 'Quota is not enough to complete the order' })
        
        const orderId = await Order.create({ user_id, event_id, ticket_id, quantity, total_price: totalPrice }) 
        const ticketCodes = await OrderItem.bulkCreate(orderId, quantity, ticket.name, ticket.price) 
        
        return res.status(201).json({ message: 'Order created successfully', order_id: orderId, ticket_codes: ticketCodes })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: 'Internal server error' })
    }
}

const getMyOrders = async (req, res) => {
    try {
        const user_id = req.headers['x-user-id']
        if (!user_id) return res.status(401).json({ message: 'Unauthorized' })
        
        const orders = await Order.findByUserId(user_id)
        if (orders.length === 0) return res.status(404).json({ message: 'No orders found' })

        return res.status(200).json({ message: 'Orders found', orders })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: 'Internal server error' })
    }
}

const getOrderById = async (req, res) => {
    try {
        const user_id = req.headers['x-user-id']
        if (!user_id) return res.status(401).json({ message: 'Unauthorized' })

        const order_id = req.params.id
        if (!order_id) return res.status(400).json({ message: 'Bad request' })

        const order = await Order.findById(order_id)
        if (!order) return res.status(404).json({ message: 'Order not found' })
        if (order.user_id !== parseInt(user_id)) return res.status(403).json({ message: 'Forbidden' })

        return res.status(200).json({ message: 'Order found', order })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: 'Internal server error' })
    }
}

module.exports = { checkout, getMyOrders, getOrderById }