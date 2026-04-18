import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PageLoader } from '../components/Spinner';
import StatusBadge from '../components/StatusBadge';
import { supabase } from '../lib/supabase';
import { ShoppingBag, Box, Truck, MapPin, CheckCircle2, QrCode, Clipboard, ArrowLeft, Clock, History } from 'lucide-react';

export default function MyOrders() {
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) { navigate('/login'); return; }
    if (user) loadInvoices();
  }, [user, authLoading]);

  // Real-time updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`invoices-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'invoices', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const updated = payload.new;
          setInvoices(prev =>
            prev.map(inv =>
              inv.id === updated.id
                ? { ...inv, status: updated.status, tracking_number: updated.tracking_number, shipping_carrier: updated.shipping_carrier, rejection_reason: updated.rejection_reason }
                : inv
            )
          );
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user]);

  const loadInvoices = async () => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;

      const enrichedInvoices = await Promise.all(data.map(async (inv) => {
        if (!inv.items || inv.items.length === 0) return { ...inv, products: [], total_price: 0 };
        
        const { data: products } = await supabase
          .from('products')
          .select('id, name, price, image_url')
          .in('id', inv.items);
        
        const total = products?.reduce((sum, p) => sum + p.price, 0) || 0;
        return { ...inv, items: products || [], total_price: inv.total_price || total };
      }));

      setInvoices(enrichedInvoices);
    } catch { showToast('โหลดรายการไม่สำเร็จ', 'error'); }
    finally { setLoading(false); }
  };

  const uploadSlip = async (invoiceId, file) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${invoiceId}-${Math.random()}.${fileExt}`;
      const filePath = `slips/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('payment-slips')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('payment-slips')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('invoices')
        .update({ 
          slip_url: publicUrl,
          status: 'pending' 
        })
        .eq('id', invoiceId);

      if (updateError) throw updateError;

      showToast('อัปโหลดสลิปสำเร็จ ✅', 'success');
      loadInvoices();
    } catch (e) { showToast(e.message, 'error'); }
  };

  if (authLoading || loading) return <PageLoader />;

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-5xl mx-auto px-6 py-20">
        <div className="flex items-center gap-6 mb-16">
          <div className="w-16 h-16 bg-slate-50 border border-slate-50 rounded-2xl flex items-center justify-center text-slate-900 shadow-sm">
            <History size={32} />
          </div>
          <div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase">ออเดอร์ของฉัน</h1>
          <p className="text-slate-400 font-bold tracking-tight">ติดตามสถานะและตรวจสอบประวัติการสั่งซื้อของคุณ</p>
          </div>
        </div>

        {invoices.length === 0 ? (
          <div className="text-center py-40 border-2 border-dashed border-slate-100 rounded-[56px] bg-white">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-10 text-slate-200 shadow-inner">
              <ShoppingBag size={48} />
            </div>
            <p className="text-4xl font-black text-slate-900 tracking-tight uppercase mb-4">ยังไม่มีรายการสั่งซื้อ</p>
            <p className="text-slate-400 font-bold mb-10">คุณยังไม่มีรายการสั่งซื้อในขณะนี้ครับ</p>
            <button onClick={() => navigate('/products')} className="bg-slate-900 text-white font-black px-12 py-5 rounded-2xl shadow-soft hover:brightness-110 active:scale-95 transition-all">เริ่มช้อปสินค้าตอนนี้</button>
          </div>
        ) : (
          <div className="space-y-10">
            {invoices.map((inv, i) => (
              <motion.div
                key={inv.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.8 }}
                className="bg-white border border-slate-100 rounded-[48px] overflow-hidden shadow-soft hover:border-slate-200 transition-all"
              >
                <div className="flex flex-col md:flex-row items-center justify-between p-10 border-b border-slate-50 bg-slate-50/20 gap-6">
                  <div>
                    <p className="text-[10px] text-slate-300 font-black uppercase tracking-widest leading-none mb-2">รหัสคำสั่งซื้อ</p>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tighter">GB-#{inv.id.toString().slice(0,12).toUpperCase()}</h3>
                    <div className="flex items-center gap-2 mt-2 text-slate-400 font-bold text-xs">
                       <Clock size={12} /> {new Date(inv.created_at).toLocaleString('th-TH')}
                    </div>
                  </div>
                  <StatusBadge status={inv.status} />
                </div>

                {/* Status Progress Tube */}
                {inv.status !== 'rejected' && (
                  <div className="px-10 pt-10 pb-6">
                    <div className="relative flex justify-between">
                      <div className="absolute top-5 left-0 w-full h-1.5 bg-slate-50 rounded-full z-0" />
                      <div 
                        className="absolute top-5 left-0 h-1.5 bg-slate-900 rounded-full z-0 transition-all duration-1000 shadow-glow-sm" 
                        style={{ 
                          width: inv.status === 'completed' ? '100%' 
                            : inv.status === 'processing' ? '50%' 
                            : '5%'
                        }} 
                      />

                      {[
                        { id: 'confirmed', label: 'อนุมัติแล้ว', active: true, icon: <CheckCircle2 size={16} /> },
                        { id: 'shipping', label: 'กำลังเตรียมของ', active: ['processing', 'completed'].includes(inv.status), icon: <Box size={16} /> },
                        { id: 'delivered', label: 'ส่งสำเร็จ', active: inv.status === 'completed', icon: <Truck size={16} /> }
                      ].map((step) => (
                        <div key={step.id} className="relative z-10 flex flex-col items-center gap-3">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border-4 border-white transition-all duration-700 ${step.active ? 'bg-slate-900 text-white shadow-soft scale-110' : 'bg-slate-50 text-slate-200'}`}>
                            {step.icon}
                          </div>
                          <span className={`text-[10px] font-black uppercase tracking-widest ${step.active ? 'text-slate-900' : 'text-slate-300'}`}>{step.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="p-10">
                  {/* Tracking Info Box */}
                  {inv.tracking_number && (
                    <div className="mb-10 p-8 bg-slate-900 rounded-[32px] shadow-glow flex flex-col md:flex-row items-center justify-between gap-6">
                      <div className="flex flex-col items-center md:items-start">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 leading-none">ข้อมูลการติดตามพัสดุ</p>
                        <div className="flex items-center gap-3">
                           <span className="text-white text-3xl font-black tracking-tighter uppercase">{inv.tracking_number}</span>
                           <span className="bg-white/10 text-white text-[10px] px-3 py-1 rounded-lg font-black uppercase tracking-widest">{inv.shipping_carrier}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(inv.tracking_number);
                          showToast('คัดลอกเลขพัสดุแล้ว 📋', 'success');
                        }}
                        className="bg-white text-slate-900 font-black px-8 py-4 rounded-xl text-xs uppercase tracking-widest shadow-soft hover:brightness-110 active:scale-95 transition-all flex items-center gap-2"
                      ><Clipboard size={14} /> คัดลอก</button>
                    </div>
                  )}

                  <div className="space-y-4 mb-10">
                    <p className="text-[10px] text-slate-300 font-black uppercase tracking-widest leading-none mb-2">Order Items</p>
                    {inv.items?.map((item) => (
                      <div key={item.id} className="flex justify-between items-center py-4 border-b border-slate-50 last:border-0">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 bg-slate-50 rounded-xl overflow-hidden border border-slate-100">
                              <img src={item.image_url} alt="prod" className="w-full h-full object-cover" />
                           </div>
                           <span className="text-slate-900 font-black text-lg tracking-tight leading-none truncate max-w-[200px] md:max-w-sm">{item.name}</span>
                        </div>
                        <span className="text-slate-900 font-black text-xl tracking-tighter">฿{item.price?.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-end pt-8 mt-4 border-t border-slate-50">
                    <div>
                        <p className="text-[10px] text-slate-300 font-black uppercase tracking-widest leading-none mb-1">Total Bill</p>
                        <p className="text-4xl text-slate-900 font-black tracking-tighter">฿{inv.total_price.toLocaleString()}</p>
                    </div>
                    {inv.method === 'meetup' ? (
                       <div className="text-right">
                          <p className="text-[10px] text-purple-400 font-black uppercase tracking-widest mb-1 leading-none">Meetup Location</p>
                          <p className="text-slate-900 font-black">📍 {inv.meet_location}</p>
                       </div>
                    ) : inv.method === 'cod' ? (
                       <div className="text-right">
                          <p className="text-[10px] text-pink-400 font-black uppercase tracking-widest mb-1 leading-none">Shipping To</p>
                          <p className="text-slate-900 font-black">{inv.shipping_name}</p>
                       </div>
                    ) : null}
                  </div>

                  {/* Slip upload for QR orders */}
                  {(inv.status === 'pending_payment' || inv.status === 'rejected') && inv.method === 'qr' && (
                    <div className={`mt-12 rounded-[32px] p-8 border ${inv.status === 'rejected' ? 'bg-red-50/50 border-red-100' : 'bg-slate-50 border-slate-100'}`}>
                      <p className={`text-xl font-black mb-6 flex items-center gap-3 ${inv.status === 'rejected' ? 'text-red-500' : 'text-slate-900'}`}>
                        {inv.status === 'rejected' ? '❌ ถูกปฏิเสธ: กรุณาแก้ไขสลิป' : <><QrCode size={24} /> แจ้งหลักฐานการโอนเงิน</>}
                      </p>
                      
                      {inv.status === 'rejected' && inv.rejection_reason && (
                        <div className="mb-6 p-6 bg-red-50 rounded-2xl border border-red-100 text-sm text-red-600 font-bold">
                          <strong>เหตุผลจากแอดมิน:</strong> {inv.rejection_reason}
                        </div>
                      )}

                      <div className="flex flex-col md:flex-row gap-4 items-center">
                         <label className="flex-1 w-full bg-white border border-slate-200 text-slate-400 px-8 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest cursor-pointer text-center relative overflow-hidden italic truncate">
                            {inv.slip_url ? 'SLIP UPLOADED. CLICK TO CHANGE' : 'SELECT PAYMENT SLIP IMAGE'}
                            <input type="file" accept="image/jpeg,image/png" className="hidden"
                               onChange={(e) => e.target.files[0] && uploadSlip(inv.id, e.target.files[0])} />
                         </label>
                         <button className="bg-slate-900 text-white font-black px-12 py-5 rounded-2xl shadow-soft hover:brightness-110 active:scale-95 transition-all text-sm uppercase tracking-widest">Update Slip</button>
                      </div>
                      
                      {inv.status === 'rejected' && (
                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em] text-center mt-6">เมื่อแก้สลิปแล้ว แอดมินจะตรวจสอบใหม่อีกครั้งภายใน 24 ชม.</p>
                      )}
                    </div>
                  )}

                  {inv.status === 'rejected' && inv.method !== 'qr' && inv.rejection_reason && (
                    <div className="mt-12 bg-red-50 border border-red-100 rounded-[32px] p-8">
                       <p className="text-xl font-black text-red-500 mb-4 flex items-center gap-2">❌ Order Rejected</p>
                       <p className="text-sm text-red-600 font-bold leading-relaxed">{inv.rejection_reason}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
