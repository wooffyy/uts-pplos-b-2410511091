const pool = require('./db');

async function migrate() {
    await pool.execute(`DROP TABLE IF EXISTS blacklisted_tokens;`);
    await pool.execute(`DROP TABLE IF EXISTS refresh_tokens;`);
    await pool.execute(`DROP TABLE IF EXISTS users;`);

    await pool.execute(`
        CREATE TABLE IF NOT EXISTS users(
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hashed VARCHAR(255),
        avatar_url VARCHAR(255),
        oauth_provider VARCHAR(255),
        oauth_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`
    ),

    await pool.execute(`
        CREATE TABLE IF NOT EXISTS refresh_tokens(
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        token VARCHAR(255) NOT NULL UNIQUE,
        expires_at TIMESTAMP NOT NULL,
        revoked_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id))`
    ),

    await pool.execute(`
        CREATE TABLE IF NOT EXISTS blacklisted_tokens(
        id INT AUTO_INCREMENT PRIMARY KEY,
        jwt_id VARCHAR(255) NOT NULL UNIQUE,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`
    );

    console.log('Auth DB migrated successfully');
    process.exit(0);
}

migrate().catch(err => {
    console.error("Migration failed!\n", err);
    process.exit(1);
});