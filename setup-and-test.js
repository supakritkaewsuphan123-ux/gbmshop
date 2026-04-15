const { initDb, getDb } = require('./src/db/database');
const bcrypt = require('bcryptjs');

async function setup() {
    try {
        console.log('🏁 Starting forced database setup...');
        await initDb();
        console.log('✅ Tables initialized.');

        const db = await getDb();
        const username = 'demo';
        const email = 'demo@example.com';
        const password = 'OldPassword123!';
        const hashed = await bcrypt.hash(password, 10);

        await db.run(
            "INSERT OR REPLACE INTO users (username, password, email, role) VALUES (?, ?, ?, ?)",
            [username, hashed, email, 'user']
        );
        console.log(`✅ Success: User demo@example.com created with password: ${password}`);
        process.exit(0);
    } catch (err) {
        console.error('❌ Setup failed:', err.message);
        process.exit(1);
    }
}

setup();
