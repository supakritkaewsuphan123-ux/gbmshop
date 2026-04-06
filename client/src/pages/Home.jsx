import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Zap, Shield, TrendingUp, Phone, Mail, MessageSquare, Send, Globe } from 'lucide-react';
import api from '../lib/api';
import ProductCard from '../components/ProductCard';
import { ProductCardSkeleton } from '../components/Spinner';
import { useToast } from '../context/ToastContext';

const FEATURES = [
  { icon: <Zap size={28} className="text-primary" />, title: 'ราคาดีที่สุด', desc: 'สินค้ามือสองคุณภาพ ราคาโดนใจ คัดมาแล้ว' },
  { icon: <Shield size={28} className="text-primary" />, title: 'ซื้อขายปลอดภัย', desc: 'มีระบบยืนยันการชำระเงินและรับรองผู้ขาย' },
  { icon: <TrendingUp size={28} className="text-primary" />, title: 'อัปเดตทุกวัน', desc: 'สินค้าใหม่เข้าทุกวัน ไม่พลาดของดี' },
];

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typedText, setTypedText] = useState('');
  const [adminInfo, setAdminInfo] = useState(null);
  const [contactLoading, setContactLoading] = useState(false);
  const { showToast } = useToast();
  const fullText = 'จำหน่ายของ มือสองสภาพดี';

  useEffect(() => {
    let currentIndex = 0;
    let isDeleting = false;
    let timeoutId;

    const type = () => {
      if (!isDeleting) {
        if (currentIndex < fullText.length) {
          setTypedText(fullText.slice(0, currentIndex + 1));
          currentIndex++;
          timeoutId = setTimeout(type, 150); // Slower typing
        } else {
          // Pause at the end
          timeoutId = setTimeout(() => {
            isDeleting = true;
            type();
          }, 3000); // 3s delay
        }
      } else {
        if (currentIndex > 0) {
          setTypedText(fullText.slice(0, currentIndex - 1));
          currentIndex--;
          timeoutId = setTimeout(type, 50); // Faster deleting
        } else {
          isDeleting = false;
          timeoutId = setTimeout(type, 1000); // Wait before restart
        }
      }
    };

    type();
    api.get('/settings/public')
      .then(setAdminInfo)
      .catch(console.error);

    return () => clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    api.get('/products')
      .then((data) => setProducts(data.slice(0, 4)))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleContactSubmit = (e) => {
    e.preventDefault();
    setContactLoading(true);
    setTimeout(() => {
      showToast('ขอบคุณที่ติดต่อเรา! ทีมงานจะตอบกลับโดยเร็วที่สุดครับ 📩', 'success');
      e.target.reset();
      setContactLoading(false);
    }, 1000);
  };

  return (
    <div>
      {/* Hero section */}
      <section
        className="relative min-h-[90vh] flex items-center text-center overflow-hidden"
        style={{
          background:
            'linear-gradient(rgba(10,10,12,0.85), rgba(10,10,12,0.98)), url(/assets/home_bg.png) center/cover no-repeat',
        }}
      >
        {/* Extra Home-Specific Decorations */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div
            animate={{ 
              x: [0, 50, 0], 
              y: [0, 30, 0],
              scale: [1, 1.1, 1] 
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute top-[10%] left-[15%] w-64 h-64 bg-primary/10 rounded-full blur-[100px]"
          />
          <motion.div
            animate={{ 
              x: [0, -40, 0], 
              y: [0, 60, 0],
              scale: [1, 1.2, 1] 
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-[20%] right-[20%] w-72 h-72 bg-blue-500/5 rounded-full blur-[120px]"
          />
          <motion.div
            animate={{ 
              opacity: [0.1, 0.3, 0.1]
            }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(255,75,92,0.05)_0%,transparent_70%)]"
          />
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          >
            <div className="mb-8">
              <motion.span 
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.05 }}
                className="inline-block bg-primary/10 border border-primary/30 text-primary text-sm font-semibold px-6 py-2 rounded-full shadow-glow-sm cursor-default"
              >
                🔥 ตลาดซื้อขายมือสองพรีเมียม
              </motion.span>
            </div>

            <div className="min-h-[160px] md:min-h-[220px] flex items-center justify-center mb-6">
              <h1 className="text-6xl md:text-8xl font-black text-white leading-tight tracking-tight flex items-center justify-center flex-wrap gap-x-4">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                  {typedText}
                </span>
                <motion.span
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: "stepEnd" }}
                  className="inline-block w-4 h-16 md:h-20 bg-primary shadow-glow-sm"
                />
              </h1>
            </div>

            <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto font-medium leading-relaxed opacity-80">
              อัปเกรดคลังสินค้าเพื่อคุณ ซื้อ-ขายสินค้าอิเล็กทรอนิกส์มือสองคุณภาพสูง และอุปกรณ์เกมครบวงจร
            </p>

            <div className="flex gap-4 justify-center flex-wrap">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                <Link to="/products" className="btn-primary text-lg px-10 py-5 flex items-center justify-center gap-2 min-w-[240px]">
                  เลือกสินค้า <ArrowRight size={20} />
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                <Link to="/register" className="btn-outline text-lg px-10 py-5 flex items-center justify-center min-w-[240px]">
                  สมัครสมาชิก
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== FEATURE CARDS ===== */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="glass p-6 hover:border-primary/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-glow-sm"
            >
              <div className="mb-4 w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                {f.icon}
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ===== FEATURED PRODUCTS ===== */}
      <section className="max-w-7xl mx-auto px-6 pb-24 border-b border-white/5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="section-title">สินค้าแนะนำ</h2>
          <p className="section-subtitle">สินค้ามือสองคุณภาพดีที่ลงขายล่าสุด</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
        </div>

        {!loading && (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-10"
          >
            <Link to="/products" className="btn-outline px-10 py-3 inline-flex items-center gap-2">
              ดูสินค้าทั้งหมด <ArrowRight size={16} />
            </Link>
          </motion.div>
        )}
      </section>

      {/* ===== CONTACT SECTION ===== */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-extrabold text-white mb-4 leading-tight">
            ติดต่อเรา
          </h2>
          <p className="text-gray-400 text-lg">
            ติดต่อผ่านช่องทางด่วนด้านล่างนี้ได้เลยครับ เราพร้อมช่วยเหลือคุณ 24 ชม.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto"
        >
          {/* ===== กล่องโทร — เปลี่ยน href="tel:XXXXXXXXXX" เป็นเบอร์จริง ===== */}
          <a href={`tel:${adminInfo?.phone || ''}`}
            className="p-6 bg-white/5 border border-white/10 rounded-2xl hover:border-primary/40 hover:bg-primary/5 transition-all group text-center cursor-pointer block">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform mx-auto">
              <Phone size={22} className="text-primary" />
            </div>
            <p className="text-xs text-gray-500 uppercase font-bold mb-1 tracking-widest">Call Center</p>
            <p className="text-white font-semibold">{adminInfo?.phone || '08x-xxxxxxx'}</p>
          </a>

          {/* ===== กล่อง LINE — เปลี่ยน YOUR_LINE_ID เป็น ID จริง ===== */}
          <a href="https://line.me/ti/p/~YOUR_LINE_ID" target="_blank" rel="noopener noreferrer"
            className="p-6 bg-white/5 border border-white/10 rounded-2xl hover:border-green-500/40 hover:bg-green-500/5 transition-all group text-center cursor-pointer block">
            <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform mx-auto">
              <MessageSquare size={22} className="text-green-500" />
            </div>
            <p className="text-xs text-gray-500 uppercase font-bold mb-1 tracking-widest">LINE Official</p>
            <p className="text-white font-semibold">@gbmoneyshop</p>
          </a>

          {/* ===== กล่อง Facebook — เปลี่ยน URL เป็นลิงค์เพจจริง ===== */}
          <a href="https://facebook.com/YOUR_PAGE_NAME" target="_blank" rel="noopener noreferrer"
            className="p-6 bg-white/5 border border-white/10 rounded-2xl hover:border-blue-500/40 hover:bg-blue-500/5 transition-all group text-center cursor-pointer block">
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform mx-auto">
              <Globe size={22} className="text-blue-500" />
            </div>
            <p className="text-xs text-gray-500 uppercase font-bold mb-1 tracking-widest">Facebook</p>
            <p className="text-white font-semibold">{adminInfo?.facebook || 'GB Money Shop'}</p>
          </a>

          {/* ===== กล่อง Email — เปลี่ยน email เป็นอีเมลจริง ===== */}
          <a href="mailto:support@gbmoney.com"
            className="p-6 bg-white/5 border border-white/10 rounded-2xl hover:border-purple-500/40 hover:bg-purple-500/5 transition-all group text-center cursor-pointer block">
            <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform mx-auto">
              <Mail size={22} className="text-purple-500" />
            </div>
            <p className="text-xs text-gray-500 uppercase font-bold mb-1 tracking-widest">Email</p>
            <p className="text-white font-semibold">support@gbmoney.com</p>
          </a>
        </motion.div>
      </section>
    </div>
  );
}
