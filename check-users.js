const { getDb } = require('./src/db/database');

async function check() {
    const db = await getDb();
    const user = await db.get("SELECT id, username, email, reset_token, reset_expires FROM users WHERE username = 'admingb'");
    console.log('User admingb status:', user);
    const all = await db.all("SELECT id, username, email, reset_token, reset_expires FROM users");
    console.log('All user statuses:', JSON.stringify(all, null, 2));
    process.exit(0);
}

check();
