import { motion } from 'framer-motion';
import { Shield, FileText, Scale, Gavel, AlertCircle } from 'lucide-react';
import { useEffect } from 'react';

export default function Terms() {
  // Set SEO metadata
  useEffect(() => {
    document.title = 'ข้อตกลงการใช้งาน | GB Marketplace';
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <div className="w-20 h-20 bg-primary/20 rounded-2xl flex items-center justify-center text-primary mx-auto mb-6 shadow-glow-sm">
          <Gavel size={40} />
        </div>
        <h1 className="text-4xl font-extrabold text-white mb-4">Terms of Service</h1>
        <p className="text-gray-400">ข้อตกลงและเงื่อนไขการใช้งานแพลตฟอร์ม GB Marketplace</p>
        <div className="w-20 h-1 bg-primary mx-auto mt-6 rounded-full" />
      </motion.div>

      <div className="space-y-10 text-gray-300 leading-relaxed">
        {/* Section 1 */}
        <section className="bg-surface/50 p-8 rounded-3xl border border-white/5">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
            <span className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center text-primary text-sm">1</span>
            การยอมรับข้อตกลง
          </h2>
          <p>
            การเข้าถึงหรือใช้งานเว็บไซต์ GB Marketplace หมายความว่าคุณตกลงที่จะปฏิบัติตามข้อกำหนดและเงื่อนไขเหล่านี้ หากคุณไม่เห็นด้วยกับข้อตกลงใดๆ โปรดระงับการใช้งานทันที ท่านต้องมีอายุไม่ต่ำกว่า 18 ปีหรือได้รับความยินยอมจากผู้ปกครองในการทำธุรกรรม
          </p>
        </section>

        {/* Section 2 */}
        <section className="bg-surface/50 p-8 rounded-3xl border border-white/5">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
            <span className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center text-primary text-sm">2</span>
            ระบบบัญชีและ Wallet
          </h2>
          <p className="mb-4">
            ผู้ใช้มีหน้าที่รักษาความปลอดภัยของรหัสผ่านและบัญชีของตนเอง แพลตฟอร์มจะไม่รับผิดชอบต่อความสูญเสียใดๆ ที่เกิดจากการเข้าถึงบัญชีโดยไม่ได้รับอนุญาตเนื่องจากความละเลยของผู้ใช้เอง
          </p>
          <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl flex gap-3 text-sm text-primary">
            <AlertCircle size={20} className="shrink-0" />
            <p>เงินใน GB Wallet ไม่สามารถแลกเปลี่ยนเป็นเงินสดคืนได้ ยกเว้นในกรณีที่เกิดข้อผิดพลาดจากระบบซึ่งทางแอดมินจะเป็นผู้พิจารณาเป็นรายกรณี</p>
          </div>
        </section>

        {/* Section 3 */}
        <section className="bg-surface/50 p-8 rounded-3xl border border-white/5">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
            <span className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center text-primary text-sm">3</span>
            การซื้อขายและสต็อกสินค้า
          </h2>
          <p>
            การสั่งซื้อสินค้าจะมีผลสมบูรณ์เมื่อแอดมินทำการ "ยืนยันการจัดส่ง" เท่านั้น ในกรณีที่สินค้าหมดสต็อกกะทันหันหรือระบบเกิดข้อผิดพลาด ทางเราขอสงวนสิทธิ์ในการยกเลิกออเดอร์และคืนเงินเข้า Wallet ของท่านเต็มจำนวน
          </p>
        </section>

        {/* Section 4 */}
        <section className="bg-surface/50 p-8 rounded-3xl border border-white/5">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
            <span className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center text-primary text-sm">4</span>
            พฤติกรรมที่ต้องห้าม
          </h2>
          <ul className="list-disc list-inside space-y-2 text-sm text-gray-400">
            <li>ห้ามใช้ระบบเพื่อการฟอกเงินหรือธุรกรรมที่ผิดกฎหมาย</li>
            <li>ห้ามพยายามเจาะระบบหรือรบกวนการทำงานของเซิร์ฟเวอร์</li>
            <li>ห้ามใช้ชื่อผู้ใช้ที่ไม่เหมาะสมหรือแอบอ้างเป็นผู้อื่น</li>
            <li>ห้ามทำการหลอกลวงหรือฉ้อโกงสมาชิกคนอื่นๆ</li>
          </ul>
        </section>

        <section className="text-center pt-10 border-t border-white/5">
          <p className="text-gray-500 text-xs italic">ปรับปรุงล่าสุดเมื่อ: 14 เมษายน 2569</p>
        </section>
      </div>
    </div>
  );
}
