import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Layers, BarChart } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const formatCurrency = (val) => {
  return new Intl.NumberFormat('th-TH', { 
    style: 'currency', 
    currency: 'THB',
    minimumFractionDigits: 0 
  }).format(val);
};

export default function HistorySummary({ invoices: propInvoices }) {
  const [activeTab, setActiveTab] = useState('daily');
  const [data, setData] = useState({ daily: [], monthly: [], yearly: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (propInvoices) {
      processInvoices(propInvoices);
      setLoading(false);
    } else {
      loadHistory();
    }
  }, [propInvoices]);

  const processInvoices = (invoices) => {
    // Filter paid invoices
    const filtered = (invoices || []).filter(inv => inv.status === 'paid');
    
    // Group by daily/monthly/yearly
    const dailyMap = {};
    const monthlyMap = {};
    const yearlyMap = {};

    filtered.forEach(inv => {
      const date = new Date(inv.created_at).toISOString().split('T')[0];
      const month = new Date(inv.created_at).toISOString().substring(0, 7);
      const year = new Date(inv.created_at).toISOString().substring(0, 4);
      const revenue = inv.total_price || 0;

      dailyMap[date] = { revenue: (dailyMap[date]?.revenue || 0) + revenue, count: (dailyMap[date]?.count || 0) + 1, date };
      monthlyMap[month] = { revenue: (monthlyMap[month]?.revenue || 0) + revenue, count: (monthlyMap[month]?.count || 0) + 1, month };
      yearlyMap[year] = { revenue: (yearlyMap[year]?.revenue || 0) + revenue, count: (yearlyMap[year]?.count || 0) + 1, year };
    });

    setData({
      daily: Object.values(dailyMap).sort((a,b) => b.date.localeCompare(a.date)),
      monthly: Object.values(monthlyMap).sort((a,b) => b.month.localeCompare(a.month)),
      yearly: Object.values(yearlyMap).sort((a,b) => b.year.localeCompare(a.year))
    });
  };

  const loadHistory = async () => {
    try {
      const { data: invoices, error } = await supabase
        .from('invoices')
        .select('created_at, total_price, status')
        .eq('status', 'paid');
      
      if (error) throw error;
      processInvoices(invoices);
    } catch (error) {
      console.error('History fetch failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'daily', label: 'รายวัน', icon: <Calendar size={14} /> },
    { id: 'monthly', label: 'รายเดือน', icon: <Layers size={14} /> },
    { id: 'yearly', label: 'รายปี', icon: <BarChart size={14} /> },
  ];

  const currentData = data[activeTab] || [];

  return (
    <div className="bg-surface border border-border rounded-3xl overflow-hidden mt-8">
      <div className="flex border-b border-border bg-black/20 p-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold uppercase tracking-widest rounded-xl transition-all ${
              activeTab === tab.id 
                ? 'bg-primary text-white shadow-glow-sm' 
                : 'text-gray-500 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <div className="p-6">
         {loading ? (
           <div className="py-10 text-center text-gray-500 italic animate-pulse">กำลังสรุปข้อมูลรายได้...</div>
         ) : (
           <table className="w-full text-left border-collapse">
             <thead>
               <tr className="text-gray-500 text-[10px] uppercase tracking-widest border-b border-white/5">
                 <th className="pb-4 font-bold">ช่วงเวลา</th>
                 <th className="pb-4 font-bold text-center">ออเดอร์</th>
                 <th className="pb-4 font-bold text-right">รายได้สุทธิ</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-white/5">
                {currentData.length > 0 ? (
                  currentData.map((row, idx) => (
                    <motion.tr 
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="group hover:bg-white/[0.02]"
                    >
                      <td className="py-4 font-medium text-white">
                        {row.date || row.month || row.year}
                      </td>
                      <td className="py-4 text-center">
                        <span className="bg-white/10 px-2 py-0.5 rounded text-xs font-bold text-gray-300">
                          {row.count}
                        </span>
                      </td>
                      <td className="py-4 text-right font-black text-primary">
                        {formatCurrency(row.revenue)}
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="py-10 text-center text-gray-500 italic">ไม่มีข้อมูลสำหรับช่วงเวลานี้</td>
                  </tr>
                )}
             </tbody>
           </table>
         )}
      </div>

      <div className="bg-black/20 p-4 border-t border-border flex justify-between items-center text-[10px] text-gray-500 italic uppercase">
         <span>⚠️ ข้อมูลสรุปเฉพาะรายการที่ชำระเงินสำเร็จ (Paid) เท่านั้น</span>
         <span className="text-primary font-bold">Invoices Source</span>
      </div>
    </div>
  );
}
