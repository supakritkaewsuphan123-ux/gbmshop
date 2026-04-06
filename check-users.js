const { getDb } = require('./src/db/database');

async function check() {
    const db = await getDb();
    const user = await db.get("SELECT id, username, reset_token, reset_expires FROM users WHERE username = 'admingb'");
    console.log('User admingb status:', user);
    const all = await db.all("SELECT username FROM users");
    console.log('All usernames in DB:', all);
    process.exit(0);
}

check();
