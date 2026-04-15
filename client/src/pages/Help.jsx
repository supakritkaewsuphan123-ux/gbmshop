import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronDown, Rocket, Wallet, ShoppingBag, ShieldCheck, HelpCircle, MessageSquare } from 'lucide-react';
import { usePageMetadata } from '../hooks/usePageMetadata';

const FAQ = [
  {
    category: '🚀 เริ่มต้นใช้งาน',
    icon: <Rocket className="text-blue-400" />,
    items: [
      { q: 'สมัครสมาชิกยังไง?', a: 'คลิกที่ปุ่ม "สมัครสมาชิก" มุมขวาบน กรอกชื่อผู้ใช้ อีเมล และรหัสผ่าน จากนั้นล็อกอินเข้าใช้งานได้ทันทีครับ' },
      { q: 'ลืมรหัสผ่านทำยังไง?', a: 'ไปที่หน้า "เข้าสู่ระบบ" แล้วคลิกที่ "ลืมรหัสผ่าน?" ระบบจะให้คุณกรอกอีเมลเพื่อรับลิงก์รีเซ็ตรหัสผ่านครับ' },
    ]
  },
  {
    category: '💰 การเงิน & Wallet',
    icon: <Wallet className="text-primary" />,
    items: [
      { q: 'เติมเงินเข้า Wallet ยังไง?', a: 'ไปที่หน้า Dashboard -> GB Wallet กดปุ่ม "เติมเงิน" สแกน QR Code โอนเงินแล้วแนบสลิป แอดมินจะตรวจสอบและอนุมัติภายใน 5-15 นาทีครับ' },
      { q: 'ถอนเงินออกจาก Wallet ได้ไหม?', a: 'ปัจจุบันระบบ Wallet ใช้สำหรับการซื้อสินค้าภายในร้านเท่านั้น ไม่สามารถถอนเป็นเงินสดได้ครับ' },
    ]
  },
  {
    category: '🛒 การซื้อสินค้า',
    icon: <ShoppingBag className="text-green-400" />,
    items: [
      { q: 'ซื้อสินค้าแล้วจะได้รับของตอนไหน?', a: 'เมื่อแอดมินยืนยันรายการ (Completed) คุณจะได้รับแจ้งเลขพัสดุในหน้า "การสั่งซื้อของฉัน" ทันทีครับ' },
      { q: 'ทำไมออเดอร์ถึงถูกปฏิเสธ?', a: 'ส่วนใหญ่เกิดจากสินค้าหมดสต็อกกะทันหัน หรือสลิปการโอนเงินไม่ชัดเจน ซึ่งระบบจะคืนเงินเข้า Wallet ให้คุณโดยอัตโนมัติครับ' },
    ]
  },
  {
    category: '🛡️ ความปลอดภัย',
    icon: <ShieldCheck className="text-purple-400" />,
    items: [
      { q: 'ซื้อขายที่นี่ปลอดภัยไหม?', a: 'ปลอดภัยแน่นอนครับ! เราใช้ระบบ Row Level Security (RLS) และมีการเก็บ Audit Log ทุกขั้นตอน ข้อมูลการชำระเงินไม่ผ่านคนกลาง' },
      { q: 'จะติดต่อแอดมินได้ช่องทางไหน?', a: 'คุณสามารถติดต่อผ่าน Line Official @gbmoneyshop หรือ Facebook Page ได้ตลอด 24 ชม. ครับ' },
    ]
  }
];

export default function Help() {
  usePageMetadata('ศูนย์ช่วยเหลือ', 'คู่มือการใช้งานและคำถามที่พบบ่อยสำหรับ GB Marketplace');
  const [search, setSearch] = useState('');
  const [openItems, setOpenItems] = useState({});

  const toggleItem = (category, index) => {
    const key = `${category}-${index}`;
    setOpenItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const filteredFaq = FAQ.map(cat => ({
    ...cat,
    items: cat.items.filter(item => 
      item.q.toLowerCase().includes(search.toLowerCase()) || 
      item.a.toLowerCase().includes(search.toLowerCase())
    )
  })).filter(cat => cat.items.length > 0);

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto mb-6 shadow-glow-sm">
          <HelpCircle size={40} />
        </div>
        <h1 className="text-4xl font-extrabold text-white mb-4">ศูนย์ช่วยเหลือ</h1>
        <p className="text-gray-400">คู่มือการใช้งานและคำถามที่พบบ่อย (FAQ)</p>
      </motion.div>

      {/* Search Bar */}
      <div className="relative max-w-2xl mx-auto mb-16">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
        <input 
          type="text"
          placeholder="ค้นหาความช่วยเหลือ (เช่น วิธีเติมเงิน, ค่าส่ง...)"
          className="input-field pl-12 py-4"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="space-y-12">
        {filteredFaq.length > 0 ? filteredFaq.map((cat) => (
          <section key={cat.category} className="space-y-4">
            <h2 className="flex items-center gap-3 text-xl font-bold text-white mb-6">
              {cat.icon} {cat.category}
            </h2>
            <div className="space-y-3">
              {cat.items.map((item, idx) => {
                const isOpen = openItems[`${cat.category}-${idx}`];
                return (
                  <motion.div 
                    key={idx}
                    className="bg-surface border border-border rounded-2xl overflow-hidden hover:border-white/20 transition-all"
                  >
                    <button 
                      onClick={() => toggleItem(cat.category, idx)}
                      className="w-full flex items-center justify-between p-5 text-left"
                    >
                      <span className="font-medium text-gray-200">{item.q}</span>
                      <motion.div animate={{ rotate: isOpen ? 180 : 0 }}>
                        <ChevronDown size={18} className="text-gray-500" />
                      </motion.div>
                    </button>
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                        >
                          <div className="px-5 pb-5 pt-2 text-gray-400 text-sm leading-relaxed border-t border-white/5">
                            {item.a}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </section>
        )) : (
          <div className="text-center py-20 bg-surface border border-dashed border-border rounded-3xl">
            <p className="text-gray-500">ไม่พบหัวข้อที่คุณค้นหา</p>
            <button onClick={() => setSearch('')} className="text-primary font-bold mt-2 hover:underline">
              ล้างการค้นหา
            </button>
          </div>
        )}
      </div>

      {/* Call to Action */}
      <motion.div 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        className="mt-20 p-8 rounded-3xl bg-gradient-to-r from-primary/10 to-surface border border-primary/20 text-center"
      >
        <MessageSquare className="mx-auto text-primary mb-4" size={32} />
        <h3 className="text-xl font-bold text-white mb-2">ยังต้องการความช่วยเหลือ?</h3>
        <p className="text-gray-400 text-sm mb-6">หากคำความช่วยเหลือด้านบนยังไม่ครอบคลุม สามารถติดต่อแอดมินได้โดยตรงครับ</p>
        <a href="/contact" className="btn-primary px-8 py-3 inline-block">ติดต่อแอดมิน</a>
      </motion.div>
    </div>
  );
}
