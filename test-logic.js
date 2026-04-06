const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database.sqlite');

const token = 'dev_manual_token_1234567890';
const now = Date.now();

db.get("SELECT * FROM users WHERE reset_token = ?", [token], (err, user) => {
    if (err) {
        console.error('DB Error:', err);
        return;
    }
    if (!user) {
        console.log('User not found with token:', token);
        db.all("SELECT id, reset_token FROM users", (err, all) => {
            console.log('All tokens in DB:', all);
            db.close();
        });
        return;
    }

    console.log('User found:', user.username);
    console.log('reset_expires in DB:', user.reset_expires, typeof user.reset_expires);
    
    // Logic from auth.js:
    const expiryDate = new Date(user.reset_expires).getTime();
    console.log('Parsed expiryDate:', expiryDate);
    console.log('Current Date.now():', now);
    
    if (isNaN(expiryDate) || expiryDate < now) {
        console.log('TOKEN EXPIRED or INVALID');
    } else {
        console.log('TOKEN VALID');
    }
    db.close();
});
