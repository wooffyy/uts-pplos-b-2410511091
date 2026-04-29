const pool = require('./db');


const Payment = {
    async create({ order_id, amount, method }) {
        const [result] = await pool.execute(
            `INSERT INTO payments(order_id, amount, method, status, paid_at)
            VALUES(?, ?, ?, 'paid', NOW())`,
            [order_id, amount, method ]
        )

        return result.insertId
    },
    
    async findByOrderId(orderId) {
        const [row] = await pool.execute(
            `SELECT *
            FROM payments
            WHERE order_id = ?`,
            [orderId]
        )
        return row[0] || null;
    }
};

module.exports = Payment;