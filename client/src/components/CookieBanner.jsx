import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, X, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // ตรวจสอบว่าเคยยอมรับไปหรือยัง
    const consented = localStorage.getItem('gb_cookie_consent');
    if (!consented) {
      // แสดงหลังจากผ่านไป 2 วินาทีเพื่อให้ดูไม่รบกวนเกินไป
      const timer = setTimeout(() => setShow(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = () => {
    localStorage.setItem('gb_cookie_consent', 'true');
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-6 left-6 right-6 md:left-auto md:right-8 md:w-[400px] z-[9999]"
        >
          <div className="bg-surface/80 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-2xl relative overflow-hidden group">
            {/* Decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/20 transition-colors" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                  <Cookie size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-white">นโยบายคุกกี้</h3>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Cookie Policy & Privacy</p>
                </div>
                <button 
                  onClick={() => setShow(false)}
                  className="ml-auto text-gray-500 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <p className="text-sm text-gray-400 leading-relaxed mb-6">
                เราใช้คุกกี้เพื่อเพิ่มประสิทธิภาพในการใช้งานและเก็บข้อมูลเพื่อความปลอดภัยของบัญชีคุณ 
                สามารถอ่านรายละเอียดเพิ่มเติมได้ที่ <Link to="/privacy" className="text-primary hover:underline italic">นโยบายความเป็นส่วนตัว</Link>
              </p>

              <div className="flex gap-3">
                <button
                  onClick={accept}
                  className="flex-1 bg-primary hover:bg-primary-hover text-white py-2.5 rounded-xl text-sm font-bold transition-all shadow-glow-sm flex items-center justify-center gap-2"
                >
                  <ShieldCheck size={16} /> ยอมรับทั้งหมด
                </button>
                <button
                  onClick={() => setShow(false)}
                  className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-sm font-medium transition-all"
                >
                  ปิด
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
