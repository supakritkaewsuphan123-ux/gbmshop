import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PageLoader } from '../components/Spinner';
import StatusBadge from '../components/StatusBadge';
import { supabase } from '../lib/supabase';

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

  // ⚡ Real-time: อัปเดตสถานะออเดอร์และหลอดสถานะทันที
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`invoices-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'invoices', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const updated = payload.new;
          // อัปเดตสถานะและเลขพัสดุทันทีโดยไม่ต้องโหลดใหม่
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

      // For each invoice, fetch product names/prices since they are stored as IDs
      const enrichedInvoices = await Promise.all(data.map(async (inv) => {
        if (!inv.items || inv.items.length === 0) return { ...inv, products: [], total_price: 0 };
        
        const { data: products } = await supabase
          .from('products')
          .select('id, name, price')
          .in('id', inv.items);
        
        const total = products?.reduce((sum, p) => sum + p.price, 0) || 0;
        return { ...inv, items: products || [], total_price: total };
      }));

      setInvoices(enrichedInvoices);
    } catch { showToast('โหลดรายการไม่สำเร็จ', 'error'); }
    finally { setLoading(false); }
  };

  const uploadSlip = async (invoiceId, file) => {
    try {
      // 1. Upload Slip Image
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

      // 2. Update Invoice
      const { error: updateError } = await supabase
        .from('invoices')
        .update({ 
          slip_url: publicUrl,
          status: 'pending' // Reset to pending for admin review
        })
        .eq('id', invoiceId);

      if (updateError) throw updateError;

      showToast('อัปโหลดสลิปสำเร็จ ✅', 'success');
      loadInvoices();
    } catch (e) { showToast(e.message, 'error'); }
  };

  if (authLoading || loading) return <PageLoader />;

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-4xl font-extrabold mb-8">
        📦 รายการสั่งซื้อ
      </motion.h1>

      {invoices.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p className="text-4xl mb-4">📭</p>
          <p className="text-xl text-gray-400">ยังไม่มีรายการสั่งซื้อ</p>
        </div>
      ) : (
        <div className="space-y-4">
          {invoices.map((inv, i) => (
            <motion.div
              key={inv.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="bg-surface border border-border rounded-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-5 border-b border-border">
                <div>
                  <h3 className="font-bold text-white">ออเดอร์ #{inv.id}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{new Date(inv.created_at).toLocaleString('th-TH')}</p>
                </div>
                <StatusBadge status={inv.status} />
              </div>

              {/* 📊 Order Progress Tube (หลอดสถานะ) */}
              {inv.status !== 'rejected' && (
                <div className="px-5 pt-6 pb-2">
                  <div className="relative flex justify-between">
                    {/* Background Line */}
                    <div className="absolute top-4 left-0 w-full h-1 bg-white/5 rounded-full z-0" />
                    {/* Progress Fill */}
                    <div 
                      className="absolute top-4 left-0 h-1 bg-primary rounded-full z-0 transition-all duration-1000" 
                      style={{ 
                        width: inv.status === 'completed' ? '100%' 
                          : inv.status === 'processing' ? '50%' 
                          : '10%'
                      }} 
                    />

                    {[
                      { 
                        id: 'confirmed', 
                        label: 'ยืนยันออเดอร์', 
                        active: true 
                      },
                      { 
                        id: 'shipping', 
                        label: 'เตรียมของ', 
                        active: inv.status === 'processing' || inv.status === 'completed' 
                      },
                      { 
                        id: 'delivered', 
                        label: 'ส่งสำเร็จ', 
                        active: inv.status === 'completed' 
                      }
                    ].map((step) => (
                      <div key={step.id} className="relative z-10 flex flex-col items-center gap-2">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center border-4 border-surface transition-all duration-500 ${step.active ? 'bg-primary shadow-[0_0_12px_rgba(var(--primary-rgb),0.6)] scale-110' : 'bg-gray-800'}`}>
                          <div className={`w-2.5 h-2.5 rounded-full ${step.active ? 'bg-white' : 'bg-gray-700'}`} />
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${step.active ? 'text-primary' : 'text-gray-600'}`}>{step.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-5">
                {/* 🚚 Tracking Info Box */}
                {inv.tracking_number && (
                  <div className="mb-6 p-4 bg-gradient-to-r from-primary/20 to-primary/5 border border-primary/30 rounded-2xl shadow-glow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-black text-primary uppercase tracking-widest">ข้อมูลการจัดส่ง</p>
                      <span className="text-[10px] px-2 py-0.5 bg-primary/20 text-primary rounded-md font-bold uppercase">{inv.shipping_carrier}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xl font-mono font-bold text-white tracking-wider">{inv.tracking_number}</p>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(inv.tracking_number);
                          showToast('คัดลอกเลขพัสดุแล้ว 📋', 'success');
                        }}
                        className="text-[10px] text-primary hover:underline font-bold"
                      >คัดลอก</button>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-2 italic">* นำเลขนี้ไปเช็คสถานะในแอป {inv.shipping_carrier} ได้เลยครับ</p>
                  </div>
                )}
                {inv.items?.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm py-1.5">
                    <span className="text-gray-300">📦 {item.name}</span>
                    <span className="text-primary font-semibold">฿{item.price.toLocaleString()}</span>
                  </div>
                ))}

                <div className="flex justify-between pt-4 mt-2 border-t border-border font-bold">
                  <span className="text-gray-400">ยอดรวม</span>
                  <span className="text-primary text-xl">฿{inv.total_price.toLocaleString()}</span>
                </div>

                {/* Meetup info */}
                {inv.method === 'meetup' && inv.meet_location && (
                  <div className="mt-4 bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 text-sm">
                    <p className="font-semibold text-purple-400 mb-2">🤝 ข้อมูลนัดรับ</p>
                    <p className="text-gray-300">📍 {inv.meet_location}</p>
                    <p className="text-gray-300">🗓️ {inv.meet_date} {inv.meet_time}</p>
                    {inv.meet_note && <p className="text-gray-400 mt-1">{inv.meet_note}</p>}
                  </div>
                )}

                {/* COD info */}
                {inv.method === 'cod' && inv.shipping_name && (
                  <div className="mt-4 bg-pink-500/10 border border-pink-500/30 rounded-xl p-4 text-sm">
                    <p className="font-semibold text-pink-400 mb-2">🚚 ที่อยู่จัดส่ง</p>
                    <p className="text-gray-300">{inv.shipping_name} · {inv.shipping_phone}</p>
                    <p className="text-gray-400">{inv.shipping_address}</p>
                  </div>
                )}

                {/* Slip upload for QR orders */}
                {(inv.status === 'pending_payment' || inv.status === 'rejected') && inv.method === 'qr' && (
                  <div className={`mt-4 rounded-xl p-4 border ${inv.status === 'rejected' ? 'bg-red-500/5 border-red-500/30' : 'bg-primary/5 border-primary/30'}`}>
                    <p className={`font-semibold mb-3 ${inv.status === 'rejected' ? 'text-red-400' : 'text-primary'}`}>
                      {inv.status === 'rejected' ? '❌ ถูกปฏิเสธ: แก้ไขสลิปชำระเงิน' : '📎 อัปโหลดสลิปชำระเงิน'}
                    </p>
                    
                    {inv.status === 'rejected' && inv.rejection_reason && (
                      <div className="mb-4 bg-red-500/10 p-3 rounded-lg border border-red-500/20 text-xs text-red-300">
                        <strong>เหตุผล:</strong> {inv.rejection_reason}
                      </div>
                    )}

                    <input type="file" accept="image/jpeg,image/png"
                      onChange={(e) => e.target.files[0] && uploadSlip(inv.id, e.target.files[0])}
                      className="input-field text-sm" />
                    
                    {inv.status === 'rejected' && (
                      <p className="text-[10px] text-gray-500 mt-2 italic">* เมื่ออัปโหลดใหม่ สถานะจะถูกเปลี่ยนเป็น "รอการอนุมัติ" อีกครั้ง</p>
                    )}
                  </div>
                )}

                {/* Show rejection reason even if NOT a QR order (e.g. COD/Meetup rejected) */}
                {inv.status === 'rejected' && inv.method !== 'qr' && inv.rejection_reason && (
                  <div className="mt-4 bg-red-500/5 border border-red-500/30 rounded-xl p-4">
                     <p className="font-semibold text-red-400 mb-2">❌ ออเดอร์ถูกปฏิเสธ</p>
                     <div className="bg-red-500/10 p-3 rounded-lg border border-red-500/20 text-xs text-red-300">
                        <strong>เหตุผล:</strong> {inv.rejection_reason}
                      </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
