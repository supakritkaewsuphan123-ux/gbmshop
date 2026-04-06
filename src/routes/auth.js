const express = require("express");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const { getDb } = require("../db/database");
const { forgotPasswordLimiter } = require("../middleware/rateLimit");

const router = express.Router();
const upload = require("../middleware/upload");

// ENV ──────────────────────────────────────────────────────────────────────────
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const NODE_ENV = process.env.NODE_ENV || "development";
const JWT_SECRET = process.env.JWT_SECRET || "secret_key";
const isProd = NODE_ENV === 'production';

// Nodemailer Setup ──────────────────────────────────────────────────────────────
let transporter;
if (isProd) {
    transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT),
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for others
        auth: { 
            user: process.env.SMTP_USER, 
            pass: process.env.SMTP_PASS 
        }
    });

    // Verification step for Production SMTP - Non-blocking
    transporter.verify((error) => {
        if (error) {
            console.error('❌ SMTP Verification Failed:', error.message);
        } else {
            console.log('✅ SMTP Server is ready to take our messages');
        }
    });
}

// ──────────────────────────────────────────────────────────────────────────────
// LOGIN
// ──────────────────────────────────────────────────────────────────────────────
router.post("/login", async (req, res) => {
    const { username, password } = req.body;
    try {
        const db = await getDb();
        const user = await db.get("SELECT * FROM users WHERE username = ?", [username]);

        if (!user) return res.status(401).json({ error: "Invalid credentials" });

        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(401).json({ error: "Invalid credentials" });

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.json({
            token,
            user: { id: user.id, username: user.username, role: user.role, balance: user.balance || 0 }
        });
    } catch (error) {
        if (!isProd) console.error('Login Error:', error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// ──────────────────────────────────────────────────────────────────────────────
// REGISTER
// ──────────────────────────────────────────────────────────────────────────────
router.post("/register", upload.single("profile_image"), async (req, res) => {
    const timestamp = new Date().toISOString();
    console.log(`[VER 2.0 - ${timestamp}] Registration Attempt`, { 
        contentType: req.headers['content-type'],
        body: req.body,
        file: req.file ? req.file.filename : 'none'
    });

    const { username, password, email } = req.body || {};
    const profileImage = req.file ? req.file.filename : 'default_avatar.png';

    if (!username || !password) {
        return res.status(400).json({ 
            error: "Username and password required",
            debug_info: { ver: "2.0", bodyReceived: !!req.body }
        });
    }

    try {
        const db = await getDb();
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.run(
            "INSERT INTO users (username, password, email, profile_image) VALUES (?, ?, ?, ?)",
            [username, hashedPassword, email || null, profileImage]
        );
        res.status(201).json({ message: "User registered successfully", ver: "2.0" });
    } catch (error) {
        if (!isProd) console.error('Register Error:', error);
        res.status(500).json({ error: "Registration failed", ver: "2.0" });
    }
});

// ──────────────────────────────────────────────────────────────────────────────
// FORGOT PASSWORD (Hardened with Rate Limiting & Private Logging)
// ──────────────────────────────────────────────────────────────────────────────
router.post("/forgot-password", forgotPasswordLimiter, async (req, res) => {
    const { email } = req.body;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        return res.status(400).json({ message: "รูปแบบอีเมลไม่ถูกต้อง" });

    const token = crypto.randomBytes(32).toString("hex"); 
    const expires = Date.now() + 15 * 60 * 1000; // 15 mins

    try {
        const db = await getDb();
        const user = await db.get("SELECT * FROM users WHERE email=?", [email]);

        // Generic response regardless of user existence (Enumeration Protection)
        const genericMessage = "หากอีเมลถูกต้อง ระบบจะส่งลิงก์ไปให้คุณในกล่องจดหมาย";

        if (user) {
            await db.run("UPDATE users SET reset_token=?, reset_expires=? WHERE email=?",
                [token, expires, email]);

            const resetUrl = `${FRONTEND_URL}/reset-password?token=${token}`;
            const emailHtml = `
                <div style="background:#0a0a0c;color:#fff;padding:40px;font-family:sans-serif;border-radius:10px;">
                    <h2 style="color:#ff003c;margin-bottom:20px;">GB MoneyShop Password Reset</h2>
                    <p style="font-size:16px;">กดที่ปุ่มด้านล่างเพื่อตั้งรหัสผ่านใหม่ของคุณ (ลิงก์มีอายุ 15 นาที):</p>
                    <div style="margin:30px 0;">
                        <a href="${resetUrl}" style="background:#ff003c;color:#white;padding:12px 25px;text-decoration:none;border-radius:5px;font-weight:bold;">รีเซ็ตรหัสผ่าน</a>
                    </div>
                    <p style="color:#888;font-size:12px;">หากคุณไม่ได้ขอนี้ โปรดเพิกเฉยต่ออีเมลฉบับนี้</p>
                </div>`;

            if (isProd) {
                await transporter.sendMail({
                    from: process.env.SMTP_FROM,
                    to: email,
                    subject: "Password Reset - GB MoneyShop",
                    html: emailHtml
                });
            } else {
                // Sensitive info ONLY logged in Dev mode
                console.log("\n" + "═".repeat(60));
                console.log("🚀 [DEV MODE] RECOVERY TOKEN: " + token);
                console.log(`🔗 RESET LINK: ${resetUrl}`);
                console.log("═".repeat(60) + "\n");
            }
        }
        res.json({ message: genericMessage });
    } catch (error) {
        if (!isProd) console.error('Forgot Password Error:', error);
        res.status(500).json({ message: "ขออภัย เกิดข้อผิดพลาดที่เซิร์ฟเวอร์" });
    }
});

// ──────────────────────────────────────────────────────────────────────────────
// RESET PASSWORD (Hardened Atomic Invalidation)
// ──────────────────────────────────────────────────────────────────────────────
router.post("/reset-password", async (req, res) => {
    const { token, newPassword } = req.body || {};
    console.log(`[VER 2.1] Reset Attempt - Token: "${token}"`);

    if (!/^(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z0-9!@#$%^&*]{8,}$/.test(newPassword))
        return res.status(400).json({ message: "รหัสผ่านไม่ผ่านเกณฑ์ความแข็งแรง" });

    try {
        const db = await getDb();
        const user = await db.get("SELECT * FROM users WHERE reset_token = ?", [token]);

        if (!user) {
             console.log(`[VER 2.1] Token match FAILED. Received: "${token}"`);
             // Debug: check all tokens in DB
             const allTokens = await db.all("SELECT reset_token FROM users WHERE reset_token IS NOT NULL");
             console.log("[VER 2.1] Tokens currently in DB:", allTokens.map(t => `"${t.reset_token}"`));
             return res.status(400).json({ message: "Token ไม่ถูกต้องหรือหมดอายุแล้ว" });
        }
        
        const now = Date.now();
        const expiryDate = new Date(user.reset_expires).getTime();
        
        console.log(`[VER 2.1] Found user: ${user.username}, Expiry: ${expiryDate}, Now: ${now}`);
        
        if (isNaN(expiryDate) || expiryDate < now) {
            console.log("[VER 2.1] Token EXPIRED");
            return res.status(400).json({ message: "Token ไม่ถูกต้องหรือหมดอายุแล้ว" });
        }

        const hashed = await bcrypt.hash(newPassword, 10);
        
        // Atomic Update: Password changed and Token nulled in one operation
        await db.run("UPDATE users SET password=?, reset_token=NULL, reset_expires=NULL WHERE id=?",
            [hashed, user.id]);

        res.json({ message: "เปลี่ยนรหัสผ่านสำเร็จแล้ว กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่" });
    } catch (error) {
        if (!isProd) console.error('Reset Password Error:', error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน" });
    }
});

module.exports = router;
