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
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isDev ? 1000 : 5,    // 5 requests in prod
    message: {
        error: 'คุณขอการรีเซ็ตรหัสผ่านมากเกินไป กรุณารอ 15 นาทีแล้วลองใหม่'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// ─── Reset Password Limiter ──────────────────────────────────────────────────
const resetPasswordLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isDev ? 1000 : 10,   // 10 requests in prod
    message: {
        error: 'คุณพยายามรีเซ็ตรหัสผ่านมากเกินไป กรุณารอ 15 นาทีแล้วลองใหม่'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = { loginLimiter, apiLimiter, forgotPasswordLimiter, resetPasswordLimiter };
