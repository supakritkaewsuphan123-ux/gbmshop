import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import { PageLoader, TableRowSkeleton } from '../components/Spinner';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import api from '../lib/api';
import { Package, Wallet, ShoppingBag, Plus, Trash2, User, MessageSquare, Phone, Globe } from 'lucide-react';

const TABS = [
  { id: 'wallet', label: 'GB Wallet', icon: <Wallet size={16} /> },
  { id: 'contact', label: 'ติดต่อเรา', icon: <MessageSquare size={16} /> },
];

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [tab, setTab] = useState('wallet');
  const [profile, setProfile] = useState(null);
  const [topups, setTopups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [topupModalOpen, setTopupModalOpen] = useState(false);
  const [topupAmount, setTopupAmount] = useState('');
  const [topupFile, setTopupFile] = useState(null);
  const [adminInfo, setAdminInfo] = useState(null);
  const [submittingTopup, setSubmittingTopup] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) { navigate('/login'); return; }
    if (user) { 
      loadProfile(); 
      loadTopups();
      loadSettings();
    }
  }, [user, authLoading]);

  const loadSettings = async () => {
    try {
      const cfg = await api.get('/settings/public');
      setAdminInfo(cfg);
    } catch { console.error('settings load error'); }
  };

  const loadProfile = async () => {
    try {
      const data = await api.get('/users/profile');
      setProfile(data);
    } catch { showToast('โหลดโปรไฟล์ไม่สำเร็จ', 'error'); }
    finally { setLoading(false); }
  };

  const loadTopups = async () => {
    try {
      const data = await api.get('/users/my-topups');
      setTopups(data);
    } catch { console.error('topups load error'); }
  };

  const openTopupModal = () => {
    setTopupModalOpen(true);
  };

  const submitTopup = async () => {
    if (!topupAmount || !topupFile) { showToast('กรุณากรอกยอดและแนบสลิป', 'error'); return; }
    setSubmittingTopup(true);
    const fd = new FormData();
    fd.append('amount', topupAmount);
    fd.append('slip_image', topupFile);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/users/topup', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast('ส่งคำขอเติมเงินแล้ว รอแอดมินอนุมัติ', 'success');
      setTopupModalOpen(false); setTopupAmount(''); setTopupFile(null);
      loadTopups(); loadProfile();
    } catch (e) { showToast(e.message, 'error'); }
    finally { setSubmittingTopup(false); }
  };

  const deleteProduct = async (id) => {
    if (!confirm('ยืนยันการลบสินค้า?')) return;
    try {
      await api.delete(`/products/${id}`);
      showToast('ลบสินค้าเรียบร้อย', 'success');
      loadProfile();
    } catch (e) { showToast(e.message, 'error'); }
  };

  if (authLoading || loading) return <PageLoader />;

  const u = profile?.user;
  const products = profile?.products || [];
  const balance = u?.balance || 0;
  const avatarSrc = u?.profile_image && u.profile_image !== 'default_avatar.png'
    ? `/uploads/${u.profile_image}` : '/default_avatar.png';

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <aside className="lg:col-span-1">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-surface border border-border rounded-2xl p-5 sticky top-24"
          >
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-3 overflow-hidden border-2 border-primary/30">
                <img src={avatarSrc} alt="avatar" className="w-full h-full object-cover"
                  onError={(e) => { e.target.style.display='none'; e.target.parentNode.innerHTML='<div class="text-primary"><span style=\'font-size:1.5rem\'>👤</span></div>'; }} />
              </div>
              <p className="font-bold text-white text-lg">{u?.username}</p>
              <p className="text-primary font-bold">฿{balance.toLocaleString()}</p>
              <p className="text-xs text-gray-500">GB Wallet</p>
            </div>

            <nav className="space-y-1">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    tab === t.id
                      ? 'bg-primary text-white shadow-glow-sm'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {t.icon} {t.label}
                </button>
              ))}
              <button
                onClick={() => navigate('/my-orders')}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-400 hover:bg-white/5 hover:text-white transition-all duration-200"
              >
                <ShoppingBag size={16} /> การสั่งซื้อ
              </button>
            </nav>
          </motion.div>
        </aside>

        {/* Main */}
        <main className="lg:col-span-3">
          <AnimatePresence mode="wait">
            {tab === 'contact' && (
              <motion.div key="contact" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <h2 className="text-2xl font-bold mb-6">📞 ติดต่อเรา</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-surface border border-border rounded-2xl p-8 flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4 text-primary">
                      <MessageSquare size={32} />
                    </div>
                    <h3 className="font-bold text-lg mb-2">ช่วยเหลือและสนับสนุน</h3>
                    <p className="text-gray-400 text-sm mb-6">หากคุณพบปัญหาในการใช้งานหรือมีข้อสงสัย สามารถติดต่อทีมงานได้ตลอด 24 ชม.</p>
                    
                    <div className="space-y-3 w-full text-left">
                      {adminInfo?.phone && (
                        <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/5 hover:border-primary/30 transition-all">
                          <Phone size={18} className="text-primary" />
                          <div>
                            <p className="text-xs text-gray-500 uppercase font-bold">Phone Number</p>
                            <p className="text-sm text-white">{adminInfo.phone}</p>
                          </div>
                        </div>
                      )}
                      
                      {adminInfo?.facebook && (
                        <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/5 hover:border-primary/30 transition-all">
                          <Globe size={18} className="text-primary" />
                          <div>
                            <p className="text-xs text-gray-500 uppercase font-bold">Facebook Page</p>
                            <p className="text-sm text-white">{adminInfo.facebook}</p>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/5 hover:border-primary/30 transition-all">
                        <MessageSquare size={18} className="text-green-400" />
                        <div>
                          <p className="text-xs text-gray-500 uppercase font-bold">Line Official</p>
                          <p className="text-sm text-white">@gbmoneyshop</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-surface border border-border rounded-2xl p-8 flex flex-col">
                    <div className="mb-8">
                      <h3 className="font-bold text-lg mb-4 text-primary flex items-center gap-2">
                        🕒 เวลาให้บริการ
                      </h3>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center text-sm p-3 bg-white/2 rounded-lg">
                          <span className="text-gray-400">จันทร์ - ศุกร์</span>
                          <span className="text-white font-medium">09:00 - 23:00</span>
                        </div>
                        <div className="flex justify-between items-center text-sm p-3 bg-white/2 rounded-lg">
                          <span className="text-gray-400">เสาร์ - อาทิตย์</span>
                          <span className="text-white font-medium">10:00 - 22:00</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-auto p-4 bg-primary/5 border border-primary/20 rounded-xl">
                      <p className="text-xs text-gray-400 leading-relaxed">
                        <span className="text-primary font-bold">หมายเหตุ:</span> หากส่งสลิปเติมเงินในช่วงเวลาปิดทำการ แอดมินจะดำเนินการตรวจสอบให้ในเช้าวันถัดไปทันทีครับ
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {tab === 'wallet' && (
              <motion.div key="wallet" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <h2 className="text-2xl font-bold mb-6">💳 GB Wallet</h2>

                {/* Balance card */}
                <div className="bg-gradient-to-br from-primary/20 to-surface border border-primary/30 rounded-2xl p-8 text-center mb-6 animate-pulse-glow">
                  <p className="text-gray-400 mb-2">ยอดคงเหลือ</p>
                  <p className="text-5xl font-extrabold text-primary mb-4">฿{balance.toLocaleString()}</p>
                  <motion.button
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={openTopupModal}
                    className="btn-primary px-8 py-3 flex items-center gap-2 mx-auto"
                  >
                    <Plus size={18} /> เติมเงิน
                  </motion.button>
                </div>

                {/* Topup history */}
                <h3 className="text-lg font-semibold mb-3">ประวัติการเติมเงิน</h3>
                <div className="bg-surface border border-border rounded-2xl overflow-hidden">
                  <table className="w-full">
                    <thead className="border-b border-border">
                      <tr>{['#', 'ยอด', 'สถานะ', 'วันที่'].map(h => <th key={h} className="text-left px-5 py-3 text-sm text-gray-500">{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {topups.length === 0 ? (
                        <tr><td colSpan={4} className="text-center py-8 text-gray-500">ยังไม่มีประวัติการเติมเงิน</td></tr>
                      ) : topups.map((t) => (
                        <tr key={t.id} className="border-b border-border last:border-0 hover:bg-white/2 transition-colors">
                          <td className="px-5 py-3 text-gray-500 text-sm">#{t.id}</td>
                          <td className="px-5 py-3 text-primary font-bold">฿{t.amount.toLocaleString()}</td>
                          <td className="px-5 py-3"><StatusBadge status={t.status} /></td>
                          <td className="px-5 py-3 text-gray-500 text-sm">{new Date(t.created_at).toLocaleDateString('th-TH')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Topup Modal */}
      <Modal isOpen={topupModalOpen} onClose={() => setTopupModalOpen(false)} title="เติมเงิน GB Wallet">
        {adminInfo && (
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-4 text-sm space-y-1">
            <p className="font-semibold text-primary mb-2">ช่องทางโอนเงิน</p>
            {adminInfo.promptpay_qr && (
              <div className="text-center mb-2">
                <img src={`/uploads/${adminInfo.promptpay_qr}`} alt="QR" className="w-40 h-40 object-contain bg-white rounded-xl mx-auto p-2" />
              </div>
            )}
            {adminInfo.promptpay_number && <p className="text-gray-300">📱 พร้อมเพย์: <strong>{adminInfo.promptpay_number}</strong></p>}
            {adminInfo.wallet_number && <p className="text-gray-300">🔶 TrueMoney: <strong>{adminInfo.wallet_number}</strong></p>}
          </div>
        )}
        <div className="space-y-4">
          <div>
            <label className="label">ยอดเงินที่โอน (บาท)</label>
            <input type="number" min="1" value={topupAmount} onChange={(e) => setTopupAmount(e.target.value)}
              className="input-field" placeholder="เช่น 500" />
          </div>
          <div>
            <label className="label">แนบสลิปการโอน</label>
            <input type="file" accept="image/jpeg,image/png" onChange={(e) => setTopupFile(e.target.files[0])}
              className="input-field text-sm" />
          </div>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={submitTopup} disabled={submittingTopup}
            className="btn-primary w-full py-3"
          >
            {submittingTopup ? 'กำลังส่ง...' : 'ส่งคำขอเติมเงิน'}
          </motion.button>
        </div>
      </Modal>
    </div>
  );
}
