import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import { PageLoader, TableRowSkeleton } from '../components/Spinner';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import { supabase } from '../lib/supabase';
import { Package, Wallet, ShoppingBag, Plus, Trash2, User, MessageSquare, Phone, Globe, Heart, Settings, Camera, Save } from 'lucide-react';
import { validateImageFile, generateSafeFilename, sanitizeText } from '../lib/security';

const TABS = [
  { id: 'wallet', label: 'GB Wallet', icon: <Wallet size={16} /> },
  { id: 'wishlist', label: 'รายการโปรด', icon: <Heart size={16} /> },
  { id: 'settings', label: 'การตั้งค่า', icon: <Settings size={16} /> },
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
  const [wishlist, setWishlist] = useState([]);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  
  // Settings State
  const [settingsForm, setSettingsForm] = useState({ username: '', avatar: null });
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  // โหลดข้อมูลเริ่มต้น
  useEffect(() => {
    if (!authLoading && !user) { navigate('/login'); return; }
    if (user) { 
      loadProfile(); 
      loadTopups();
      loadSettings();
      loadWishlist();
    }
  }, [user, authLoading]);

  // ⚡ Real-time: ฟังการเปลี่ยนแปลงยอดเงินใน Wallet
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`profile-balance-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
        (payload) => {
          // อัปเดตยอดเงินทันทีโดยไม่ต้องโหลดใหม่ทั้งหมด
          if (payload.new?.balance !== undefined) {
            setProfile(prev => prev ? { ...prev, balance: payload.new.balance } : prev);
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user]);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase.from('settings').select('*').single();
      if (error) throw error;
      setAdminInfo(data);
    } catch { console.error('settings load error'); }
  };

  const loadProfile = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, balance, avatar_url, role')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      setProfile(data);
    } catch (err) { 
      console.error('[Dashboard] loadProfile error:', err);
      showToast(`โหลดโปรไฟล์ไม่สำเร็จ: ${err.message || 'Unknown Error'}`, 'error'); 
    }
    finally { setLoading(false); }
  };

  const loadTopups = async () => {
    try {
      const { data, error } = await supabase
        .from('topups')
        .select('id, amount, status, created_at, rejection_reason')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setTopups(data || []);
    } catch (err) { 
      console.error('[Dashboard] loadTopups error:', err);
      showToast('ไม่สามารถโหลดประวัติเติมเงินได้', 'error');
    }
  };

  const loadWishlist = async () => {
    if (!user) return;
    setWishlistLoading(true);
    try {
      const { data, error } = await supabase
        .from('wishlist')
        .select('product_id, products(id, name, price, image, category)')
        .eq('user_id', user.id);
      
      if (error) throw error;
      setWishlist(data.map(item => item.products));
    } catch { console.error('wishlist load error'); }
    finally { setWishlistLoading(false); }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!profile) return;
    
    const cleanUsername = sanitizeText(settingsForm.username, 20);
    if (cleanUsername.length < 3) return showToast('ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร', 'error');

    setUpdatingProfile(true);
    try {
      let avatarUrl = profile.avatar_url;

      // 1. จัดการอัปโหลดรูปถ้ามีรูปใหม่
      if (settingsForm.avatar) {
        const check = validateImageFile(settingsForm.avatar, { maxSizeMB: 2 });
        if (!check.valid) throw new Error(check.error);

        const filePath = generateSafeFilename(settingsForm.avatar, 'avatars');
        const { error: uploadError } = await supabase.storage.from('product-images').upload(filePath, settingsForm.avatar);
        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(filePath);
        avatarUrl = publicUrl;
      }

      // 2. อัปเดต Database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ username: cleanUsername, avatar_url: avatarUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // 3. อัปเดต Local State
      setProfile(prev => ({ ...prev, username: cleanUsername, avatar_url: avatarUrl }));
      showToast('อัปเดตข้อมูลสำเร็จ! ✨', 'success');
      setSettingsForm(p => ({ ...p, avatar: null }));
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setUpdatingProfile(false);
    }
  };

  useEffect(() => {
    if (profile) {
      setSettingsForm(p => ({ ...p, username: profile.username || '' }));
    }
  }, [profile]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSettingsForm(p => ({ ...p, avatar: file }));
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const deleteFromWishlist = async (productId) => {
    try {
      const { error } = await supabase
        .from('wishlist')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId);
      
      if (error) throw error;
      loadWishlist();
      showToast('ลบออกจากรายการโปรดแล้ว', 'success');
    } catch (err) {
      showToast('เกิดข้อผิดพลาดในการลบ', 'error');
      console.error(err);
    }
  };

  const openTopupModal = () => {
    setTopupModalOpen(true);
  };

  const submitTopup = async () => {
    if (!topupAmount || !topupFile) { showToast('กรุณากรอกยอดและแนบสลิป', 'error'); return; }
    setSubmittingTopup(true);
    try {
      const fileExt = topupFile.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `slips/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('topup-slips')
        .upload(filePath, topupFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('topup-slips')
        .getPublicUrl(filePath);

      const { error: insertError } = await supabase.from('topups').insert({
        user_id: user.id,
        amount: parseFloat(topupAmount),
        slip_url: publicUrl,
        status: 'pending',
        idempotency_key: crypto.randomUUID()
      });

      if (insertError) throw insertError;

      showToast('ส่งคำขอเติมเงินแล้ว รอแอดมินอนุมัติ', 'success');
      setTopupModalOpen(false); setTopupAmount(''); setTopupFile(null);
      loadTopups(); loadProfile();
    } catch (e) { showToast(e.message, 'error'); }
    finally { setSubmittingTopup(false); }
  };

  if (authLoading || loading) return <PageLoader />;

  const u = profile;
  const balance = u?.balance || 0;
  const avatarSrc = u?.avatar_url || '/default_avatar.png';

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
            {tab === 'settings' && (
              <motion.div key="settings" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-2xl font-bold mb-6">⚙️ การตั้งค่าโปรไฟล์</h2>
                
                <div className="bg-surface border border-border rounded-2xl p-8 max-w-2xl">
                  <form onSubmit={handleUpdateProfile} className="space-y-8">
                    {/* Avatar Upload */}
                    <div className="flex flex-col items-center gap-4">
                      <div className="relative group">
                        <div className="w-32 h-32 rounded-full border-4 border-primary/20 overflow-hidden bg-white/5 relative">
                          <img 
                            src={previewUrl || profile?.avatar_url || `https://ui-avatars.com/api/?name=${profile?.username || 'G'}&background=random`} 
                            className="w-full h-full object-cover" 
                            alt="Avatar" 
                          />
                          <label className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                            <Camera size={24} className="text-white mb-1" />
                            <span className="text-[10px] text-white font-bold uppercase">Change</span>
                            <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                          </label>
                        </div>
                        {settingsForm.avatar && (
                          <div className="absolute -top-2 -right-2 bg-primary text-white text-[10px] px-2 py-1 rounded-full animate-pulse shadow-glow-sm">
                            New!
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">คลิกที่รูปเพื่อเปลี่ยน (ขนาดไม่เกิน 2MB)</p>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Username</label>
                        <input 
                          type="text" 
                          value={settingsForm.username}
                          onChange={(e) => setSettingsForm(p => ({ ...p, username: e.target.value }))}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all outline-none"
                          placeholder="ชื่อที่ต้องการแสดง"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Email (Read-only)</label>
                        <input 
                          type="text" 
                          disabled
                          value={user?.email}
                          className="w-full bg-white/2 border border-white/5 rounded-xl px-4 py-3 text-gray-500 cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <div className="pt-4">
                      <button
                        type="submit"
                        disabled={updatingProfile}
                        className="w-full md:w-auto px-8 py-3 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold transition-all shadow-glow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {updatingProfile ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            กำลังบันทึก...
                          </>
                        ) : (
                          <><Save size={18} /> บันทึกการเปลี่ยนแปลง</>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            )}

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

                <h3 className="text-lg font-semibold mb-3">ประวัติการเติมเงิน</h3>
                <div className="bg-surface border border-border rounded-2xl overflow-hidden">
                  <table className="w-full">
                    <thead className="border-b border-border">
                      <tr>{['#', 'ยอด', 'สถานะ', 'วันที่', 'หมายเหตุ'].map(h => <th key={h} className="text-left px-5 py-3 text-sm text-gray-500">{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {topups.length === 0 ? (
                        <tr><td colSpan={5} className="text-center py-8 text-gray-500">ยังไม่มีประวัติการเติมเงิน</td></tr>
                      ) : topups.map((t) => (
                        <tr key={t.id} className="border-b border-border last:border-0 hover:bg-white/2 transition-colors">
                          <td className="px-5 py-3 text-gray-500 text-sm">#{t.id}</td>
                          <td className="px-5 py-3 text-primary font-bold">฿{t.amount.toLocaleString()}</td>
                          <td className="px-5 py-3"><StatusBadge status={t.status} /></td>
                          <td className="px-5 py-3 text-gray-500 text-sm">{new Date(t.created_at).toLocaleDateString('th-TH')}</td>
                          <td className="px-5 py-3 text-red-400 text-xs italic">{t.status === 'rejected' ? (t.rejection_reason || 'ข้อมูลไม่ถูกต้อง') : '--'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {tab === 'wishlist' && (
              <motion.div key="wishlist" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">❤️ รายการโปรด ({wishlist.length})</h2>
                  <button onClick={loadWishlist} className="text-xs text-primary hover:underline">รีเฟรช</button>
                </div>
                
                {wishlistLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-40 bg-white/5 rounded-2xl animate-pulse" />)}
                  </div>
                ) : wishlist.length === 0 ? (
                  <div className="py-20 text-center glass rounded-3xl border border-dashed border-white/10">
                    <Heart size={48} className="mx-auto text-gray-700 mb-4 opacity-20" />
                    <p className="text-gray-500">ยังไม่มีรายการโปรด</p>
                    <button onClick={() => navigate('/products')} className="mt-4 text-primary font-bold hover:underline">ไปดูตลาดสินค้ากัน!</button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {wishlist.map((p) => (
                      <div key={p.id} className="bg-surface border border-border rounded-2xl overflow-hidden flex group">
                        <div className="w-1/3 aspect-square overflow-hidden">
                           <img 
                            src={p.image?.startsWith('http') ? p.image : `/uploads/${p.image}`} 
                            alt={p.name} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                          />
                        </div>
                        <div className="p-4 flex-1 flex flex-col justify-between">
                          <div>
                            <h4 className="font-bold text-white text-sm line-clamp-1">{p.name}</h4>
                            <p className="text-primary font-bold text-lg">฿{p.price.toLocaleString()}</p>
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => navigate(`/products/${p.id}`)}
                              className="btn-outline flex-1 py-1.5 text-xs"
                            >ดูรายละเอียด</button>
                            <button 
                              onClick={() => deleteFromWishlist(p.id)}
                              className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
                <img src={adminInfo.promptpay_qr} alt="QR" className="w-40 h-40 object-contain bg-white rounded-xl mx-auto p-2" />
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
