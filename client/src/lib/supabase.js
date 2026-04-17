import { createClient } from '@supabase/supabase-js';

/**
 * Supabase Initialization (Senior Frontend - "Just Works" Hybrid Version)
 * 
 * This version satisfies the requirement to "Return to Old System" (Hardcoded)
 * while maintaining a professional structure that supports .env if available.
 */

// 1. ค่าเริ่มต้นจากระบบเดิม (Hardcoded Fallbacks) - "กันเหนียว" ให้ระบบทำงานได้ทันที
const DEFAULT_URL = 'https://euxrctkxybobupmurmtb.supabase.co';
const DEFAULT_KEY = 'sb_publishable_ne-RYj9a7FIY-NRfn3Fxew_-NoTO0ka'; // จากไฟล์ .env ล่าสุดของคุณ

// 2. พยายามดึงค่าจาก Environment Variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_KEY;
const isDev = import.meta.env.DEV;

// 🛡️ Safe Proxy สำหรับกรณีฉุกเฉินที่สุด (เผื่อมีคนลบค่าทิ้งทั้งหมด)
const createSafeProxy = (reason) => {
  const noop = () => {};
  const emptyRes = Promise.resolve({ data: null, error: { message: reason } });
  const handler = {
    get: (t, p) => {
      if (p === 'auth') return new Proxy({}, { get: (tt, pp) => {
        if (pp === 'onAuthStateChange') return () => ({ data: { subscription: { unsubscribe: noop } } });
        return () => emptyRes;
      }});
      if (['from', 'rpc', 'storage', 'select', 'eq', 'single', 'maybeSingle', 'order', 'limit', 'insert', 'update', 'delete'].includes(p)) return () => new Proxy({}, handler);
      if (p === 'then') return (res) => res({ data: null, error: { message: reason } });
      return noop;
    }
  };
  return new Proxy({}, handler);
};

// 3. เริ่มการเชื่อมต่อ
const validateAndInit = () => {
  try {
    // ตรวจสอบความถูกต้องเบื้องต้น
    if (!supabaseUrl || !supabaseUrl.startsWith('https://')) {
      console.error('[Supabase] Invalid URL. Using Safe Proxy.');
      return createSafeProxy('Invalid Supabase URL');
    }

    if (isDev) {
      console.log('🚀 [Supabase] System Initialized (Hybrid Mode)');
    }

    return createClient(supabaseUrl, supabaseAnonKey);
  } catch (err) {
    console.error('[Supabase] Critical Error during init:', err.message);
    return createSafeProxy(err.message);
  }
};

const supabase = validateAndInit();

export { supabase };
