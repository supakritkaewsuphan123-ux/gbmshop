import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PageLoader } from '../components/Spinner';
import StatusBadge from '../components/StatusBadge';
import api from '../lib/api';

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

  const loadInvoices = async () => {
    try {
      const data = await api.get('/invoices/my');
      setInvoices(data);
    } catch { showToast('โหลดรายการไม่สำเร็จ', 'error'); }
    finally { setLoading(false); }
  };

  const uploadSlip = async (invoiceId, file) => {
    const formData = new FormData();
    formData.append('slip_image', file);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/invoices/${invoiceId}/slip`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
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

              <div className="p-5">
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
                {inv.status === 'pending_payment' && inv.method === 'qr' && (
                  <div className="mt-4 bg-primary/5 border border-primary/30 rounded-xl p-4">
                    <p className="font-semibold text-primary mb-3">📎 อัปโหลดสลิปชำระเงิน</p>
                    <input type="file" accept="image/jpeg,image/png"
                      onChange={(e) => e.target.files[0] && uploadSlip(inv.id, e.target.files[0])}
                      className="input-field text-sm" />
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
