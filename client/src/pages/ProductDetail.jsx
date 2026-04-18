import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Zap, ArrowLeft, User, Heart, MapPin, Truck, QrCode, ShieldCheck, Star, Clock, Globe } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { PageLoader } from '../components/Spinner';
import Modal from '../components/Modal';
import ProductGallery from '../components/ProductGallery';
import { getImageUrl } from '../lib/urlHelper';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { addToCart, items } = useCart();
  const { showToast } = useToast();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState('menu'); // menu | meetup | cod | qr
  const [adminSettings, setAdminSettings] = useState(null);
  const [meetForm, setMeetForm] = useState({ date: '', time: '', location: '', contact: '', note: '' });
  const [codForm, setCodForm] = useState({ name: '', phone: '', address: '' });
  const [placing, setPlacing] = useState(false);
  const [inWishlist, setInWishlist] = useState(false);
  const [togglingWishlist, setTogglingWishlist] = useState(false);

  useEffect(() => {
    fetchProduct();
    checkWishlist();
    loadSettings();
  }, [id, user]);

  const loadSettings = async () => {
    const { data } = await supabase.from('settings').select('*').single();
    if (data) setAdminSettings(data);
  };

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const { data: productData, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      let sellerName = 'GB Official Store';
      if (productData.user_id) {
        const { data: profile } = await supabase.from('profiles').select('username').eq('id', productData.user_id).single();
        if (profile) sellerName = profile.username;
      }
      
      setProduct({ ...productData, seller_name: sellerName });
    } catch (err) {
      showToast('โหลดสินค้าไม่สำเร็จ', 'error');
    } finally {
      setLoading(false);
    }
  };

  const checkWishlist = async () => {
    if (!user) return;
    try {
      const { data } = await supabase.from('wishlist').select('*').eq('product_id', id).eq('user_id', user.id).single();
      setInWishlist(!!data);
    } catch { /* ignore */ }
  };

  const toggleWishlist = async () => {
    if (!user) { 
      showToast('กรุณาเข้าสู่ระบบก่อน', 'error'); 
      navigate('/login', { state: { from: location } }); 
      return; 
    }
    setTogglingWishlist(true);
    try {
      if (inWishlist) {
        await supabase.from('wishlist').delete().eq('product_id', id).eq('user_id', user.id);
        setInWishlist(false);
        showToast('ลบออกจากรายการโปรดแล้ว', 'success');
      } else {
        await supabase.from('wishlist').insert({ product_id: id, user_id: user.id });
        setInWishlist(true);
        showToast('เพิ่มลงในรายการโปรดแล้ว', 'success');
      }
    } catch { showToast('เกิดข้อผิดพลาด', 'error'); }
    finally { setTogglingWishlist(false); }
  };

  const isOwn = user && product && user.id === product.user_id;
  const inCart = items.some((p) => p.id === product?.id);

  const media = product ? [
    { type: 'image', src: getImageUrl(product.image_url, 'product-images') },
    ...(product.images ? (() => { try { return JSON.parse(product.images); } catch(e) { return []; } })().map(img => ({ type: 'image', src: getImageUrl(img, 'product-images') })) : []),
    ...(product.videos ? (() => { try { return JSON.parse(product.videos); } catch(e) { return []; } })().map(vid => ({ type: 'video', src: getImageUrl(vid, 'product-images') })) : [])
  ].filter(m => m.src) : [];

  const handleAddToCart = () => {
    if (!product) return;
    if (!user) {
      showToast('กรุณาเข้าสู่ระบบก่อนเพิ่มสินค้า', 'error');
      navigate('/login', { state: { from: location } });
      return;
    }
    addToCart({ id: product.id, name: product.name, price: product.price, image: product.image_url });
    showToast('เพิ่มลงตะกร้าเรียบร้อย 🛒', 'success');
  };

  const openBuy = () => {
    if (!user) { 
      showToast('กรุณาเข้าสู่ระบบก่อน', 'error'); 
      navigate('/login', { state: { from: location } }); 
      return; 
    }
    setModalStep('menu');
    setModalOpen(true);
  };

  const placeOrder = async (method) => {
    setPlacing(true);
    try {
      const { data, error } = await supabase.rpc('handle_purchase', {
        p_user_id: user.id,
        p_item_ids: [parseInt(id)],
        p_method: method,
        p_shipping_name: (method === 'cod' || method === 'qr') ? (codForm.name || user.username) : null,
        p_shipping_phone: (method === 'cod' || method === 'qr') ? codForm.phone : null,
        p_shipping_address: (method === 'cod' || method === 'qr') ? codForm.address : null,
        p_meet_date: (method === 'meetup') ? meetForm.date : null,
        p_meet_time: (method === 'meetup') ? meetForm.time : null,
        p_meet_location: (method === 'meetup') ? meetForm.location : null,
        p_meet_note: (method === 'meetup') ? `ติดต่อ: ${meetForm.contact}\n${meetForm.note}` : null
      });

      if (error) throw error;
      if (data && !data.success) throw new Error(data.message);

      showToast('ยืนยันคำสั่งซื้อสำเร็จ! 🎉', 'success');
      setModalOpen(false);
      navigate('/my-orders');
    } catch (e) {
      showToast(e.message || 'Error placement', 'error');
    } finally { setPlacing(false); }
  };

  if (loading) return <PageLoader />;
  if (!product) return <div className="text-center py-40 text-slate-400 font-bold">ไม่พบสินค้าที่คุณต้องการ</div>;

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-20">
        <button onClick={() => navigate(-1)} className="flex items-center gap-3 text-slate-400 hover:text-slate-900 mb-12 transition-all font-black uppercase text-[10px] tracking-widest group">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Marketplace
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
          {/* Left: Gallery */}
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="w-full">
            <ProductGallery media={media} />
          </motion.div>

          {/* Right: Details */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }} className="flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <span className="bg-slate-50 text-slate-900 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl border border-slate-100 shadow-sm">
                Condition: {product.condition_percent}% Perfect
              </span>
              <button 
                onClick={toggleWishlist}
                disabled={togglingWishlist}
                className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-glow ${inWishlist ? 'bg-slate-900 text-white' : 'bg-white text-slate-200 hover:text-slate-900 border border-slate-50'}`}
              >
                <Heart size={24} fill={inWishlist ? 'white' : 'none'} />
              </button>
            </div>

            <h1 className="text-5xl md:text-6xl font-black text-slate-900 mb-4 leading-none tracking-tighter">{product.name}</h1>
            <div className="flex items-center gap-2 mb-10 text-slate-900">
              <Star size={16} fill="currentColor" />
              <Star size={16} fill="currentColor" />
              <Star size={16} fill="currentColor" />
              <Star size={16} fill="currentColor" />
              <Star size={16} fill="currentColor" />
              <span className="text-slate-400 text-[10px] font-black uppercase ml-4 tracking-[0.2em] opacity-60">Authentication Passed</span>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-[32px] p-8 mb-10 flex flex-col gap-2 shadow-sm">
               <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none">Price Total</span>
               <div className="flex items-end gap-3">
                  <span className="text-5xl font-black text-slate-900 tracking-tighter">฿{product.price.toLocaleString()}</span>
                  <span className="text-slate-400 text-xs font-bold opacity-60 mb-1 tracking-tight">Best price guaranteed</span>
               </div>
            </div>

            <div className="space-y-8 mb-12">
              <div className="prose prose-slate">
                <p className="text-xl text-slate-500 leading-relaxed font-bold tracking-tight">
                  {product.description || 'ไม่มีรายละเอียดเพิ่มเติมสำหรับสินค้านี้'}
                </p>
              </div>
              
              <div className="flex items-center gap-10 py-6 border-y border-slate-50">
                 <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${product.stock > 0 ? 'bg-green-500' : 'bg-red-500'} shadow-glow-sm`} />
                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{product.stock > 0 ? `Stock: ${product.stock} units` : 'No Stock'}</span>
                 </div>
                 <div className="flex items-center gap-3 text-slate-400 font-black text-[10px] uppercase tracking-widest">
                    <ShieldCheck size={18} className="text-slate-900" />
                    <span>Secure Packaging</span>
                 </div>
              </div>
            </div>

            {!isOwn && product.stock > 0 && (
              <div className="flex flex-col gap-4">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={openBuy} className="bg-slate-900 text-white py-6 text-2xl font-black flex items-center justify-center gap-3 rounded-2xl shadow-soft transition-all hover:brightness-110">
                  <Zap size={24} fill="white" /> ซื้อทันที
                </motion.button>
                <div className="grid grid-cols-1 gap-4">
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleAddToCart} disabled={inCart} className={`bg-white text-slate-900 border border-slate-200 py-6 text-xl font-black flex items-center justify-center gap-3 rounded-2xl hover:bg-slate-50 transition-all ${inCart ? 'opacity-50 grayscale' : ''}`}>
                    <ShoppingCart size={24} /> {inCart ? 'อยู่ในตะกร้าแล้ว' : 'ใส่รถเช็น'}
                  </motion.button>
                </div>
              </div>
            )}

            {isOwn && (
              <div className="p-6 bg-slate-900 text-white font-black text-center rounded-2xl shadow-glow">
                🏷️ คุณคือเจ้าของรายการนี้ (Admin Mode)
              </div>
            )}

            <div className="mt-16 pt-10 border-t border-slate-50 flex items-center gap-6">
               <div className="w-16 h-16 bg-slate-50 rounded-[20px] flex items-center justify-center text-slate-900 font-black text-xl border border-slate-100 shadow-sm">
                  {product.seller_name?.slice(0,1).toUpperCase()}
               </div>
               <div>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1 leading-none">Premium Dealer</p>
                  <p className="text-2xl text-slate-900 font-black tracking-tighter">{product.seller_name}</p>
               </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Payment Modal — Clean White Overhaul */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Checkout Session">
         <AnimatePresence mode="wait">
            {modalStep === 'menu' && (
              <motion.div key="menu" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col gap-4 p-4">
                <button onClick={() => setModalStep('qr')} className="group flex items-center justify-between p-7 bg-white border border-slate-100 rounded-[32px] hover:border-slate-900 transition-all shadow-sm">
                   <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-soft"><QrCode size={32} /></div>
                      <div className="text-left">
                         <p className="font-black text-slate-900 text-lg leading-tight">โอนเงิน / QR Payment</p>
                         <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Instant Transfer</p>
                      </div>
                   </div>
                   <Zap size={24} className="text-slate-900 opacity-0 group-hover:opacity-100 transition-all" />
                </button>
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => setModalStep('meetup')} className="flex flex-col items-center justify-center p-8 bg-slate-50 border border-transparent hover:border-slate-200 hover:bg-white rounded-[32px] transition-all group">
                     <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm text-slate-900 group-hover:bg-slate-900 group-hover:text-white transition-all"><MapPin size={28} /></div>
                     <p className="font-black text-slate-900 text-sm tracking-tight uppercase">นัดรับสินค้า</p>
                     <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-2">Meetup</p>
                  </button>
                  <button onClick={() => setModalStep('cod')} className="flex flex-col items-center justify-center p-8 bg-slate-50 border border-transparent hover:border-slate-200 hover:bg-white rounded-[32px] transition-all group">
                     <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm text-slate-900 group-hover:bg-slate-900 group-hover:text-white transition-all"><Truck size={28} /></div>
                     <p className="font-black text-slate-900 text-sm tracking-tight uppercase">เก็บเงินปลายทาง</p>
                     <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-2">COD</p>
                  </button>
                </div>
              </motion.div>
            )}

            {modalStep === 'qr' && (
              <motion.div key="qr" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8 p-4">
                <button onClick={() => setModalStep('menu')} className="text-[10px] font-black text-slate-400 hover:text-slate-900 mb-6 flex items-center gap-2 uppercase tracking-widest transition-all">← Back to Options</button>
                <div className="bg-slate-50 border border-slate-100 rounded-[40px] p-10 text-center shadow-inner">
                   {adminSettings?.promptpay_qr ? (
                     <div className="bg-white p-4 rounded-[32px] border border-slate-100 inline-block shadow-soft mb-8">
                        <img src={adminSettings.promptpay_qr} className="w-52 h-52 object-contain" />
                     </div>
                   ) : (
                     <div className="w-52 h-52 mx-auto bg-white rounded-[32px] flex items-center justify-center mb-8 border border-slate-100 shadow-sm"><QrCode size={56} className="text-slate-200" /></div>
                   )}
                   <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2 leading-none">PromptPay Account</p>
                   <p className="font-black text-slate-900 text-3xl tracking-tighter">{adminSettings?.promptpay_number || '08X-XXX-XXXX'}</p>
                   <div className="h-0.5 w-12 bg-slate-200 mx-auto my-6" />
                   <p className="text-[11px] text-slate-900 font-black uppercase tracking-[0.2em] mb-1">Total Bill</p>
                   <p className="text-4xl text-slate-900 font-black">฿{product.price.toLocaleString()}</p>
                </div>
                <div className="space-y-6">
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><label className="label">Full Name</label><input className="input-field" placeholder="ชื่อ-นามสกุล" value={codForm.name} onChange={e => setCodForm(p => ({...p, name: e.target.value}))} /></div>
                      <div className="space-y-2"><label className="label">Phone Line</label><input className="input-field" placeholder="08X-XXX-XXXX" value={codForm.phone} onChange={e => setCodForm(p => ({...p, phone: e.target.value}))} /></div>
                   </div>
                </div>
                <button onClick={() => placeOrder('qr')} disabled={placing} className="bg-slate-900 text-white w-full py-6 text-xl font-black rounded-2xl shadow-soft hover:brightness-110 active:scale-95 transition-all">
                   {placing ? 'PLACING ORDER...' : 'ยืนยันการโอนเงิน (แจ้งสลิป)'}
                </button>
              </motion.div>
            )}

            {modalStep === 'meetup' && (
              <motion.div key="meetup" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="p-4 space-y-8">
                <button onClick={() => setModalStep('menu')} className="text-[10px] font-black text-slate-400 mb-8 flex items-center gap-2 uppercase tracking-widest">← Back to Options</button>
                <div className="flex items-center gap-4 mb-4">
                   <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-900 shadow-sm"><MapPin size={24} /></div>
                   <div>
                      <h4 className="text-2xl font-black text-slate-900 tracking-tight">Meetup Details</h4>
                      <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">การนัดรับสินค้าจริง</p>
                   </div>
                </div>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2"><label className="label">Date Select</label><input type="date" className="input-field" value={meetForm.date} onChange={e => setMeetForm(p => ({...p, date: e.target.value}))} /></div>
                    <div className="space-y-2"><label className="label">Time (Approx)</label><input type="time" className="input-field" value={meetForm.time} onChange={e => setMeetForm(p => ({...p, time: e.target.value}))} /></div>
                  </div>
                  <div className="space-y-2"><label className="label">Meeting Point</label><input className="input-field" placeholder="ห้างเซ็นทรัล, หน้าสถานี BTS, มหาลัย..." value={meetForm.location} onChange={e => setMeetForm(p => ({...p, location: e.target.value}))} /></div>
                  <div className="space-y-2"><label className="label">Contact Info</label><input className="input-field" placeholder="FB Name / Line ID / Phone" value={meetForm.contact} onChange={e => setMeetForm(p => ({...p, contact: e.target.value}))} /></div>
                  <button onClick={() => {
                    if(!meetForm.location) return showToast('กรุณาระบุสถานที่', 'error');
                    placeOrder('meetup');
                  }} disabled={placing} className="bg-slate-900 text-white w-full py-6 text-xl font-black rounded-2xl shadow-glow transition-all">CONFIRM MEETUP</button>
                </div>
              </motion.div>
            )}

            {modalStep === 'cod' && (
               <motion.div key="cod" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="p-4 space-y-8">
                  <button onClick={() => setModalStep('menu')} className="text-[10px] font-black text-slate-400 mb-8 flex items-center gap-2 uppercase tracking-widest">← Back to Options</button>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-900 shadow-sm"><Truck size={24} /></div>
                    <div>
                        <h4 className="text-2xl font-black text-slate-900 tracking-tight">Cash on Delivery</h4>
                        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">ชำระเงินเมื่อได้รับสินค้า</p>
                    </div>
                  </div>
                  <div className="space-y-6">
                     <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2"><label className="label">Reciver Name</label><input className="input-field" value={codForm.name} onChange={e => setCodForm(p => ({...p, name: e.target.value}))} /></div>
                        <div className="space-y-2"><label className="label">Phone Line</label><input className="input-field" value={codForm.phone} onChange={e => setCodForm(p => ({...p, phone: e.target.value}))} /></div>
                     </div>
                     <div className="space-y-2"><label className="label">Shipping Address</label><textarea rows={5} className="input-field resize-none px-6 py-6" placeholder="รหัสไปรษณีย์, หมู่บ้าน, ถนน..." value={codForm.address} onChange={e => setCodForm(p => ({...p, address: e.target.value}))} /></div>
                     <button onClick={() => {
                       if(!codForm.name || !codForm.address) return showToast('กรุณาใส่ที่อยู่ให้ครบ', 'error');
                       placeOrder('cod');
                     }} disabled={placing} className="bg-slate-900 text-white w-full py-6 text-xl font-black rounded-2xl shadow-glow transition-all">PLACE COD ORDER</button>
                  </div>
               </motion.div>
            )}
         </AnimatePresence>
      </Modal>
    </div>
  );
}
