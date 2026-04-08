const nodemailer = require('nodemailer');

// 🛡️ สร้างระบบขนส่งอีเมล (Transporter) พร้อมระบบตัดการทำงานหากค้าง
const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // Use SSL
    pool: true,   // Use pooled connections
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    connectionTimeout: 10000, 
    greetingTimeout: 10000,   
    socketTimeout: 10000,     
});

/**
 * ส่งอีเมลรีเซ็ตรหัสผ่าน พร้อมระบบ Log และ Fallback
 * @param {string} to - อีเมลผู้รับ
 * @param {string} resetLink - ลิงก์สำหรับรีเซ็ต
 */
const sendResetEmail = async (to, resetLink) => {
    // 🔍 1. ตรวจสอบการตั้งค่า SMTP (FALLBACK LOGIC)
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.log("\n" + "!".repeat(60));
        console.log("[EMAIL] ⚠️ WARNING: SMTP NOT CONFIGURED!");
        console.log(`[EMAIL] FALLBACK - Reset Link for ${to}:`);
        console.log(`[EMAIL] URL: ${resetLink}`);
        console.log("!".repeat(60) + "\n");
        return { success: true, method: 'fallback_console' };
    }

    const mailOptions = {
        from: `"GB MoneyShop" <${process.env.EMAIL_USER}>`,
        to: to,
        subject: '🔒 รีเซ็ตรหัสผ่าน - GB MoneyShop',
        html: `
            <div style="font-family: 'Prompt', sans-serif; max-width: 600px; margin: auto; padding: 40px; background: #0a0a0c; color: white; border-radius: 20px; border: 1px solid #2a2a2e;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #ff003c; margin: 0;">GB MoneyShop</h1>
                    <p style="color: #9ca3af; margin-top: 5px;">ระบบกู้คืนรหัสผ่าน</p>
                </div>
                
                <div style="background: #151518; padding: 30px; border-radius: 15px; border: 1px solid #333;">
                    <h2 style="margin-top: 0; color: white;">สวัสดีค่ะคุณลูกค้า,</h2>
                    <p style="color: #d1d5db; line-height: 1.6;">
                        คุณได้ทำรายการขอรีเซ็ตรหัสผ่านใหม่ที่หน้าเว็บไซต์ GB MoneyShop <br>
                        กรุณากดปุ่มด้านล่างเพื่อดำเนินการต่อภายใน 1 ชั่วโมงค่ะ:
                    </p>
                    
                    <div style="text-align: center; margin: 35px 0;">
                        <a href="${resetLink}" 
                           style="background: #ff003c; color: white; padding: 15px 35px; text-decoration: none; border-radius: 10px; font-weight: bold; display: inline-block; box-shadow: 0 4px 15px rgba(255, 0, 60, 0.3);">
                           ยืนยันและตั้งรหัสผ่านใหม่
                        </a>
                    </div>
                    
                    <p style="color: #6b7280; font-size: 11px; line-height: 1.5; text-align: center;">
                        หากปุ่มใช้งานไม่ได้ คัดลอกลิงก์นี้ไปวางในเบราว์เซอร์ค่ะ: <br>
                        <a href="${resetLink}" style="color: #ff003c; text-decoration: none;">${resetLink}</a>
                    </p>
                </div>
                
                <div style="text-align: center; margin-top: 30px; color: #4b5563; font-size: 11px;">
                    © 2026 GB MoneyShop Marketplace. All Rights Reserved.
                </div>
            </div>
        `,
    };

    try {
        console.log(`[EMAIL] Sending to ${to}... 🕊️`);
        const info = await transporter.sendMail(mailOptions);
        console.log(`[EMAIL] SUCCESS ✅ (MessageID: ${info.messageId})`);
        return { success: true, method: 'smtp' };
    } catch (error) {
        console.error(`[EMAIL ERROR] ❌ Failed to send to ${to}:`, error.message);
        // Fallback log link even if SMTP fails mid-way
        console.log(`[EMAIL ERROR] DEBUG Fallback - Link: ${resetLink}`);
        throw error;
    }
};

module.exports = {
    sendResetEmail,
};
