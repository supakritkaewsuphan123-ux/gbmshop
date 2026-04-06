const bcrypt = require('bcrypt');
const { getDb } = require('./src/db/database');

async function forceReset() {
    try {
        const db = await getDb();
        const username = 'Nompang123';
        const password = 'GbShop@2026';
        
        console.log(`Hashing password for ${username}...`);
        const hashed = await bcrypt.hash(password, 10);
        
        const result = await db.run(
            "UPDATE users SET password = ?, reset_token = NULL, reset_expires = NULL WHERE username = ?",
            [hashed, username]
        );
        
        if (result.changes > 0) {
            console.log(`✅ SUCCESS: Password for ${username} has been manually set to ${password}`);
        } else {
            console.log(`❌ FAILED: User ${username} not found!`);
            const all = await db.all("SELECT username FROM users");
            console.log("Available users:", all.map(u => u.username));
        }
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

forceReset();
