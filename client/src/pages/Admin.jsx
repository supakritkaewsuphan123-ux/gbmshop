import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import { PageLoader, TableRowSkeleton } from '../components/Spinner';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import api from '../lib/api';
import {
  Package, ShoppingCart, Wallet, BarChart2, Settings,
  PlusCircle, Trash2, Pencil, Eye, Check, X as XIcon, Upload,
} from 'lucide-react';
import { Line } from 'react-chartjs-2';
import FinancialOverview from '../components/Finance/FinancialOverview';
import 'chart.js/auto';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const TABS = [
  { id: 'listings', label: 'สินค้า', icon: <Package size={16} /> },
  { id: 'orders', label: 'ออเดอร์', icon: <ShoppingCart size={16} /> },
  { id: 'topups', label: 'เติมเงิน', icon: <Wallet size={16} /> },
  { id: 'finance', label: 'การเงิน', icon: <BarChart2 size={16} /> },
  { id: 'settings', label: 'ตั้งค่า', icon: <Settings size={16} /> },
];

export default function Admin() {
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [tab, setTab] = useState('listings');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [topups, setTopups] = useState([]);
  const [stats, setStats] = useState(null);
  const [salesData, setSalesData] = useState(null);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [slipModal, setSlipModal] = useState({ open: false, src: '' });
  const [addProductModal, setAddProductModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [productForm, setProductForm] = useState({ 
    name: '', 
    price: '', 
    condition_percent: '', 
    stock: 1, 
    description: '', 
    image: null, 
    additional_images: [], 
    videos: [] 
  });
  const [submitting, setSubmitting] = useState(false);
  const [qrFile, setQrFile] = useState(null);
  const [currentQr, setCurrentQr] = useState('');

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) { navigate('/'); return; }
    if (user?.role === 'admin') {
      Promise.all([loadProducts(), loadOrders(), loadTopups(), loadSettings()]).finally(() => setLoading(false));
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (tab === 'finance') loadFinance();
  }, [tab]);

  const loadProducts = () => api.get('/products').then(setProducts).catch(console.error);
  const loadOrders = () => api.get('/invoices/all').then(setOrders).catch(console.error);
  const loadTopups = () => api.get('/users/topups/all').then(setTopups).catch(console.error);
  const loadSettings = async () => {
    const cfg = await api.get('/settings').catch(() => ({}));
    setSettings(cfg);
    if (cfg.promptpay_qr) setCurrentQr(`/uploads/${cfg.promptpay_qr}`);
  };
  const loadFinance = async () => {
    const statsRes = await api.get('/dashboard').catch(() => null);
    const chartRes = await api.get('/dashboard/chart').catch(() => null);
    if (statsRes?.success) setStats(statsRes.data);
    if (chartRes?.success) setSalesData(chartRes.data);
  };

  const updateOrderStatus = async (id, action) => {
    try {
      await api.post(`/invoices/${id}/${action}`);
      showToast(action === 'approve' ? 'อนุมัติเรียบร้อย ✅' : 'ปฏิเสธเรียบร้อย', 'success');
      loadOrders();
    } catch (e) { showToast(e.message, 'error'); }
  };

  const updateTopupStatus = async (id, status) => {
    try {
      await api.put(`/users/topups/${id}/status`, { status });
      showToast(status === 'completed' ? 'อนุมัติเติมเงินแล้ว ✅' : 'ปฏิเสธแล้ว', 'success');
      loadTopups();
    } catch (e) { showToast(e.message, 'error'); }
  };

  const deleteProduct = async (id) => {
    if (!confirm('ยืนยันลบสินค้า?')) return;
    try { await api.delete(`/products/${id}`); showToast('ลบแล้ว', 'success'); loadProducts(); }
    catch (e) { showToast(e.message, 'error'); }
  };

  const openAddModal = () => {
    setProductForm({ 
      name: '', 
      price: '', 
      condition_percent: '', 
      stock: 1, 
      description: '', 
      image: null, 
      additional_images: [], 
      videos: [] 
    });
    setAddProductModal(true);
  };

  const openEditModal = (p) => {
    setEditProduct(p);
    setProductForm({ 
      name: p.name, 
      price: p.price, 
      condition_percent: p.condition_percent, 
      stock: p.stock, 
      description: p.description || '', 
      image: null, 
      additional_images: [], 
      videos: [] 
    });
    setAddProductModal(true);
  };

  const submitProduct = async () => {
    setSubmitting(true);
    const fd = new FormData();
    // Standard fields
    ['name', 'price', 'condition_percent', 'stock', 'description'].forEach(k => {
      if (productForm[k] !== undefined) fd.append(k, productForm[k]);
    });

    // Images (Main image at index 0)
    if (productForm.image) {
      fd.append('images', productForm.image);
    }
    if (productForm.additional_images?.length > 0) {
      Array.from(productForm.additional_images).forEach(f => fd.append('images', f));
    }

    // Videos
    if (productForm.videos?.length > 0) {
      Array.from(productForm.videos).forEach(f => fd.append('videos', f));
    }

    // Debug
    console.log('--- FormData Debug ---');
    for (let [key, value] of fd.entries()) {
      console.log(`${key}:`, value instanceof File ? `File(${value.name})` : value);
    }

    try {
      const token = localStorage.getItem('token');
      const url = editProduct ? `/api/products/${editProduct.id}` : '/api/products';
      const method = editProduct ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { Authorization: `Bearer ${token}` }, body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'บันทึกไม่สำเร็จ');
      showToast(editProduct ? 'แก้ไขสินค้าแล้ว ✅' : 'เพิ่มสินค้าแล้ว ✅', 'success');
      setAddProductModal(false);
      loadProducts();
    } catch (e) { showToast(e.message, 'error'); }
    finally { setSubmitting(false); }
  };

  const saveSettings = async () => {
    try {
      await api.post('/settings', {
        promptpay_number: settings.promptpay_number,
        wallet_number: settings.wallet_number,
        meetup_address: settings.meetup_address,
        meetup_contact: settings.meetup_contact,
      });
      showToast('บันทึกการตั้งค่าแล้ว ✅', 'success');
    } catch (e) { showToast(e.message, 'error'); }
  };

  const uploadQr = async () => {
    if (!qrFile) return;
    const fd = new FormData(); fd.append('qr_image', qrFile);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/settings/qr', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast('อัปโหลด QR สำเร็จ', 'success');
      setCurrentQr(data.qr_url || '');
      loadSettings();
    } catch (e) { showToast(e.message, 'error'); }
  };

  if (authLoading || loading) return <PageLoader />;

  const chartData = (salesData && Array.isArray(salesData)) ? {
    labels: salesData.map(d => d.date),
    datasets: [{
      label: 'รายได้รายวัน (฿)',
      data: salesData.map(d => d.revenue),
      borderColor: '#ff003c',
      backgroundColor: 'rgba(255,0,60,0.1)',
      borderWidth: 2,
      pointBackgroundColor: '#ff003c',
      tension: 0.4,
      fill: true,
    }],
  } : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { labels: { color: '#9ca3af', font: { family: 'Prompt' } } } },
    scales: { y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#6b7280' }, beginAtZero: true }, x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#6b7280' } } },
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-primary/20 to-surface border border-primary/20 rounded-2xl p-6 mb-8 flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-extrabold text-white">🛡️ ศูนย์ควบคุมแอดมิน</h1>
          <p className="text-gray-400 mt-1">จัดการระบบ GB MoneyShop</p>
        </div>
        {stats && (
          <div className="hidden md:flex gap-6 text-center">
            <div><p className="text-primary text-2xl font-extrabold">฿{(stats.revenue?.total || 0).toLocaleString()}</p><p className="text-gray-500 text-xs">รายได้รวม</p></div>
            <div><p className="text-white text-2xl font-extrabold">{stats.orders?.total || 0}</p><p className="text-gray-500 text-xs">ออเดอร์</p></div>
          </div>
        )}
      </motion.div>

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-surface border border-border rounded-2xl p-1.5 mb-6 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap ${tab === t.id ? 'bg-primary text-white shadow-glow-sm' : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {/* ===== LISTINGS ===== */}
        {tab === 'listings' && (
          <motion.div key="listings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold">สินค้าทั้งหมด ({products.length})</h2>
              <button onClick={openAddModal} className="btn-primary py-2 px-4 text-sm flex items-center gap-2">
                <PlusCircle size={16} /> เพิ่มสินค้า
              </button>
            </div>
            <div className="bg-surface border border-border rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-border">
                    <tr>{['#', 'ชื่อสินค้า', 'ผู้ขาย', 'ราคา', 'สต็อก', 'จัดการ'].map(h => <th key={h} className="text-left px-5 py-3 text-sm text-gray-500 font-medium">{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {products.map((p) => (
                      <tr key={p.id} className="border-b border-border last:border-0 hover:bg-white/2 transition-colors">
                        <td className="px-5 py-3 text-gray-500 text-sm">#{p.id}</td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <img src={p.image?.startsWith('http') ? p.image : `/uploads/${p.image}`} className="w-9 h-9 rounded-lg object-cover bg-white flex-shrink-0" alt="" />
                            <span className="text-white text-sm font-medium">{p.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-gray-400 text-sm">{p.seller_name}</td>
                        <td className="px-5 py-3 text-primary font-bold">฿{p.price.toLocaleString()}</td>
                        <td className="px-5 py-3 text-gray-400 text-sm">{p.stock}</td>
                        <td className="px-5 py-3">
                          <div className="flex gap-2">
                            <button onClick={() => openEditModal(p)} className="p-2 text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"><Pencil size={14} /></button>
                            <button onClick={() => deleteProduct(p.id)} className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {products.length === 0 && <tr><td colSpan={6} className="text-center py-10 text-gray-500">ยังไม่มีสินค้า</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* ===== ORDERS ===== */}
        {tab === 'orders' && (
          <motion.div key="orders" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <h2 className="text-xl font-bold mb-5">จัดการออเดอร์ ({orders.length})</h2>
            <div className="bg-surface border border-border rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-border">
                    <tr>{['#', 'สินค้า', 'ผู้ซื้อ', 'วิธี/ข้อมูล', 'สถานะ', 'จัดการ'].map(h => <th key={h} className="text-left px-5 py-3 text-sm text-gray-500 font-medium">{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.id} className="border-b border-border last:border-0 hover:bg-white/2 transition-colors align-top">
                        <td className="px-5 py-4 text-gray-500 text-sm">#{o.id}</td>
                        <td className="px-5 py-4">
                          <p className="text-white text-sm font-medium">{o.items?.map(i => i.name).join(', ')}</p>
                          <p className="text-primary text-sm font-bold">฿{o.total_price?.toLocaleString()}</p>
                        </td>
                        <td className="px-5 py-4 text-gray-300 text-sm">{o.buyer_name}</td>
                        <td className="px-5 py-4 text-sm">
                          {o.method === 'meetup' || o.meet_date ? (
                            <div className="text-gray-300 text-xs space-y-0.5 mt-1">
                              <p className="text-purple-400 font-semibold mb-1">🤝 นัดรับสินค้า</p>
                              {o.meet_date && <p><span className="text-gray-500">🗓️</span> {o.meet_date} {o.meet_time}</p>}
                              {o.meet_location && <p><span className="text-gray-500">📍</span> {o.meet_location}</p>}
                              {o.meet_note && <div className="text-[10px] text-gray-500 bg-white/5 p-1.5 rounded mt-1 whitespace-pre-wrap">{o.meet_note}</div>}
                            </div>
                          ) : o.method === 'cod' ? (
                            <div className="text-gray-300 text-xs space-y-0.5 mt-1">
                              <p className="text-pink-400 font-semibold mb-1">🚚 เก็บเงินปลายทาง (COD)</p>
                              {o.shipping_name && <p><span className="text-gray-400 font-medium">{o.shipping_name}</span> · {o.shipping_phone}</p>}
                              {o.shipping_address && <div className="text-[10px] text-gray-500 bg-white/5 p-1.5 rounded mt-1 whitespace-pre-wrap">🏠 {o.shipping_address}</div>}
                            </div>
                          ) : (
                            <div>
                              <p className="text-gray-400 uppercase text-xs">{o.method || 'QR'}</p>
                              {o.slip_image && (
                                <button onClick={() => setSlipModal({ open: true, src: `/uploads/${o.slip_image}` })}
                                  className="flex items-center gap-1 text-blue-400 text-xs mt-1 hover:underline">
                                  <Eye size={12} /> ดูสลิป
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-4"><StatusBadge status={o.status} /></td>
                        <td className="px-5 py-4">
                          {['waiting_approval', 'meeting_scheduled', 'pending_delivery'].includes(o.status) ? (
                            <div className="flex gap-2">
                              <button onClick={() => updateOrderStatus(o.id, 'approve')}
                                className="p-2 bg-green-500/20 text-green-400 hover:bg-green-500/40 rounded-lg transition-all" title="อนุมัติ">
                                <Check size={14} />
                              </button>
                              <button onClick={() => updateOrderStatus(o.id, 'reject')}
                                className="p-2 bg-red-500/20 text-red-400 hover:bg-red-500/40 rounded-lg transition-all" title="ปฏิเสธ">
                                <XIcon size={14} />
                              </button>
                            </div>
                          ) : o.status === 'paid' ? <span className="text-green-400 text-xs">✅ สำเร็จ</span>
                            : o.status === 'rejected' ? <span className="text-red-400 text-xs">❌ ปฏิเสธ</span>
                              : <span className="text-yellow-400 text-xs">⏳ รอ</span>}
                        </td>
                      </tr>
                    ))}
                    {orders.length === 0 && <tr><td colSpan={6} className="text-center py-10 text-gray-500">ยังไม่มีออเดอร์</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* ===== TOPUPS ===== */}
        {tab === 'topups' && (
          <motion.div key="topups" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <h2 className="text-xl font-bold mb-5">อนุมัติการเติมเงิน ({topups.length})</h2>
            <div className="bg-surface border border-border rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-border">
                    <tr>{['#', 'ผู้ใช้', 'ยอด', 'หลักฐาน', 'สถานะ', 'จัดการ'].map(h => <th key={h} className="text-left px-5 py-3 text-sm text-gray-500">{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {topups.map((t) => (
                      <tr key={t.id} className="border-b border-border last:border-0 hover:bg-white/2 transition-colors">
                        <td className="px-5 py-4 text-gray-500 text-sm">#{t.id}</td>
                        <td className="px-5 py-4 text-white text-sm">{t.username}</td>
                        <td className="px-5 py-4 text-primary font-bold">฿{t.amount.toLocaleString()}</td>
                        <td className="px-5 py-4">
                          {t.slip_image && (
                            <button onClick={() => setSlipModal({ open: true, src: `/uploads/${t.slip_image}` })}
                              className="flex items-center gap-1 text-blue-400 text-sm hover:underline">
                              <Eye size={14} /> ดูสลิป
                            </button>
                          )}
                        </td>
                        <td className="px-5 py-4"><StatusBadge status={t.status} /></td>
                        <td className="px-5 py-4">
                          {t.status === 'pending' ? (
                            <div className="flex gap-2">
                              <button onClick={() => updateTopupStatus(t.id, 'completed')}
                                className="p-2 bg-green-500/20 text-green-400 hover:bg-green-500/40 rounded-lg transition-all" title="อนุมัติ">
                                <Check size={14} />
                              </button>
                              <button onClick={() => updateTopupStatus(t.id, 'rejected')}
                                className="p-2 bg-red-500/20 text-red-400 hover:bg-red-500/40 rounded-lg transition-all" title="ปฏิเสธ">
                                <XIcon size={14} />
                              </button>
                            </div>
                          ) : t.status === 'completed' ? <span className="text-green-400 text-xs">✅</span>
                            : <span className="text-red-400 text-xs">❌</span>}
                        </td>
                      </tr>
                    ))}
                    {topups.length === 0 && <tr><td colSpan={6} className="text-center py-10 text-gray-500">ยังไม่มีคำขอ</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* ===== FINANCE ===== */}
        {tab === 'finance' && (
          <motion.div key="finance" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
             <FinancialOverview />
          </motion.div>
        )}

        {/* ===== SETTINGS ===== */}
        {tab === 'settings' && (
          <motion.div key="settings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <h2 className="text-xl font-bold mb-5">ตั้งค่าระบบ</h2>
            <div className="space-y-6">
              <div className="bg-surface border border-border rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-primary mb-4">ข้อมูลการชำระเงิน</h3>
                <div className="space-y-4">
                  <div><label className="label">หมายเลขพร้อมเพย์</label>
                    <input className="input-field" value={settings.promptpay_number || ''} onChange={e => setSettings(p => ({ ...p, promptpay_number: e.target.value }))} /></div>
                  <div><label className="label">TrueMoney Wallet</label>
                    <input className="input-field" value={settings.wallet_number || ''} onChange={e => setSettings(p => ({ ...p, wallet_number: e.target.value }))} /></div>
                  <div>
                    <label className="label">อัปโหลด QR Code (รถยนต์)</label>
                    {currentQr && <img src={currentQr} alt="QR" className="w-32 h-32 object-contain bg-white rounded-xl p-2 mb-3 border border-border" />}
                    <div className="flex gap-3">
                      <input type="file" accept="image/jpeg,image/png" onChange={e => setQrFile(e.target.files[0])} className="input-field text-sm" />
                      <button onClick={uploadQr} className="btn-outline py-2 px-4 text-sm whitespace-nowrap flex items-center gap-2">
                        <Upload size={14} /> อัปโหลด
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-surface border border-border rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-primary mb-4">ข้อมูลนัดรับสินค้า (Meetup)</h3>
                <div className="space-y-4">
                  <div><label className="label">สถานที่นัดรับ</label>
                    <textarea className="input-field resize-none" rows={2} value={settings.meetup_address || ''} onChange={e => setSettings(p => ({ ...p, meetup_address: e.target.value }))} /></div>
                  <div><label className="label">ช่องทางติดต่อ (Line / Facebook / เบอร์โทร)</label>
                    <input className="input-field" value={settings.meetup_contact || ''} onChange={e => setSettings(p => ({ ...p, meetup_contact: e.target.value }))} /></div>
                </div>
              </div>

              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={saveSettings} className="btn-primary py-3 px-8">
                💾 บันทึกการตั้งค่า
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Slip Modal */}
      <Modal isOpen={slipModal.open} onClose={() => setSlipModal({ open: false, src: '' })} title="หลักฐานการชำระเงิน">
        <img src={slipModal.src} alt="สลิป" className="w-full max-h-[60vh] object-contain rounded-xl bg-white p-2" />
      </Modal>

      {/* Add/Edit Product Modal */}
      <Modal isOpen={addProductModal} onClose={() => setAddProductModal(false)} title={editProduct ? `แก้ไขสินค้า #${editProduct.id}` : 'เพิ่มสินค้าใหม่'} maxWidth="max-w-lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">ชื่อสินค้า</label>
              <input className="input-field" value={productForm.name} onChange={e => setProductForm(p => ({ ...p, name: e.target.value }))} /></div>
            <div><label className="label">ราคา (฿)</label>
              <input type="number" className="input-field" value={productForm.price} onChange={e => setProductForm(p => ({ ...p, price: e.target.value }))} /></div>
            <div><label className="label">สภาพสินค้า (%)</label>
              <input type="number" min="1" max="100" className="input-field" value={productForm.condition_percent} onChange={e => setProductForm(p => ({ ...p, condition_percent: e.target.value }))} /></div>
            <div><label className="label">จำนวน (ชิ้น)</label>
              <input type="number" min="1" className="input-field" value={productForm.stock} onChange={e => setProductForm(p => ({ ...p, stock: e.target.value }))} /></div>
          </div>
          <div><label className="label">คำอธิบาย</label>
            <textarea rows={3} className="input-field resize-none" value={productForm.description} onChange={e => setProductForm(p => ({ ...p, description: e.target.value }))} /></div>
          <div><label className="label">รูปหน้าปก (Main Image) {editProduct && '(เว้นว่างถ้าไม่ต้องการเปลี่ยน)'}</label>
            <input type="file" accept="image/*" className="input-field text-sm" onChange={e => setProductForm(p => ({ ...p, image: e.target.files[0] || null }))} /></div>
          <div className="space-y-1">
            <div className="flex justify-between items-end">
              <label className="label">รูปภาพเพิ่มเติม (สูงสุด 10 รูป) <span className="text-gray-500 font-normal italic">(ไม่บังคับ)</span></label>
              {productForm.additional_images?.length > 0 && (
                <button type="button" onClick={() => setProductForm(p => ({ ...p, additional_images: [] }))} className="text-[10px] text-red-400 hover:text-red-300 mb-1 flex items-center gap-1">
                  <XIcon size={8} /> ล้างรูปที่เลือก
                </button>
              )}
            </div>
            <input type="file" accept="image/*" multiple className="input-field text-sm" onChange={e => setProductForm(p => ({ ...p, additional_images: e.target.files }))} />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-end">
              <label className="label">วิดีโอตัวอย่างสินค้า <span className="text-gray-500 font-normal italic">(ไม่บังคับ, สูงสุด 5 ไฟล์)</span></label>
              {productForm.videos?.length > 0 && (
                <button type="button" onClick={() => setProductForm(p => ({ ...p, videos: [] }))} className="text-[10px] text-red-400 hover:text-red-300 mb-1 flex items-center gap-1">
                  <XIcon size={8} /> ล้างวิดีโอที่เลือก
                </button>
              )}
            </div>
            <input type="file" accept="video/*" multiple className="input-field text-sm" onChange={e => setProductForm(p => ({ ...p, videos: e.target.files }))} />
          </div>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={submitProduct} disabled={submitting} className="btn-primary w-full py-3">
            {submitting ? 'กำลังบันทึก...' : (editProduct ? 'บันทึกการแก้ไข' : 'เพิ่มสินค้า')}
          </motion.button>
        </div>
      </Modal>
    </div>
  );
}
