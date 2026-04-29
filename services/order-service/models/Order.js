const pool = require('./db')

const Order = {
    async create({ user_id, event_id, ticket_id, quantity, total_price}){
        const [result] = await pool.execute(`
            INSERT INTO orders(user_id, event_id, ticket_id, quantity, total_price)
            VALUES(?, ?, ?, ?, ?)`,
            [user_id, event_id, ticket_id, quantity, total_price]
        );
        
        return result.insertId
    },

    async findById(id){
        const [row]= await pool.execute(
            `SELECT *
            FROM orders
            WHERE id = ?`,
            [id]
        );
        return row[0] || null;
    },

    async findByUserId(user_id){
        const [rows] = await pool.execute(
            `SELECT *
            FROM orders
            WHERE user_id = ?`,
            [user_id]
        );

        return rows;
    },

    async updateStatus(id, status){
        const [result] = await pool.execute(
            `UPDATE orders
            SET status = ?
            WHERE id = ?`,
            [status, id]
        )

        if (result.changedRows === 0) return null;
        return this.findById(id);
    }
}

module.exports = Order;