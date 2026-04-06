const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');
const bcrypt = require('bcrypt');

const dbPath = path.join(__dirname, '../../database.sqlite');

async function getDb() {
    return open({
        filename: dbPath,
        driver: sqlite3.Database
    });
}

async function initDb() {
    const db = await getDb();
    
    // Create Users table
    await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE,
            password TEXT NOT NULL,
            profile_image TEXT DEFAULT 'default_avatar.png',
            role TEXT DEFAULT 'user',
            reset_token TEXT,
            reset_expires DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Create Products table
    await db.exec(`
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            price REAL NOT NULL,
            image TEXT NOT NULL,
            condition_percent INTEGER NOT NULL,
            description TEXT,
            stock INTEGER DEFAULT 1,
            user_id INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
    `);

    // Create Orders table
    await db.exec(`
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id INTEGER NOT NULL,
            buyer_id INTEGER NOT NULL,
            status TEXT DEFAULT 'pending',
            method TEXT DEFAULT 'qr',
            payment_ref TEXT,
            slip_image TEXT,
            meet_date TEXT,
            meet_time TEXT,
            meet_location TEXT,
            meet_note TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
            FOREIGN KEY (buyer_id) REFERENCES users (id) ON DELETE CASCADE
        )
    `);

    // Insert admin user if it doesn't exist
    const adminUser = await db.get('SELECT * FROM users WHERE username = ?', ['admingb']);
    if (!adminUser) {
        const hashedPassword = await bcrypt.hash('admingbmoney4972', 10);
        await db.run('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', ['admingb', hashedPassword, 'admin']);
        console.log('Admin user created: admingb');
    }

    // Migration: Add method column to orders if it doesn't exist
    try {
        await db.exec(`ALTER TABLE orders ADD COLUMN method TEXT DEFAULT 'qr'`);
        console.log('Added method column to orders table.');
    } catch (err) {
        // Column likely already exists
    }

    // Migration: Add payment_ref column to orders
    try {
        await db.exec(`ALTER TABLE orders ADD COLUMN payment_ref TEXT`);
        console.log('Added payment_ref column to orders table.');
    } catch (err) {
        // Column likely already exists
    }

    // Migration: Add stock column to products
    try {
        await db.exec(`ALTER TABLE products ADD COLUMN stock INTEGER DEFAULT 1`);
        console.log('Added stock column to products table.');
    } catch (err) {
        // Column likely already exists
    }

    // Migration: Add slip_image column to orders
    try {
        await db.exec(`ALTER TABLE orders ADD COLUMN slip_image TEXT`);
        console.log('Added slip_image column to orders table.');
    } catch (err) {
        // Column likely already exists
    }

    // Migration: Add balance column to users
    try {
        await db.exec(`ALTER TABLE users ADD COLUMN balance REAL DEFAULT 0`);
        console.log('Added balance column to users table.');
    } catch (err) {
        // Column likely already exists
    }

    // Create Topups table
    await db.exec(`
        CREATE TABLE IF NOT EXISTS topups (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            amount REAL NOT NULL,
            slip_image TEXT,
            status TEXT DEFAULT 'pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
    `);

    // Create Invoices table
    await db.exec(`
        CREATE TABLE IF NOT EXISTS invoices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            total_price REAL NOT NULL,
            method TEXT DEFAULT 'qr',
            status TEXT DEFAULT 'pending_payment',
            slip_image TEXT,
            meet_date TEXT,
            meet_time TEXT,
            meet_location TEXT,
            meet_note TEXT,
            shipping_name TEXT,
            shipping_phone TEXT,
            shipping_address TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
    `);

    // Migration: Add shipping details for COD to invoices
    try {
        await db.exec(`ALTER TABLE invoices ADD COLUMN shipping_name TEXT`);
        await db.exec(`ALTER TABLE invoices ADD COLUMN shipping_phone TEXT`);
        await db.exec(`ALTER TABLE invoices ADD COLUMN shipping_address TEXT`);
        console.log('Added shipping columns to invoices table.');
    } catch (err) {
        // Columns likely already exist
    }

    // Migration: Add invoice_id column to orders
    try {
        await db.exec(`ALTER TABLE orders ADD COLUMN invoice_id INTEGER`);
        console.log('Added invoice_id column to orders table.');
    } catch (err) {
        // Column likely already exists
    }

    // Migration: Add meeting details to orders
    try {
        await db.exec(`ALTER TABLE orders ADD COLUMN meet_date TEXT`);
        await db.exec(`ALTER TABLE orders ADD COLUMN meet_time TEXT`);
        await db.exec(`ALTER TABLE orders ADD COLUMN meet_location TEXT`);
        await db.exec(`ALTER TABLE orders ADD COLUMN meet_note TEXT`);
        console.log('Added meeting columns to orders table.');
    } catch (err) {}

    // Migration: Add images and videos columns to products
    try {
        await db.exec(`ALTER TABLE products ADD COLUMN images TEXT`);
        await db.exec(`ALTER TABLE products ADD COLUMN video TEXT`);
        console.log('Added images and video columns to products table.');
    } catch (err) {}

    try {
        await db.exec(`ALTER TABLE products ADD COLUMN videos TEXT`);
        console.log('Added videos column to products table.');
    } catch (err) {}

    // Create Settings table
    await db.exec(`
        CREATE TABLE IF NOT EXISTS settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            key TEXT UNIQUE NOT NULL,
            value TEXT
        )
    `);

    // Insert default settings
    await db.exec(`
        INSERT OR IGNORE INTO settings (key, value) VALUES 
        ('promptpay_number', ''),
        ('wallet_number', ''),
        ('contact_name', 'Admin Facebook'),
        ('contact_url', 'https://facebook.com/admin')
    `);

    // Migration: Add email and reset token columns to users (Non-blocking)
    const runMigration = async (label, sql) => {
        try {
            await db.exec(sql);
            if (process.env.NODE_ENV !== 'production') console.log(`Migration [${label}]: Success`);
        } catch (err) {
            if (process.env.NODE_ENV !== 'production') {
                console.warn(`Migration [${label}]: Skipped/Already exists - ${err.message}`);
            }
        }
    };

    await runMigration('Add email column', `ALTER TABLE users ADD COLUMN email TEXT`);
    await runMigration('Create email index', `CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
    await runMigration('Add reset_token column', `ALTER TABLE users ADD COLUMN reset_token TEXT`);
    await runMigration('Add reset_expires column', `ALTER TABLE users ADD COLUMN reset_expires DATETIME`);
}

module.exports = {
    getDb,
    initDb
};
