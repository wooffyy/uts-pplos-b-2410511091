const pool = require('./db');

async function migrate(){
    await pool.execute(`
        CREATE TABLE IF NOT EXISTS orders(
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        event_id INT NOT NULL,
        ticket_id INT NOT NULL,
        quantity INT NOT NULL,
        total_price DECIMAL(10,2) NOT NULL,
        status ENUM('pending', 'paid', 'cancelled') DEFAULT 'pending' NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`
    );

    await pool.execute(`
        CREATE TABLE IF NOT EXISTS order_items(
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        ticket_code VARCHAR(36) UNIQUE,
        is_used TINYINT(1) DEFAULT 0 NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id))`
    );

    await pool.execute(`
        CREATE TABLE IF NOT EXISTS payments(
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        method VARCHAR(100),
        status VARCHAR(100),
        paid_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id))`
    );

    console.log('Order DB migrated successfully');
    process.exit(0);
}

migrate().catch(err => {
    console.error("Migration failed!\n", err);
    process.exit(1);
});

