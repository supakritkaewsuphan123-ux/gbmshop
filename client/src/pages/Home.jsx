import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Zap, Shield, TrendingUp, Phone, Mail, MessageSquare, Send, Globe } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/ProductCard';
import { ProductCardSkeleton } from '../components/Spinner';
import { useToast } from '../context/ToastContext';
import { usePageMetadata } from '../hooks/usePageMetadata';

// FEATURES section removed

export default function Home() {
  usePageMetadata('หน้าแรก', 'GB Marketplace - ตลาดซื้อขายสินค้าพรีเมียม ปลอดภัย มั่นใจ 100% พร้อมระบบ Wallet อัตโนมัติ');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase.from('settings').select('*').single()
      .then(({ data }) => setAdminInfo(data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    setLoading(true);
    let isMounted = true;
    
    const loadData = async () => {
      try {
        const { data: productsData, error } = await supabase
          .from('products')
          .select('*')
          .limit(8)
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        if (productsData && productsData.length > 0) {
          const userIds = [...new Set(productsData.map(p => p.user_id).filter(Boolean))];
          let profileMap = {};
          
          if (userIds.length > 0) {
            const { data: profiles } = await supabase.from('profiles').select('id, username').in('id', userIds);
            if (profiles) profileMap = Object.fromEntries(profiles.map(p => [p.id, p]));
          }
          
          const enriched = productsData.map(p => ({
            ...p,
            seller_name: profileMap[p.user_id]?.username || 'System'
          }));
          if (isMounted) setProducts(enriched);
        } else {
          if (isMounted) setProducts([]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    loadData();
    return () => { isMounted = false; };
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
      <section className="relative min-h-[65vh] flex items-center text-center overflow-hidden bg-white">
        {/* Subtle Decorative Elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px]" />
          <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[80px]" />
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="mb-6">
              <span className="inline-block bg-slate-100 text-slate-600 text-xs font-bold px-4 py-1.5 rounded-full tracking-wider uppercase border border-slate-200">
                Premium Marketplace
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-6 leading-[1.1] tracking-tight">
              เลือกซื้อสินค้า <br />
              <span className="text-primary font-black">คุณภาพดี</span> ในราคาคุ้มค่า
            </h1>

            <p className="text-lg text-slate-500 mb-10 max-w-2xl mx-auto font-medium leading-relaxed">
              แหล่งรวมสินค้าพรีเมียม ปลอดภัย มั่นใจ 100% พร้อมระบบ Wallet อัตโนมัติ <br className="hidden md:block" />
              ช้อปง่าย จ่ายสะดวก กับสินค้าที่ผ่านการคัดสรรมาเพื่อคุณ
            </p>

            <div className="flex gap-4 justify-center flex-wrap">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link to="/products" className="bg-slate-900 text-white font-bold text-lg px-10 py-5 rounded-2xl flex items-center justify-center gap-2 min-w-[240px] shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all">
                  เริ่มเลือกสินค้า <ArrowRight size={20} />
                </Link>
              </motion.div>
              {!user && (
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Link to="/register" className="bg-white text-slate-900 border-2 border-slate-100 font-bold text-lg px-10 py-5 rounded-2xl flex items-center justify-center min-w-[240px] hover:bg-slate-50 transition-all">
                    สมัครสมาชิก
                  </Link>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* FEATURE CARDS REMOVED */}

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
          <h2 className="text-4xl font-extrabold text-slate-900 mb-4 leading-tight">
            ติดต่อเรา
          </h2>
          <p className="text-slate-500 text-lg">
            หากมีข้อสงสัยหรือปัญหาการใช้งาน ติดต่อเราได้ตลอด 24 ชม.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto"
        >
          {/* โทร — แก้เบอร์โทรที่ href="tel:..." และข้อความด้านล่าง */}
          <a href="tel:0829879790"
            className="p-6 bg-white border border-slate-100 rounded-2xl hover:border-primary/40 hover:bg-primary/5 transition-all group text-center cursor-pointer block shadow-sm">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform mx-auto">
              <Phone size={22} className="text-primary" />
            </div>
            <p className="text-xs text-slate-400 uppercase font-bold mb-1 tracking-widest">Call Center</p>
            <p className="text-slate-900 font-semibold">082-987-9790</p>
          </a>

          {/* LINE — แก้ลิงก์ไลน์ที่ href="..." */}
          <a href="https://lin.ee/Z1pMLkJ" target="_blank" rel="noopener noreferrer"
            className="p-6 bg-white border border-slate-100 rounded-2xl hover:border-green-500/40 hover:bg-green-500/5 transition-all group text-center cursor-pointer block shadow-sm">
            <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform mx-auto">
              <MessageSquare size={22} className="text-green-500" />
            </div>
            <p className="text-xs text-slate-400 uppercase font-bold mb-1 tracking-widest">LINE Official</p>
            <p className="text-slate-900 font-semibold">@gbmoneyshop</p>
          </a>

          {/* Facebook — แก้ลิงก์เฟซบุ๊กที่ href="..." */}
          <a href="https://www.facebook.com/share/1EmdvU4Jwu/" target="_blank" rel="noopener noreferrer"
            className="p-6 bg-white border border-slate-100 rounded-2xl hover:border-blue-500/40 hover:bg-blue-500/5 transition-all group text-center cursor-pointer block shadow-sm">
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform mx-auto">
              <Globe size={22} className="text-blue-500" />
            </div>
            <p className="text-xs text-slate-400 uppercase font-bold mb-1 tracking-widest">Facebook</p>
            <p className="text-slate-900 font-semibold">GB Money Shop</p>
          </a>

          {/* Email — แก้อีเมลที่ href="mailto:..." */}
          <a href="mailto:support@gbmoney.com"
            className="p-6 bg-white border border-slate-100 rounded-2xl hover:border-purple-500/40 hover:bg-purple-500/5 transition-all group text-center cursor-pointer block shadow-sm">
            <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform mx-auto">
              <Mail size={22} className="text-purple-500" />
            </div>
            <p className="text-xs text-slate-400 uppercase font-bold mb-1 tracking-widest">Email</p>
            <p className="text-slate-900 font-semibold">support@gbmoney.com</p>
          </a>
        </motion.div>
      </section>
    </div>
  );
}
