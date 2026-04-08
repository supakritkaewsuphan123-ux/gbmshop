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

// ✅ PERMISSIVE CORS FOR TROUBLESHOOTING
app.use(cors({
    origin: true, // Allow all origins
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

// Catch-all: serve React SPA or Diagnostic Page
app.get('*', (req, res) => {
    // 1. Ignore API calls
    if (req.path.startsWith('/api')) return res.status(404).json({ error: "API Route not found" });
    
    const clientDistPath = path.join(__dirname, 'client', 'dist', 'index.html');
    const legacyPath = path.join(__dirname, 'frontend', 'index.html');
    const fs = require('fs');

    // 2. Try to serve modern React build
    if (fs.existsSync(clientDistPath)) {
        console.log(`[SPA] Serving modern React build: ${req.url}`);
        return res.sendFile(clientDistPath);
    } 
    
    // 3. Try to serve legacy frontend
    if (fs.existsSync(legacyPath)) {
        console.warn(`[SPA] Modern build NOT FOUND. Falling back to legacy: ${req.url}`);
        return res.sendFile(legacyPath);
    }

    // 4. CRITICAL: Show Diagnostic Page if nothing found
    console.error(`[SPA] ❌ ERROR: No index.html found at all! Path: ${req.url}`);
    res.status(500).send(`
        <!DOCTYPE html>
        <html lang="th">
        <head>
            <meta charset="UTF-8">
            <style>
                body { background: #0a0a0c; color: white; font-family: 'Prompt', sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; text-align: center; }
                .card { background: #151518; border: 1px solid #2a2a2e; padding: 40px; border-radius: 20px; max-width: 500px; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
                h1 { color: #ff003c; margin-bottom: 10px; }
                p { color: #94a3b8; line-height: 1.6; }
                .box { background: #1e1e22; padding: 15px; border-radius: 10px; border-left: 4px solid #ff003c; text-align: left; margin: 20px 0; font-size: 14px; }
                code { color: #ff003c; font-family: monospace; }
                .btn { background: #ff003c; color: white; padding: 12px 30px; border-radius: 10px; text-decoration: none; font-weight: bold; display: inline-block; margin-top: 10px; }
            </style>
        </head>
        <body>
            <div class="card">
                <h1>⚠️ หน้าเว็บยังไม่พร้อมใช้งาน</h1>
                <p>เซิฟเวอร์เชื่อมต่อสำเร็จ แต่หาไฟล์ HTML ของหน้าเว็บไม่เจอค่ะ</p>
                <div class="box">
                    <strong>ต้องแก้ที่ Render Dashboard:</strong><br><br>
                    1. ไปที่ <b>Settings</b> -> <b>Build & Deploy</b><br>
                    2. ตั้งค่า <b>Build Command</b> เป็น:<br>
                    <code>npm install && cd client && npm install && npm run build</code><br><br>
                    3. ตรวจสอบให้แน่ใจว่าได้กด <b>Save Changes</b> แล้วค่ะ
                </div>
                <a href="/" class="btn">ลองโหลดหน้าใหม่อีกครั้ง</a>
            </div>
        </body>
        </html>
    `);
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
