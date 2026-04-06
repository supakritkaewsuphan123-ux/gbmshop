import React from 'react';
import { motion } from 'framer-motion';
import FinancialOverview from '../components/Finance/FinancialOverview';

export default function FinancialDashboard() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-black italic tracking-tighter text-white uppercase mb-2">
          Financial <span className="text-primary italic">Dashboard</span>
        </h1>
        <p className="text-gray-500">ระบบติดตามรายได้และออเดอร์แบบเรียลไทม์ (SQLite Persistence)</p>
      </motion.div>

      <FinancialOverview />
    </div>
  );
}
