const express = require("express");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { getDb } = require("../db/database");
const { forgotPasswordLimiter, resetPasswordLimiter } = require("../middleware/rateLimit");
const upload = require("../middleware/upload");

const { sendResetEmail } = require("../services/emailService");
const router = express.Router();

// ✅ HEALTH CHECK (TESTING ONLY)
router.get("/ping", (req, res) => {
    console.log(`[${req.id}] HANDLER: ping`);
    res.json({ message: "pong" });
});

// ──────────────────────────────────────────────────────────────────────────────
// FORGOT PASSWORD (SUPABASE PROXY WITH RATE LIMIT)
// ──────────────────────────────────────────────────────────────────────────────
router.post("/request-reset", async (req, res) => {
    let { email } = req.body || {};
    const ip = req.ip;

    try {
        if (!email || !email.includes('@')) {
            return res.status(400).json({ error: "กรุณาระบุอีเมลที่ถูกต้อง" });
        }
        email = email.trim().toLowerCase();

        const db = await getDb();

        // 🛡️ PRO: Backend Rate Limit (check last 60 seconds)
        const lastRequest = await db.get(`
            SELECT id FROM audit_logs 
            WHERE user_email = ? 
            AND action = 'PASSWORD_RESET_REQUEST' 
            AND created_at > datetime('now', '-60 seconds')
        `, [email]);

        if (lastRequest) {
            return res.status(429).json({ error: "ส่งอีเมลบ่อยเกินไป กรุณารอกดส่งใหม่ในอีก 60 วินาทีครับ ⏳" });
        }

        const { supabase } = require('../services/supabaseService');
        const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
        const redirectTo = `${frontendUrl}/reset-password?mode=recovery`;
        console.log(`[AUTH] Reset Link Redirecting to: ${redirectTo}`);
        
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo,
        });

        if (error) {
            console.error('[SUPABASE ERROR]', error.message);
            throw error;
        }

        // 📝 PRO: Log the successful request
        await db.run(`
            INSERT INTO audit_logs (user_email, action, severity, ip_address)
            VALUES (?, ?, ?, ?)
        `, [email, 'PASSWORD_RESET_REQUEST', 'info', ip]);

        return res.json({ message: "ระบบได้ส่งลิงก์รีเซ็ตไปที่อีเมลของคุณแล้ว 🎉" });
    } catch (error) {
        console.error(`[RESET PROXY ERROR]`, error.message);
        return res.status(500).json({ error: "เกิดข้อผิดพลาดในการส่งอีเมล กรุณาลองใหม่ภายหลัง" });
    }
});

router.post("/log-reset-success", async (req, res) => {
    const { userId, email } = req.body;
    try {
        const db = await getDb();
        await db.run(`
            INSERT INTO audit_logs (user_email, action, severity, ip_address)
            VALUES (?, ?, ?, ?)
        `, [email || `ID:${userId}`, 'PASSWORD_RESET_SUCCESS', 'success', req.ip]);
        res.json({ status: 'ok' });
    } catch (err) {
        res.status(500).json({ error: 'Logging failed' });
    }
});

router.route("/forgot-password")
// ... existing legacy code kept if needed, or I can replace it.
// I'll keep it for now but the frontend will use /request-reset.

