import { motion } from 'framer-motion';
import { ShieldCheck, Eye, Lock, Database, UserCheck, Globe } from 'lucide-react';
import { useEffect } from 'react';

export default function Privacy() {
  useEffect(() => {
    document.title = 'นโยบายความเป็นส่วนตัว | GBshop Marketplace';
  }, []);

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-4xl mx-auto px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-24"
        >
          <div className="w-16 h-16 bg-slate-50 border border-slate-50 rounded-2xl flex items-center justify-center text-slate-900 mx-auto mb-8 shadow-sm">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-6xl font-black text-slate-900 mb-4 tracking-tighter uppercase">Privacy Policy</h1>
          <p className="text-xl text-slate-400 font-bold tracking-tight">นโยบายความเป็นส่วนตัวและการรักษาความปลอดภัยของข้อมูล</p>
        </motion.div>

        <div className="space-y-12 text-slate-500">
          {/* Intro */}
          <section className="bg-white p-10 rounded-[48px] shadow-soft border border-slate-100">
            <p className="text-xl font-bold text-slate-900 leading-relaxed tracking-tight">
              เราให้ความสำคัญอย่างสูงสุดกับการคุ้มครองข้อมูลส่วนบุคคลของท่าน (PDPA) นโยบายนี้อธิบายถึงขั้นตอนการเก็บรวบรวม การใช้งาน และการป้องกันข้อมูลของสมาชิกทุกท่านบน GBshop
            </p>
          </section>

          {/* Section 1 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <section className="bg-white p-10 rounded-[48px] shadow-soft border border-slate-100 flex flex-col items-center text-center">
              <div className="text-slate-900 mb-8 bg-slate-50 border border-slate-50 w-16 h-16 rounded-2xl flex items-center justify-center shadow-inner"><Database size={32} /></div>
              <h2 className="text-2xl font-black text-slate-900 mb-6 tracking-tight uppercase">Data Storage</h2>
              <ul className="text-lg space-y-4 font-bold text-slate-400">
                <li className="flex items-center gap-3 justify-center"><div className="w-1.5 h-1.5 bg-slate-900 rounded-full" /> Username Account</li>
                <li className="flex items-center gap-3 justify-center"><div className="w-1.5 h-1.5 bg-slate-900 rounded-full" /> Email Authentication</li>
                <li className="flex items-center gap-3 justify-center"><div className="w-1.5 h-1.5 bg-slate-900 rounded-full" /> Delivery Address</li>
                <li className="flex items-center gap-3 justify-center"><div className="w-1.5 h-1.5 bg-slate-900 rounded-full" /> Order Histories</li>
              </ul>
            </section>

            <section className="bg-white p-10 rounded-[48px] shadow-soft border border-slate-100 flex flex-col items-center text-center">
              <div className="text-slate-900 mb-8 bg-slate-50 border border-slate-50 w-16 h-16 rounded-2xl flex items-center justify-center shadow-inner"><Eye size={32} /></div>
              <h2 className="text-2xl font-black text-slate-900 mb-6 tracking-tight uppercase">Usage Scope</h2>
              <ul className="text-lg space-y-4 font-bold text-slate-400">
                <li className="flex items-center gap-3 justify-center"><div className="w-1.5 h-1.5 bg-slate-900 rounded-full" /> Order Verification</li>
                <li className="flex items-center gap-3 justify-center"><div className="w-1.5 h-1.5 bg-slate-900 rounded-full" /> Payment Audits</li>
                <li className="flex items-center gap-3 justify-center"><div className="w-1.5 h-1.5 bg-slate-900 rounded-full" /> Logistics Services</li>
                <li className="flex items-center gap-3 justify-center"><div className="w-1.5 h-1.5 bg-slate-900 rounded-full" /> Fraud Prevention</li>
              </ul>
            </section>
          </div>

          {/* Section 2 */}
          <section className="bg-white p-12 rounded-[56px] shadow-soft border border-slate-100">
            <h2 className="text-3xl font-black text-slate-900 mb-8 flex items-center gap-4 tracking-tight uppercase">
              <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white"><Lock size={28} /></div>
              Security Standard
            </h2>
            <p className="text-xl font-bold text-slate-500 leading-relaxed tracking-tight">
              ข้อมูลทั้งหมดถูกจัดเก็บไว้บนระบบ **Supabase (Cloud Infrastructure)** ซึ่งมีมาตรฐานความปลอดภัยระดับโลก พร้อมระบบการเข้ารหัส (Encryption) และ Row Level Security (RLS) เพื่อให้มั่นใจว่าข้อมูลของคุณจะไม่รั่วไหลหรือถูกเข้าถึงโดยไม่ได้รับอนุญาต
            </p>
          </section>

          {/* Section 3 */}
          <section className="bg-white p-12 rounded-[56px] shadow-soft border border-slate-100">
            <h2 className="text-3xl font-black text-slate-900 mb-8 flex items-center gap-4 tracking-tight uppercase">
               <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white"><UserCheck size={28} /></div>
              User Rights
            </h2>
            <p className="text-xl font-bold text-slate-500 leading-relaxed tracking-tight">
              ท่านมีสิทธิ์ในการเข้าถึง แก้ไข หรือขอให้ลบข้อมูลส่วนบุคคลออกจากระบบของเราได้ตลอดเวลา โดยการติดต่อแอดมินผ่านช่องทางที่ระบุไว้ในหน้าติดต่อสอบถาม หรือผ่านการจัดการโปรไฟล์ในหน้า Dashboard
            </p>
          </section>

          <section className="text-center pt-24">
            <div className="w-12 h-1 bg-slate-100 mx-auto mb-8" />
            <p className="text-slate-300 text-[10px] font-black uppercase tracking-[0.4em]">Last Updated: April 18, 2026</p>
          </section>
        </div>
      </div>
    </div>
  );
}
