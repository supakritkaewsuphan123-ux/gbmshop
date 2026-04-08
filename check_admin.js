const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');

async function checkAdmin() {
    try {
        const db = await open({
            filename: dbPath,
            driver: sqlite3.Database
        });
        const user = await db.get('SELECT * FROM users WHERE username = ?', ['admingb']);
        console.log('User admingb info:');
        console.log(user ? JSON.stringify(user, null, 2) : 'User not found');
        const allUsers = await db.all('SELECT id, username, role FROM users');
        console.log('\nAll users:');
        console.log(JSON.stringify(allUsers, null, 2));
    } catch (error) {
        console.error('Error:', error);
    }
}

checkAdmin();
