const nodemailer = require('nodemailer');

// 🛡️ สร้างระบบขนส่งอีเมล (Transporter)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // ต้องเป็น App Password 16 หลัก
    },
});

/**
 * ส่งอีเมลรีเซ็ตรหัสผ่าน
 * @param {string} to - อีเมลผู้รับ
 * @param {string} resetLink - ลิงก์สำหรับรีเซ็ต
 */
const sendResetEmail = async (to, resetLink) => {
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
                    
                    <p style="color: #6b7280; font-size: 12px; line-height: 1.5;">
                        หากคุณไม่ได้เป็นคนทำรายการนี้ โปรดเพิกเฉยต่ออีเมลฉบับนี้ค่ะ <br>
                        บัญชีของคุณยังคงปลอดภัยและไม่มีการเปลี่ยนแปลงใดๆ
                    </p>
                </div>
                
                <div style="text-align: center; margin-top: 30px; color: #4b5563; font-size: 11px;">
                    © 2026 GB MoneyShop Marketplace. All Rights Reserved.
                </div>
            </div>
        `,
    };

    try {
        console.log(`[EMAIL] 📩 🕊️ Attempting to send email to ${to}...`);
        const info = await transporter.sendMail(mailOptions);
        console.log(`[EMAIL] ✅ Email sent successfully: ${info.messageId}`);
        return { success: true, info };
    } catch (error) {
        console.error(`[EMAIL] ❌ Failed to send email:`, error.message);
        throw new Error('ไม่สามารถส่งอีเมลได้ในขณะนี้ กรุณาลองใหม่ภายหลัง');
    }
};

module.exports = {
    sendResetEmail,
};
