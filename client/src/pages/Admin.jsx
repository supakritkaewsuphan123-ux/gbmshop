import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageLoader, TableRowSkeleton } from '../components/Spinner';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import { supabase } from '../lib/supabase';
import {
  Package, ShoppingCart, Wallet, BarChart2, Settings,
  PlusCircle, Trash2, Pencil, Eye, Check, X as XIcon, Upload, Users, Clock,
} from 'lucide-react';
import { getImageUrl } from '../lib/urlHelper';
import { Line } from 'react-chartjs-2';
import FinancialOverview from '../components/Finance/FinancialOverview';
import { validateImageFile, validateVideoFile, generateSafeFilename, sanitizeText, validatePrice, validateStock } from '../lib/security';
import 'chart.js/auto';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const TABS = [
  { id: 'listings', label: 'สินค้า', icon: <Package size={16} /> },
  { id: 'orders', label: 'ออเดอร์', icon: <ShoppingCart size={16} /> },
  { id: 'users', label: 'สมาชิก', icon: <Users size={16} /> },
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
  const [users, setUsers] = useState([]);
  const [topups, setTopups] = useState([]);
  const [userStats, setUserStats] = useState({ total: 0, admin: 0, banned: 0 });
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [stats, setStats] = useState(null);
  const [salesData, setSalesData] = useState(null);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [uploadStatus, setUploadStatus] = useState(''); // New: To show what's happening
  const [approveForm, setApproveForm] = useState({ carrier: 'Flash', tracking: '' }); // New: For tracking info
  const [slipModal, setSlipModal] = useState({ open: false, src: '' });
  const [addProductModal, setAddProductModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [productForm, setProductForm] = useState({ 
    name: '', 
    price: '', 
    condition_percent: '100', 
    stock: 1, 
    category: 'มือ1',
    description: '', 
    image: null
  });
  const [submitting, setSubmitting] = useState(false);
  const [qrFile, setQrFile] = useState(null);
  const [currentQr, setCurrentQr] = useState('');
  const [pendingDeleteQr, setPendingDeleteQr] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [rejectModal, setRejectModal] = useState({ open: false, id: null, type: 'invoice', reason: '' });
  const [approveModal, setApproveModal] = useState({ open: false, id: null, type: 'topup', data: null });
  const [processingIds, setProcessingIds] = useState(new Set());
  const scrollRef = useRef({});

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    
    const topupChannel = supabase
      .channel('admin-global-topups')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'topups' }, () => loadTopups())
      .subscribe();

    const invoiceChannel = supabase
      .channel('admin-global-invoices')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, () => loadOrders())
      .subscribe();

    return () => {
      supabase.removeChannel(topupChannel);
      supabase.removeChannel(invoiceChannel);
    };
  }, [user]);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) { 
      showToast('เฉพาะ Admin เท่านั้น!', 'error');
      navigate('/'); 
      return; 
    }
    
    const urlTab = searchParams.get('tab');
    if (urlTab && TABS.find(t => t.id === urlTab)) {
      setTab(urlTab);
    }
    loadTabData(urlTab || tab);
  }, [user, authLoading, searchParams, tab]);

  // Track which tabs have been loaded to prevent redundant fetches
  const [loadedTabs, setLoadedTabs] = useState(new Set());

  const loadTabData = async (currentTab) => {
    // If already loaded this session, skip fetching unless it's a forced refresh
    if (loadedTabs.has(currentTab)) return;

    setLoading(true);
    try {
      switch (currentTab) {
        case 'listings': await loadProducts(); break;
        case 'orders': await loadOrders(); break;
        case 'users': await loadUsers(); break;
        case 'topups': await loadTopups(); break;
        case 'settings': await loadSettings(); break;
        case 'finance': await loadFinance(); break;
      }
      setLoadedTabs(prev => new Set(prev).add(currentTab));
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    const { data: prodData, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (!error && prodData) {
      const userIds = [...new Set(prodData.map(p => p.user_id).filter(Boolean))];
      let profileMap = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase.from('profiles').select('id, username').in('id', userIds);
        if (profiles) profileMap = Object.fromEntries(profiles.map(p => [p.id, p]));
      }
      setProducts(prodData.map(p => ({ ...p, seller_name: profileMap[p.user_id]?.username || 'System' })));
    }
  };

  const loadUsers = async () => {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (data) {
      setUsers(data);
      setUserStats({
        total: data.length,
        admin: data.filter(u => u.role === 'admin').length,
        banned: data.filter(u => u.is_banned).length
      });
    }
  };

  const handleBanUser = async (id, currentBanned) => {
    if (!confirm(`ยืนยันการ${currentBanned ? 'ปลด' : ''}แบนผู้ใช้นี้?`)) return;
    setProcessingIds(prev => new Set(prev).add(id));
    try {
      const { data, error } = await supabase.rpc('process_user_ban', { p_user_id: id, p_banned: !currentBanned });
      if (error) throw error;
      showToast(`${currentBanned ? 'ปลดแบน' : 'แบน'}สำเร็จ! 🛡️`, 'success');
      loadUsers();
    } catch (e) { showToast(e.message, 'error'); }
    finally { setProcessingIds(prev => { const n = new Set(prev); n.delete(id); return n; }); }
  };

  const handleRoleChange = async (id, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    if (!confirm(`เปลี่ยนบทบาทผู้ใช้นี้เป็น ${newRole.toUpperCase()}?`)) return;
    setProcessingIds(prev => new Set(prev).add(id));
    try {
      const { data, error } = await supabase.rpc('update_user_role', { p_user_id: id, p_role: newRole });
      if (error) throw error;
      showToast(`เปลี่ยนเป็น ${newRole} สำเร็จ! 👤`, 'success');
      loadUsers();
    } catch (e) { showToast(e.message, 'error'); }
    finally { setProcessingIds(prev => { const n = new Set(prev); n.delete(id); return n; }); }
  };

  const loadOrders = async () => {
    const { data: invoices, error } = await supabase.from('invoices').select('*, profiles:user_id(username)').order('created_at', { ascending: false });
    if (!error && invoices) {
      const allItemIds = [...new Set(invoices.flatMap(o => o.items || []))];
      let productMap = {};
      if (allItemIds.length > 0) {
        const { data: productsData } = await supabase.from('products').select('id, name, price, image_url').in('id', allItemIds);
        if (productsData) productMap = Object.fromEntries(productsData.map(p => [p.id, p]));
      }
      setOrders(invoices.map(o => ({
        ...o,
        items: (o.items || []).map(id => productMap[id]).filter(Boolean),
        buyer_name: o.profiles?.username || 'Unknown'
      })));
    }
  };

  const loadTopups = async () => {
    const { data: topupData } = await supabase.from('topups').select('*, profiles:user_id(username)').order('created_at', { ascending: false });
    if (topupData) setTopups(topupData.map(t => ({ ...t, username: t.profiles?.username || 'Unknown' })));
  };

  const loadFinance = async () => {
    const { data } = await supabase.from('invoices').select('total_price, created_at, method').eq('status', 'completed');
    const totalRevenue = data?.reduce((sum, o) => sum + (o.total_price || 0), 0) || 0;
    setStats({ revenue: { total: totalRevenue }, orders: { total: data?.length || 0 } });
  };

  const exportToCSV = (data, filename) => {
    if (!data.length) return showToast('ไม่มีข้อมูลสำหรับการส่งออก', 'error');
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => {
        let val = row[header];
        if (typeof val === 'string') val = `"${val.replace(/"/g, '""')}"`;
        if (val === null || val === undefined) val = '';
        return val;
      }).join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const updateOrderStatus = async (id, action, reason = '') => {
    if (action === 'reject' && !reason.trim()) return showToast('กรุณาระบุเหตุผล', 'error');
    setProcessingIds(prev => new Set(prev).add(id));
    try {
      const { data, error } = await supabase.rpc('process_order_action', {
        p_invoice_id: id,
        p_action: action === 'approve' ? 'approve' : 'reject',
        p_reason: reason || null,
        p_tracking: action === 'approve' ? approveForm.tracking : null,
        p_carrier: action === 'approve' ? approveForm.carrier : null
      });

      if (error) throw error;
      if (data && !data.success) throw new Error(data.message);

      showToast(action === 'approve' ? 'อนุมัติและแจ้งเลขพัสดุแล้ว ✅' : 'ปฏิเสธและคืนเงินแล้ว ❌', 'success');
      setApproveModal({ open: false, id: null, type: 'invoice', data: null });
      setRejectModal({ open: false, id: null, type: 'invoice', reason: '' });
      setApproveForm({ carrier: 'Flash', tracking: '' });
      loadOrders();
    } catch (e) { showToast(e.message, 'error'); }
    finally { setProcessingIds(prev => { const n = new Set(prev); n.delete(id); return n; }); }
  };

  const setProcessingStatus = async (id) => {
    setProcessingIds(prev => new Set(prev).add(id));
    try {
      const { error } = await supabase.from('invoices').update({ status: 'processing' }).eq('id', id);
      if (error) throw error;
      showToast('เปลี่ยนสถานะเป็น กำลังเตรียมของ ⏳', 'success');
      loadOrders();
    } catch (e) { showToast(e.message, 'error'); }
    finally { setProcessingIds(prev => { const n = new Set(prev); n.delete(id); return n; }); }
  };

  const updateTopupStatus = async (id, status, reason = '') => {
    if (status === 'rejected' && !reason.trim()) return showToast('กรุณาระบุเหตุผล', 'error');
    setProcessingIds(prev => new Set(prev).add(id));
    try {
      const { data, error } = await supabase.rpc('process_topup_status', { p_topup_id: id, p_status: status, p_reason: reason || null });
      if (error) throw error;
      if (data?.success) {
        showToast(status === 'completed' ? 'อนุมัติแล้ว ✅' : 'ปฏิเสธแล้ว ❌', 'success');
        setApproveModal({ open: false, id: null, type: 'topup', data: null });
        setRejectModal({ open: false, id: null, type: 'topup', reason: '' });
        loadTopups(); loadUsers();
      }
    } catch (e) { showToast(e.message, 'error'); }
    finally { setProcessingIds(prev => { const n = new Set(prev); n.delete(id); return n; }); }
  };

  const deleteProduct = async (id) => {
    if (!confirm('ยืนยันลบ?')) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (!error) { showToast('ลบแล้ว', 'success'); loadProducts(); }
  };

  const openAddModal = () => { 
    setEditProduct(null); 
    setProductForm({ 
      name: '', price: '', condition_percent: '100', stock: 1, 
      category: 'มือ1', description: '', image: null, 
      additional_images: [], videos: [] 
    }); 
    setAddProductModal(true); 
  };
  const openEditModal = (p) => { 
    setEditProduct(p); 
    setProductForm({ 
      name: p.name, price: p.price, 
      condition_percent: p.condition_percent || '100', 
      stock: p.stock, category: p.category || 'มือ1', 
      description: p.description || '', image: null,
      additional_images: [], videos: [] 
    }); 
    setAddProductModal(true); 
  };

  const submitProduct = async () => {
    // ✅ Validate ก่อนส่ง
    if (!productForm.name?.trim()) return showToast('กรุณากรอกชื่อสินค้า', 'error');
    if (!validatePrice(productForm.price)) return showToast('ราคาต้องเป็นตัวเลขบวกที่ถูกต้อง', 'error');
    if (!validateStock(productForm.stock)) return showToast('จำนวนสต็อกไม่ถูกต้อง', 'error');

    // ✅ Validate ไฟล์ภาพหลัก
    if (productForm.image) {
      const check = validateImageFile(productForm.image, { maxSizeMB: 10 });
      if (!check.valid) return showToast(check.error, 'error');
    }

    // ✅ Validate รูปเพิ่มเติม
    if (productForm.additional_images?.length > 0) {
      for (const f of Array.from(productForm.additional_images)) {
        const check = validateImageFile(f, { maxSizeMB: 10 });
        if (!check.valid) return showToast(`รูปเพิ่มเติม: ${check.error}`, 'error');
      }
    }

    // ✅ Validate วิดีโอ
    if (productForm.videos?.length > 0) {
      for (const f of Array.from(productForm.videos)) {
        const check = validateVideoFile(f, { maxSizeMB: 50 });
        if (!check.valid) return showToast(`วิดีโอ: ${check.error}`, 'error');
      }
    }

    setSubmitting(true);
    setUploadStatus('กำลังเริ่มต้น...');
    try {
      // 1. จัดการรูปภาพหน้าปก
      let imageUrl = editProduct?.image_url || '';
      if (productForm.image) {
        setUploadStatus('กำลังอัปโหลดรูปภาพหลัก...');
        const file = productForm.image;
        const filePath = generateSafeFilename(file, 'products'); // ✅ UUID filename
        await supabase.storage.from('product-images').upload(filePath, file);
        const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(filePath);
        imageUrl = publicUrl;
      }

      // 2. จัดการรูปเพิ่มเติม
      let additionalImages = editProduct?.images ? (typeof editProduct.images === 'string' ? JSON.parse(editProduct.images) : editProduct.images) : [];
      if (productForm.additional_images?.length > 0) {
        setUploadStatus(`กำลังอัปโหลดรูปภาพเพิ่มเติม (${productForm.additional_images.length} ไฟล์)...`);
        const uploadPromises = Array.from(productForm.additional_images).map(async (file) => {
          const filePath = generateSafeFilename(file, 'products/extra'); // ✅ UUID
          await supabase.storage.from('product-images').upload(filePath, file);
          const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(filePath);
          return publicUrl;
        });
        const newImages = await Promise.all(uploadPromises);
        additionalImages = [...additionalImages, ...newImages];
      }

      // 3. จัดการวิดีโอ
      let videos = editProduct?.videos ? (typeof editProduct.videos === 'string' ? JSON.parse(editProduct.videos) : editProduct.videos) : [];
      if (productForm.videos?.length > 0) {
        setUploadStatus(`กำลังอัปโหลดวิดีโอ (${productForm.videos.length} ไฟล์)... โปรดรอครู่เดียว`);
        const videoPromises = Array.from(productForm.videos).map(async (file) => {
          const filePath = generateSafeFilename(file, 'products/video'); // ✅ UUID
          await supabase.storage.from('product-images').upload(filePath, file);
          const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(filePath);
          return publicUrl;
        });
        const newVideos = await Promise.all(videoPromises);
        videos = [...videos, ...newVideos];
      }

      setUploadStatus('กำลังบันทึกลงฐานข้อมูล...');
      const pData = { 
        name: productForm.name, 
        price: parseFloat(productForm.price), 
        condition_percent: parseInt(productForm.condition_percent), 
        stock: parseInt(productForm.stock), 
        category: productForm.category, 
        description: productForm.description, 
        image_url: imageUrl, 
        images: JSON.stringify(additionalImages),
        videos: JSON.stringify(videos)
      };

      const { error } = editProduct 
        ? await supabase.from('products').update(pData).eq('id', editProduct.id) 
        : await supabase.from('products').insert([pData]);

      if (error) throw error;

      showToast('บันทึกข้อมูลสินค้าเรียบร้อย ✅', 'success');
      setAddProductModal(false);
      loadProducts();
    } catch (e) {
      showToast(e.message, 'error');
    } finally { 
      setSubmitting(false); 
      setUploadStatus('');
    }
  };

  const loadSettings = async () => {
    const { data } = await supabase.from('settings').select('*').single();
    if (data) { setSettings(data); if (data.promptpay_qr) setCurrentQr(data.promptpay_qr); }
  };

  const saveSettings = async () => {
    const { error } = await supabase.from('settings').upsert({ id: 1, ...settings });
    if (!error) showToast('บันทึกแล้ว ✅', 'success');
  };

  const uploadQr = async () => {
    if (!qrFile) return;
    const filePath = `qr-${Math.random()}.${qrFile.name.split('.').pop()}`;
    await supabase.storage.from('product-images').upload(filePath, qrFile);
    const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(filePath);
    setSettings(p => ({ ...p, promptpay_qr: publicUrl }));
    setCurrentQr(publicUrl);
    showToast('อัปโหลดแล้ว', 'success');
  };

  const deleteQr = () => { setSettings(p => ({ ...p, promptpay_qr: '' })); setCurrentQr(''); showToast('ล้างค่าแล้ว', 'info'); };

  if (authLoading || loading) return <PageLoader />;

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-r from-primary/20 to-surface border border-primary/20 rounded-2xl p-6 mb-8 flex items-center justify-between">
        <div><h1 className="text-3xl font-extrabold text-white">🛡️ Admin Dashboard</h1><p className="text-gray-400 mt-1">Management System</p></div>
        {stats && <div className="hidden md:flex gap-6 text-center">
          <div><p className="text-primary text-2xl font-extrabold">฿{(stats.revenue?.total || 0).toLocaleString()}</p><p className="text-gray-500 text-xs">รายได้รวม</p></div>
          <div><p className="text-white text-2xl font-extrabold">{stats.orders?.total || 0}</p><p className="text-gray-500 text-xs">ออเดอร์</p></div>
        </div>}
      </motion.div>

      {/* Nav */}
      <div className="flex gap-1 bg-surface border border-border rounded-2xl p-1.5 mb-6 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === t.id ? 'bg-primary text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>{t.icon} {t.label}</button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === 'listings' && (
          <motion.div key="listings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="flex justify-between items-center mb-5"><h2 className="text-xl font-bold">สินค้า ({products.length})</h2><button onClick={openAddModal} className="btn-primary py-2 px-4 text-sm flex items-center gap-2"><PlusCircle size={16} /> เพิ่มสินค้า</button></div>
            <div className="bg-surface border border-border rounded-2xl overflow-hidden"><div className="overflow-x-auto"><table className="w-full">
              <thead className="border-b border-border"><tr>{['#', 'ชื่อสินค้า', 'ผู้ขาย', 'ราคา', 'สต็อก', 'จัดการ'].map(h => <th key={h} className="text-left px-5 py-3 text-sm text-gray-500">{h}</th>)}</tr></thead>
              <tbody>{products.map(p => (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-white/5 whitespace-nowrap">
                  <td className="px-5 py-3 text-sm text-gray-500">#{p.id}</td>
                  <td className="px-5 py-3 text-sm font-medium"><div className="flex items-center gap-2"><img src={getImageUrl(p.image_url, 'product-images')} className="w-8 h-8 rounded object-cover" />{p.name}</div></td>
                  <td className="px-5 py-3 text-sm text-gray-400">{p.seller_name}</td>
                  <td className="px-5 py-3 text-primary font-bold">฿{p.price?.toLocaleString()}</td>
                  <td className="px-5 py-3 text-sm text-gray-400">{p.stock}</td>
                  <td className="px-5 py-3"><div className="flex gap-2"><button onClick={() => openEditModal(p)} className="p-1.5 hover:bg-blue-500/10 text-blue-400 rounded"><Pencil size={14} /></button><button onClick={() => deleteProduct(p.id)} className="p-1.5 hover:bg-red-500/10 text-red-400 rounded"><Trash2 size={14} /></button></div></td>
                </tr>
              ))}</tbody>
            </table></div></div>
          </motion.div>
        )}

        {tab === 'orders' && (
          <motion.div key="orders" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold">ออเดอร์ ({orders.length})</h2>
              <button 
                onClick={() => exportToCSV(orders.map(o => ({ 
                  ID: o.id, 
                  Buyer: o.buyer_name, 
                  Total: o.total_price, 
                  Method: o.method, 
                  Status: o.status, 
                  Date: o.created_at 
                })), 'orders_report')}
                className="bg-white/5 border border-white/10 text-gray-400 px-4 py-2 rounded-xl text-xs font-bold hover:bg-white/10 hover:text-white transition-all flex items-center gap-2"
              >
                📥 โหลดรายงาน (CSV)
              </button>
            </div>
            <div className="bg-surface border border-border rounded-2xl overflow-hidden"><div className="overflow-x-auto"><table className="w-full">
              <thead className="border-b border-border"><tr>{['#', 'สินค้า', 'ผู้ซื้อ', 'วิธี', 'สถานะ', 'จัดการ'].map(h => <th key={h} className="text-left px-5 py-3 text-sm text-gray-500">{h}</th>)}</tr></thead>
              <tbody>{orders.map(o => (
                <tr key={o.id} className="border-b border-border last:border-0 hover:bg-white/5 align-top">
                  <td className="px-5 py-4 text-sm text-gray-500">#{o.id}</td>
                  <td className="px-5 py-4 text-sm"><p className="font-medium text-white">{o.items?.map(i => i.name).join(', ')}</p><p className="text-primary font-bold">฿{o.total_price?.toLocaleString()}</p></td>
                  <td className="px-5 py-4 text-sm font-medium">{o.buyer_name}</td>
                  <td className="px-5 py-4">
                    {/* ข้อมูลการจัดส่ง / นัดรับ */}
                    <div className="text-xs space-y-1.5 min-w-[180px]">
                      {o.method === 'meetup' ? (
                        <div className="bg-purple-500/10 border border-purple-500/20 p-2 rounded-lg">
                          <p className="text-purple-400 font-bold mb-1 flex items-center gap-1">🤝 นัดรับสินค้า</p>
                          <div className="text-gray-300 space-y-0.5">
                            <p className="flex gap-1"><span className="text-gray-500">📍</span> {o.meet_location || 'ไม่ระบุสถานที่'}</p>
                            {(o.meet_date || o.meet_time) && (
                              <p className="flex gap-1"><span className="text-gray-500">⏰</span> {o.meet_date} {o.meet_time}</p>
                            )}
                            {o.meet_note && (
                              <div className="mt-1 pt-1 border-t border-purple-500/10 text-[10px] text-gray-400 italic">
                                "{o.meet_note}"
                              </div>
                            )}
                          </div>
                        </div>
                      ) : o.method === 'cod' ? (
                        <div className="bg-pink-500/10 border border-pink-500/20 p-2 rounded-lg">
                          <p className="text-pink-400 font-bold mb-1 flex items-center gap-1">🚚 เก็บเงินปลายทาง (COD)</p>
                          <div className="text-gray-300 space-y-0.5">
                            <p className="font-semibold text-white">{o.shipping_name || 'ไม่ระบุชื่อ'}</p>
                            <p className="flex gap-1"><span className="text-gray-500">📞</span> {o.shipping_phone || '-'}</p>
                            <p className="mt-1 bg-black/20 p-1.5 rounded text-[10px] leading-relaxed text-gray-400 border border-white/5">
                              🏠 {o.shipping_address || 'ไม่ระบุที่อยู่'}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-blue-500/10 border border-blue-500/20 p-2 rounded-lg">
                          <p className="text-blue-400 font-bold mb-1 flex items-center gap-1">💳 โอนเงิน / QR Code</p>
                          {o.slip_url && (
                            <button onClick={() => setSlipModal({ open: true, src: getImageUrl(o.slip_url, 'payment_slips') })} 
                              className="mt-1 flex items-center gap-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 py-1 px-2 rounded-md transition-all border border-blue-500/30">
                              <Eye size={12} /> ตรวจสอบสลิป
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4"><StatusBadge status={o.status} /></td>
                  <td className="px-5 py-4">
                    {!['completed', 'rejected'].includes(o.status) ? (
                      <div className="flex flex-col gap-1.5 min-w-[120px]">
                        {/* ปุ่มเตรียมของ (แสดงเฉพาะสถานะที่ยังไม่ processing) */}
                        {o.status !== 'processing' && (
                          <button
                            onClick={() => setProcessingStatus(o.id)}
                            disabled={processingIds.has(o.id)}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-yellow-500/20 text-yellow-400 rounded-lg hover:bg-yellow-500/40 text-xs font-bold border border-yellow-500/20 transition-all"
                          >
                            <Clock size={12} /> เตรียมของ
                          </button>
                        )}
                        {/* ปุ่มอนุมัติ */}
                        <button
                          onClick={() => setApproveModal({ open: true, id: o.id, type: 'invoice', data: o })}
                          disabled={processingIds.has(o.id)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/40 text-xs font-bold border border-green-500/20 transition-all"
                        >
                          <Check size={12} /> อนุมัติ
                        </button>
                        {/* ปุ่มปฏิเสธ */}
                        <button
                          onClick={() => setRejectModal({ open: true, id: o.id, type: 'invoice', reason: '', data: o })}
                          disabled={processingIds.has(o.id)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/40 text-xs font-bold border border-red-500/20 transition-all"
                        >
                          <XIcon size={12} /> ปฏิเสธ
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-500 text-xs">เสร็จสิ้น</span>
                    )}
                  </td>
                </tr>
              ))}</tbody>
            </table></div></div>
          </motion.div>
        )}

        {tab === 'users' && (
          <motion.div key="users" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold">จัดการสมาชิก ({users.length})</h2>
                <div className="flex gap-4 mt-1">
                  <span className="text-xs text-gray-500">ทั้งหมด: <span className="text-white">{userStats.total}</span></span>
                  <span className="text-xs text-gray-500">แอดมิน: <span className="text-red-400">{userStats.admin}</span></span>
                  <span className="text-xs text-gray-500">โดนแบน: <span className="text-orange-400">{userStats.banned}</span></span>
                </div>
              </div>
              
              <div className="flex gap-2 w-full md:w-auto">
                <input 
                  type="text" 
                  placeholder="ค้นหาชื่อผู้ใช้..." 
                  className="bg-surface border border-border rounded-xl px-4 py-2 text-sm outline-none focus:border-primary/50 w-full"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
                <select 
                  className="bg-surface border border-border rounded-xl px-3 py-2 text-sm outline-none cursor-pointer"
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                >
                  <option value="all">ทั้งหมด</option>
                  <option value="admin">Admin</option>
                  <option value="user">User</option>
                  <option value="banned">โดนแบน</option>
                </select>
              </div>
            </div>

            <div className="bg-surface border border-border rounded-2xl overflow-hidden"><div className="overflow-x-auto"><table className="w-full">
              <thead className="border-b border-border"><tr>{['ชื่อผู้ใช้', 'บทบาท', 'ยอดเงิน', 'สถานะ', 'จัดการ'].map(h => <th key={h} className="text-left px-5 py-3 text-sm text-gray-500">{h}</th>)}</tr></thead>
              <tbody>{users
                .filter(u => {
                  const matchesSearch = u.username?.toLowerCase().includes(userSearch.toLowerCase());
                  const matchesRole = userRoleFilter === 'all' 
                    || (userRoleFilter === 'admin' && u.role === 'admin')
                    || (userRoleFilter === 'user' && u.role === 'user')
                    || (userRoleFilter === 'banned' && u.is_banned);
                  return matchesSearch && matchesRole;
                })
                .map(u => (
                <tr key={u.id} className={`border-b border-border last:border-0 hover:bg-white/5 ${u.is_banned ? 'opacity-60 grayscale' : ''}`}>
                  <td className="px-5 py-4 text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary border border-primary/20">
                        {u.username?.slice(0, 2).toUpperCase()}
                      </div>
                      {u.username}
                      {u.is_banned && <span className="text-[10px] bg-red-500/20 text-red-500 px-1.5 py-0.5 rounded">Banned</span>}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <button 
                      onClick={() => handleRoleChange(u.id, u.role)}
                      disabled={processingIds.has(u.id) || u.id === user.id}
                      className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold transition-all ${
                        u.role === 'admin' ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                      }`}
                    >
                      {u.role}
                    </button>
                  </td>
                  <td className="px-5 py-4 text-primary font-bold">฿{(u.balance || 0).toLocaleString()}</td>
                  <td className="px-5 py-4 text-xs text-gray-500">{new Date(u.created_at).toLocaleDateString('th-TH')}</td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleBanUser(u.id, u.is_banned)}
                        disabled={processingIds.has(u.id) || u.id === user.id}
                        className={`p-1.5 rounded transition-all ${
                          u.is_banned ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30'
                        }`}
                        title={u.is_banned ? 'Unban' : 'Ban'}
                      >
                        {u.is_banned ? <Check size={14} /> : <XIcon size={14} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}</tbody>
            </table></div></div>
          </motion.div>
        )}

        {tab === 'topups' && (
          <motion.div key="topups" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <h2 className="text-xl font-bold mb-5">เติมเงิน ({topups.length})</h2>
            <div className="bg-surface border border-border rounded-2xl overflow-hidden"><div className="overflow-x-auto"><table className="w-full">
              <thead className="border-b border-border"><tr>{['#', 'ผู้ใช้', 'ยอด', 'หลักฐาน', 'สถานะ', 'จัดการ'].map(h => <th key={h} className="text-left px-5 py-3 text-sm text-gray-500">{h}</th>)}</tr></thead>
              <tbody>{topups.map(t => (
                <tr key={t.id} className="border-b border-border last:border-0 hover:bg-white/5">
                  <td className="px-5 py-4 text-sm text-gray-500">#{t.id}</td>
                  <td className="px-5 py-4 text-sm font-medium">{t.username}</td>
                  <td className="px-5 py-4 text-primary font-bold">฿{t.amount.toLocaleString()}</td>
                  <td className="px-5 py-4">{t.slip_image && <button onClick={() => setSlipModal({ open: true, src: getImageUrl(t.slip_image, 'payment-slips') })} className="text-blue-400 text-xs hover:underline">ดูสลิป</button>}</td>
                  <td className="px-5 py-4"><StatusBadge status={t.status} /></td>
                  <td className="px-5 py-4">{t.status === 'pending' ? (
                    <div className="flex gap-2">
                      <button onClick={() => setApproveModal({ open: true, id: t.id, type: 'topup', data: t })} className="p-1.5 bg-green-500/20 text-green-400 rounded hover:bg-green-500/40"><Check size={14} /></button>
                      <button onClick={() => setRejectModal({ open: true, id: t.id, type: 'topup', reason: '' })} className="p-1.5 bg-red-500/20 text-red-400 rounded hover:bg-red-500/40"><XIcon size={14} /></button>
                    </div>
                  ) : <span className="text-gray-500 text-xs">เสร็จสิ้น</span>}</td>
                </tr>
              ))}</tbody>
            </table></div></div>
          </motion.div>
        )}

        {tab === 'finance' && (
          <motion.div key="finance" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex justify-end mb-4">
              <button 
                onClick={async () => {
                  const { data } = await supabase.from('invoices').select('id, total_price, method, status, created_at').eq('status', 'completed');
                  exportToCSV(data, 'finance_report');
                }}
                className="btn-outline px-4 py-2 text-xs flex items-center gap-2"
              >
                📊 โหลดสถิติการเงิน (CSV)
              </button>
            </div>
            <FinancialOverview />
          </motion.div>
        )}
        {tab === 'settings' && (
          <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="bg-surface border border-border rounded-2xl p-6">
              <h3 className="text-lg font-bold text-primary mb-4">Payment Methods</h3>
              <div className="space-y-4">
                <div><label className="label">พร้อมเพย์</label><input className="input-field" value={settings.promptpay_number || ''} onChange={e => setSettings(p => ({ ...p, promptpay_number: e.target.value }))} /></div>
                <div><label className="label">QR Scan</label>{currentQr && <img src={getImageUrl(currentQr, 'system')} className="w-32 h-32 mb-2 rounded border" />}<div className="flex gap-2"><input type="file" className="input-field text-sm" onChange={e => setQrFile(e.target.files[0])} /><button onClick={uploadQr} className="btn-outline px-4">Upload</button><button onClick={deleteQr} className="text-red-400 p-2"><Trash2 size={16} /></button></div></div>
              </div>
            </div>
            <button onClick={saveSettings} className="btn-primary py-3 px-8">💾 Save Settings</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <Modal isOpen={slipModal.open} onClose={() => setSlipModal({ open: false, src: '' })} title="Slip Verification"><img src={slipModal.src} className="w-full rounded-xl" /></Modal>
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
            <div>
              <label className="label">หมวดหมู่</label>
              <select className="input-field" value={productForm.category} onChange={e => setProductForm(p => ({ ...p, category: e.target.value }))}>
                <option value="มือ1">มือ1 (ใหม่)</option>
                <option value="มือสอง">มือสอง</option>
              </select>
            </div>
          </div>
          <div><label className="label">คำอธิบาย</label>
            <textarea rows={3} className="input-field resize-none" value={productForm.description} onChange={e => setProductForm(p => ({ ...p, description: e.target.value }))} /></div>
          
          <div><label className="label">รูปหน้าปก (หลัก) {editProduct && '(เว้นว่างถ้าไม่ต้องการเปลี่ยน)'}</label>
            <input type="file" accept="image/*" className="input-field text-sm" onChange={e => setProductForm(p => ({ ...p, image: e.target.files[0] || null }))} /></div>

          <div className="space-y-1">
            <label className="label">รูปภาพเพิ่มเติม <span className="text-gray-500 font-normal italic">(ไม่บังคับ)</span></label>
            <input type="file" accept="image/*" multiple className="input-field text-sm" onChange={e => setProductForm(p => ({ ...p, additional_images: e.target.files }))} />
          </div>

          <div className="space-y-1">
            <label className="label">วิดีโอตัวอย่างสินค้า <span className="text-gray-500 font-normal italic">(ไม่บังคับ)</span></label>
            <input type="file" accept="video/*" multiple className="input-field text-sm" onChange={e => setProductForm(p => ({ ...p, videos: e.target.files }))} />
          </div>

          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={submitProduct} disabled={submitting} className="btn-primary w-full py-4 text-lg font-bold shadow-glow-sm">
            {submitting ? uploadStatus || '⏳ กำลังบันทึกข้อมูล...' : (editProduct ? '💾 บันทึกการแก้ไข' : '➕ เพิ่มสินค้าเข้าสู่ระบบ')}
          </motion.button>
        </div>
      </Modal>
      <Modal isOpen={approveModal.open} onClose={() => setApproveModal({ open: false, id: null })} title={approveModal.type === 'invoice' ? "ยืนยันการจัดส่งสินค้า" : "ยืนยันการอนุมัติ"}>
        <div className="p-4 space-y-4">
          {approveModal.type === 'invoice' && (
            <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 space-y-4">
              <p className="text-sm text-gray-400">ระบุข้อมูลการจัดส่งเพื่อให้ลูกค้าตรวจสอบ</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">บริษัทขนส่ง</label>
                  <select className="input-field" value={approveForm.carrier} onChange={e => setApproveForm(p => ({ ...p, carrier: e.target.value }))}>
                    <option value="Flash">Flash Express</option>
                    <option value="Kerry">Kerry Express</option>
                    <option value="J&T">J&T Express</option>
                    <option value="EMS">ไปรษณีย์ไทย (EMS)</option>
                    <option value="Meetup">นัดรับเรียบร้อย</option>
                  </select>
                </div>
                <div>
                  <label className="label">เลขพัสดุ (ถ้ามี)</label>
                  <input className="input-field" placeholder="TH..." value={approveForm.tracking} onChange={e => setApproveForm(p => ({ ...p, tracking: e.target.value }))} />
                </div>
              </div>
            </div>
          )}
          <p className="text-center py-2">{approveModal.type === 'topup' ? 'ยืนยันการอนุมัติยอดเติมเงิน?' : 'คุณตรวจสอบสินค้าและส่งมอบเรียบร้อยแล้วใช่หรือไม่?'}</p>
          <div className="flex gap-3">
            <button onClick={() => setApproveModal({ open: false })} className="btn-outline flex-1 py-3">ยกเลิก</button>
            <button 
              onClick={() => approveModal.type === 'invoice' ? updateOrderStatus(approveModal.id, 'approve') : updateTopupStatus(approveModal.id, 'completed')} 
              className="btn-primary flex-1 py-3 bg-green-600 shadow-glow-sm shadow-green-500/20"
            >
              ยืนยันดำเนินการ
            </button>
          </div>
        </div>
      </Modal>
      <Modal isOpen={rejectModal.open} onClose={() => setRejectModal({ open: false, id: null })} title="ปฏิเสธรายการ">
        <div className="space-y-4 p-4">
          {rejectModal.type === 'invoice' && rejectModal.data?.method === 'wallet' && (
            <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-lg text-red-400 text-xs flex items-center gap-2">
              ⚠️ การปฏิเสธจะทำการคืนเงิน ฿{rejectModal.data.total_price.toLocaleString()} เข้า Wallet ลูกค้าอัตโนมัติ
            </div>
          )}
          <textarea className="input-field h-32" placeholder="ระบุเหตุผลที่ลูกค้าจะได้รับทราบ (เช่น สินค้าหมด, ชำรุด...)" value={rejectModal.reason} onChange={e => setRejectModal(p => ({ ...p, reason: e.target.value }))} />
          <div className="flex gap-3">
            <button onClick={() => setRejectModal({ open: false })} className="btn-outline flex-1 py-3">ยกเลิก</button>
            <button onClick={() => rejectModal.type === 'invoice' ? updateOrderStatus(rejectModal.id, 'reject', rejectModal.reason) : updateTopupStatus(rejectModal.id, 'rejected', rejectModal.reason)} className="btn-primary flex-1 py-3 bg-red-600 shadow-glow-sm shadow-red-500/20">
              ยืนยันปฏิเสธ
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
