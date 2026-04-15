import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, Package, ArrowRight, ShoppingBag, Download, Printer } from 'lucide-react';
import { usePageMetadata } from '../hooks/usePageMetadata';

export default function OrderSuccess() {
  usePageMetadata('สั่งซื้อสำเร็จ', 'ขอบคุณที่ใช้บริการ GB Marketplace');
  const [redirectCount, setRedirectCount] = useState(5);
  const location = useLocation();
  const navigate = useNavigate();
  const orderData = location.state?.order;

  useEffect(() => {
    if (!orderData) {
      let count = 5;
      const interval = setInterval(() => {
        count -= 1;
        setRedirectCount(count);
        if (count <= 0) {
          clearInterval(interval);
          navigate('/my-orders');
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [orderData, navigate]);

  if (!orderData) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6">
        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 animate-pulse">
          <ShoppingBag size={40} className="text-gray-500" />
        </div>
        <h1 className="text-2xl font-bold mb-2">ไม่พบข้อมูลคำสั่งซื้อ</h1>
        <p className="text-gray-400 mb-8">
          กำลังนำคุณไปยังหน้าออเดอร์ของคุณใน <span className="text-primary font-bold font-mono">{redirectCount}</span> วินาที...
        </p>
        <Link to="/my-orders" className="btn-primary px-8 py-3">ไปหน้าออเดอร์</Link>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center mb-12"
      >
        <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center text-green-400 mx-auto mb-6 shadow-glow-sm shadow-green-500/20">
          <CheckCircle size={56} />
        </div>
        <h1 className="text-4xl font-extrabold text-white mb-3">สั่งซื้อสำเร็จ!</h1>
        <p className="text-gray-400">ขอบคุณที่ร่วมเป็นส่วนหนึ่งในสังคม GB Marketplace</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Receipt Details */}
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="md:col-span-2 bg-surface border border-border rounded-3xl p-8 shadow-2xl relative overflow-hidden print:border-black print:text-black print:bg-white print:shadow-none"
        >
          {/* Print Only Header */}
          <div className="hidden print:block mb-8 border-b-2 border-black pb-4">
            <h2 className="text-2xl font-bold">GB MoneyShop - Digital Receipt</h2>
            <p className="text-sm">ใบเสร็จรับเงินอิเล็กทรอนิกส์</p>
          </div>

          <div className="flex justify-between items-start mb-8">
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold tracking-widest mb-1">Order ID</p>
              <p className="text-xl font-mono font-bold text-white print:text-black">#{orderData.invoice_id || orderData.id}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 uppercase font-bold tracking-widest mb-1">Date</p>
              <p className="text-sm text-gray-300 print:text-black">{new Date().toLocaleDateString('th-TH')}</p>
            </div>
          </div>

          <div className="space-y-4 mb-8">
            <p className="text-sm font-bold text-white border-b border-white/5 pb-2 print:text-black print:border-black">รายการสินค้า</p>
            {/* Note: In a real app we'd pass item names here too, but summary price works for now */}
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400 print:text-black">ยอดรวมสินค้าทั้งหมด</span>
              <span className="text-white font-bold print:text-black">฿{orderData.total?.toLocaleString() || '0'}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400 print:text-black">วิธีการชำระเงิน</span>
              <span className="text-primary font-bold uppercase">{orderData.method || 'Unknown'}</span>
            </div>
          </div>

          <div className="bg-white/5 p-4 rounded-2xl border border-white/5 mb-8 print:bg-gray-100 print:border-black">
             <p className="text-xs text-gray-500 font-bold uppercase mb-2">สถานะการทำรายการ</p>
             <div className="flex items-center gap-2 text-green-400 font-bold">
               <Package size={16} /> รอการยืนยันสินค้าจากแอดมิน
             </div>
          </div>

          <div className="flex gap-3 print:hidden">
            <button 
              onClick={handlePrint}
              className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-gray-300 py-3 rounded-xl text-sm font-bold transition-all border border-white/5"
            >
              <Printer size={16} /> พิมพ์ใบเสร็จ
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-gray-300 py-3 rounded-xl text-sm font-bold transition-all border border-white/5">
              <Download size={16} /> บันทึกรูปภาพ
            </button>
          </div>
        </motion.div>

        {/* Next Steps */}
        <motion.div
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="space-y-4 print:hidden"
        >
          <div className="bg-surface border border-border rounded-3xl p-6">
            <h3 className="font-bold text-white mb-4">ขั้นตอนต่อไป</h3>
            <ul className="space-y-4">
              <li className="flex gap-3 items-start">
                <div className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center shrink-0 mt-0.5">1</div>
                <p className="text-xs text-gray-400 leading-relaxed">แอดมินจะตรวจสอบยอดเงินและสต็อกสินค้า</p>
              </li>
              <li className="flex gap-3 items-start">
                <div className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center shrink-0 mt-0.5">2</div>
                <p className="text-xs text-gray-400 leading-relaxed">คุณจะได้รับแจ้งเตือนเมื่อสินค้าถูกจัดส่งเรียบร้อย</p>
              </li>
              <li className="flex gap-3 items-start">
                <div className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center shrink-0 mt-0.5">3</div>
                <p className="text-xs text-gray-400 leading-relaxed">เช็คเลขพัสดุได้ที่หน้า "การสั่งซื้อของฉัน"</p>
              </li>
            </ul>
          </div>

          <Link 
            to="/my-orders" 
            className="block w-full text-center py-4 bg-primary hover:bg-primary-hover text-white rounded-2xl font-bold transition-all shadow-glow-sm"
          >
            ดูออเดอร์ของฉัน <ArrowRight size={18} className="inline ml-1" />
          </Link>
          <Link 
            to="/products" 
            className="block w-full text-center py-4 bg-white/5 hover:bg-white/10 text-gray-300 rounded-2xl font-medium transition-all"
          >
            กลับบ้านสินค้า
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
