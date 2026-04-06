const rateLimit = require('express-rate-limit');

const isDev = process.env.NODE_ENV !== 'production';

// ─── Login Limiter ────────────────────────────────────────────────────────────
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isDev ? 10000 : 15,
    message: {
        error: 'พยายามเข้าสู่ระบบผิดหลายครั้ง กรุณารอ 15 นาทีแล้วลองใหม่อีกครั้ง'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // login สำเร็จไม่ถูกนับ
});

// ─── API Limiter ──────────────────────────────────────────────────────────────
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isDev ? 1000 : 300,
    message: {
        error: 'คุณส่งคำขอมากเกินไป กรุณารอสักครู่แล้วลองใหม่'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// ─── Forgot Password Limiter ──────────────────────────────────────────────────
const forgotPasswordLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: isDev ? 10000 : 5,    // 10,000 requests in dev, 5 in prod
    message: {
        error: 'คุณขอการรีเซ็ตรหัสผ่านมากเกินไป กรุณารอ 1 ชั่วโมงแล้วลองใหม่'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = { loginLimiter, apiLimiter, forgotPasswordLimiter };
