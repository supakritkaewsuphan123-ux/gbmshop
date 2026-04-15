import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import { supabase } from '../lib/supabase';

function getImageUrl(img) {
  if (!img) return 'https://via.placeholder.com/80?text=?';
  return img; // Supabase public URLs are already full links
}

export default function Cart() {
  const { items, removeFromCart, clearCart, total } = useCart();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [modalOpen, setModalOpen] = useState(false);
  const [step, setStep] = useState('menu');
  const [meetForm, setMeetForm] = useState({ date: '', time: '', location: '', contact: '', note: '' });
  const [codForm, setCodForm] = useState({ 
    name: '', 
    phone: '', 
    houseNo: '', 
    street: '',
    district: '',
    amphure: '',
    province: '',
    zip: ''
  });
  const [codErrors, setCodErrors] = useState({});
  const [walletInfo, setWalletInfo] = useState(null);
  const [placing, setPlacing] = useState(false);

  // Auto-validate items in cart
  useEffect(() => {
    if (items.length > 0) {
      const validateItems = async () => {
        try {
          const { data, error } = await supabase.from('products').select('id');
          if (error) throw error;
          const validIds = new Set(data.map(p => p.id));
          items.forEach(item => {
            if (!validIds.has(item.id)) {
              removeFromCart(item.id);
            }
          });
        } catch (e) {
          console.error('Failed to validate cart items:', e);
        }
      };
      validateItems();
    }
  }, []);

  const openCheckout = () => {
    if (!user) { showToast('กรุณาเข้าสู่ระบบก่อน', 'error'); navigate('/login'); return; }
    setStep('menu'); setModalOpen(true);
  };

  const showWalletStep = async () => {
    setWalletInfo(user); setStep('wallet');
  };

  const placeOrder = async (method) => {
    setPlacing(true);
    const itemIds = items.map((p) => p.id);
    let payload = { 
      items: itemIds, 
      method,
      user_id: user.id,
      status: 'pending'
    };

    if (method === 'meetup') {
      if (!meetForm.date || !meetForm.time || !meetForm.location || !meetForm.contact) {
        showToast('กรุณากรอกข้อมูลนัดรับให้ครบ', 'error'); setPlacing(false); return;
      }
      payload = { ...payload, meet_date: meetForm.date, meet_time: meetForm.time, meet_location: meetForm.location, meet_note: `ติดต่อ: ${meetForm.contact}\n${meetForm.note}` };
    }
    if (method === 'cod') {
      if (!codForm.name || !codForm.phone || !codForm.houseNo || !codForm.district || !codForm.amphure || !codForm.province || !codForm.zip) {
        showToast('กรุณากรอกข้อมูลจัดส่งให้ครบทุกช่อง', 'error'); setPlacing(false); return;
      }
      if (codForm.phone.replace(/[^0-9]/g, '').length !== 10) {
        showToast('เบอร์โทรศัพท์ต้องครบ 10 หลัก', 'error'); setPlacing(false); return;
      }
      const fullAddress = `${codForm.houseNo} ${codForm.street} ต.${codForm.district} อ.${codForm.amphure} จ.${codForm.province} ${codForm.zip}`;
      payload = { ...payload, shipping_name: codForm.name, shipping_phone: codForm.phone, shipping_address: fullAddress };
    }

    try {
      // ✅ Idempotency Key: ป้องกันกดซ้ำ / Double Submit
      const idempotencyKey = crypto.randomUUID();

      const { data, error } = await supabase.rpc('handle_purchase', {
        p_user_id: user.id,
        p_item_ids: itemIds,
        p_method: method,
        p_shipping_name: (method === 'cod') ? codForm.name : null,
        p_shipping_phone: (method === 'cod') ? codForm.phone : null,
        p_shipping_address: (method === 'cod') ? `${codForm.houseNo} ${codForm.street} ต.${codForm.district} อ.${codForm.amphure} จ.${codForm.province} ${codForm.zip}` : null,
        p_meet_date: (method === 'meetup') ? meetForm.date : null,
        p_meet_time: (method === 'meetup') ? meetForm.time : null,
        p_meet_location: (method === 'meetup') ? meetForm.location : null,
        p_meet_note: (method === 'meetup') ? `ติดต่อ: ${meetForm.contact}\n${meetForm.note}` : null,
        p_idempotency_key: idempotencyKey
      });

      if (error) throw error;
      if (data && !data.success) throw new Error(data.message);

      showToast('สั่งซื้อสำเร็จ! ✅ ระบบตัดสต็อกและยอดเงินเรียบร้อย', 'success');
      clearCart(); 
      setModalOpen(false);
      navigate('/order-success', { state: { order: { ...payload, total, invoice_id: data.invoice_id } } });
    } catch (e) {
      showToast(e.message, 'error');
    } finally { setPlacing(false); }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-4xl font-extrabold mb-8">
        🛒 ตะกร้าสินค้า
      </motion.h1>

      {items.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-24 text-gray-500">
          <ShoppingBag size={64} className="mx-auto mb-4 opacity-30" />
          <p className="text-xl font-semibold text-gray-400 mb-2">ตะกร้าของคุณว่างเปล่า</p>
          <p className="text-sm mb-8">ไปเลือกดูสินค้าก่อนนะครับ</p>
          <Link to="/products" className="btn-primary px-8 py-3 inline-flex items-center gap-2">
            เลือกสินค้า <ArrowRight size={16} />
          </Link>
        </motion.div>
      ) : (
        <>
          <div className="bg-surface border border-border rounded-2xl overflow-hidden mb-6">
            <AnimatePresence>
              {items.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="flex items-center gap-4 p-4 border-b border-border last:border-0"
                >
                  <img src={getImageUrl(item.image)} alt={item.name}
                    className="w-20 h-20 rounded-xl object-cover bg-white flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white truncate">{item.name}</h3>
                    <p className="text-primary font-bold text-xl">฿{item.price.toLocaleString()}</p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                    onClick={() => removeFromCart(item.id)}
                    className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200"
                  >
                    <Trash2 size={18} />
                  </motion.button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="bg-surface border border-border rounded-2xl p-6">
            <div className="flex justify-between items-center text-lg mb-6">
              <span className="text-gray-400">ยอดรวม ({items.length} รายการ)</span>
              <span className="text-primary font-extrabold text-3xl">฿{total.toLocaleString()}</span>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={openCheckout}
              className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-2"
            >
              ดำเนินการชำระเงิน <ArrowRight size={20} />
            </motion.button>
          </div>
        </>
      )}

      {/* Checkout Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="เลือกวิธีชำระเงิน">
        {step === 'menu' && (
          <div className="flex flex-col gap-3">
            <button onClick={() => setStep('meetup')} className="btn-outline py-3">🤝 นัดรับสินค้า (Meetup)</button>
            <button onClick={() => setStep('cod')} className="btn-outline py-3">🚚 เก็บเงินปลายทาง (COD)</button>
            <button onClick={showWalletStep} className="btn-primary py-3 bg-purple-600 border-purple-600 hover:bg-purple-700">💳 GB Wallet</button>
          </div>
        )}
        {step === 'meetup' && (
          <div className="space-y-4">
            <button onClick={() => setStep('menu')} className="btn-ghost text-sm">← กลับ</button>
            <h4 className="font-semibold">🤝 นัดรับสินค้า</h4>
            {[
              { label: 'วันที่', type: 'date', key: 'date' },
              { label: 'เวลา', type: 'time', key: 'time' },
              { label: 'สถานที่', type: 'text', key: 'location', placeholder: 'BTS สยาม' },
              { label: 'ติดต่อ', type: 'text', key: 'contact', placeholder: 'Line / เบอร์โทร' },
              { label: 'หมายเหตุ', type: 'text', key: 'note', placeholder: '(ไม่บังคับ)' },
            ].map(f => (
              <div key={f.key}>
                <label className="label">{f.label}</label>
                <input type={f.type} placeholder={f.placeholder} className="input-field"
                  value={meetForm[f.key]} onChange={(e) => setMeetForm(p => ({ ...p, [f.key]: e.target.value }))} />
              </div>
            ))}
            <button onClick={() => placeOrder('meetup')} disabled={placing} className="btn-primary w-full py-3">
              {placing ? 'กำลังส่ง...' : 'ยืนยัน'}
            </button>
          </div>
        )}
        {step === 'cod' && (
          <div className="space-y-4">
            <button onClick={() => setStep('menu')} className="btn-ghost text-sm">← กลับ</button>
            <h4 className="font-semibold">🚚 เก็บเงินปลายทาง</h4>
            {[
              { label: 'ชื่อ-นามสกุล', key: 'name', placeholder: 'ชื่อผู้รับ' },
              { label: 'เบอร์โทร', key: 'phone', placeholder: '08x-xxx-xxxx' },
            ].map(f => (
              <div key={f.key}>
                <label className="label">{f.label} <span className="text-red-400">*</span></label>
                <input type="text" placeholder={f.placeholder}
                  className={`input-field ${codErrors[f.key] ? 'border-red-500 focus:border-red-500' : ''}`}
                  value={codForm[f.key]} onChange={(e) => {
                    setCodForm(p => ({ ...p, [f.key]: e.target.value }));
                    if (e.target.value) setCodErrors(p => ({ ...p, [f.key]: false }));
                  }} />
                {codErrors[f.key] && <p className="text-red-400 text-xs mt-1">⚠️ กรุณากรอก{f.label}</p>}
              </div>
            ))}
            <div>
              <label className="label">ที่อยู่จัดส่ง <span className="text-red-400">*</span></label>
              <div className="grid grid-cols-2 gap-2">
                <input type="text" placeholder="บ้านเลขที่ / ซอย" className="input-field" 
                  value={codForm.houseNo} onChange={(e) => setCodForm(p => ({ ...p, houseNo: e.target.value }))} />
                <input type="text" placeholder="ถนน (ถ้ามี)" className="input-field" 
                  value={codForm.street} onChange={(e) => setCodForm(p => ({ ...p, street: e.target.value }))} />
                <input type="text" placeholder="แขวง / ตำบล" className="input-field" 
                  value={codForm.district} onChange={(e) => setCodForm(p => ({ ...p, district: e.target.value }))} />
                <input type="text" placeholder="เขต / อำเภอ" className="input-field" 
                  value={codForm.amphure} onChange={(e) => setCodForm(p => ({ ...p, amphure: e.target.value }))} />
                <input type="text" placeholder="จังหวัด" className="input-field" 
                  value={codForm.province} onChange={(e) => setCodForm(p => ({ ...p, province: e.target.value }))} />
                <input type="text" placeholder="รหัสไปรษณีย์" className="input-field" 
                  value={codForm.zip} onChange={(e) => setCodForm(p => ({ ...p, zip: e.target.value }))} />
              </div>
            </div>
            <button onClick={() => {
              const errors = {
                name: !codForm.name,
                phone: !codForm.phone || codForm.phone.replace(/[^0-9]/g, '').length !== 10,
                address: !codForm.houseNo || !codForm.district || !codForm.amphure || !codForm.province || !codForm.zip,
              };
              setCodErrors(errors);
              if (Object.values(errors).some(Boolean)) {
                showToast('กรุณากรอกข้อมูลให้ครบถ้วนและเบอร์โทรครบ 10 หลัก', 'error');
                return;
              }
              placeOrder('cod');
            }} disabled={placing} className="btn-primary w-full py-3">
              {placing ? 'กำลังส่ง...' : 'ยืนยัน COD'}
            </button>
          </div>
        )}
        {step === 'wallet' && walletInfo && (
          <div className="space-y-4">
            {/* แบนเนอร์แจ้งเตือนรับหน้าร้านเท่านั้น */}
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
              <p className="text-gray-500 text-sm mt-1">ยอดสั่งซื้อ: ฿{total.toLocaleString()}</p>
              {walletInfo.balance >= total
                ? <p className="text-green-400 text-sm mt-2">✅ ยอดเงินเพียงพอ</p>
                : <p className="text-red-400 text-sm mt-2">❌ ยอดไม่พอ ต้องการอีก ฿{(total - walletInfo.balance).toLocaleString()}</p>}
            </div>
            <button onClick={() => placeOrder('wallet')} disabled={placing || walletInfo.balance < total} className="btn-primary w-full py-3">
              {placing ? 'กำลังส่ง...' : 'ยืนยันชำระ'}
            </button>
            <button onClick={() => setStep('menu')} className="btn-ghost w-full">กลับ</button>
          </div>
        )}
      </Modal>
    </div>
  );
}
