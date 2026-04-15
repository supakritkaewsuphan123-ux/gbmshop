const { getDb } = require('./src/db/database');
const bcrypt = require('bcryptjs');

async function reset() {
    try {
        const db = await getDb();
        const hashedPassword = await bcrypt.hash('admin1234', 10);
        
        // Delete existing admin to be sure
        await db.run('DELETE FROM users WHERE username = ?', ['admingb']);
        
        // Insert brand new admin
        await db.run(
            'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)', 
            ['admingb', 'admin@gb-marketplace.com', hashedPassword, 'admin']
        );
        
        console.log('✅ Admin user FORCE RESET with bcryptjs');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

reset();
