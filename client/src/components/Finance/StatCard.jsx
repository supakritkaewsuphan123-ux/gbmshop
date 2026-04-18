import React from 'react';
import { motion } from 'framer-motion';

export default function StatCard({ label, value, icon, color, subValueToday, subValueMonth }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-slate-100 p-6 rounded-[32px] shadow-soft hover:shadow-glow-sm hover:border-primary/20 transition-all duration-500 group"
    >
      <div className="flex items-center gap-4 mb-6">
        <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center shadow-soft group-hover:scale-110 transition-transform duration-500`}>
          {icon}
        </div>
        <div>
          <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-widest leading-none mb-2">{label}</h3>
          <p className="text-2xl font-black text-slate-900 leading-none tracking-tight">{value}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-5 border-t border-slate-50">
        <div>
          <p className="text-slate-400 text-[9px] uppercase font-black tracking-widest mb-1">ความเคลื่อนไหววันนี้</p>
          <p className="text-sm font-black text-slate-700">{subValueToday}</p>
        </div>
        <div>
          <p className="text-slate-400 text-[9px] uppercase font-black tracking-widest mb-1">ยอดสะสมเดือนนี้</p>
          <p className="text-sm font-black text-slate-700">{subValueMonth}</p>
        </div>
      </div>
    </motion.div>
  );
}
