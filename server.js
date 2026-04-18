require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDb, getDb } = require('./src/db/database');
const helmet = require('helmet');
const { apiLimiter } = require('./src/middleware/rateLimit');
const { authMiddleware, adminMiddleware } = require('./src/middleware/auth');

const app = express();
const APP_PORT = process.env.PORT || 3000;

// ✅ 1. PRIORITIZE STATIC ASSETS (ENSURES NO WHITE SCREEN)
const reactDistPath = path.join(__dirname, 'client', 'dist');
app.use(express.static(reactDistPath));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/legacy', express.static(path.join(__dirname, 'frontend')));

// ✅ 2. LOGGING (WITHOUT TIMEOUTS THAT CAUSE 503)
app.use((req, res, next) => {
    console.log(`REQ: ${req.method} ${req.url}`);
    next();
});

// ✅ 3. MIDDLEWARES & SECURITY
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for easier initial deployment if needed
}));
app.use(apiLimiter);

const APP_VERSION = '1.0.3-pure-white-fix';

app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        version: APP_VERSION,
        time: new Date().toISOString()
    });
});

// ✅ 4. API ROUTES
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/products', require('./src/routes/products'));
app.use('/api/orders', require('./src/routes/orders'));
app.use('/api/invoices', require('./src/routes/invoices'));
app.use('/api/users', require('./src/routes/users'));
app.use('/api/settings', require('./src/routes/settings'));
app.use('/api/sales', require('./src/routes/sales'));
// app.use('/api/notifications', require('./src/routes/notifications').router);
app.use('/api/wishlist', require('./src/routes/wishlist'));
app.use('/api/dashboard', require('./src/routes/dashboard'));

// Admin Orders
app.get('/admin/orders', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const db = await getDb();
        const rows = await db.all(`
            SELECT i.*, u.username AS buyer_name
            FROM invoices i
            JOIN users u ON i.user_id = u.id
            ORDER BY i.created_at DESC
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

// ✅ 5. SPA CATCH-ALL (SERVE INDEX.HTML FOR ANY OTHER ROUTE)
app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) return res.status(404).json({ error: "API Route not found" });
    const indexPath = path.join(reactDistPath, 'index.html');
    res.sendFile(indexPath);
});

// ✅ 6. ERROR HANDLING
app.use((err, req, res, next) => {
    console.error('SERVER ERROR:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
});

// Start server
app.listen(APP_PORT, async () => {
    console.log(`\n🚀 GBshop Server running on http://localhost:${APP_PORT}`);
    
    try {
        await initDb();
        console.log('✅ Database connected.');

        // Cleanup intervals
        setInterval(async () => {
            try {
                const db = await getDb();
                await db.run("DELETE FROM blocked_ips WHERE expires_at < CURRENT_TIMESTAMP");
            } catch (err) {}
        }, 3600000);
    } catch (error) {
        console.warn('⚠️ Database initialization warning (Continuing for static serving):', error.message);
    }
});
