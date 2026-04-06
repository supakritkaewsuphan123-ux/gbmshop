import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Phone, Mail, MessageSquare, Globe, Clock } from 'lucide-react';
import api from '../lib/api';

export default function Contact() {
  const [adminInfo, setAdminInfo] = useState(null);

  useEffect(() => {
    api.get('/settings/public')
      .then(setAdminInfo)
      .catch(console.error);
  }, []);

  return (
    <div className="min-h-[85vh] py-20 px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl font-black text-white mb-4 tracking-tight">ติดต่อเรา</h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            ทีมงาน GB Money Shop พร้อมดูแลและให้บริการคุณเสมอ เราพร้อมช่วยเหลือคุณ 24 ชม.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8"
        >
          {/* โทร */}
          <a href={`tel:${adminInfo?.phone || ''}`}
            className="flex gap-4 items-center p-6 bg-surface border border-border rounded-2xl hover:border-primary/40 hover:bg-primary/5 transition-all group cursor-pointer">
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Phone size={26} className="text-primary" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold mb-1 tracking-widest">Call Center</p>
              <p className="text-white font-semibold text-lg group-hover:text-primary transition-colors">{adminInfo?.phone || '0818662451'}</p>
            </div>
          </a>

          {/* LINE — เปลี่ยน YOUR_LINE_ID */}
          <a href="" target="_blank" rel="noopener noreferrer"
            className="flex gap-4 items-center p-6 bg-surface border border-border rounded-2xl hover:border-green-500/40 hover:bg-green-500/5 transition-all group cursor-pointer">
            <div className="w-14 h-14 bg-green-500/10 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <MessageSquare size={26} className="text-green-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold mb-1 tracking-widest">LINE Official</p>
              <p className="text-white font-semibold text-lg group-hover:text-green-400 transition-colors">@gbmoneyshop</p>
            </div>
          </a>

          {/* Facebook — เปลี่ยน YOUR_PAGE_NAME */}
          <a href="https://facebook.com/YOUR_PAGE_NAME" target="_blank" rel="noopener noreferrer"
            className="flex gap-4 items-center p-6 bg-surface border border-border rounded-2xl hover:border-blue-500/40 hover:bg-blue-500/5 transition-all group cursor-pointer">
            <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Globe size={26} className="text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold mb-1 tracking-widest">Facebook</p>
              <p className="text-white font-semibold text-lg group-hover:text-blue-400 transition-colors">{adminInfo?.facebook || 'GB Money Shop'}</p>
            </div>
          </a>

          {/* Email — เปลี่ยน email จริง */}
          <a href="mailto:support@gbmoney.com"
            className="flex gap-4 items-center p-6 bg-surface border border-border rounded-2xl hover:border-purple-500/40 hover:bg-purple-500/5 transition-all group cursor-pointer">
            <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Mail size={26} className="text-purple-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold mb-1 tracking-widest">Email Support</p>
              <p className="text-white font-semibold text-lg group-hover:text-purple-400 transition-colors">support@gbmoney.com</p>
            </div>
          </a>
        </motion.div>

        {/* เวลาทำการ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="flex gap-4 items-center p-6 bg-surface border border-border rounded-2xl"
        >
          <div className="w-14 h-14 bg-orange-500/10 rounded-2xl flex items-center justify-center shrink-0">
            <Clock size={26} className="text-orange-500" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-bold mb-1 tracking-widest">เวลาทำการ</p>
            <p className="text-white font-semibold text-lg">ทุกวัน: 09:00 – 23:00 น.</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
