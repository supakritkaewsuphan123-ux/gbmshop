import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageLoader } from '../components/Spinner';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import { supabase } from '../lib/supabase';
import {
  Package, ShoppingCart, BarChart2, Settings,
  PlusCircle, Trash2, Pencil, Eye, Check, X as XIcon, Users, Clock, Globe
} from 'lucide-react';
import { getImageUrl } from '../lib/urlHelper';
import FinancialOverview from '../components/Finance/FinancialOverview';
import { validateImageFile, validateVideoFile, generateSafeFilename, validatePrice, validateStock } from '../lib/security';
import 'chart.js/auto';

const TABS = [
  { id: 'listings', label: 'สินค้า', icon: <Package size={18} /> },
  { id: 'categories', label: 'หมวดหมู่', icon: <PlusCircle size={18} /> },
  { id: 'orders', label: 'ออเดอร์', icon: <ShoppingCart size={18} /> },
  { id: 'users', label: 'สมาชิก', icon: <Users size={18} /> },
  { id: 'finance', label: 'สถิติการขาย', icon: <BarChart2 size={18} /> },
  { id: 'settings', label: 'ตั้งค่าร้านค้า', icon: <Settings size={18} /> },
];

export default function Admin() {
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [tab, setTab] = useState('listings');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [userStats, setUserStats] = useState({ total: 0, admin: 0, banned: 0 });
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [stats, setStats] = useState(null);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [uploadStatus, setUploadStatus] = useState('');
  const [approveForm, setApproveForm] = useState({ carrier: 'Flash', tracking: '' });
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
    image: null,
    additional_images: [],
    videos: []
  });
  const [submitting, setSubmitting] = useState(false);
  const [qrFile, setQrFile] = useState(null);
  const [currentQr, setCurrentQr] = useState('');
  const [searchParams] = useSearchParams();
  const [rejectModal, setRejectModal] = useState({ open: false, id: null, type: 'invoice', reason: '' });
  const [approveModal, setApproveModal] = useState({ open: false, id: null, type: 'invoice', data: null });
  const [processingIds, setProcessingIds] = useState(new Set());
  const [categories, setCategories] = useState([]);
  const [newCatName, setNewCatName] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'admin') return;

    const invoiceChannel = supabase
      .channel('admin-global-invoices')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, () => loadOrders())
      .subscribe();

    return () => {
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

  const [loadedTabs, setLoadedTabs] = useState(new Set());

  const loadTabData = async (currentTab) => {
    if (loadedTabs.has(currentTab)) return;

    setLoading(true);
    try {
      switch (currentTab) {
        case 'listings': await loadProducts(); await loadCategories(); break;
        case 'categories': await loadCategories(); break;
        case 'orders': await loadOrders(); break;
        case 'users': await loadUsers(); break;
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

  const loadCategories = async () => {
    const { data, error } = await supabase.from('categories').select('*').order('created_at', { ascending: true });
    if (!error && data) setCategories(data);
  };

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return showToast('กรุณากรอกชื่อหมวดหมู่', 'error');
    const { error } = await supabase.from('categories').insert([{ name: newCatName.trim() }]);
    if (error) {
       showToast(error.message, 'error');
    } else {
       showToast('เพิ่มหมวดหมู่สำเร็จ ✅', 'success');
       setNewCatName('');
       loadCategories();
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!confirm('ยืนยันลบหมวดหมู่? สินค้าในหมวดหมู่นี้อาจไม่แสดงผล')) return;
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (!error) {
       showToast('ลบหมวดหมู่แล้ว', 'success');
       loadCategories();
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

  const deleteProduct = async (id) => {
    if (!confirm('ยืนยันลบ?')) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (!error) { showToast('ลบแล้ว', 'success'); loadProducts(); }
  };

  const openAddModal = async () => { 
    await loadCategories();
    setEditProduct(null); 
    setProductForm({ 
      name: '', price: '', condition_percent: '100', stock: 1, 
      category: categories[0]?.name || 'มือ1', description: '', image: null, 
      additional_images: [], videos: [] 
    }); 
    setAddProductModal(true); 
  };

  const openEditModal = async (p) => { 
    await loadCategories();
    setEditProduct(p); 
    setProductForm({ 
      name: p.name, price: p.price, 
      condition_percent: p.condition_percent || '100', 
      stock: p.stock, category: p.category || categories[0]?.name || 'มือ1', 
      description: p.description || '', image: null,
      additional_images: [], videos: [] 
    }); 
    setAddProductModal(true); 
  };

  const submitProduct = async () => {
    if (!productForm.name?.trim()) return showToast('กรุณากรอกชื่อสินค้า', 'error');
    if (!validatePrice(productForm.price)) return showToast('ราคาต้องเป็นตัวเลขบวกที่ถูกต้อง', 'error');
    if (!validateStock(productForm.stock)) return showToast('จำนวนสต็อกไม่ถูกต้อง', 'error');

    setSubmitting(true);
    setUploadStatus('กำลังเริ่มต้น...');
    try {
      let imageUrl = editProduct?.image_url || '';
      if (productForm.image) {
        setUploadStatus('กำลังอัปโหลดรูปภาพหลัก...');
        const file = productForm.image;
        const filePath = generateSafeFilename(file, 'products');
        await supabase.storage.from('product-images').upload(filePath, file);
        const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(filePath);
        imageUrl = publicUrl;
      }

      let additionalImages = editProduct?.images ? (typeof editProduct.images === 'string' ? JSON.parse(editProduct.images) : editProduct.images) : [];
      if (productForm.additional_images?.length > 0) {
        setUploadStatus(`กำลังอัปโหลดรูปภาพเพิ่มเติม (${productForm.additional_images.length} ไฟล์)...`);
        const uploadPromises = Array.from(productForm.additional_images).map(async (file) => {
          const filePath = generateSafeFilename(file, 'products/extra');
          await supabase.storage.from('product-images').upload(filePath, file);
          const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(filePath);
          return publicUrl;
        });
        const newImages = await Promise.all(uploadPromises);
        additionalImages = [...additionalImages, ...newImages];
      }

      let videos = editProduct?.videos ? (typeof editProduct.videos === 'string' ? JSON.parse(editProduct.videos) : editProduct.videos) : [];
      if (productForm.videos?.length > 0) {
        setUploadStatus(`กำลังอัปโหลดวิดีโอ (${productForm.videos.length} ไฟล์)...`);
        const videoPromises = Array.from(productForm.videos).map(async (file) => {
          const filePath = generateSafeFilename(file, 'products/video');
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
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-20">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-slate-100 rounded-[40px] p-10 mb-12 shadow-soft flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tighter uppercase">🛡️ Admin Dashboard</h1>
            <p className="text-slate-400 font-bold">ระบบจัดการหลังบ้าน GBshop มินิมอลสไตล์</p>
          </div>
          {stats && <div className="flex gap-12">
            <div className="text-right">
               <p className="text-[10px] text-slate-300 font-black uppercase tracking-widest mb-1">Total Revenue</p>
               <p className="text-slate-900 text-3xl font-black tracking-tight">฿{(stats.revenue?.total || 0).toLocaleString()}</p>
            </div>
            <div className="text-right border-l border-slate-50 pl-12">
               <p className="text-[10px] text-slate-300 font-black uppercase tracking-widest mb-1">Total Orders</p>
               <p className="text-slate-900 text-3xl font-black tracking-tight">{stats.orders?.total || 0}</p>
            </div>
          </div>}
        </motion.div>

        {/* Navigation */}
        <div className="flex gap-3 bg-slate-50 p-3 rounded-[32px] mb-12 overflow-x-auto no-scrollbar border border-slate-100 shadow-sm max-w-fit mx-auto md:mx-0">
          {TABS.map(t => (
            <button 
              key={t.id} 
              onClick={() => setTab(t.id)} 
              className={`flex items-center gap-3 px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                tab === t.id ? 'bg-slate-900 text-white shadow-soft' : 'text-slate-400 hover:text-slate-900'
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {tab === 'listings' && (
            <motion.div key="listings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="flex justify-between items-center mb-8 px-2">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">สินค้าในระบบ</h2>
                    <p className="text-slate-400 font-bold text-sm">อัปเดตและจัดการสินค้าทั้งหมด {products.length} รายการ</p>
                </div>
                <button onClick={openAddModal} className="bg-slate-900 text-white font-black px-10 py-5 rounded-2xl flex items-center gap-3 shadow-soft hover:brightness-110 active:scale-95 transition-all">
                  <PlusCircle size={22} /> เพิ่มสินค้าใหม่
                </button>
              </div>
              
              <div className="bg-white border border-slate-100 rounded-[40px] overflow-hidden shadow-soft">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>{['#', 'สินค้า', 'ผู้ลงประกาศ', 'ราคา', 'สต็อก', 'จัดการ'].map(h => 
                        <th key={h} className="text-left px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none border-b border-slate-100">{h}</th>)}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {products.map(p => (
                        <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-8 py-6 text-xs text-slate-300 font-bold font-mono">#{p.id.toString().slice(0,5)}</td>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                              <img src={p.image_url} className="w-16 h-16 rounded-2xl object-cover border border-slate-100 shadow-sm" />
                              <span className="font-black text-slate-900 tracking-tight leading-tight">{p.name}</span>
                            </div>
                          </td>
                          <td className="px-8 py-6 text-sm text-slate-500 font-bold">{p.seller_name}</td>
                          <td className="px-8 py-6 text-slate-900 font-black text-lg">฿{p.price?.toLocaleString()}</td>
                          <td className="px-8 py-6">
                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${p.stock > 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                              {p.stock} units
                            </span>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex gap-3">
                              <button onClick={() => openEditModal(p)} className="w-11 h-11 bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-white border border-transparent hover:border-slate-100 rounded-xl transition-all flex items-center justify-center"><Pencil size={18} /></button>
                              <button onClick={() => deleteProduct(p.id)} className="w-11 h-11 bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 border border-transparent hover:border-red-100 rounded-xl transition-all flex items-center justify-center"><Trash2 size={18} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {tab === 'orders' && (
            <motion.div key="orders" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="flex justify-between items-center mb-8 px-2">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">รายการสั่งซื้อ</h2>
                    <p className="text-slate-400 font-bold text-sm">ตรวจสอบและอนุมัติออเดอร์จากลูกค้า</p>
                </div>
                <button 
                  onClick={() => exportToCSV(orders.map(o => ({ ID: o.id, Buyer: o.buyer_name, Total: o.total_price, Method: o.method, Status: o.status, Date: o.created_at })), 'orders_report')}
                  className="bg-white text-slate-900 border border-slate-200 font-black px-8 py-4 rounded-2xl text-[10px] uppercase tracking-widest flex items-center gap-3 shadow-sm hover:bg-slate-50 transition-all"
                >
                  📥 Export CSV
                </button>
              </div>
              
              <div className="bg-white border border-slate-100 rounded-[40px] overflow-hidden shadow-soft">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>{['ID', 'รายการสินค้า', 'ผู้ซื้อ', 'นัดรับ/จัดส่ง/ชำระ', 'สถานะ', 'จัดการ'].map(h => 
                        <th key={h} className="text-left px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none border-b border-slate-100">{h}</th>)}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {orders.map(o => (
                        <tr key={o.id} className="hover:bg-slate-50/50 transition-colors align-top">
                          <td className="px-8 py-8 text-[10px] text-slate-300 font-black font-mono">#{o.id.toString().slice(0,8)}</td>
                          <td className="px-8 py-8">
                            <div className="space-y-2">
                              <p className="font-black text-slate-900 line-clamp-2 tracking-tight">{o.items?.map(i => i.name).join(', ')}</p>
                              <p className="text-primary font-black text-xl">฿{o.total_price?.toLocaleString()}</p>
                            </div>
                          </td>
                          <td className="px-8 py-8">
                             <p className="font-black text-slate-900">{o.buyer_name}</p>
                             <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Buyer Account</p>
                          </td>
                          <td className="px-8 py-8 min-w-[260px]">
                            <div className="text-xs space-y-3">
                              {o.method === 'meetup' ? (
                                <div className="bg-slate-50 border border-slate-100 p-5 rounded-[24px] shadow-sm">
                                  <p className="text-slate-900 font-black mb-2 flex items-center gap-2 uppercase text-[10px] tracking-widest"><Globe size={14} /> นัดรับสินค้า</p>
                                  <p className="text-slate-600 font-bold leading-relaxed">{o.meet_location}</p>
                                  <div className="flex items-center gap-2 mt-2 text-slate-400 font-bold text-[10px]">
                                     <Clock size={12} /> {o.meet_date} @ {o.meet_time}
                                  </div>
                                </div>
                              ) : o.method === 'cod' ? (
                                <div className="bg-slate-50 border border-slate-100 p-5 rounded-[24px] shadow-sm">
                                  <p className="text-slate-900 font-black mb-2 uppercase text-[10px] tracking-widest">🚚 เก็บเงินปลายทาง</p>
                                  <p className="text-slate-900 font-black">{o.shipping_name}</p>
                                  <p className="text-slate-500 font-bold mt-1">{o.shipping_phone}</p>
                                </div>
                              ) : (
                                <div className="bg-slate-900 p-5 rounded-[24px] shadow-glow">
                                  <p className="text-white font-black mb-3 uppercase text-[10px] tracking-widest opacity-60">💳 โอนเงินผ่านธนาคาร</p>
                                  {o.slip_url && (
                                    <button onClick={() => setSlipModal({ open: true, src: o.slip_url })} className="bg-white/10 hover:bg-white/20 text-white font-black px-6 py-3 rounded-xl text-[10px] flex items-center justify-center gap-2 transition-all w-full">
                                      <Eye size={14} /> ดูหลักฐานการโอน
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-8 py-8"><StatusBadge status={o.status} /></td>
                          <td className="px-8 py-8">
                            {!['completed', 'rejected'].includes(o.status) ? (
                              <div className="flex flex-col gap-3">
                                {o.status !== 'processing' && (
                                  <button onClick={() => setProcessingStatus(o.id)} className="w-full py-4 bg-slate-100 text-slate-900 rounded-2xl text-[11px] font-black uppercase tracking-widest border border-transparent hover:border-slate-200 transition-all">เตรียมสินค้า</button>
                                )}
                                <button onClick={() => setApproveModal({ open: true, id: o.id, type: 'invoice', data: o })} className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-soft hover:brightness-110 transition-all">อนุมัติ</button>
                                <button onClick={() => setRejectModal({ open: true, id: o.id, type: 'invoice', reason: '', data: o })} className="w-full py-4 bg-red-50 text-red-500 rounded-2xl text-[11px] font-black uppercase tracking-widest border border-transparent hover:border-red-100 transition-all">ปฏิเสธ</button>
                              </div>
                            ) : <span className="text-slate-200 text-[10px] font-black uppercase tracking-[0.3em] block py-2 text-center">Finished</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {tab === 'categories' && (
            <motion.div key="categories" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="max-w-2xl">
               <div className="flex justify-between items-center mb-8 px-2">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">จัดการหมวดหมู่</h2>
                    <p className="text-slate-400 font-bold text-sm">เพิ่มหรือลบหมวดหมู่สินค้าในระบบ</p>
                </div>
              </div>

              <div className="bg-white border border-slate-100 rounded-[40px] p-10 shadow-soft mb-12">
                 <div className="flex gap-4">
                    <input 
                      type="text" 
                      className="input-field flex-1" 
                      placeholder="ชื่อหมวดหมู่ใหม่ เช่น อสังหาริมทรัพย์..." 
                      value={newCatName}
                      onChange={e => setNewCatName(e.target.value)}
                    />
                    <button onClick={handleAddCategory} className="bg-slate-900 text-white font-black px-10 py-5 rounded-2xl flex items-center gap-3 shadow-soft hover:brightness-110 active:scale-95 transition-all">
                       <PlusCircle size={22} /> เพิ่ม
                    </button>
                 </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                 {categories.map(cat => (
                   <div key={cat.id} className="bg-white border border-slate-100 rounded-[32px] p-8 flex items-center justify-between shadow-sm hover:shadow-soft transition-all">
                      <div>
                         <p className="font-black text-slate-900 text-xl tracking-tight">{cat.name}</p>
                         <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">ID: {cat.id.toString().slice(0,8)}</p>
                      </div>
                      <button onClick={() => handleDeleteCategory(cat.id)} className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm">
                         <Trash2 size={20} />
                      </button>
                   </div>
                 ))}
                 {categories.length === 0 && (
                   <div className="text-center py-20 border-2 border-dashed border-slate-100 rounded-[40px] text-slate-300 font-black uppercase tracking-widest">
                      ยังไม่มีหมวดหมู่สินค้า
                   </div>
                 )}
              </div>
            </motion.div>
          )}

          {tab === 'users' && (
            <motion.div key="users" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 px-2">
                <div>
                   <h2 className="text-3xl font-black text-slate-900 tracking-tight">สมาชิกในระบบ</h2>
                   <p className="text-slate-400 font-bold text-sm">จัดการสิทธิ์และการเข้าถึงของผู้ใช้งาน</p>
                </div>
                <div className="relative w-full md:w-80">
                  <input 
                    type="text" 
                    placeholder="ค้นหาด้วยชื่อผู้ใช้..." 
                    className="input-field py-5 pr-12 text-sm"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                  />
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300"><Users size={20} /></div>
                </div>
              </div>

              <div className="bg-white border border-slate-100 rounded-[40px] overflow-hidden shadow-soft">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>{['สมาชิก', 'บทบาท', 'วันที่เข้าร่วม', 'จัดการ'].map(h => 
                      <th key={h} className="text-left px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none border-b border-slate-100">{h}</th>)}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {users.filter(u => u.username?.toLowerCase().includes(userSearch.toLowerCase())).map(u => (
                      <tr key={u.id} className={`hover:bg-slate-50/50 transition-colors ${u.is_banned ? 'opacity-40 grayscale' : ''}`}>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-5">
                            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-slate-400 text-sm shadow-inner border border-slate-50">
                              {u.username?.slice(0,1).toUpperCase()}
                            </div>
                            <div>
                               <p className="font-black text-slate-900 tracking-tight">{u.username}</p>
                               <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">{u.email?.slice(0,15)}...</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${u.role === 'admin' ? 'bg-slate-900 text-white shadow-soft' : 'bg-slate-100 text-slate-400'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-xs text-slate-400 font-black">{new Date(u.created_at).toLocaleDateString('th-TH')}</td>
                        <td className="px-8 py-6">
                          <div className="flex gap-3">
                             <button 
                              onClick={() => handleRoleChange(u.id, u.role)}
                              disabled={u.id === user.id}
                              className="w-11 h-11 bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-white border border-transparent hover:border-slate-100 rounded-xl transition-all flex items-center justify-center"
                            ><User size={18} /></button>
                            <button 
                              onClick={() => handleBanUser(u.id, u.is_banned)}
                              disabled={u.id === user.id}
                              className={`w-11 h-11 rounded-xl transition-all flex items-center justify-center ${u.is_banned ? 'bg-green-100 text-green-500 shadow-glow-sm' : 'bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 border border-transparent hover:border-red-100'}`}
                            >{u.is_banned ? <Check size={18} /> : <Trash2 size={18} />}</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {tab === 'finance' && (
            <motion.div key="finance" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <FinancialOverview />
            </motion.div>
          )}

          {tab === 'settings' && (
            <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto md:mx-0">
               <div className="bg-white border border-slate-100 rounded-[48px] p-12 shadow-soft space-y-12">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 mb-10 flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-900 border border-slate-100 shadow-sm"><Settings size={22} /></div>
                    ตั้งค่าพิกัดร้านค้า
                  </h3>
                  <div className="space-y-10">
                    <div className="space-y-3">
                      <label className="label">เบอร์ติดต่อ / พร้อมเพย์</label>
                      <input className="input-field" placeholder="0xx-xxx-xxxx" value={settings.promptpay_number || ''} onChange={e => setSettings(p => ({ ...p, promptpay_number: e.target.value }))} />
                    </div>
                    <div>
                      <label className="label">รูปภาพคิวอาร์โค้ด (QR Payment)</label>
                      <div className="mt-4 p-8 border-2 border-dashed border-slate-100 rounded-[32px] bg-slate-50/50 flex flex-col items-center">
                        {currentQr ? (
                          <div className="relative group w-52 h-52 bg-white rounded-[24px] overflow-hidden shadow-soft border border-slate-100 p-4 mb-4">
                            <img src={currentQr} className="w-full h-full object-contain" />
                            <button onClick={deleteQr} className="absolute inset-0 bg-red-600/90 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all backdrop-blur-[2px]">
                               <Trash2 size={32} className="mb-2" />
                               <span className="text-[10px] font-black uppercase tracking-widest">Remove QR</span>
                            </button>
                          </div>
                        ) : (
                          <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-slate-200 mb-6 shadow-sm"><Globe size={32} /></div>
                        )}
                        <div className="flex flex-col md:flex-row gap-3 w-full max-w-sm">
                          <label className="flex-1 bg-white border border-slate-200 text-slate-400 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest cursor-pointer text-center hover:bg-slate-50 transition-all overflow-hidden relative">
                             {qrFile ? qrFile.name : 'Select QR Image'}
                             <input type="file" className="hidden" onChange={e => setQrFile(e.target.files[0])} />
                          </label>
                          <button onClick={uploadQr} className="bg-slate-900 text-white font-black px-10 py-4 rounded-2xl text-[10px] uppercase tracking-widest shadow-soft hover:brightness-110 active:scale-95 transition-all">Upload</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="pt-10 border-t border-slate-50">
                  <button onClick={saveSettings} className="bg-slate-900 text-white font-black w-full py-6 text-xl rounded-2xl shadow-soft hover:shadow-glow transition-all">บันทึกข้อมูลร้านค้า</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modals — Clean White Style */}
        <Modal isOpen={slipModal.open} onClose={() => setSlipModal({ open: false, src: '' })} title="Evidence of Transfer">
           <div className="p-2">
            <img src={slipModal.src} className="w-full rounded-[32px] border border-slate-100 shadow-soft" />
           </div>
        </Modal>

        <Modal isOpen={addProductModal} onClose={() => setAddProductModal(false)} title={editProduct ? `Edit Product` : 'Create New Product'} maxWidth="max-w-xl">
          <div className="space-y-8 p-4">
            <div className="grid grid-cols-2 gap-6">
              <div className="col-span-2 space-y-2">
                 <label className="label">Product Name</label>
                 <input className="input-field" placeholder="Item Name..." value={productForm.name} onChange={e => setProductForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                 <label className="label">Price (THB)</label>
                 <input type="number" className="input-field" placeholder="0.00" value={productForm.price} onChange={e => setProductForm(p => ({ ...p, price: e.target.value }))} />
              </div>
              <div className="space-y-2">
                 <label className="label">Category</label>
                 <select className="input-field cursor-pointer" value={productForm.category} onChange={e => setProductForm(p => ({ ...p, category: e.target.value }))}>
                  {/* Dynamic Categories */}
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                  
                  {/* Divider if both exist */}
                  {categories.length > 0 && <option disabled>──────────</option>}
                  
                  {/* Legacy/Default Options */}
                  <option value="มือ1">มือ1 (Default)</option>
                  <option value="มือสอง">มือ2 (Default)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="label">Stock</label>
                <input type="number" min="0" className="input-field" value={productForm.stock} onChange={e => setProductForm(p => ({ ...p, stock: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <label className="label">Condition (%)</label>
                <input type="number" min="1" max="100" className="input-field" value={productForm.condition_percent} onChange={e => setProductForm(p => ({ ...p, condition_percent: e.target.value }))} />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="label">General Description</label>
              <textarea rows={5} className="input-field resize-none" placeholder="Provide details about the item..." value={productForm.description} onChange={e => setProductForm(p => ({ ...p, description: e.target.value }))} />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                 <label className="label">Primary Image</label>
                 <label className="block w-full bg-slate-50 border border-slate-100 px-6 py-4 rounded-2xl text-xs font-black text-slate-400 cursor-pointer text-center truncate italic">
                    {productForm.image ? productForm.image.name : 'Select Image...'}
                    <input type="file" accept="image/*" className="hidden" onChange={e => setProductForm(p => ({ ...p, image: e.target.files[0] || null }))} />
                 </label>
              </div>
              <div className="space-y-2">
                 <label className="label">Extra Photos</label>
                 <label className="block w-full bg-slate-50 border border-slate-100 px-6 py-4 rounded-2xl text-xs font-black text-slate-400 cursor-pointer text-center truncate italic">
                    {productForm.additional_images?.length > 0 ? `${productForm.additional_images.length} files selected` : 'Choose Files...'}
                    <input type="file" accept="image/*" multiple className="hidden" onChange={e => setProductForm(p => ({ ...p, additional_images: e.target.files }))} />
                 </label>
              </div>
            </div>

            <div className="pt-6">
              <button 
                onClick={submitProduct} 
                disabled={submitting} 
                className="bg-slate-900 text-white font-black w-full py-6 text-xl rounded-2xl shadow-soft hover:brightness-110 active:scale-95 transition-all"
              >
                {submitting ? 'PROCESSING...' : 'SAVE PRODUCT CHANGES'}
              </button>
              {uploadStatus && <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest text-center mt-4">Status: {uploadStatus}</p>}
            </div>
          </div>
        </Modal>

        {/* Reject/Approve Modals updated to same style */}
        <Modal isOpen={rejectModal.open} onClose={() => setRejectModal({ open: false, id: null, type: 'invoice', reason: '' })} title="State Rejection Reason">
          <div className="space-y-6 p-4">
            <textarea rows={4} className="input-field resize-none px-6 py-6" placeholder="Reason for rejection (e.g. invalid slip, item out of stock)..." value={rejectModal.reason} onChange={e => setRejectModal(p => ({ ...p, reason: e.target.value }))} />
            <button onClick={() => updateOrderStatus(rejectModal.id, 'reject', rejectModal.reason)} className="bg-red-500 text-white font-black w-full py-5 text-lg rounded-2xl shadow-soft hover:brightness-110 transition-all uppercase tracking-widest">Confirm Rejection</button>
          </div>
        </Modal>

        <Modal isOpen={approveModal.open} onClose={() => setApproveModal({ open: false, id: null })} title="Confirm Fulfillment">
          <div className="space-y-8 p-4">
            <div className="bg-slate-50 p-8 rounded-[32px] space-y-6 border border-slate-100">
               <div className="space-y-2">
                  <label className="label">Courier Service</label>
                  <select className="input-field cursor-pointer" value={approveForm.carrier} onChange={e => setApproveForm(p => ({ ...p, carrier: e.target.value }))}>
                    <option value="Flash">Flash Express</option>
                    <option value="Kerry">Kerry Express</option>
                    <option value="J&T">J&T Express</option>
                    <option value="EMS">Thailand Post (EMS)</option>
                    <option value="Meetup">Self-Delivery / Meetup</option>
                  </select>
               </div>
               <div className="space-y-2">
                  <label className="label">Tracking Number</label>
                  <input className="input-field px-6 py-5" placeholder="TH0123456789..." value={approveForm.tracking} onChange={e => setApproveForm(p => ({ ...p, tracking: e.target.value }))} />
               </div>
            </div>
            <button onClick={() => updateOrderStatus(approveModal.id, 'approve')} className="bg-slate-900 text-white font-black w-full py-6 text-xl rounded-2xl shadow-soft hover:brightness-110 transition-all uppercase tracking-widest">Approve & Ship</button>
          </div>
        </Modal>
      </div>
    </div>
  );
}
