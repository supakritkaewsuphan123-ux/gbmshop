import React from 'react';
import { motion } from 'framer-motion';

export default function StatCard({ label, value, icon, color, subValueToday, subValueMonth }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-surface border border-border p-5 rounded-2xl hover:border-primary/50 transition-all duration-300"
    >
      <div className="flex items-center gap-4 mb-4">
        <div className={`p-3 rounded-xl ${color} bg-opacity-10 text-xl`}>
          {icon}
        </div>
        <div>
          <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">{label}</h3>
          <p className="text-2xl font-black text-white">{value}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-4 border-t border-white/5">
        <div>
          <p className="text-gray-500 text-[10px] uppercase font-bold">วันนี้</p>
          <p className="text-sm font-bold text-white">{subValueToday}</p>
        </div>
        <div>
          <p className="text-gray-500 text-[10px] uppercase font-bold">เดือนนี้</p>
          <p className="text-sm font-bold text-white">{subValueMonth}</p>
        </div>
      </div>
    </motion.div>
  );
}
