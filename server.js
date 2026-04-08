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

// ✅ ADVANCED DEBUG LOGGER & LIFECYCLE TRACKING
app.use((req, res, next) => {
    const start = Date.now();
    req.id = start; // Unique ID for request tracing
    console.log(`[${req.id}] REQ: ${req.method} ${req.url}`);
    
    // Timeout Protection (5 seconds)
    const timeout = setTimeout(() => {
        if (!res.headersSent) {
            console.error(`[${req.id}] ❌ TIMEOUT: Request took too long (>5s)`);
            res.status(503).json({ error: "Request timeout" });
        }
    }, 5000);

    res.on('finish', () => {
        clearTimeout(timeout);
        const duration = Date.now() - start;
        const logMsg = `[${req.id}] RES: ${res.statusCode} (${duration}ms) ${req.method} ${req.url}`;
        if (duration > 2000) {
            console.warn(`[SLOW] ${logMsg}`);
        } else {
            console.log(logMsg);
        }
    });

    next();
});

// ✅ MIDDLEWARES
app.use(cors());
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

// ✅ GLOBAL PROCESS ERROR HANDLERS (NO SILENT CRASHES)
process.on('uncaughtException', (err) => {
    console.error('❌ CRITICAL UNCAUGHT ERROR:', err.message);
    console.error(err.stack);
    // In production, you might want to restart the process here
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ UNHANDLED REJECTION AT:', promise, 'REASON:', reason);
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
app.get('/admin/orders', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const db = await getDb();
        const rows = await db.all(`
            SELECT 
                i.*, 
                u.username AS buyer_name
            FROM invoices i
            JOIN users u ON i.user_id = u.id
            ORDER BY i.created_at DESC
        `);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Catch-all: serve React SPA for any non-API routes
app.get('/*splat', (req, res) => {
    if (req.path.startsWith('/api')) return res.status(404).json({ error: "API Route not found" });
    
    const indexPath = path.join(__dirname, 'client', 'dist', 'index.html');
    const fs = require('fs');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
    }
});

// ✅ GLOBAL 404 FALLBACK (DEFINITIVE DEBUGGING)
app.use((req, res) => {
    console.log(`[${req.id}] ❌ 404 NOT FOUND: ${req.method} ${req.url}`);
    res.status(404).json({ 
        error: "Route not found", 
        method: req.method, 
        path: req.url,
        request_id: req.id 
    });
});

// ✅ GLOBAL ERROR HANDLER (NO SILENT FAILURES)
app.use((err, req, res, next) => {
    console.error(`[${req.id}] ❌ SERVER ERROR:`, err.message);
    if (process.env.NODE_ENV !== 'production') console.error(err.stack);
    
    const status = err.status || 500;
    res.status(status).json({ 
        error: process.env.NODE_ENV === 'production' ? 'Something went wrong!' : err.message,
        request_id: req.id
    });
});

// ✅ ROUTE VISIBILITY DUMP (DEBUG ON STARTUP)
function printRoutes(stack, prefix = '') {
    stack.forEach(r => {
        if (r.route && r.route.path) {
            const methods = Object.keys(r.route.methods).join(',').toUpperCase();
            console.log(`   mount: ${methods.padEnd(7)} ${prefix}${r.route.path}`);
        } else if (r.name === 'router' && r.handle.stack) {
            printRoutes(r.handle.stack, prefix + (r.regexp.source.replace('\\/?(?=\\/|$)', '').replace('^\\', '').replace('\\/', '/')));
        }
    });
}

// Start server
app.listen(APP_PORT, async () => {
    console.log(`\n🚀 Server running on http://localhost:${APP_PORT}`);
    console.log(`[DEV] Development Mode: ${process.env.NODE_ENV !== 'production' ? 'ACTIVE' : 'OFF'}`);
    
    try {
        await initDb();
        console.log('✅ Database connected and initialized.');

        // ENTERPRISE: background cleanup for blocked IPs every 1 hour
        setInterval(async () => {
            try {
                const db = await getDb();
                const result = await db.run("DELETE FROM blocked_ips WHERE expires_at < CURRENT_TIMESTAMP");
                if (result.changes > 0) {
                    console.log(`[MAINTENANCE] Purged ${result.changes} expired IP blocks.`);
                }
            } catch (err) {
                console.error('[MAINTENANCE] Cleanup failed:', err);
            }
        }, 60 * 60 * 1000);
    } catch (error) {
        console.error('❌ FATAL: Failed to initialize database:', error.message);
        process.exit(1);
    }
});
