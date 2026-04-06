const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

const token = 'dev_manual_token_1234567890';
const expires = Date.now() + 60 * 60 * 1000;

db.serialize(() => {
  // Update ALL users with the manual token for guaranteed testing success
  db.run("UPDATE users SET reset_token = ?, reset_expires = ?", 
    [token, expires], (err) => {
      if (err) {
        console.error('Error updating token:', err.message);
      } else {
        console.log('Successfully set manual token for testing! 🚀');
        console.log('Token:', token);
        console.log('Expires:', expires);
      }
      db.close();
  });
});
