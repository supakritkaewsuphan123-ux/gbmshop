const { getDb } = require('../src/db/database');

async function verify() {
    try {
        const db = await getDb();
        console.log('--- Verifying Products Table ---');
        const columns = await db.all('PRAGMA table_info(products)');
        const categoryColumn = columns.find(c => c.name === 'category');
        
        if (categoryColumn) {
            console.log('✅ Column "category" EXISTS');
            console.log('Details:', categoryColumn);
        } else {
            console.log('❌ Column "category" MISSING');
        }

        const products = await db.all('SELECT id, name, category FROM products LIMIT 5');
        console.log('\n--- Sample Products ---');
        console.table(products);

        process.exit(0);
    } catch (err) {
        console.error('Error during verification:', err);
        process.exit(1);
    }
}

verify();
