const pool = require('./db');

const RefreshToken = {
    async create({ user_id, token, expires_at }) {
        const [result] = await pool.execute(`
            INSERT INTO refresh_tokens(user_id, token, expires_at)
            VALUES(?, ?, ?)`, 
            [user_id, token, expires_at]
        );
        return result.insertId;       
    },

    async findbyToken(token) {
        const [row] = await pool.execute(`
            SELECT * 
            FROM refresh_tokens
            WHERE token=?
            AND revoked_at IS NULL 
            AND expires_at > NOW()`, 
            [token]
        );
        return row[0] || null;
    },

    async revoke(token){
        const [result] = await pool.execute(`
            UPDATE refresh_tokens
            SET revoked_at = NOW()
            WHERE token = ?`, 
            [token]
        );
    },
}

module.exports = RefreshToken;