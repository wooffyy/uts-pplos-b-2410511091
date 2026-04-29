const pool = require('./db');
const { v4: uuidv4 } = require('uuid');

const OrderItem = {
    async bulkCreate(orderId, quantity) {
        const ticket_codes = [];
        for (let i = 0; i < quantity; i++) {
            const code = uuidv4();
            await pool.execute(
                `INSERT INTO order_items(order_id, ticket_code)
                VALUES(?, ?)`,
                [orderId, code]
            );
            ticket_codes.push(code);
        }

        return ticket_codes;
    },

    async findByOrderId(orderId) {
        const [rows] = await pool.execute(
            `SELECT *
            FROM order_items
            WHERE order_id = ?`,
            [orderId]
        )

        return rows;
    },

    async findByTicketCode(ticketCode) {
        const [row] = await pool.execute(
            `SELECT *
            FROM order_items
            WHERE ticket_code = ?`,
            [ticketCode]
        )
        return row[0] || null;
    },

    async markAsUsed(ticketCode) {
        const [result] = await pool.execute(
            `UPDATE order_items
            SET is_used = 1
            WHERE ticket_code = ?`,
            [ticketCode]
        )

        if (result.changedRows === 0) return null;
        return this.findByTicketCode(ticketCode);
    }
}

module.exports = OrderItem;