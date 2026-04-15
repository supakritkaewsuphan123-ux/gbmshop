const { getDb } = require('./src/db/database');

async function debugSettings() {
    try {
        const db = await getDb();
        const settings = await db.all('SELECT * FROM settings');
        console.log('--- SETTINGS TABLE DUMP ---');
        console.table(settings);
    } catch (e) {
        console.error('Debug failed:', e);
    }
}

debugSettings();
