import { motion } from 'framer-motion';
import { ShieldCheck, Eye, Lock, Database, UserCheck } from 'lucide-react';
import { useEffect } from 'react';

export default function Privacy() {
  useEffect(() => {
    document.title = 'นโยบายความเป็นส่วนตัว | GB Marketplace';
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <div className="w-20 h-20 bg-green-500/20 rounded-2xl flex items-center justify-center text-green-400 mx-auto mb-6 shadow-glow-sm shadow-green-500/20">
          <ShieldCheck size={40} />
        </div>
        <h1 className="text-4xl font-extrabold text-white mb-4">Privacy Policy</h1>
        <p className="text-gray-400">นโยบายความเป็นส่วนตัวและการรักษาความปลอดภัยของข้อมูล</p>
        <div className="w-20 h-1 bg-green-500 mx-auto mt-6 rounded-full" />
      </motion.div>

      <div className="space-y-10 text-gray-300 leading-relaxed">
        {/* Intro */}
        <section className="bg-surface/50 p-8 rounded-3xl border border-white/5">
          <p>
            เราให้ความสำคัญอย่างสูงสุดกับการคุ้มครองข้อมูลส่วนบุคคลของท่าน (PDPA) นโยบายนี้อธิบายถึงขั้นตอนการเก็บรวบรวม การใช้งาน และการป้องกันข้อมูลของสมาชิกทุกท่านบน GB Marketplace
          </p>
        </section>

        {/* Section 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className="bg-surface/50 p-8 rounded-3xl border border-white/5">
            <div className="text-green-400 mb-4"><Database size={24} /></div>
            <h2 className="text-xl font-bold text-white mb-4">ข้อมูลที่เราจัดเก็บ</h2>
            <ul className="text-sm space-y-2 text-gray-400 list-disc list-inside">
              <li>ชื่อผู้ใช้ (Username)</li>
              <li>อีเมล (สำหรับการยืนยันตัวตน)</li>
              <li>ข้อมูลการติดต่อ (ที่อยู่/เบอร์โทร เมื่อมีการสั่งซื้อ)</li>
              <li>ประวัติการเติมเงินและสั่งซื้อ</li>
              <li>ภาพสลิปชำระเงิน</li>
            </ul>
          </section>

          <section className="bg-surface/50 p-8 rounded-3xl border border-white/5">
            <div className="text-blue-400 mb-4"><Eye size={24} /></div>
            <h2 className="text-xl font-bold text-white mb-4">วัตถุประสงค์การใช้</h2>
            <ul className="text-sm space-y-2 text-gray-400 list-disc list-inside">
              <li>เพื่อใช้ในการยืนยันรายการสั่งซื้อ</li>
              <li>เพื่อตรวจสอบยอดเงินใน Wallet</li>
              <li>เพื่อการติดต่อสื่อสารเรื่องการจัดส่ง</li>
              <li>เพื่อป้องกันการทุจริตและการโจมตีระบบ</li>
            </ul>
          </section>
        </div>

        {/* Section 2 */}
        <section className="bg-surface/50 p-8 rounded-3xl border border-white/5">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
            <Lock size={20} className="text-primary" />
            การรักษาความปลอดภัย
          </h2>
          <p className="text-sm">
            ข้อมูลทั้งหมดถูกจัดเก็บไว้บนระบบ **Supabase (Cloud Infrastructure)** ซึ่งมีมาตรฐานความปลอดภัยระดับโลก พร้อมระบบการเข้ารหัส (Encryption) และ Row Level Security (RLS) เพื่อให้มั่นใจว่าข้อมูลของคุณจะไม่รั่วไหลหรือถูกเข้าถึงโดยไม่ได้รับอนุญาต
          </p>
        </section>

        {/* Section 3 */}
        <section className="bg-surface/50 p-8 rounded-3xl border border-white/5">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
            <UserCheck size={20} className="text-green-400" />
            สิทธิของเจ้าของข้อมูล
          </h2>
          <p className="text-sm">
            ท่านมีสิทธิ์ในการเข้าถึง แก้ไข หรือขอให้ลบข้อมูลส่วนบุคคลออกจากระบบของเราได้ตลอดเวลา โดยการติดต่อแอดมินผ่านช่องทางที่ระบุไว้ในหน้าติดต่อสอบถาม หรือผ่านการตั้งค่าในหน้า Dashboard
          </p>
        </section>

        <section className="text-center pt-10 border-t border-white/5">
          <p className="text-gray-500 text-xs italic">ปรับปรุงล่าสุดเมื่อ: 14 เมษายน 2569</p>
        </section>
      </div>
    </div>
  );
}
