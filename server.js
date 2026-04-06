require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDb } = require('./src/db/database');

const helmet = require('helmet');
const { apiLimiter } = require('./src/middleware/rateLimit');
const { authMiddleware, adminMiddleware } = require('./src/middleware/auth');

const app = express();
const APP_PORT = process.env.PORT || 3000;

// Essential Body Parsers (Moved to top for reliability)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration
const allowedOrigins = process.env.NODE_ENV === 'production' 
    ? [process.env.PRODUCTION_URL, 'https://gb-marketplace-test-ka.netlify.app'] 
    : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS (' + origin + ')'));
        }
    },
    credentials: true
}));

// Security Middleware
app.use(helmet());
app.use(apiLimiter);

// Serve uploads (always available)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve legacy HTML frontend (still available)
app.use('/legacy', express.static(path.join(__dirname, 'frontend')));

// Serve React SPA build (production)
const reactDistPath = path.join(__dirname, 'client', 'dist');
app.use(express.static(reactDistPath));

// Global Catch for Uncaught Exceptions to prevent silent crashes
process.on('uncaughtException', (err) => {
    if (process.env.NODE_ENV !== 'production') {
        console.error('CRITICAL UNCAUGHT ERROR:', err.message);
        console.error(err.stack);
    }
});

process.on('unhandledRejection', (reason, promise) => {
    if (process.env.NODE_ENV !== 'production') {
        console.error('UNHANDLED REJECTION AT:', promise, 'REASON:', reason);
    }
});

// Routes
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/products', require('./src/routes/products'));
app.use('/api/orders', require('./src/routes/orders'));
app.use('/api/invoices', require('./src/routes/invoices'));
app.use('/api/users', require('./src/routes/users'));
app.use('/api/settings', require('./src/routes/settings'));
app.use('/api/sales', require('./src/routes/sales'));
app.use('/api/dashboard', require('./src/routes/dashboard'));

// Custom route requested by user - SECURED
const { getDb } = require('./src/db/database');
app.get('/admin/orders', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const db = await getDb();
        const rows = await db.all(`
            SELECT 
                id AS order_id,
                total_price,
                status,
                created_at,
                meet_date,
                meet_time,
                meet_location,
                meet_note
            FROM invoices
            ORDER BY created_at DESC
        `);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Catch-all: serve React SPA for any non-API routes (Express 5 syntax: '/*splat')
app.get('/*splat', (req, res) => {
    // Prevent API calls from accidentally serving index.html
    if (req.path.startsWith('/api')) return res.status(404).json({ error: 'API not found' });
    
    const indexPath = path.join(__dirname, 'client', 'dist', 'index.html');
    const fs = require('fs');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        // Fallback to old frontend if React not built
        res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
    }
});

// Global Error Handler
app.use((err, req, res, next) => {
    if (process.env.NODE_ENV !== 'production') console.error(err.stack);
    const status = err.status || 500;
    const message = process.env.NODE_ENV === 'production' 
        ? 'Something went wrong!' 
        : err.message;
    
    res.status(status).json({ error: message });
});

// Start server
app.listen(APP_PORT, async () => {
    console.log(`Server running on http://localhost:${APP_PORT} 🚀`);
    try {
        await initDb();
        console.log('Database initialized successfully.');
    } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
            console.error('Failed to initialize database:', error);
        }
    }
});
