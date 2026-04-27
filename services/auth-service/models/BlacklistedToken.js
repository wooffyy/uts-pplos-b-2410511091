const pool = require('./db');

const BlacklistedToken = {
    async insert({ jwt_id, expires_at }) {
        await pool.execute(`
            INSERT INTO blacklisted_tokens(jwt_id, expires_at)
            VALUES(?, ?)`,
            [jwt_id, expires_at]
        );
    },

    async isBlacklisted(jwt_id) {
        const [row] = await pool.execute(`
            SELECT *
            FROM blacklisted_tokens
            WHERE jwt_id = ?
            AND expires_at > NOW()`,
            [jwt_id]
        );
        return row.length > 0;
    },
}

module.exports = BlacklistedToken;