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
    // Filter completed invoices
    const filtered = (invoices || []).filter(inv => inv.status === 'completed');
    
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
        .eq('status', 'completed');
      
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
    <div className="bg-white border border-slate-100 rounded-[40px] overflow-hidden mt-8 shadow-soft">
      <div className="flex border-b border-slate-50 bg-slate-50/50 p-3 gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-xs font-black uppercase tracking-widest rounded-2xl transition-all ${
              activeTab === tab.id 
                ? 'bg-primary text-white shadow-glow' 
                : 'text-slate-400 hover:text-slate-600 hover:bg-white'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <div className="p-10">
         {loading ? (
            <div className="py-20 text-center text-slate-300 font-bold animate-pulse">กำลังสรุปข้อมูลรายได้...</div>
         ) : (
           <table className="w-full text-left border-collapse">
             <thead>
               <tr className="text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-50">
                 <th className="pb-6 font-black">ช่วงเวลา</th>
                 <th className="pb-6 font-black text-center">จำนวนออเดอร์</th>
                 <th className="pb-6 font-black text-right">รายได้ (NET)</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-50">
                {currentData.length > 0 ? (
                  currentData.map((row, idx) => (
                    <motion.tr 
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="group hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="py-5 font-bold text-slate-800">
                        {row.date || row.month || row.year}
                      </td>
                      <td className="py-5 text-center">
                        <span className="bg-slate-100 px-3 py-1 rounded-lg text-xs font-black text-slate-500">
                          {row.count}
                        </span>
                      </td>
                      <td className="py-5 text-right font-black text-primary text-lg">
                        {formatCurrency(row.revenue)}
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="py-20 text-center text-slate-300 italic font-medium">ยังไม่มีข้อมูลสำหรับช่วงเวลานี้</td>
                  </tr>
                )}
             </tbody>
           </table>
         )}
      </div>

      <div className="bg-slate-50/50 p-5 px-10 border-t border-slate-50 flex justify-between items-center text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">
         <span>⚠️ สรุปยอดเฉพาะรายการที่แอดมินยืนยันผล (Completed)</span>
         <span className="text-primary">Source: Invoices Database</span>
      </div>
    </div>
  );
}