// ──────────────────────────────────────────────────────────────────────────────
// RESET PASSWORD
// ──────────────────────────────────────────────────────────────────────────────
router.route("/reset-password")
    .post(resetPasswordLimiter, async (req, res) => {
        console.log(`[${req.id}] โดนเรียก reset-password แล้ว`);
        let { token, newPassword } = req.body || {};
        const uniformError = "ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้องหรือหมดอายุแล้ว";

        try {
            // 1. DATA CLEANUP & LOGGING
            if (!token || typeof token !== "string") {
                console.warn(`[${req.id}] [WARN] No token provided in request body`);
                return res.status(400).json({ error: uniformError });
            }

            token = token.trim(); // ✅ Clean up stray spaces
            console.log(`[${req.id}] DEBUG: Received Token Length: ${token.length}`);

            if (token.length !== 64 || !/^[0-9a-f]{64}$/i.test(token)) {
                console.warn(`[${req.id}] [WARN] Invalid Token Format. Length=${token.length}, Value="${token}"`);
                return res.status(400).json({ error: uniformError });
            }

            if (!newPassword || newPassword.length < 6) {
                return res.status(400).json({ error: "รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร" });
            }

            console.log(`[${req.id}] HANDLER: Validating token against DB...`);

            // Hash incoming token with SHA-256 for comparison
            const hashedIncoming = crypto.createHash("sha256").update(token.toLowerCase()).digest("hex");
            
            const db = await getDb();
            // ✅ FIX: Find the SPECIFIC user associated with this hashed token
            const user = await db.get(
                `SELECT id, password, reset_token, reset_expires FROM users 
                 WHERE reset_token = ? AND reset_expires > CURRENT_TIMESTAMP`, 
                [hashedIncoming]
            );

            if (!user) {
                console.warn(`[${req.id}] [WARN] Token mismatch or expired. HashedIncoming: ${hashedIncoming}`);
                return res.status(400).json({ error: uniformError });
            }

            // Security Step: TIMING SAFE EQUAL
            const buf1 = Buffer.from(hashedIncoming, "hex");
            const buf2 = Buffer.from(user.reset_token, "hex");

            if (buf1.length !== buf2.length || !crypto.timingSafeEqual(buf1, buf2)) {
                console.warn(`[${req.id}] [WARN] Token comparison failed (TimingSafeEqual Mismatch)`);
                return res.status(400).json({ error: uniformError });
            }

            // 2. PREVENT PASSWORD REUSE
            const sameAsOld = await bcrypt.compare(newPassword, user.password);
            if (sameAsOld) {
                return res.status(400).json({ error: "ไม่สามารถใช้รหัสผ่านเดิมได้" });
            }

            // 3. UPDATE
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            await db.run(
                `UPDATE users SET 
                    password = ?, 
                    token_version = token_version + 1, 
                    reset_token = NULL, 
                    reset_expires = NULL 
                 WHERE id = ?`,
                [hashedPassword, user.id]
            );

            console.log(`[${req.id}] ✅ Password reset success for UserID: ${user.id}`);
            
            // 📝 PRO: Security Log
            await db.run(`
                INSERT INTO audit_logs (user_email, action, severity, ip_address)
                VALUES ((SELECT email FROM users WHERE id = ?), ?, ?, ?)
            `, [user.id, 'PASSWORD_RESET_SUCCESS', 'success', req.ip]);

            res.json({ message: "รีเซ็ตรหัสผ่านสำเร็จ! กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่" });

        } catch (error) {
            console.error(`[${req.id}] ❌ Reset Password Error:`, error.message);
            res.status(500).json({ error: "Internal server error" });
        }
    })
    .get((req, res) => {
        console.log(`[${req.id}] ❌ 405 METHOD NOT ALLOWED: GET /reset-password`);
        res.status(405).json({ error: "Method Not Allowed. Use POST." });
    })
    .all((req, res) => {
        res.status(405).json({ error: "Method Not Allowed" });
    });

// ──────────────────────────────────────────────────────────────────────────────
// REGISTER
// ──────────────────────────────────────────────────────────────────────────────
router.post("/register", upload.single('profile_image'), async (req, res) => {
    const { username, email, password } = req.body;
    try {
        if (!username || !password || !email) {
            return res.status(400).json({ error: "กรุณากรอกข้อมูลให้ครบถ้วน" });
        }

        const db = await getDb();

        // Check if user or email already exists
        const existingUser = await db.get("SELECT id FROM users WHERE username = ? OR email = ?", [username, email.toLowerCase()]);
        if (existingUser) {
            return res.status(400).json({ error: "ชื่อผู้ใช้หรืออีเมลนี้มีอยู่ในระบบแล้ว" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const profileImage = req.file ? req.file.filename : 'default_avatar.png';

        await db.run(
            "INSERT INTO users (username, email, password, profile_image) VALUES (?, ?, ?, ?)",
            [username, email.toLowerCase(), hashedPassword, profileImage]
        );

        res.status(201).json({ message: "สมัครสมาชิกสำเร็จ" });
    } catch (error) {
        console.error("❌ Registration Error:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
});

// ──────────────────────────────────────────────────────────────────────────────
// LOGIN (Standard)
// ──────────────────────────────────────────────────────────────────────────────
router.post("/login", async (req, res) => {
    const { username, password } = req.body;
    try {
        const db = await getDb();
        // Support login by Username OR Email (case-insensitive for email)
        const user = await db.get("SELECT * FROM users WHERE username = ? OR email = ?", [username, username.toLowerCase()]);

        if (!user) return res.status(401).json({ error: "Invalid credentials" });

        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(401).json({ error: "Invalid credentials" });

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role, token_version: user.token_version || 0 },
            process.env.JWT_SECRET || "secret_key",
            { expiresIn: "1d" }
        );

        res.json({
            token,
            user: { id: user.id, username: user.username, role: user.role, balance: user.balance || 0 }
        });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});

module.exports = router;
