import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, Zap, ArrowLeft, User, Heart } from 'lucide-react';
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
  const [modalStep, setModalStep] = useState('menu'); // menu | meetup | cod | qr | wallet | angpao
  const [meetForm, setMeetForm] = useState({ date: '', time: '', location: '', contact: '', note: '' });
  const [codForm, setCodForm] = useState({ name: '', phone: '', address: '' });
  const [walletInfo, setWalletInfo] = useState(null);
  const [qrUrl, setQrUrl] = useState('');
  const [placing, setPlacing] = useState(false);
  const [codErrors, setCodErrors] = useState({});
  const [inWishlist, setInWishlist] = useState(false);
  const [togglingWishlist, setTogglingWishlist] = useState(false);

  useEffect(() => {
    fetchProduct();
    checkWishlist();
  }, [id, user]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const { data: productData, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      let sellerName = 'ผู้ขายพัฒนาระบบ';
      if (productData.user_id) {
        const { data: profile } = await supabase.from('profiles').select('username').eq('id', productData.user_id).single();
        if (profile) sellerName = profile.username;
      }
      
      setProduct({
        ...productData,
        seller_name: sellerName
      });
    } catch (err) {
      showToast('โหลดสินค้าไม่สำเร็จ', 'error');
    } finally {
      setLoading(false);
    }
  };

  const checkWishlist = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('wishlist')
        .select('*')
        .eq('product_id', id)
        .eq('user_id', user.id)
        .single();
      
      setInWishlist(!!data);
    } catch (err) {
      console.error('Wishlist check error:', err);
    }
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
    } catch (err) {
      showToast('เกิดข้อผิดพลาด', 'error');
    } finally {
      setTogglingWishlist(false);
    }
  };

  const isOwn = user && product && user.id === product.user_id;
  const inCart = items.some((p) => p.id === product?.id);

  // Prepare Media Array for Gallery
  const media = product ? [
    { type: 'image', src: getImageUrl(product.image_url, 'product-images') },
    ...(product.images ? (() => { try { return JSON.parse(product.images); } catch(e) { return []; } })().map(img => ({ type: 'image', src: getImageUrl(img, 'product-images') })) : []),
    ...(product.videos ? (() => { try { return JSON.parse(product.videos); } catch(e) { return []; } })().map(vid => ({ type: 'video', src: getImageUrl(vid, 'product-images') })) : [])
  ].filter(m => m.src) : [];

  const handleAddToCart = () => {
    if (!product) return;
    if (!user) {
      showToast('กรุณาเข้าสู่ระบบก่อนเพิ่มสินค้าลงตะกร้า', 'error');
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

  const showQR = () => {
    setQrUrl(`https://api.gb.money/qr?amount=${product.price}`); // Link to external QR generator
    setModalStep('qr');
  };

  const showWalletStep = async () => {
    // Note: In Supabase migration, we rely on the AuthContext user object which has the profile/balance
    setWalletInfo(user);
    setModalStep('wallet');
  };

  const placeOrder = async (method) => {
    setPlacing(true);
    try {
      const { data, error } = await supabase.rpc('handle_purchase', {
        p_user_id: user.id,
        p_item_ids: [parseInt(id)],
        p_method: method,
        p_shipping_name: (method === 'cod') ? codForm.name : null,
        p_shipping_phone: (method === 'cod') ? codForm.phone : null,
        p_shipping_address: (method === 'cod') ? codForm.address : null,
        p_meet_date: (method === 'meetup') ? meetForm.date : null,
        p_meet_time: (method === 'meetup') ? meetForm.time : null,
        p_meet_location: (method === 'meetup') ? meetForm.location : null,
        p_meet_note: (method === 'meetup') ? `ติดต่อ: ${meetForm.contact}\n${meetForm.note}` : null
      });

      if (error) throw error;
      if (data && !data.success) throw new Error(data.message);

      showToast(method === 'meetup' ? 'นัดรับสินค้าเรียบร้อย!' : 'สั่งซื้อสำเร็จ! ตัดสต็อกและเงินแล้ว', 'success');
      setModalOpen(false);
      navigate('/dashboard');
    } catch (e) {
      showToast(e.message || 'เกิดข้อผิดพลาดในการสั่งซื้อ', 'error');
    } finally { setPlacing(false); }
  };

  if (loading) return <PageLoader />;
  if (!product) return <div className="text-center py-20 text-gray-400">ไม่พบสินค้า</div>;

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors group">
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> กลับ
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Gallery Section */}
        <motion.div
           initial={{ opacity: 0, x: -30 }}
           animate={{ opacity: 1, x: 0 }}
           transition={{ duration: 0.5 }}
           className="w-full"
        >
          <ProductGallery media={media} />
        </motion.div>

        {/* Info Section */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-col"
        >
          <div className="flex items-center justify-between mb-4">
             <span className="inline-block bg-primary/10 border border-primary/30 text-primary text-sm font-semibold px-3 py-1 rounded-full w-fit">
              สภาพสินค้า {product.condition_percent}%
            </span>
            {user && (
              <button 
                onClick={toggleWishlist}
                disabled={togglingWishlist}
                className={`p-2 rounded-full transition-all duration-300 ${inWishlist ? 'bg-red-500/20 text-red-500 shadow-glow-sm' : 'bg-surface border border-border text-gray-400 hover:text-white'}`}
              >
                <Heart size={20} fill={inWishlist ? 'currentColor' : 'none'} />
              </button>
            )}
          </div>
          <h1 className="text-4xl font-extrabold text-white mb-3">{product.name}</h1>
          <div className="flex items-center gap-4 mb-3">
            <div className="text-4xl font-bold text-primary">฿{product.price.toLocaleString()}</div>
          </div>
          <div className={`text-sm font-semibold mb-4 ${product.stock <= 0 ? 'text-red-400' : 'text-green-400'}`}>
            {product.stock <= 0 ? '⛔ หมดสต็อก' : `✅ สต็อกเหลือ ${product.stock} ชิ้น`}
          </div>
          <p className="text-gray-400 leading-relaxed mb-8 whitespace-pre-wrap">
            {product.description || 'ไม่มีคำอธิบายสินค้า'}
          </p>

          {/* Action Buttons */}
          {!isOwn && (
            <div className="flex flex-col gap-3">
              {product.stock > 0 ? (
                <>
                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    onClick={openBuy}
                    className="btn-primary py-4 text-lg flex items-center justify-center gap-2"
                  >
                    <Zap size={20} /> ซื้อเลย
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    onClick={handleAddToCart}
                    className={`btn-outline py-4 text-lg flex items-center justify-center gap-2 ${inCart ? 'opacity-60' : ''}`}
                    disabled={inCart}
                  >
                    <ShoppingCart size={20} /> {inCart ? 'อยู่ในตะกร้าแล้ว' : 'เพิ่มลงตะกร้า'}
                  </motion.button>
                </>
              ) : (
                <div className="w-full py-4 bg-gray-500/10 border border-gray-500/20 rounded-2xl text-gray-500 text-center font-bold flex items-center justify-center gap-2 cursor-not-allowed">
                  <X size={20} /> ขออภัย! สินค้าหมดสต็อก
                </div>
              )}
            </div>
          )}
          {isOwn && (
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-yellow-400 text-sm text-center">
              🏷️ นี่คือสินค้าของคุณ
            </div>
          )}

          {/* Seller */}
          <div className="mt-8 p-4 bg-surface border border-border rounded-xl flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
              <User size={18} className="text-primary" />
            </div>
            <div>
              <p className="text-xs text-gray-500">ลงขายโดย</p>
              <p className="font-semibold text-white">{product.seller_name}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Payment Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="เลือกวิธีชำระเงิน" maxWidth="max-w-md">
        {modalStep === 'menu' && (
          <div className="flex flex-col gap-3">
            <button onClick={() => setModalStep('meetup')} className="btn-payment-selection">🤝 นัดรับสินค้า (Meetup)</button>
            <button onClick={() => setModalStep('cod')} className="btn-payment-selection">🚚 เก็บเงินปลายทาง (COD)</button>
            <button onClick={showWalletStep} className="btn-payment-selection hover:bg-purple-600 hover:border-purple-600">💳 ชำระด้วย GB Wallet</button>
          </div>
        )}
        {modalStep === 'meetup' && (
          <div className="space-y-4">
            <button onClick={() => setModalStep('menu')} className="text-sm text-gray-400 hover:text-white mb-2 flex items-center gap-1"><ArrowLeft size={14}/> กลับ</button>
            <h4 className="text-lg font-semibold">🤝 นัดรับสินค้า</h4>
            {[
              { label: 'วันที่', type: 'date', key: 'date' },
              { label: 'เวลา', type: 'time', key: 'time' },
              { label: 'สถานที่', type: 'text', key: 'location', placeholder: 'เช่น BTS สยาม' },
              { label: 'ข้อมูลติดต่อ', type: 'text', key: 'contact', placeholder: 'Line / เบอร์โทร' },
              { label: 'หมายเหตุ', type: 'text', key: 'note', placeholder: 'รายละเอียดเพิ่มเติม' },
            ].map(f => (
              <div key={f.key}>
                <label className="label">{f.label}</label>
                <input type={f.type} placeholder={f.placeholder} className="input-field"
                  value={meetForm[f.key]} onChange={(e) => setMeetForm(prev => ({ ...prev, [f.key]: e.target.value }))} />
              </div>
            ))}
            <button onClick={() => placeOrder('meetup')} disabled={placing} className="btn-primary w-full py-3">
              {placing ? 'กำลังส่ง...' : 'ยืนยันนัดรับ'}
            </button>
          </div>
        )}
        {modalStep === 'cod' && (
          <div className="space-y-4">
            <button onClick={() => setModalStep('menu')} className="text-sm text-gray-400 hover:text-white flex items-center gap-1"><ArrowLeft size={14}/> กลับ</button>
            <h4 className="text-lg font-semibold">🚚 เก็บเงินปลายทาง</h4>
            {[
              { label: 'ชื่อ-นามสกุล', key: 'name', placeholder: 'ชื่อผู้รับ' },
              { label: 'เบอร์โทร', key: 'phone', placeholder: '08x-xxx-xxxx' },
            ].map(f => (
              <div key={f.key}>
                <label className="label">{f.label} <span className="text-red-400">*</span></label>
                <input type="text" placeholder={f.placeholder}
                  className={`input-field ${codErrors[f.key] ? 'border-red-500 focus:border-red-500' : ''}`}
                  value={codForm[f.key]} onChange={(e) => {
                    setCodForm(prev => ({ ...prev, [f.key]: e.target.value }));
                    if (e.target.value) setCodErrors(p => ({ ...p, [f.key]: false }));
                  }} />
                {codErrors[f.key] && <p className="text-red-400 text-xs mt-1">⚠️ กรุณากรอก{f.label}</p>}
              </div>
            ))}
            <div>
              <label className="label">ที่อยู่จัดส่ง <span className="text-red-400">*</span></label>
              <textarea rows={3} placeholder="บ้านเลขที่ ซอย ถนน ตำบล อำเภอ จังหวัด รหัสไปรษณีย์"
                className={`input-field ${codErrors.address ? 'border-red-500 focus:border-red-500' : ''}`}
                value={codForm.address} onChange={(e) => {
                  setCodForm(prev => ({ ...prev, address: e.target.value }));
                  if (e.target.value) setCodErrors(p => ({ ...p, address: false }));
                }} />
              {codErrors.address && <p className="text-red-400 text-xs mt-1">⚠️ กรุณากรอกที่อยู่จัดส่ง</p>}
            </div>
            <button onClick={() => {
              const errors = { name: !codForm.name, phone: !codForm.phone, address: !codForm.address };
              setCodErrors(errors);
              if (Object.values(errors).some(Boolean)) return;
              placeOrder('cod');
            }} disabled={placing} className="btn-primary w-full py-3">
              {placing ? 'กำลังส่ง...' : 'ยืนยัน COD'}
            </button>
          </div>
        )}
        {modalStep === 'wallet' && walletInfo && (
          <div className="space-y-4">
            {/* แบนเนอร์แดง: รับหน้าร้านเท่านั้น */}
            <div className="bg-red-500/15 border border-red-500/50 rounded-xl px-4 py-3 flex items-start gap-3">
              <span className="text-red-400 text-xl mt-0.5">🚫</span>
              <div>
                <p className="text-red-400 font-bold text-sm">รับสินค้าหน้าร้านเท่านั้น</p>
                <p className="text-red-300/80 text-xs mt-0.5">การชำระด้วย GB Wallet ไม่รองรับการจัดส่ง กรุณานัดรับสินค้าที่ร้านโดยตรง</p>
              </div>
            </div>
            <div className="bg-surface-hover rounded-xl p-5 text-center border border-border">
              <p className="text-gray-400 text-sm mb-1">ยอดคงเหลือ</p>
              <p className="text-4xl font-extrabold text-primary">฿{(walletInfo.balance || 0).toLocaleString()}</p>
              {walletInfo.balance >= product.price
                ? <p className="text-green-400 text-sm mt-2">✅ ยอดเงินเพียงพอ</p>
                : <p className="text-red-400 text-sm mt-2">❌ ยอดไม่พอ ต้องการเพิ่ม ฿{(product.price - walletInfo.balance).toLocaleString()}</p>}
            </div>
            <button
              onClick={() => placeOrder('wallet')}
              disabled={placing || walletInfo.balance < product.price}
              className="btn-primary w-full py-3"
            >{placing ? 'กำลังส่ง...' : 'ยืนยันชำระ'}</button>
            <button onClick={() => setModalStep('menu')} className="btn-ghost w-full">กลับ</button>
          </div>
        )}
      </Modal>
    </div>
  );
}
