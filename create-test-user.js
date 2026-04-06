const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

const dbPath = path.join(__dirname, 'db.sqlite');
const db = new sqlite3.Database(dbPath);

const username = 'demo';
const email = 'demo@example.com';
const password = 'OldPassword123!';

async function create() {
    const hashed = await bcrypt.hash(password, 10);
    db.run(
        "INSERT OR REPLACE INTO users (username, password, email, role) VALUES (?, ?, ?, ?)",
        [username, hashed, email, 'user'],
        (err) => {
            if (err) {
                console.error('❌ Error creating user:', err.message);
            } else {
                console.log('✅ Success: User demo@example.com created with password: ' + password);
            }
            db.close();
        }
    );
}

create();
