import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Trash2, ShoppingBag, ArrowRight, MapPin, Truck, Phone, User, CheckCircle2, QrCode, Zap, Globe } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import { supabase } from '../lib/supabase';

export default function Cart() {
  const { items, removeFromCart, clearCart, total } = useCart();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [modalOpen, setModalOpen] = useState(false);
  const [step, setStep] = useState('menu');
  const [adminSettings, setAdminSettings] = useState(null);
  const [placing, setPlacing] = useState(false);

  const [meetForm, setMeetForm] = useState({ date: '', time: '', location: '', contact: '', note: '' });
  const [codForm, setCodForm] = useState({ name: '', phone: '', houseNo: '', street: '', district: '', amphure: '', province: '', zip: '' });

  useEffect(() => {
    loadSettings();
    if (items.length > 0) {
      validateCartItems();
    }
  }, []);

  const loadSettings = async () => {
    const { data } = await supabase.from('settings').select('*').single();
    if (data) setAdminSettings(data);
  };

  const validateCartItems = async () => {
    try {
      const { data, error } = await supabase.from('products').select('id');
      if (error) throw error;
      const validIds = new Set(data.map(p => p.id));
      items.forEach(item => {
        if (!validIds.has(item.id)) removeFromCart(item.id);
      });
    } catch (e) { console.error('Cart validation failed', e); }
  };

  const openCheckout = () => {
    if (!user) { showToast('กรุณาเข้าสู่ระบบก่อนชำระเงิน', 'error'); navigate('/login'); return; }
    setStep('menu');
    setModalOpen(true);
  };

  const placeOrder = async (method) => {
    setPlacing(true);
    const itemIds = items.map(p => p.id);
    const idempotencyKey = crypto.randomUUID();

    try {
      const { data, error } = await supabase.rpc('handle_purchase', {
        p_user_id: user.id,
        p_item_ids: itemIds,
        p_method: method,
        p_shipping_name: (method === 'cod' || method === 'qr') ? (codForm.name || user.username) : null,
        p_shipping_phone: (method === 'cod' || method === 'qr') ? codForm.phone : null,
        p_shipping_address: (method === 'cod' || method === 'qr') ? `${codForm.houseNo} ${codForm.street} ต.${codForm.district} อ.${codForm.amphure} จ.${codForm.province} ${codForm.zip}` : null,
        p_meet_date: (method === 'meetup') ? meetForm.date : null,
        p_meet_time: (method === 'meetup') ? meetForm.time : null,
        p_meet_location: (method === 'meetup') ? meetForm.location : null,
        p_meet_note: (method === 'meetup') ? `ติดต่อ: ${meetForm.contact}\n${meetForm.note}` : null,
        p_idempotency_key: idempotencyKey
      });

      if (error) throw error;
      if (data && !data.success) throw new Error(data.message);

      showToast('สั่งซื้อสำเร็จ! 🎉 ยืนยันคำสั่งซื้อแล้ว', 'success');
      clearCart();
      setModalOpen(false);
      navigate('/my-orders');
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="bg-transparent min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="flex items-center gap-6 mb-16">
          <div className="w-16 h-16 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center text-primary shadow-sm">
            <ShoppingBag size={32} />
          </div>
          <div>
            <h1 className="text-8xl font-black text-navy tracking-tighter uppercase leading-none mb-4">Your Shopping Cart</h1>
            <p className="text-3xl text-navy/60 font-bold tracking-tight">รายการสินค้าที่คุณเลือกซื้อทั้งหมด {items.length} รายการ</p>
          </div>
        </div>

        {items.length === 0 ? (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-40 bg-brand-navy/30 border-2 border-dashed border-primary/10 rounded-[56px]">
            <div className="w-24 h-24 bg-navy/5 rounded-full flex items-center justify-center mx-auto mb-10 text-navy/20">
              <ShoppingBag size={48} />
            </div>
            <h2 className="text-4xl font-black text-navy mb-4 tracking-tight uppercase">Your Cart is Empty</h2>
            <p className="text-navy/60 font-bold mb-12 max-w-sm mx-auto">เลือกช้อปสินค้าพรีเมียมในตลาดของเราเพื่อเริ่มต้นประสบการณ์ใหม่</p>
            <Link to="/products" className="bg-primary text-white font-black px-12 py-5 rounded-2xl shadow-glow-sm hover:brightness-110 active:scale-95 transition-all inline-flex items-center gap-3">
              ช้อปสินค้าตอนนี้ <ArrowRight size={22} className="group-hover:translate-x-1" />
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
            {/* List Section */}
            <div className="lg:col-span-3 space-y-6">
              <AnimatePresence>
                {items.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-white/40 backdrop-blur-md p-8 rounded-[40px] shadow-glow-sm border border-navy/10 flex flex-col md:flex-row items-center gap-8 group hover:border-navy/30 transition-all"
                  >
                    <div className="w-32 h-32 flex-shrink-0 rounded-[28px] overflow-hidden border border-primary/10 shadow-sm bg-brand-dark">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-90 group-hover:opacity-100" />
                    </div>
                    <div className="flex-1 min-w-0 text-center md:text-left">
                       <p className="text-xs text-navy/40 font-black uppercase tracking-widest leading-none mb-3">Authenticated Item</p>
                       <h3 className="text-3xl font-black text-navy truncate leading-tight tracking-tight">{item.name}</h3>
                       <p className="text-5xl font-black text-navy mt-6 tracking-tighter">฿{item.price.toLocaleString()}</p>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="w-14 h-14 bg-primary/5 text-primary/40 hover:text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 rounded-2xl transition-all flex items-center justify-center"
                    >
                      <Trash2 size={24} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Summary Section */}
            <div className="lg:col-span-1">
              <div className="bg-white/40 backdrop-blur-xl p-10 rounded-[48px] shadow-glow-sm border border-navy/20 sticky top-32">
                <h3 className="text-3xl font-black text-navy mb-12 tracking-tight uppercase border-b border-navy/10 pb-6">Order Summary</h3>
                <div className="space-y-8 mb-16">
                  <div className="flex justify-between items-center text-navy/40 font-black uppercase text-xs tracking-widest">
                    <span>Items Count</span>
                    <span className="text-navy">{items.length} Units</span>
                  </div>
                  <div className="flex justify-between items-center text-navy/40 font-black uppercase text-xs tracking-widest">
                    <span>Shipping Fee</span>
                    <span className="text-green-600">Free</span>
                  </div>
                  <div className="h-1 w-full bg-navy/10" />
                  <div className="flex flex-col gap-4">
                    <span className="text-navy/30 font-black uppercase tracking-widest text-xs">Total Amount</span>
                    <span className="text-8xl font-black text-navy tracking-tighter">฿{total.toLocaleString()}</span>
                  </div>
                </div>
                <button
                  onClick={openCheckout}
                  className="bg-primary text-white w-full py-6 text-xl font-black rounded-2xl shadow-glow-sm hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  ชำระเงิน <ArrowRight size={24} />
                </button>
                <p className="text-center text-primary/20 font-bold text-[10px] uppercase tracking-widest mt-6">Secure Checkout Guaranteed</p>
              </div>
            </div>
          </div>
        )}

        {/* Checkout Modal — Deep Navy Theme */}
        <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Secure Checkout Session">
          <div className="p-4">
            <AnimatePresence mode="wait">
              {step === 'menu' && (
                <motion.div key="menu" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col gap-4">
                  <p className="text-center text-white/40 font-bold text-sm mb-6">เลือกช่องทางการชำระเงินที่สะดวกที่สุดสำหรับออเดอร์นี้</p>
                  
                  <button onClick={() => setStep('qr')} className="group flex items-center justify-between p-8 bg-white/5 border border-white/10 rounded-[32px] hover:border-primary hover:bg-primary/10 transition-all shadow-sm">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-primary text-white rounded-2xl flex items-center justify-center shadow-glow-sm">
                        <QrCode size={32} />
                      </div>
                      <div className="text-left">
                        <p className="font-black text-white text-xl leading-tight">โอนเงิน / QR Code</p>
                        <p className="text-[10px] text-white/40 font-black uppercase tracking-widest mt-1">Direct Bank Transfer</p>
                      </div>
                    </div>
                    <Zap size={24} className="text-primary opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all" />
                  </button>

                  <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => setStep('meetup')} className="flex flex-col items-center justify-center p-10 bg-brand-navy/40 border border-white/10 hover:border-primary hover:bg-brand-navy/60 rounded-[40px] transition-all group">
                       <div className="w-14 h-14 bg-white/10 rounded-2xl mb-6 flex items-center justify-center text-white shadow-sm group-hover:bg-primary group-hover:text-white transition-all"><MapPin size={28} /></div>
                       <p className="font-black text-white text-sm tracking-tight uppercase">นัดรับสินค้า</p>
                       <p className="text-[9px] text-white/40 font-bold uppercase tracking-widest mt-2">Meetup</p>
                    </button>
                    <button onClick={() => setStep('cod')} className="flex flex-col items-center justify-center p-10 bg-brand-navy/40 border border-white/10 hover:border-primary hover:bg-brand-navy/60 rounded-[40px] transition-all group">
                       <div className="w-14 h-14 bg-white/10 rounded-2xl mb-6 flex items-center justify-center text-white shadow-sm group-hover:bg-primary group-hover:text-white transition-all"><Truck size={28} /></div>
                       <p className="font-black text-white text-sm tracking-tight uppercase">เก็บเงินปลายทาง</p>
                       <p className="text-[9px] text-white/40 font-bold uppercase tracking-widest mt-2">COD</p>
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 'qr' && (
                <motion.div key="qr" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-10">
                  <button onClick={() => setStep('menu')} className="text-[10px] font-black text-white/40 hover:text-white mb-4 flex items-center gap-2 uppercase tracking-widest transition-colors">← Back to Options</button>
                  <div className="bg-brand-dark/40 border border-white/10 rounded-[48px] p-12 text-center shadow-inner">
                    {adminSettings?.promptpay_qr ? (
                      <div className="bg-white p-4 rounded-[32px] border border-white inline-block shadow-soft mb-10">
                        <img src={adminSettings.promptpay_qr} className="w-56 h-56 object-contain" alt="QR Pay" />
                      </div>
                    ) : (
                      <div className="w-56 h-56 mx-auto bg-white/5 rounded-[32px] flex items-center justify-center mb-10 border border-white/10 shadow-sm"><QrCode size={64} className="text-white/10" /></div>
                    )}
                    <p className="text-[10px] text-white/30 font-black uppercase tracking-widest mb-2 leading-none">PromptPay Destination</p>
                    <p className="font-black text-white text-4xl tracking-tighter">{adminSettings?.promptpay_number || '08x-xxx-xxxx'}</p>
                    <div className="h-0.5 w-16 bg-white/10 mx-auto my-8" />
                    <p className="text-[11px] text-white/40 font-black uppercase tracking-[0.2em] mb-2 leading-none">Checkout Value</p>
                    <p className="text-5xl text-white font-black tracking-tighter">฿{total.toLocaleString()}</p>
                  </div>
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><label className="label">Receiver Name</label><input type="text" className="input-field" placeholder="Full Name..." value={codForm.name} onChange={e => setCodForm(p => ({...p, name: e.target.value}))} /></div>
                      <div className="space-y-2"><label className="label">Phone Line</label><input type="text" className="input-field" placeholder="08x-xxx-xxxx" value={codForm.phone} onChange={e => setCodForm(p => ({...p, phone: e.target.value}))} /></div>
                    </div>
                  </div>
                  <button onClick={() => placeOrder('qr')} disabled={placing} className="bg-primary text-white w-full py-6 text-xl font-black rounded-2xl shadow-glow-sm hover:brightness-110 active:scale-95 transition-all">
                    {placing ? 'PLACING ORDER...' : 'โอนเงินแล้ว (แจ้งสลิปออเดอร์)'}
                  </button>
                </motion.div>
              )}

              {step === 'meetup' && (
                <motion.div key="meetup" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-10">
                  <button onClick={() => setStep('menu')} className="text-[10px] font-black text-white/40 hover:text-white mb-8 flex items-center gap-2 uppercase tracking-widest transition-colors">← Back to Options</button>
                  <div className="flex items-center gap-4 mb-4">
                     <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-white shadow-sm border border-white/10"><MapPin size={24} /></div>
                     <div>
                        <h4 className="text-2xl font-black text-white tracking-tight leading-none uppercase">Meetup Details</h4>
                        <p className="text-white/40 font-bold text-[10px] uppercase tracking-widest mt-1">การนัดรับสินค้าจริง</p>
                     </div>
                  </div>
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2"><label className="label">Date select</label><input type="date" className="input-field" value={meetForm.date} onChange={e => setMeetForm(p => ({ ...p, date: e.target.value }))} /></div>
                      <div className="space-y-2"><label className="label">Appox Time</label><input type="time" className="input-field" value={meetForm.time} onChange={e => setMeetForm(p => ({ ...p, time: e.target.value }))} /></div>
                    </div>
                    <div className="space-y-2"><label className="label">Meeting Point</label><input type="text" className="input-field" placeholder="ห้างเซ็นทรัล, หน้าสถานี BTS, มหาลัย..." value={meetForm.location} onChange={e => setMeetForm(p => ({ ...p, location: e.target.value }))} /></div>
                    <div className="space-y-2"><label className="label">Contact Detail</label><input type="text" className="input-field" placeholder="FB Name / Line ID / Phone" value={meetForm.contact} onChange={e => setMeetForm(p => ({ ...p, contact: e.target.value }))} /></div>
                    <button onClick={() => {
                      if(!meetForm.location || !meetForm.contact) return showToast('กรุณากรอกสถานที่และข้อมูลติดต่อ', 'error');
                      placeOrder('meetup');
                    }} disabled={placing} className="bg-primary text-white w-full py-6 text-xl font-black rounded-2xl shadow-glow-sm hover:brightness-110 active:scale-95 transition-all">CONFIRM MEETUP ORDER</button>
                  </div>
                </motion.div>
              )}

              {step === 'cod' && (
                <motion.div key="cod" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-10">
                  <button onClick={() => setStep('menu')} className="text-[10px] font-black text-white/40 hover:text-white mb-8 flex items-center gap-2 uppercase tracking-widest transition-colors">← Back to Options</button>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-white shadow-sm border border-white/10"><Truck size={24} /></div>
                    <div>
                        <h4 className="text-2xl font-black text-white tracking-tight leading-none uppercase">Shipping Destination</h4>
                        <p className="text-white/40 font-bold text-[10px] uppercase tracking-widest mt-1">ชำระเงินปลายทาง</p>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2"><label className="label">Full Name</label><input type="text" className="input-field" value={codForm.name} onChange={e => setCodForm(p => ({...p, name: e.target.value}))} /></div>
                      <div className="space-y-2"><label className="label">Phone Line</label><input type="text" className="input-field" value={codForm.phone} onChange={e => setCodForm(p => ({...p, phone: e.target.value}))} /></div>
                      <div className="col-span-2 space-y-2"><label className="label">Home Address Detail</label><input type="text" className="input-field" placeholder="บ้านเลขที่, หมู่บ้าน, ซอย, ถนน..." value={codForm.houseNo} onChange={e => setCodForm(p => ({...p, houseNo: e.target.value}))} /></div>
                      <div className="space-y-2"><label className="label">District</label><input type="text" className="input-field" value={codForm.district} onChange={e => setCodForm(p => ({...p, district: e.target.value}))} /></div>
                      <div className="space-y-2"><label className="label">Province</label><input type="text" className="input-field" value={codForm.province} onChange={e => setCodForm(p => ({...p, province: e.target.value}))} /></div>
                    </div>
                    <button onClick={() => {
                      if(!codForm.name || !codForm.phone || !codForm.houseNo) return showToast('กรุณากรอกข้อมูลที่อยู่ให้ครบถ้วน', 'error');
                      placeOrder('cod');
                    }} disabled={placing} className="bg-primary text-white w-full py-6 text-xl font-black rounded-2xl shadow-glow-sm hover:brightness-110 active:scale-95 transition-all">PLACE COD ORDER</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Modal>
      </div>
    </div>
  );
}
