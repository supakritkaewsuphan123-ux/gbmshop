const { getDb } = require('./src/db/database');

async function dump() {
    try {
        const db = await getDb();
        const products = await db.all('SELECT id, name, category, created_at FROM products');
        console.log('--- Products Table Dump ---');
        console.table(products);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

dump();
