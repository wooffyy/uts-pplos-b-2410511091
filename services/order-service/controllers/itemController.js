require('dotenv').config()
const axios = require('axios')
const QRCode = require('qrcode')
const Order = require('../models/Order')
const OrderItem = require('../models/OrderItem')
const Payment = require('../models/Payment')
const TicketValidation = require('../models/ValidatedTicket');

const getETicket = async (req, res) => {
    try {
        const user_id = req.headers['x-user-id']
        if (!user_id) return res.status(401).json({ message: 'Unauthorized' })
        
        const order_id = req.params.id
        if (!order_id) return res.status(400).json({ message: 'Bad request' })
        const order = await Order.findById(order_id)
        if (!order) return res.status(404).json({ message: 'Order not found' })
        if (order.user_id !== parseInt(user_id)) return res.status(403).json({ message: 'Forbidden' })
        if (order.status !== 'paid') return res.status(400).json({ message: 'Order is not paid' })
        
        const items = await OrderItem.findByOrderId(order_id)
        if (items.length === 0) return res.status(404).json({ message: 'No items found' })
        
        const tickets = await Promise.all(
            items.map(async (item) => ({
                ticket_code: item.ticket_code,
                ticket_name: item.ticket_name,
                qr: await QRCode.toDataURL(item.ticket_code),
                is_used: item.is_used === 1
            }))
        )

        return res.status(200).json({ order_id, tickets})
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: 'Internal server error' })
    }
}

const validateTicket = async (req, res) => {
    try {
        const user_id = req.headers['x-user-id']
        if (!user_id) return res.status(401).json({ message: 'Unauthorized' })

        const ticket_code = req.body.ticket_code
        if (!ticket_code) return res.status(400).json({ message: 'Bad request' })
        
        const ticket = await OrderItem.findByTicketCode(ticket_code)
        if (!ticket) return res.status(404).json({ message: 'Ticket not found' })
        
        if (ticket.is_used === 1) return res.status(400).json({ message: 'Ticket is already used' })
        
        await OrderItem.markAsUsed(ticket_code)
        
        await TicketValidation.create({
            order_item_id: ticket.id,
            ticket_code,
            validated_by: parseInt(user_id),
            gate: req.body.gate || 'main'
        });
        
        return res.status(200).json({ valid: true, message: 'Ticket validated' })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: 'Internal server error' })
    }
}

module.exports = { getETicket, validateTicket }