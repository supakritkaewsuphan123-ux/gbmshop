const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, '../../database.sqlite');

let dbInstance = null;
let SQL_MODULE = null;

const saveDb = (db) => {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
};

const dbWrapper = (db) => ({
    get: async (sql, params = []) => {
        const stmt = db.prepare(sql);
        stmt.bind(params);
        let result = undefined;
        if (stmt.step()) {
            result = stmt.getAsObject();
        }
        stmt.free();
        return result;
    },
    all: async (sql, params = []) => {
        const stmt = db.prepare(sql);
        stmt.bind(params);
        const results = [];
        while (stmt.step()) {
            results.push(stmt.getAsObject());
        }
        stmt.free();
        return results;
    },
    run: async (sql, params = []) => {
        try {
            console.log(`[DB] RUN: ${sql} | PARAMS: ${JSON.stringify(params)}`);
            const stmt = db.prepare(sql);
            stmt.run(params);
            stmt.free();
            
            saveDb(db);
            
            let lastID = 0;
            let changes = 0;
            const lidRes = db.exec("SELECT last_insert_rowid()");
            if (lidRes.length > 0) lastID = lidRes[0].values[0][0];
            
            const chgRes = db.exec("SELECT changes()");
            if (chgRes.length > 0) changes = chgRes[0].values[0][0];
            
            console.log(`[DB] OK. Rows affected: ${changes}`);
            return { lastID, changes };
        } catch (err) {
            console.error('[DB] ERROR:', err.message);
            throw err;
        }
    },
    exec: async (sql) => {
        db.exec(sql);
        saveDb(db);
        return true;
    },
    close: async () => {
        saveDb(db);
        db.close();
        dbInstance = null;
    }
});

async function getDb() {
    if (!dbInstance) {
        if (!SQL_MODULE) {
            SQL_MODULE = await initSqlJs();
        }
        let filebuffer = null;
        if (fs.existsSync(dbPath)) {
            filebuffer = fs.readFileSync(dbPath);
        }
        const db = new SQL_MODULE.Database(filebuffer);
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
            category TEXT DEFAULT 'มือ1',
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

    // Create admin user
    const existingAdmin = await db.get('SELECT id FROM users WHERE username = ?', ['admingb']);
    
    if (!existingAdmin) {
        const hashedPassword = await bcrypt.hash('admin1234', 10);
        await db.run(
            'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)', 
            ['admingb', 'admin@gb-marketplace.com', hashedPassword, 'admin']
        );
        console.log('✅ Admin user CREATED: admingb with default password admin1234');
    } else {
        await db.run('UPDATE users SET role = ? WHERE username = ?', ['admin', 'admingb']);
        console.log('✅ Admin user already exists. Persistent login maintained.');
    }

    // Migration helper
    const runMigration = async (label, sql) => {
        try {
            await db.exec(sql);
            if (process.env.NODE_ENV !== 'production') console.log(`Migration [${label}]: Success`);
        } catch (err) {
            // Error usually means column already exists
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
    await runMigration('Add category to products', "ALTER TABLE products ADD COLUMN category TEXT DEFAULT 'มือ1'");
    await runMigration('Add rejection_reason to invoices', "ALTER TABLE invoices ADD COLUMN rejection_reason TEXT");
    await runMigration('Add rejection_reason to topups', "ALTER TABLE topups ADD COLUMN rejection_reason TEXT");
    await runMigration('Add supabase_id to users', "ALTER TABLE users ADD COLUMN supabase_id TEXT");

    // Create Topups table
    await db.exec(`
        CREATE TABLE IF NOT EXISTS topups (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            amount REAL NOT NULL,
            slip_image TEXT,
            status TEXT DEFAULT 'pending',
            rejection_reason TEXT,
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
            rejection_reason TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
    `);

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

    // Audit Logs table
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

    // Blocked IPs table
    await db.exec(`
        CREATE TABLE IF NOT EXISTS blocked_ips (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ip_address TEXT UNIQUE NOT NULL,
            reason TEXT,
            expires_at DATETIME NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Notifications table
    await db.exec(`
        CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            title TEXT NOT NULL,
            message TEXT,
            type TEXT DEFAULT 'info',
            is_read INTEGER DEFAULT 0,
            is_global INTEGER DEFAULT 0,
            link TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Indexing for performance
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_notif_user_read ON notifications(user_id, is_read)`);
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_notif_created ON notifications(created_at)`);

    // Reviews table
    await db.exec(`
        CREATE TABLE IF NOT EXISTS reviews (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
            comment TEXT,
            images TEXT, -- JSON array of filenames
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
            UNIQUE(user_id, product_id) -- One review per user per product
        )
    `);

    // Wishlist table
    await db.exec(`
        CREATE TABLE IF NOT EXISTS wishlist (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
            FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
            UNIQUE(user_id, product_id)
        )
    `);
}

module.exports = {
    getDb,
    initDb
};
