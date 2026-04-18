import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronDown, Rocket, CreditCard, ShoppingBag, ShieldCheck, HelpCircle, MessageSquare, Globe } from 'lucide-react';
import { usePageMetadata } from '../hooks/usePageMetadata';

const FAQ = [
  {
    category: '🚀 เริ่มต้นใช้งาน',
    icon: <Rocket size={20} />,
    items: [
      { q: 'สมัครสมาชิกยังไง?', a: 'คลิกที่ปุ่ม "สมัครสมาชิก" มุมขวาบน กรอกชื่อผู้ใช้ อีเมล และรหัสผ่าน จากนั้นล็อกอินเข้าใช้งานได้ทันทีครับ' },
      { q: 'ลืมรหัสผ่านทำยังไง?', a: 'ไปที่หน้า "เข้าสู่ระบบ" แล้วคลิกที่ "ลืมรหัสผ่าน?" ระบบจะให้คุณกรอกอีเมลเพื่อรับลิงก์รีเซ็ตรหัสผ่านครับ' },
    ]
  },
  {
    category: '💳 การชำระเงิน',
    icon: <CreditCard size={20} />,
    items: [
      { q: 'ชำระเงินผ่านช่องทางไหนได้บ้าง?', a: 'เรารองรับ 3 ช่องทางหลัก: 1. โอนผ่านธนาคาร/QR Code (PromptPay) 2. เก็บเงินปลายทาง (COD) และ 3. นัดรับสินค้าด้วยตัวเอง (Meetup) ครับ' },
      { q: 'ต้องส่งสลิปตอนไหน?', a: 'หลังจากสั่งซื้อแบบโอนเงินเรียบร้อย ให้ไปที่หน้า "การสั่งซื้อของฉัน" (My Orders) แล้วกดปุ่ม "ส่งสลิป" เพื่อแนบหลักฐานให้แอดมินตรวจสอบครับ' },
    ]
  },
  {
    category: '🛒 การซื้อสินค้า',
    icon: <ShoppingBag size={20} />,
    items: [
      { q: 'ซื้อสินค้าแล้วจะได้รับของตอนไหน?', a: 'เมื่อแอดมินตรวจสอบการชำระเงินหรือยืนยันออเดอร์แล้ว (Status: Completed) คุณจะได้รับแจ้งเลขพัสดุในหน้าออเดอร์ทันทีครับ' },
      { q: 'ถ้าสินค้าหมดจะทำยังไง?', a: 'หากสินค้าหมดสต็อกกะทันหัน แอดมินจะกดยกเลิกออเดอร์และติดต่อท่านเพื่อดำเนินการคืนเงินให้เต็มจำนวนผ่านช่องทางธนาคารครับ' },
    ]
  },
  {
    category: '🛡️ ความปลอดภัย',
    icon: <ShieldCheck size={20} />,
    items: [
      { q: 'ซื้อขายที่นี่ปลอดภัยไหม?', a: 'ปลอดภัยแน่นอนครับ! เราใช้ระบบ Row Level Security (RLS) และมีการเก็บ Audit Log ทุกขั้นตอน ข้อมูลการชำระเงินไม่ผ่านคนกลาง ตรวจสอบได้ทุกรายการ' },
      { q: 'จะติดต่อแอดมินได้ช่องทางไหน?', a: 'คุณสามารถติดต่อแอดมินได้โดยตรงผ่านเมนู "ติดต่อเรา" ในหน้า Dashboard หรือช่องทางที่ได้รับหลังจากสั่งซื้อครับ' },
    ]
  }
];

