import { motion } from 'framer-motion';
import { Shield, FileText, Scale, Gavel, AlertCircle, Globe } from 'lucide-react';
import { useEffect } from 'react';

export default function Terms() {
  useEffect(() => {
    document.title = 'ข้อตกลงการใช้งาน | GBshop Marketplace';
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
            <Gavel size={32} />
          </div>
          <h1 className="text-6xl font-black text-slate-900 mb-4 tracking-tighter uppercase">Terms of Service</h1>
          <p className="text-xl text-slate-400 font-bold tracking-tight">ข้อตกลงและเงื่อนไขการใช้งานแพลตฟอร์ม GBshop</p>
        </motion.div>

        <div className="space-y-12 text-slate-500">
          {/* Section 1 */}
          <section className="bg-white p-12 rounded-[56px] shadow-soft border border-slate-100">
            <h2 className="text-3xl font-black text-slate-900 mb-8 flex items-center gap-4 tracking-tight uppercase">
              <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white text-lg font-black">01</div>
              การยอมรับข้อตกลง
            </h2>
            <p className="text-xl font-bold text-slate-500 leading-relaxed tracking-tight">
              การเข้าถึงหรือใช้งานเว็บไซต์ GBshop หมายความว่าคุณตกลงที่จะปฏิบัติตามข้อกำหนดและเงื่อนไขเหล่านี้ หากคุณไม่เห็นด้วยกับข้อตกลงใดๆ โปรดระงับการใช้งานทันที ท่านต้องมีอายุไม่ต่ำกว่า 18 ปีหรือได้รับความยินยอมจากผู้ปกครองในการทำธุรกรรม
            </p>
          </section>

          {/* Section 2 */}
          <section className="bg-white p-12 rounded-[56px] shadow-soft border border-slate-100">
            <h2 className="text-3xl font-black text-slate-900 mb-8 flex items-center gap-4 tracking-tight uppercase">
              <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white text-lg font-black">02</div>
              ระบบบัญชีและการชำระเงิน
            </h2>
            <p className="text-xl font-bold text-slate-500 mb-10 leading-relaxed tracking-tight">
              ผู้ใช้มีหน้าที่รักษาความปลอดภัยของบัญชีตนเอง ระบบของเรารองรับการชำระเงินผ่านการโอนเงินธนาคาร (QR Code), การนัดรับสินค้า (Meetup) และการเก็บเงินปลายทาง (COD) เท่านั้น
            </p>
            <div className="bg-slate-50 border border-slate-100 p-8 rounded-[32px] flex gap-6 items-start">
              <AlertCircle size={28} className="text-slate-900 shrink-0" />
              <p className="text-lg font-bold text-slate-700 leading-tight">กรุณาตรวจสอบข้อมูลการชำระเงินและหลักฐานการโอนเงิน (Slip) ให้ถูกต้องก่อนยืนยัน เพื่อความรวดเร็วในการตรวจสอบโดยแอดมิน</p>
            </div>
          </section>

          {/* Section 3 */}
          <section className="bg-white p-12 rounded-[56px] shadow-soft border border-slate-100">
            <h2 className="text-3xl font-black text-slate-900 mb-8 flex items-center gap-4 tracking-tight uppercase">
              <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white text-lg font-black">03</div>
              การคืนเงินและสต็อกสินค้า
            </h2>
            <p className="text-xl font-bold text-slate-500 leading-relaxed tracking-tight">
              การสั่งซื้อสินค้าจะมีผลสมบูรณ์เมื่อแอดมินทำการ "ยืนยันการจัดส่ง" เท่านั้น ในกรณีที่สินค้าหมดสต็อกหรือเกิดข้อผิดพลาด ทางเราจะดำเนินการติดต่อกลับเพื่อยกเลิกออเดอร์และคืนเงินแก่ท่านโดยตรงตามช่องทางที่ตกลงกันไว้
            </p>
          </section>

          {/* Section 4 */}
          <section className="bg-white p-12 rounded-[56px] shadow-soft border border-slate-100">
            <h2 className="text-3xl font-black text-slate-900 mb-8 flex items-center gap-4 tracking-tight uppercase">
              <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white text-lg font-black">04</div>
              พฤติกรรมที่ต้องห้าม
            </h2>
            <ul className="space-y-6 text-xl font-bold text-slate-400">
              <li className="flex items-center gap-4"><div className="w-2 h-2 bg-slate-900 rounded-full" /> ห้ามใช้ระบบเพื่อการฟอกเงินหรือธุรกรรมที่ผิดกฎหมาย</li>
              <li className="flex items-center gap-4"><div className="w-2 h-2 bg-slate-900 rounded-full" /> ห้ามพยายามเจาะระบบหรือรบกวนการทำงานของเซิร์ฟเวอร์</li>
              <li className="flex items-center gap-4"><div className="w-2 h-2 bg-slate-900 rounded-full" /> ห้ามใช้ชื่อผู้ใช้ที่ไม่เหมาะสมหรือแอบอ้างเป็นผู้อื่น</li>
              <li className="flex items-center gap-4"><div className="w-2 h-2 bg-slate-900 rounded-full" /> ห้ามทำการหลอกลวงหรือฉ้อโกงสมาชิกคนอื่นๆ</li>
            </ul>
          </section>

          <section className="text-center pt-24 text-slate-300">
            <div className="w-12 h-1 bg-slate-100 mx-auto mb-8" />
            <p className="text-[10px] font-black uppercase tracking-[0.4em]">Last Updated: April 18, 2026</p>
          </section>
        </div>
      </div>
    </div>
  );
}
