import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import { PageLoader } from '../components/Spinner';
import { supabase } from '../lib/supabase';
import { ShoppingBag, User, MessageSquare, Phone, Globe, Heart, Settings, Camera, Save, Trash2 } from 'lucide-react';
import { validateImageFile, generateSafeFilename, sanitizeText } from '../lib/security';

const TABS = [
  { id: 'settings', label: 'การตั้งค่าโปรไฟล์', icon: <Settings size={18} /> },
  { id: 'wishlist', label: 'รายการโปรด', icon: <Heart size={18} /> },
  { id: 'contact', label: 'ติดต่อสอบถาม', icon: <MessageSquare size={18} /> },
];

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [tab, setTab] = useState('settings');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adminInfo, setAdminInfo] = useState(null);
  const [wishlist, setWishlist] = useState([]);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  
  const [settingsForm, setSettingsForm] = useState({ username: '', avatar: null });
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    if (!authLoading && !user) { navigate('/login'); return; }
    if (user) { 
      loadProfile(); 
      loadSettings();
      loadWishlist();
    }
  }, [user, authLoading]);

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
        .select('id, username, avatar_url, role')
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

      if (settingsForm.avatar) {
        const check = validateImageFile(settingsForm.avatar, { maxSizeMB: 2 });
        if (!check.valid) throw new Error(check.error);

        const filePath = generateSafeFilename(settingsForm.avatar, 'avatars');
        const { error: uploadError } = await supabase.storage.from('product-images').upload(filePath, settingsForm.avatar);
        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(filePath);
        avatarUrl = publicUrl;
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ username: cleanUsername, avatar_url: avatarUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

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

  if (authLoading || loading) return <PageLoader />;

  const u = profile;
  const avatarSrc = u?.avatar_url || `https://ui-avatars.com/api/?name=${u?.username || 'U'}&background=0F172A&color=fff`;

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white border border-slate-100 rounded-[40px] p-8 sticky top-32 shadow-soft"
            >
              <div className="flex flex-col items-center text-center mb-10">
                <div className="w-24 h-24 rounded-full bg-slate-50 flex items-center justify-center mb-6 overflow-hidden border border-slate-100 shadow-inner">
                  <img src={avatarSrc} alt="avatar" className="w-full h-full object-cover" />
                </div>
                <h3 className="font-black text-slate-900 text-2xl tracking-tighter mb-1">{u?.username}</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Member Account</p>
              </div>

              <nav className="space-y-2">
                {TABS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${
                      tab === t.id
                        ? 'bg-slate-900 text-white shadow-soft'
                        : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    {t.icon} {t.label}
                  </button>
                ))}
                <div className="pt-6 mt-6 border-t border-slate-50">
                  <button
                    onClick={() => navigate('/my-orders')}
                    className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 hover:text-slate-900 transition-all duration-300"
                  >
                    <ShoppingBag size={18} /> ประวัติการสั่งซื้อ
                  </button>
                </div>
              </nav>
            </motion.div>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-3">
            <AnimatePresence mode="wait">
              {tab === 'settings' && (
                <motion.div key="settings" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                  <div className="flex items-center gap-4 mb-10">
                    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-900 shadow-sm border border-slate-100">
                      <Settings size={28} />
                    </div>
                    <div>
                        <h2 className="text-4xl font-black text-slate-900 tracking-tight">การตั้งค่าโปรไฟล์</h2>
                        <p className="text-slate-400 font-bold text-sm">จัดการข้อมูลส่วนตัวและภาพโปรไฟล์ของคุณ</p>
                    </div>
                  </div>
                  
                  <div className="bg-white border border-slate-100 rounded-[48px] p-12 shadow-soft">
                    <form onSubmit={handleUpdateProfile} className="space-y-10">
                      <div className="flex flex-col items-center gap-6">
                        <div className="relative group">
                          <div className="w-40 h-40 rounded-full border-2 border-slate-100 overflow-hidden bg-slate-50 relative shadow-inner">
                            <img 
                              src={previewUrl || avatarSrc} 
                              className="w-full h-full object-cover" 
                              alt="Avatar" 
                            />
                            <label className="absolute inset-0 bg-slate-900/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer backdrop-blur-[2px]">
                              <Camera size={32} className="text-white mb-2" />
                              <span className="text-[10px] text-white font-black uppercase tracking-widest">Update</span>
                              <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                            </label>
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-300 font-black uppercase tracking-[0.2em]">Profile Picture (PNG, JPG Max 2MB)</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                          <label className="label">Username</label>
                          <input 
                            type="text" 
                            value={settingsForm.username}
                            onChange={(e) => setSettingsForm(p => ({ ...p, username: e.target.value }))}
                            className="input-field"
                            placeholder="Display Name"
                          />
                        </div>

                        <div className="space-y-3">
                          <label className="label">Contact Email</label>
                          <input 
                            type="text" 
                            disabled
                            value={user?.email}
                            className="input-field bg-slate-50 text-slate-400 cursor-not-allowed border-dashed"
                          />
                        </div>
                      </div>

                      <div className="pt-10 border-t border-slate-50 flex justify-end">
                        <button
                          type="submit"
                          disabled={updatingProfile}
                          className="bg-slate-900 text-white font-black text-lg px-12 py-5 rounded-2xl shadow-soft hover:brightness-110 active:scale-95 transition-all min-w-[240px]"
                        >
                          {updatingProfile ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
                        </button>
                      </div>
                    </form>
                  </div>
                </motion.div>
              )}

              {tab === 'wishlist' && (
                <motion.div key="wishlist" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                  <div className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-900 shadow-sm border border-slate-100">
                        <Heart size={28} />
                      </div>
                      <div>
                        <h2 className="text-4xl font-black text-slate-900 tracking-tight">รายการโปรด</h2>
                        <p className="text-slate-400 font-bold text-sm">สินค้าที่คุณถูกใจทั้งหมด {wishlist.length} รายการ</p>
                      </div>
                    </div>
                  </div>
                  
                  {wishlistLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {[1, 2, 3].map(i => <div key={i} className="h-64 bg-slate-50 animate-pulse rounded-[40px] border border-slate-100" />)}
                    </div>
                  ) : wishlist.length === 0 ? (
                    <div className="py-32 text-center bg-white border border-slate-100 rounded-[48px] shadow-soft">
                      <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200 mx-auto mb-8 shadow-inner">
                         <Heart size={40} />
                      </div>
                      <p className="text-slate-400 font-bold text-lg mb-10">ยังไม่มีสินค้าในรายการโปรดของคุณ</p>
                      <button onClick={() => navigate('/products')} className="bg-slate-900 text-white font-black px-12 py-5 rounded-2xl shadow-soft hover:brightness-110 transition-all">ไปเลือกชมสินค้า</button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {wishlist.map((p) => (
                        <div key={p.id} className="bg-white border border-slate-100 rounded-[40px] overflow-hidden shadow-soft group hover:border-slate-200 transition-all">
                          <div className="aspect-[4/3] overflow-hidden relative">
                             <img 
                              src={p.image} 
                              alt={p.name} 
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                            />
                            <div className="absolute top-4 left-4">
                               <span className="bg-white/95 backdrop-blur-md px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-900 shadow-sm">{p.category}</span>
                            </div>
                          </div>
                          <div className="p-8">
                            <h4 className="font-black text-slate-900 text-lg mb-2 line-clamp-1">{p.name}</h4>
                            <p className="text-primary font-black text-2xl mb-8">฿{p.price.toLocaleString()}</p>
                            <div className="flex gap-3">
                              <button 
                                onClick={() => navigate(`/products/${p.id}`)}
                                className="bg-slate-900 text-white font-black text-xs px-8 py-4 rounded-xl flex-1 shadow-soft hover:brightness-110 transition-all"
                              >View Item</button>
                              <button 
                                onClick={() => deleteFromWishlist(p.id)}
                                className="w-12 h-12 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center hover:text-red-500 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {tab === 'contact' && (
                <motion.div key="contact" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                  <div className="flex items-center gap-4 mb-10">
                    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-900 shadow-sm border border-slate-100">
                      <MessageSquare size={28} />
                    </div>
                    <div>
                        <h2 className="text-4xl font-black text-slate-900 tracking-tight">ติดต่อสอบถาม</h2>
                        <p className="text-slate-400 font-bold text-sm">ศูนย์ช่วยเหลือและช่องทางติดต่อแอดมิน</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-white border border-slate-100 rounded-[48px] p-12 shadow-soft flex flex-col items-center text-center">
                      <div className="w-24 h-24 rounded-[32px] bg-slate-50 flex items-center justify-center mb-8 text-slate-900 shadow-inner">
                        <Phone size={40} />
                      </div>
                      <h3 className="font-black text-slate-900 text-2xl mb-4">Customer Support</h3>
                      <p className="text-slate-400 font-bold text-lg mb-10 leading-relaxed">มีข้อสงสัยหรือต้องการความช่วยเหลือเพิ่มเติม? ติดต่อเราได้ทางช่องทางต่างๆ ด้านล่างนี้ครับ</p>
                      
                      <div className="space-y-4 w-full">
                        <a href={`tel:${adminInfo?.phone || '0829879790'}`} className="flex items-center gap-6 p-6 bg-slate-50 rounded-[28px] border border-transparent hover:border-slate-200 hover:bg-white transition-all group">
                          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-slate-900 group-hover:text-primary transition-all shadow-sm">
                            <Phone size={24} />
                          </div>
                          <div className="text-left">
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1">Direct Call</p>
                            <p className="text-lg text-slate-900 font-black tracking-tight">{adminInfo?.phone || '082-987-9790'}</p>
                          </div>
                        </a>
                        
                        <a href="https://lin.ee/Z1pMLkJ" target="_blank" rel="noopener noreferrer" className="flex items-center gap-6 p-6 bg-slate-50 rounded-[28px] border border-transparent hover:border-slate-200 hover:bg-white transition-all group">
                          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-green-500 shadow-sm group-hover:bg-green-50 transition-all">
                            <MessageSquare size={24} />
                          </div>
                          <div className="text-left">
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1">Line Official</p>
                            <p className="text-lg text-slate-900 font-black tracking-tight">@gbmoneyshop</p>
                          </div>
                        </a>
                      </div>
                    </div>

                    <div className="space-y-8">
                      <div className="bg-white border border-slate-100 rounded-[48px] p-10 shadow-soft">
                        <h3 className="font-black text-slate-900 text-xl mb-8 flex items-center gap-3">
                          <Globe size={24} className="text-primary" /> เวลาทำการ
                        </h3>
                        <div className="space-y-6">
                          <div className="flex justify-between items-center bg-slate-50/50 p-4 rounded-2xl border border-slate-50">
                            <span className="text-slate-400 font-black uppercase text-[10px] tracking-widest">จันทร์ - ศุกร์</span>
                            <span className="text-slate-900 font-black">09:00 - 22:00</span>
                          </div>
                          <div className="flex justify-between items-center bg-slate-50/50 p-4 rounded-2xl border border-slate-50">
                            <span className="text-slate-400 font-black uppercase text-[10px] tracking-widest">เสาร์ - อาทิตย์</span>
                            <span className="text-slate-900 font-black">10:00 - 21:00</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-900 rounded-[32px] p-8 shadow-glow">
                        <p className="text-slate-100 font-bold leading-relaxed text-sm">
                          <span className="text-primary font-black uppercase tracking-widest text-xs block mb-2">Note:</span> 
                          หากติดต่อมานอกเวลาทำการ แอดมินจะตอบกลับโดยเร็วที่สุดในเวลาทำการวันถัดไปครับ ขอบคุณที่ไว้วางใจใช้บริการ GBshop
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
}