export default function Help() {
  usePageMetadata('ศูนย์ช่วยเหลือ', 'คู่มือการใช้งานและคำถามที่พบบ่อยสำหรับ GBshop Marketplace');
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
    <div className="bg-white min-h-screen">
      <div className="max-w-5xl mx-auto px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-24"
        >
          <div className="w-16 h-16 bg-slate-50 border border-slate-50 rounded-2xl flex items-center justify-center text-slate-900 mx-auto mb-8 shadow-sm">
            <HelpCircle size={32} />
          </div>
          <h1 className="text-6xl font-black text-slate-900 mb-4 tracking-tighter uppercase">Help Center</h1>
          <p className="text-xl text-slate-400 font-bold tracking-tight">คู่มือการใช้งานและคำถามที่พบบ่อย (FAQ)</p>
        </motion.div>

        {/* Search Bar */}
        <div className="relative max-w-2xl mx-auto mb-24 pr-2">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={24} />
          <input 
            type="text"
            placeholder="ค้นหาความช่วยเหลือที่คุณต้องการ..."
            className="input-field pl-16 py-6 text-xl shadow-soft border-slate-100 focus:border-slate-900"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="space-y-20">
          {filteredFaq.length > 0 ? filteredFaq.map((cat) => (
            <section key={cat.category} className="space-y-10">
              <h2 className="flex items-center gap-4 text-2xl font-black text-slate-900 tracking-tight">
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-900 border border-slate-100 shadow-sm">{cat.icon}</div>
                {cat.category}
              </h2>
              <div className="grid grid-cols-1 gap-4">
                {cat.items.map((item, idx) => {
                  const isOpen = openItems[`${cat.category}-${idx}`];
                  return (
                    <motion.div 
                      key={idx}
                      className="bg-white border border-slate-100 rounded-[32px] overflow-hidden shadow-soft transition-all hover:border-slate-200"
                    >
                      <button 
                        onClick={() => toggleItem(cat.category, idx)}
                        className="w-full flex items-center justify-between p-8 text-left"
                      >
                        <span className="text-lg font-black text-slate-900 tracking-tight">{item.q}</span>
                        <motion.div animate={{ rotate: isOpen ? 180 : 0 }}>
                          <ChevronDown size={20} className="text-slate-200" />
                        </motion.div>
                      </button>
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                          >
                            <div className="px-8 pb-8 pt-2 text-slate-500 font-bold text-lg leading-relaxed border-t border-slate-50 mt-2">
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
            <div className="text-center py-40 bg-white border-2 border-dashed border-slate-100 rounded-[56px]">
               <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-10 text-slate-200 shadow-inner">
                  <Search size={48} />
               </div>
               <p className="text-3xl font-black text-slate-900 mb-4 tracking-tight uppercase">No Results Found</p>
               <p className="text-slate-400 font-bold mb-10">ไม่พบหัวข้อที่คุณค้นหา ลองใช้คำอื่นดูครับ</p>
               <button onClick={() => setSearch('')} className="bg-slate-900 text-white font-black px-12 py-5 rounded-2xl shadow-soft transition-all">
                  ล้างการค้นหา
               </button>
            </div>
          )}
        </div>

        {/* Support Section */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-40 p-16 rounded-[56px] bg-slate-900 text-center shadow-glow"
        >
          <div className="w-20 h-20 bg-white/10 rounded-[32px] flex items-center justify-center text-white mx-auto mb-10 shadow-soft">
            <MessageSquare size={40} />
          </div>
          <h3 className="text-4xl font-black text-white mb-4 tracking-tight uppercase">Still Need Help?</h3>
          <p className="text-slate-400 font-bold text-lg mb-12 max-w-lg mx-auto">หากข้อมูลด้านบนยังไม่ครอบคลุม สามารถติดต่อแอดมินเจ้าหน้าที่เทคนิคได้โดยตรงตลอดเวลาทำการครับ</p>
          <a href="/dashboard?tab=contact" className="bg-white text-slate-900 font-black px-16 py-6 text-xl rounded-2xl shadow-soft hover:brightness-110 active:scale-95 transition-all inline-block uppercase tracking-widest">Connect with Support</a>
        </motion.div>
      </div>
    </div>
  );
}
