const pool = require('./db');

const User = {
    async create({name, email, password_hashed, avatar_url, oauth_provider, oauth_id}) {
        const [result] = await pool.execute(`
            INSERT INTO users(name, email, password_hashed, avatar_url, oauth_provider, oauth_id)
            VALUES(?, ?, ?, ?, ?, ?)`, 
            [name, email, password_hashed, avatar_url, oauth_provider, oauth_id]
        );
        return result.insertId;       
    },

    async findById(id) {
        const [row] = await pool.execute(`
            SELECT *
            FROM users
            WHERE id = ?`, 
            [id]
        );
        return row[0] || null;
    },

    async findByEmail(email) {
        const [row] = await pool.execute(`
            SELECT *
            FROM users
            WHERE email = ?`, 
            [id]
        );
        return row[0] || null;
    },

    async findbyOAuth(oauth_provider, oauth_id) {
        const [row] = await pool.execute(`
            SELECT *
            FROM users
            WHERE oauth_provider = ? AND oauth_id = ?`, 
            [oauth_provider, oauth_id]
        );
        return row[0] || null;
    },

    async insert({ name, email, password_hashed, avatar_url, oauth_provider, oauth_id }) {
        const exist = await User.findbyOAuth(oauth_provider, oauth_id);
        if (exist) return exist;

        const id = await User.create({ name, email, avatar_url, oauth_provider, oauth_id, password_hashed: null });
        return User.findById(id);
    }
}

module.exports = User;