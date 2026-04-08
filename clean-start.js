const { getDb } = require('./src/db/database');

async function cleanup() {
    console.log('🧹 Cleaning up database reset fields...');
    try {
        const db = await getDb();
        const result = await db.run("UPDATE users SET reset_token = NULL, reset_expires = NULL");
        console.log(`✅ Cleared reset tokens for ${result.changes} users.`);
        process.exit(0);
    } catch (err) {
        console.error('❌ Cleanup failed:', err);
        process.exit(1);
    }
}

cleanup();
