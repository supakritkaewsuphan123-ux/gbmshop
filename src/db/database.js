const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcrypt');

const dbPath = path.join(__dirname, '../../database.sqlite');

// Wrapper to maintain compatibility with the async 'sqlite' package usage
const dbWrapper = (db) => ({
    get: async (sql, params = []) => db.prepare(sql).get(...params),
    all: async (sql, params = []) => db.prepare(sql).all(...params),
    run: async (sql, params = []) => {
        const result = db.prepare(sql).run(...params);
        return { lastID: result.lastInsertRowid, changes: result.changes };
    },
    exec: async (sql) => {
        db.exec(sql);
        return true;
    },
    close: async () => db.close()
});

let dbInstance = null;

async function getDb() {
    if (!dbInstance) {
        const db = new Database(dbPath);
        db.pragma('journal_mode = WAL'); // Performance boost
        dbInstance = dbWrapper(db);
    }
    return dbInstance;
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

    // Force Reset/Create admin user during troubleshooting
    const hashedPassword = await bcrypt.hash('admin1234', 10);
    const existingAdmin = await db.get('SELECT id FROM users WHERE username = ?', ['admingb']);
    
    if (existingAdmin) {
        await db.run('UPDATE users SET password = ?, role = ? WHERE username = ?', [hashedPassword, 'admin', 'admingb']);
        console.log('✅ Admin password FORCED RESET to: admin1234');
    } else {
        await db.run(
            'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)', 
            ['admingb', 'admin@gb-marketplace.com', hashedPassword, 'admin']
        );
        console.log('✅ Admin user CREATED: admingb with password admin1234');
    }

    // Migration: Columns check
    const runMigration = async (label, sql) => {
        try {
            await db.exec(sql);
            if (process.env.NODE_ENV !== 'production') console.log(`Migration [${label}]: Success`);
        } catch (err) {
            // Already exists or column exists
        }
    };

    await runMigration('method', `ALTER TABLE orders ADD COLUMN method TEXT DEFAULT 'qr'`);
    await runMigration('payment_ref', `ALTER TABLE orders ADD COLUMN payment_ref TEXT`);
    await runMigration('stock', `ALTER TABLE products ADD COLUMN stock INTEGER DEFAULT 1`);
    await runMigration('slip_image', `ALTER TABLE orders ADD COLUMN slip_image TEXT`);
    await runMigration('balance', `ALTER TABLE users ADD COLUMN balance REAL DEFAULT 0`);
    await runMigration('invoice_id', `ALTER TABLE orders ADD COLUMN invoice_id INTEGER`);
    await runMigration('meet_date', `ALTER TABLE orders ADD COLUMN meet_date TEXT`);
    await runMigration('meet_time', `ALTER TABLE orders ADD COLUMN meet_time TEXT`);
    await runMigration('meet_location', `ALTER TABLE orders ADD COLUMN meet_location TEXT`);
    await runMigration('meet_note', `ALTER TABLE orders ADD COLUMN meet_note TEXT`);
    await runMigration('images', `ALTER TABLE products ADD COLUMN images TEXT`);
    await runMigration('video', `ALTER TABLE products ADD COLUMN video TEXT`);
    await runMigration('videos', `ALTER TABLE products ADD COLUMN videos TEXT`);

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

    // Migration: Shipping details
    await runMigration('shipping_name', `ALTER TABLE invoices ADD COLUMN shipping_name TEXT`);
    await runMigration('shipping_phone', `ALTER TABLE invoices ADD COLUMN shipping_phone TEXT`);
    await runMigration('shipping_address', `ALTER TABLE invoices ADD COLUMN shipping_address TEXT`);

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

    // Additional User Migrations
    await runMigration('Add email column', `ALTER TABLE users ADD COLUMN email TEXT`);
    await runMigration('Add reset_token column', `ALTER TABLE users ADD COLUMN reset_token TEXT`);
    await runMigration('Add reset_expires column', `ALTER TABLE users ADD COLUMN reset_expires DATETIME`);
    await runMigration('Add token_version column', `ALTER TABLE users ADD COLUMN token_version INTEGER DEFAULT 0`);

    // Create Audit Logs table
    await db.exec(`
        CREATE TABLE IF NOT EXISTS audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_email TEXT,
            action TEXT NOT NULL,
            severity TEXT DEFAULT 'info',
            ip_address TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Create Blocked IPs table
    await db.exec(`
        CREATE TABLE IF NOT EXISTS blocked_ips (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ip_address TEXT UNIQUE NOT NULL,
            reason TEXT,
            expires_at DATETIME NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
}

module.exports = {
    getDb,
    initDb
};
