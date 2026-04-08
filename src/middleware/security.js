const { getDb } = require('../db/database');

/**
 * Adaptive Security Middleware
 * Handles Hard-Blocking (403) and Soft-Blocking (Exponential Delay)
 */
const adaptiveSecurityMiddleware = (priority = 'medium') => {
    return async (req, res, next) => {
        const ip = req.ip || req.connection.remoteAddress;
        const db = await getDb();

        try {
            // 1. Check for Hard Block
            const blocked = await db.get(
                "SELECT * FROM blocked_ips WHERE ip_address = ? AND expires_at > CURRENT_TIMESTAMP",
                [ip]
            );

            if (blocked) {
                return res.status(403).json({ 
                    error: 'Access denied. Your IP has been temporarily blocked for suspicious activity.',
                    reason: blocked.reason
                });
            }

            // 2. Adaptive Soft-Block (Exponential Backoff based on recent warnings)
            // Count warnings in the last 15 minutes
            const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
            const logs = await db.get(
                "SELECT COUNT(*) as count FROM audit_logs WHERE ip_address = ? AND severity = 'warning' AND created_at > ?",
                [ip, fifteenMinsAgo]
            );

            const warningCount = logs.count || 0;
            if (warningCount > 0) {
                // Base delays: High (Login/Reset) = 1s, Medium (Forgot) = 0.5s
                const baseDelay = priority === 'high' ? 1000 : 500;
                // Exponential backoff: base * 2^warnings, capped at 10s
                const calculatedDelay = Math.min(10000, baseDelay * Math.pow(2, warningCount));
                
                // Server-side internal log (optional)
                console.log(`[SECURITY] Throttling IP ${ip} for ${calculatedDelay}ms (Warnings: ${warningCount})`);
                
                await new Promise(resolve => setTimeout(resolve, calculatedDelay));
            }

            next();
        } catch (err) {
            console.error('Security Middleware Error:', err);
            next(); // Proceed if DB fails to avoid blocking legitimate users
        }
    };
};

/**
 * Audit Logger Helper
 */
const logAuditEvent = async (email, action, severity, ip) => {
    try {
        const db = await getDb();
        await db.run(
            "INSERT INTO audit_logs (user_email, action, severity, ip_address) VALUES (?, ?, ?, ?)",
            [email, action, severity, ip]
        );

        // Auto-Block Logic: If 5 critical events from same IP in 1 hour
        if (severity === 'critical') {
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
            const criticals = await db.get(
                "SELECT COUNT(*) as count FROM audit_logs WHERE ip_address = ? AND severity = 'critical' AND created_at > ?",
                [ip, oneHourAgo]
            );

            if (criticals.count >= 5) {
                const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours
                await db.run(
                    "INSERT OR REPLACE INTO blocked_ips (ip_address, reason, expires_at) VALUES (?, ?, ?)",
                    [ip, 'Automated block due to repeated security failures', expiresAt]
                );
                console.log(`[SECURITY] IP ${ip} HARD-BLOCKED for 24 hours.`);
            }
        }
    } catch (err) {
        console.error('Audit Log Error:', err);
    }
};

module.exports = { adaptiveSecurityMiddleware, logAuditEvent };
