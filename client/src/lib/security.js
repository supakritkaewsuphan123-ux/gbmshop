// ============================================================
// 🔒 Security Utilities - GB Marketplace (Fintech-Grade)
// ============================================================

/**
 * ✅ ตรวจสอบประเภทและขนาดไฟล์ก่อน Upload (Client-side guard)
 * หมายเหตุ: Server-side (Supabase Storage Policy) เป็นด่านสำคัญ
 * Client-side นี้เป็นแค่ UX convenience
 */
export const validateImageFile = (file, options = {}) => {
  const {
    maxSizeMB = 10,
    allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  } = options;

  if (!file) return { valid: false, error: 'ไม่พบไฟล์' };

  // Check MIME type (ไม่เชื่อ extension เพียงอย่างเดียว)
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `ไฟล์ไม่ถูกต้อง อนุญาตเฉพาะ: ${allowedTypes.join(', ')}`
    };
  }

  // Check file size
  const maxBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxBytes) {
    return {
      valid: false,
      error: `ไฟล์ใหญ่เกินไป (สูงสุด ${maxSizeMB}MB)`
    };
  }

  // Check for dangerous extensions in filename
  const dangerousExts = /\.(php|js|exe|sh|bat|cmd|py|rb|pl|asp|aspx|cgi|html|htm|svg)$/i;
  if (dangerousExts.test(file.name)) {
    return {
      valid: false,
      error: 'ประเภทไฟล์นี้ไม่อนุญาต'
    };
  }

  return { valid: true };
};

export const validateVideoFile = (file, options = {}) => {
  const {
    maxSizeMB = 50,
    allowedTypes = ['video/mp4', 'video/mov', 'video/webm', 'video/quicktime'],
  } = options;

  if (!file) return { valid: false, error: 'ไม่พบไฟล์' };
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `ไฟล์วิดีโอไม่ถูกต้อง อนุญาตเฉพาะ: MP4, MOV, WebM`
    };
  }
  const maxBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxBytes) {
    return { valid: false, error: `วิดีโอใหญ่เกินไป (สูงสุด ${maxSizeMB}MB)` };
  }

  return { valid: true };
};

export const validateSlipFile = (file) => {
  return validateImageFile(file, {
    maxSizeMB: 5,
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  });
};

/**
 * ✅ สร้างชื่อไฟล์ที่ปลอดภัย (UUID-based ไม่ใช้ชื่อจาก user)
 */
export const generateSafeFilename = (originalFile, prefix = 'file') => {
  const ext = originalFile.name.split('.').pop()?.toLowerCase() || 'jpg';
  const uuid = crypto.randomUUID();
  return `${prefix}/${uuid}.${ext}`;
};

/**
 * ✅ ป้องกัน XSS - Sanitize text input
 */
export const sanitizeText = (text, maxLength = 500) => {
  if (!text || typeof text !== 'string') return '';
  return text
    .trim()
    .slice(0, maxLength)
    .replace(/[<>]/g, ''); // Strip HTML tags
};

/**
 * ✅ ตรวจสอบเบอร์โทร (Thai format)
 */
export const validateThaiPhone = (phone) => {
  const digits = phone.replace(/[^0-9]/g, '');
  return digits.length === 10 && /^0[0-9]{9}$/.test(digits);
};

/**
 * ✅ ตรวจสอบราคา (ต้องเป็นตัวเลขบวก)
 */
export const validatePrice = (price) => {
  const num = parseFloat(price);
  return !isNaN(num) && num > 0 && num <= 10000000; // ไม่เกิน 10 ล้าน
};

/**
 * ✅ ตรวจสอบ Stock (ต้องเป็นจำนวนเต็มบวก)
 */
export const validateStock = (stock) => {
  const num = parseInt(stock);
  return !isNaN(num) && num >= 0 && num <= 100000;
};

/**
 * ✅ Rate Limiting (Client-side เพิ่มเติม - ป้องกัน UI double-click)
 */
const actionTimestamps = new Map();
export const clientRateLimit = (action, minIntervalMs = 3000) => {
  const now = Date.now();
  const last = actionTimestamps.get(action) || 0;
  if (now - last < minIntervalMs) {
    return false; // Too soon
  }
  actionTimestamps.set(action, now);
  return true;
};
