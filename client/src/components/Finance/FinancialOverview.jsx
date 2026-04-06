import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Line } from 'react-chartjs-2';
import api from '../../lib/api';
import 'chart.js/auto'; // Ensure Chart.js is auto-registered
import { 
  BarChart3, TrendingUp, ShoppingBag, CheckCircle, 
  Clock, RefreshCcw, DollarSign, ArrowUpRight 
} from 'lucide-react';
import StatCard from './StatCard';
import HistorySummary from './HistorySummary';
import { TableRowSkeleton } from '../Spinner';

const formatCurrency = (val) => {
  return new Intl.NumberFormat('th-TH', { 
    style: 'currency', 
    currency: 'THB',
    minimumFractionDigits: 0 
  }).format(val);
};

const formatNumber = (val) => (val || 0).toLocaleString();

export default function FinancialOverview() {
  const [stats, setStats] = useState(null);
  const [chartRawData, setChartRawData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const statsRes = await api.get('/dashboard');
      const chartRes = await api.get('/dashboard/chart');

      if (statsRes.success) setStats(statsRes.data);
      if (chartRes.success) setChartRawData(chartRes.data || []);
      
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 15000); // 15 sec auto-refresh
    return () => clearInterval(interval);
  }, []);

  if (loading) return <TableRowSkeleton rows={5} />;

  // Map data to Chart.js format
  const labels = chartRawData.map(item => item.date);
  const dataPoints = chartRawData.map(item => item.revenue);

  const chartConfig = {
    labels: labels,
    datasets: [{
      label: 'รายได้ (฿)',
      data: dataPoints,
      borderColor: '#ff003c',
      backgroundColor: 'rgba(255, 0, 60, 0.1)',
      borderWidth: 2,
      pointBackgroundColor: '#ff003c',
      tension: 0.4,
      fill: true,
    }]
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold italic tracking-tighter">📊 ผลประกอบการเรียลไทม์</h2>
        <div className="flex items-center gap-2 text-xs text-gray-500">
           {refreshing && <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}><RefreshCcw size={12} /></motion.span>}
           เชื่อมต่อฐานข้อมูล SQLite สำเร็จ
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard 
          label="รายได้รวมทั้งหมด" 
          value={formatCurrency(stats?.revenue?.total || 0)} 
          subValueToday={formatCurrency(stats?.revenue?.today || 0)}
          subValueMonth={formatCurrency(stats?.revenue?.month || 0)}
          icon={<DollarSign size={20} />} 
          color="bg-primary text-primary" 
        />
        <StatCard 
          label="ออเดอร์ทั้งหมด" 
          value={formatNumber(stats?.orders?.total || 0)} 
          subValueToday={formatNumber(stats?.orders?.today || 0)}
          subValueMonth={formatNumber(stats?.orders?.month || 0)}
          icon={<ShoppingBag size={20} />} 
          color="bg-blue-500 text-blue-500" 
        />
        <StatCard 
          label="สำเร็จสะสม" 
          value={formatNumber(stats?.success?.total || 0)} 
          subValueToday={formatNumber(stats?.success?.today || 0)}
          subValueMonth={formatNumber(stats?.success?.month || 0)}
          icon={<CheckCircle size={20} />} 
          color="bg-green-500 text-green-500" 
        />
        <StatCard 
          label="รายชื่อรอตรวจสอบ" 
          value={formatNumber(stats?.pending || 0)} 
          subValueToday="--"
          subValueMonth="--"
          icon={<Clock size={20} />} 
          color="bg-yellow-500 text-yellow-500" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-surface border border-border rounded-2xl p-6 h-[400px]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2"><TrendingUp size={18} className="text-primary" /> รายได้รายวัน</h3>
            <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">LIVE DATA</span>
          </div>
          <div className="h-[300px]">
             {chartRawData.length > 0 ? (
               <Line 
                 data={chartConfig} 
                 options={{
                   responsive: true,
                   maintainAspectRatio: false,
                   plugins: { legend: { display: false } },
                   scales: { 
                     y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#6b7280' } },
                     x: { grid: { display: false }, ticks: { color: '#6b7280' } } 
                   }
                 }} 
               />
             ) : (
               <div className="flex items-center justify-center h-full text-gray-500 italic text-sm">ยังไม่มีข้อมูลรายได้สะสม</div>
             )}
          </div>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-4">ประสิทธิภาพ</h3>
            <div className="space-y-4">
               <div className="flex justify-between items-center border-b border-border pb-3">
                 <span className="text-sm text-gray-400">อัตราความสำเร็จรวม</span>
                 <span className="text-sm font-bold text-green-400">
                   {stats?.orders?.total > 0 ? ((stats?.success?.total / stats?.orders?.total) * 100).toFixed(1) : 0}%
                 </span>
               </div>
               <div className="flex justify-between items-center border-b border-border pb-3">
                 <span className="text-sm text-gray-400">ยอดวันนี้</span>
                 <span className="text-sm font-bold text-primary">{formatCurrency(stats?.revenue?.today || 0)}</span>
               </div>
               <div className="flex justify-between items-center border-b border-border pb-3">
                 <span className="text-sm text-gray-400">ออเดอร์วันนี้</span>
                 <span className="text-sm font-bold text-blue-400">{stats?.orders?.today || 0} รายการ</span>
               </div>
            </div>
          </div>
          <button className="btn-primary w-full py-4 mt-6 text-sm font-bold flex items-center justify-center gap-2 rounded-xl">
            <BarChart3 size={18} /> ออกรายงานสรุปยอดขาย
          </button>
        </div>
      </div>

      <HistorySummary />
    </div>
  );
}
