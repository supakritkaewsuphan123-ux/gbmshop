import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { motion } from 'framer-motion';
import { Line } from 'react-chartjs-2';
import { 
  BarChart3, TrendingUp, ShoppingBag, CheckCircle, 
  Clock, RefreshCcw, DollarSign 
} from 'lucide-react';
import StatCard from './StatCard';
import HistorySummary from './HistorySummary';
import { TableRowSkeleton } from '../Spinner';
import 'chart.js/auto';

const formatCurrency = (val) => {
  return new Intl.NumberFormat('th-TH', { 
    style: 'currency', 
    currency: 'THB',
    minimumFractionDigits: 0 
  }).format(val);
};

const formatNumber = (val) => (val || 0).toLocaleString();

export default function FinancialOverview() {
  const [stats, setStats] = useState({
    revenue: { total: 0, today: 0, month: 0 },
    orders: { total: 0, today: 0, month: 0 },
    success: { total: 0, today: 0, month: 0 },
    pending: 0
  });
  const [chartRawData, setChartRawData] = useState([]);
  const [rawInvoices, setRawInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const { data: invoices, error } = await supabase
        .from('invoices')
        .select('id, status, created_at, total_price');
      
      if (error) throw error;
      setRawInvoices(invoices || []);

      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const monthStr = now.toISOString().substring(0, 7);

      const computedStats = (invoices || []).reduce((acc, inv) => {
        const isCompleted = inv.status === 'completed';
        const isPending = inv.status === 'pending';
        const invDate = new Date(inv.created_at).toISOString().split('T')[0];
        const invMonth = new Date(inv.created_at).toISOString().substring(0, 7);
        const price = inv.total_price || 0; 

        if (isCompleted) {
          acc.revenue.total += price;
          acc.success.total += 1;
          if (invDate === todayStr) {
            acc.revenue.today += price;
            acc.success.today += 1;
          }
          if (invMonth === monthStr) {
            acc.revenue.month += price;
            acc.success.month += 1;
          }
        }
        
        acc.orders.total += 1;
        if (invDate === todayStr) acc.orders.today += 1;
        if (invMonth === monthStr) acc.orders.month += 1;
        if (isPending) acc.pending += 1;

        return acc;
      }, {
        revenue: { total: 0, today: 0, month: 0 },
        orders: { total: 0, today: 0, month: 0 },
        success: { total: 0, today: 0, month: 0 },
        pending: 0
      });

      setStats(computedStats);

      const chartMap = (invoices || []).filter(i => i.status === 'completed').reduce((acc, inv) => {
        const date = new Date(inv.created_at).toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + (inv.total_price || 0);
        return acc;
      }, {});
      
      const chartData = Object.keys(chartMap).sort().map(date => ({ date, revenue: chartMap[date] }));
      setChartRawData(chartData);

    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 60000); // 60 sec polling
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="p-8"><TableRowSkeleton rows={5} /></div>;

  const chartConfig = {
    labels: chartRawData.map(item => item.date),
    datasets: [{
      label: 'รายได้ (฿)',
      data: chartRawData.map(item => item.revenue),
      borderColor: '#3B82F6',
      backgroundColor: 'rgba(59, 130, 246, 0.05)',
      borderWidth: 3,
      pointBackgroundColor: '#3B82F6',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6,
      tension: 0.4,
      fill: true,
    }]
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <BarChart3 className="text-primary" /> สถิติยอดขายแบบเรียลไทม์
        </h2>
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-soft">
           {refreshing && <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }} className="text-primary"><RefreshCcw size={14} /></motion.span>}
           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Supabase Live Connection</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="รายได้ที่สำเร็จแล้ว" 
          value={formatCurrency(stats.revenue.total)} 
          subValueToday={formatCurrency(stats.revenue.today)}
          subValueMonth={formatCurrency(stats.revenue.month)}
          icon={<DollarSign size={24} />} 
          color="bg-primary text-white" 
        />
        <StatCard 
          label="ออเดอร์ทั้งหมด" 
          value={formatNumber(stats.orders.total)} 
          subValueToday={formatNumber(stats.orders.today)}
          subValueMonth={formatNumber(stats.orders.month)}
          icon={<ShoppingBag size={24} />} 
          color="bg-slate-900 text-white" 
        />
        <StatCard 
          label="สำเร็จสะสม (ออเดอร์)" 
          value={formatNumber(stats.success.total)} 
          subValueToday={formatNumber(stats.success.today)}
          subValueMonth={formatNumber(stats.success.month)}
          icon={<CheckCircle size={24} />} 
          color="bg-green-500 text-white" 
        />
        <StatCard 
          label="ออเดอร์รอตรวจสอบ" 
          value={formatNumber(stats.pending)} 
          subValueToday="--"
          subValueMonth="--"
          icon={<Clock size={24} />} 
          color="bg-orange-500 text-white" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-[40px] p-10 shadow-soft min-h-[450px]">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-slate-900 flex items-center gap-2"><TrendingUp size={20} className="text-primary" /> รายได้สะสมรายวัน</h3>
            <span className="text-[10px] font-black text-primary bg-primary/5 px-3 py-1 rounded-full border border-primary/10 tracking-[0.2em] uppercase">Visualized Data</span>
          </div>
          <div className="h-[320px]">
             {chartRawData.length > 0 ? (
               <Line 
                 data={chartConfig} 
                 options={{
                   responsive: true,
                   maintainAspectRatio: false,
                   plugins: { 
                     legend: { display: false },
                     tooltip: {
                       backgroundColor: '#1e293b',
                       padding: 12,
                       titleFont: { size: 12, weight: 'bold' },
                       bodyFont: { size: 14, weight: '900' },
                       displayColors: false,
                       cornerRadius: 12
                     }
                   },
                   scales: { 
                     y: { 
                       grid: { color: 'rgba(241, 245, 249, 1)', drawBorder: false }, 
                       ticks: { color: '#94a3b8', font: { weight: 'bold', size: 10 } } 
                     },
                     x: { 
                       grid: { display: false }, 
                       ticks: { color: '#94a3b8', font: { weight: 'bold', size: 10 } } 
                     } 
                   }
                 }} 
               />
             ) : (
               <div className="flex flex-col items-center justify-center h-full text-slate-300 italic">
                 <BarChart3 size={48} className="mb-4 opacity-20" />
                 <p className="font-bold">ยังไม่มีข้อมูลรายได้ที่สำเร็จในระบบ</p>
               </div>
             )}
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-[40px] p-10 shadow-soft flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-black text-slate-900 mb-8 tracking-tight">ประสิทธิภาพการขาย</h3>
            <div className="space-y-6">
               <div className="flex justify-between items-center bg-slate-50 p-5 rounded-3xl border border-slate-100">
                 <span className="text-sm font-bold text-slate-500">อัตราความสำเร็จ</span>
                 <span className="text-xl font-black text-green-500">
                   {stats.orders.total > 0 ? ((stats.success.total / stats.orders.total) * 100).toFixed(1) : 0}%
                 </span>
               </div>
               <div className="flex justify-between items-center p-5 rounded-3xl border border-slate-50">
                 <span className="text-sm font-bold text-slate-500">ยอดขายวันนี้</span>
                 <span className="text-xl font-black text-primary">{formatCurrency(stats.revenue.today)}</span>
               </div>
               <div className="flex justify-between items-center p-5 rounded-3xl border border-slate-50">
                 <span className="text-sm font-bold text-slate-500">ออเดอร์วันนี้</span>
                 <span className="text-xl font-black text-slate-900">{stats.orders.today} <span className="text-xs text-slate-400">รายการ</span></span>
               </div>
            </div>
          </div>
          <button className="btn-primary w-full py-5 mt-10 text-lg font-black flex items-center justify-center gap-2 shadow-glow">
            <BarChart3 size={20} /> ออกรายงานสรุปผล
          </button>
        </div>
      </div>

      <HistorySummary invoices={rawInvoices} />
    </div>
  );
}
