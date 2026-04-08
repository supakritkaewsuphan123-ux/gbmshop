const bcrypt = require('bcrypt');
const { getDb } = require('./src/db/database');

async function resetAdmin() {
    try {
        const db = await getDb();
        const username = 'admingb';
        const newPassword = 'admingbmoney4972';
        
        console.log(`Resetting password for ${username} to ${newPassword}...`);
        const hashed = await bcrypt.hash(newPassword, 10);
        
        const result = await db.run(
            "UPDATE users SET password = ?, reset_token = NULL, reset_expires = NULL WHERE username = ?",
            [hashed, username]
        );
        
        if (result.changes > 0) {
            console.log(`✅ SUCCESS: Password for ${username} has been reset to ${newPassword}`);
        } else {
            console.log(`❌ FAILED: User ${username} not found!`);
        }
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

resetAdmin();
