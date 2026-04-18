import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Mail, MessageSquare, Globe, ShieldCheck, Zap, Heart } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/ProductCard';
import { ProductCardSkeleton } from '../components/Spinner';
import { useToast } from '../context/ToastContext';
import { usePageMetadata } from '../hooks/usePageMetadata';

export default function Home() {
  usePageMetadata('หน้าแรก', 'GBshop Marketplace - ตลาดซื้อขายสินค้าพรีเมียม ปลอดภัย มั่นใจ 100%');
  
  const { user } = useAuth();
  const { showToast } = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

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
            seller_name: profileMap[p.user_id]?.username || 'GB Official'
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

  return (
    <div className="bg-white">
      {/* ===== FEATURED PRODUCTS (TOP) ===== */}
      <section className="max-w-7xl mx-auto px-6 pt-32 pb-40">
        <div className="flex flex-col md:flex-row justify-between items-end mb-24 gap-10">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="text-left"
          >
            <h2 className="text-6xl font-black text-[#000000] mb-6 tracking-tight">สินค้าแนะนำ</h2>
            <p className="text-2xl text-[#F97316] font-bold">เลือกชมสินค้าคุณภาพที่ผ่านการคัดสรรมาเพื่อคุณ</p>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <Link to="/products" className="text-[#000000] font-black flex items-center gap-3 hover:translate-x-2 transition-transform py-6 px-12 bg-white rounded-[24px] border border-blue-50 shadow-soft">
              ดูทั้งหมด <ArrowRight size={24} className="text-primary" />
            </Link>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
        </div>
      </section>

      {/* ===== TRUST SECTION ===== */}
      <section className="bg-slate-50/30 py-40 border-y border-slate-50">
         <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-24">
            <div className="text-center group">
               <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-primary mx-auto mb-8 shadow-soft border border-blue-50 group-hover:bg-primary group-hover:text-white transition-all"><ShieldCheck size={36} /></div>
               <h4 className="text-2xl font-black text-[#000000] mb-3 uppercase tracking-tighter">ปลอดภัย 100%</h4>
               <p className="text-[#555555] font-bold leading-relaxed">ตรวจสอบความปลอดภัยทุกออเดอร์ มั่นใจได้ในทุกคำสั่งซื้อ</p>
            </div>
            <div className="text-center group">
               <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-primary mx-auto mb-8 shadow-soft border border-blue-50 group-hover:bg-primary group-hover:text-white transition-all"><Zap size={36} /></div>
               <h4 className="text-2xl font-black text-[#000000] mb-3 uppercase tracking-tighter">จัดส่งว่องไว</h4>
               <p className="text-[#555555] font-bold leading-relaxed">ระบบยืนยันออเดอร์รวดเร็ว พร้อมแจ้งเตือนทันทีเมื่อมีการเปลี่ยนแปลง</p>
            </div>
            <div className="text-center group">
               <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-primary mx-auto mb-8 shadow-soft border border-blue-50 group-hover:bg-primary group-hover:text-white transition-all"><MessageSquare size={36} /></div>
               <h4 className="text-2xl font-black text-[#000000] mb-3 uppercase tracking-tighter">ดูแลตลอด 24 ชม.</h4>
               <p className="text-[#555555] font-bold leading-relaxed">ทีมงานแอดมินพร้อมซัพพอร์ตและแก้ไขปัญหาให้คุณได้ทุกเวลา</p>
            </div>
         </div>
      </section>

      {/* ===== CONTACT SECTION ===== */}
      <section className="max-w-7xl mx-auto px-6 py-40">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <h2 className="text-6xl font-black text-[#000000] mb-6 tracking-tight">ช่องทางติดต่อ</h2>
          <p className="text-2xl text-[#555555] font-bold">เลือกช่องทางที่คุณสะดวกเพื่อสอบถามข้อมูลเพิ่มเติม</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 max-w-5xl mx-auto"
        >
          <a href="https://lin.ee/Z1pMLkJ" target="_blank" rel="noopener noreferrer"
            className="p-10 bg-white border border-blue-50 rounded-[48px] hover:border-blue-100 hover:-translate-y-2 transition-all group text-center shadow-soft block">
            <div className="w-20 h-20 bg-blue-50/30 rounded-[28px] flex items-center justify-center mb-10 group-hover:bg-green-50 transition-all mx-auto shadow-sm">
              <MessageSquare size={40} className="text-[#000000] group-hover:text-green-500" />
            </div>
            <p className="text-[10px] text-[#555555] uppercase font-black mb-1 tracking-[0.4em]">LINE Official</p>
            <p className="text-[#000000] font-black text-2xl">@gbmoneyshop</p>
          </a>

          <a href="https://www.facebook.com/share/1EmdvU4Jwu/" target="_blank" rel="noopener noreferrer"
            className="p-10 bg-white border border-blue-50 rounded-[48px] hover:border-blue-100 hover:-translate-y-2 transition-all group text-center shadow-soft block">
            <div className="w-20 h-20 bg-blue-50/30 rounded-[28px] flex items-center justify-center mb-10 group-hover:bg-blue-600 transition-all mx-auto shadow-sm">
              <Globe size={40} className="text-[#000000] group-hover:text-white" />
            </div>
            <p className="text-[10px] text-[#555555] uppercase font-black mb-1 tracking-[0.4em]">Facebook</p>
            <p className="text-[#000000] font-black text-2xl">GB Money Shop</p>
          </a>

          <a href="mailto:support@gbmoney.com"
            className="p-10 bg-white border border-slate-100 rounded-[48px] hover:border-slate-200 hover:-translate-y-2 transition-all group text-center shadow-soft block md:col-span-2 lg:col-span-1">
            <div className="w-20 h-20 bg-slate-50 rounded-[28px] flex items-center justify-center mb-10 group-hover:bg-primary/5 transition-all mx-auto shadow-sm">
              <Mail size={40} className="text-slate-900 group-hover:text-primary" />
            </div>
            <p className="text-[10px] text-slate-400 uppercase font-black mb-1 tracking-[0.4em]">Email Support</p>
            <p className="text-slate-900 font-black text-2xl lowercase">support@gbmoney.com</p>
          </a>
        </motion.div>
      </section>
    </div>
  );
}
