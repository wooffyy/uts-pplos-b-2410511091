const pool = require('./db');

const TicketValidation = {
    async create({ order_item_id, ticket_code, validated_by, gate = 'main' }) {
        const [result] = await pool.execute(
            `INSERT INTO ticket_validations(order_item_id, ticket_code, validated_by, gate)
            VALUES(?, ?, ?, ?)`,
            [order_item_id, ticket_code, validated_by, gate]
        );
        return result.insertId;
    }
};

module.exports = TicketValidation;