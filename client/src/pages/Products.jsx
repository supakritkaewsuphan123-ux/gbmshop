import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, SlidersHorizontal, Globe } from 'lucide-react';
import { supabase } from '../lib/supabase';
import ProductCard from '../components/ProductCard';
import { ProductCardSkeleton } from '../components/Spinner';
import { usePageMetadata } from '../hooks/usePageMetadata';

export default function Products() {
  usePageMetadata('ตลาดสินค้า', 'รวมสินค้าพรีเมียมคุณภาพดี ราคาคุ้มค่า ทันสมัยที่สุด');
  const [allProducts, setAllProducts] = useState([]); // Master list
  const [filtered, setFiltered] = useState([]); // Display list
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ทั้งหมด');
  const [sortBy, setSortBy] = useState('latest');

  // Fetch ALL products once on mount
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    
    const fetchProducts = async () => {
      try {
        const { data: productsData, error } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        if (isMounted) {
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
            setAllProducts(enriched);
          } else {
            setAllProducts([]);
          }
        }
      } catch (err) {
        console.error('[Products] Initial fetch error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProducts();
    return () => { isMounted = false; };
  }, []);

  // Local filtering and sorting (Instant)
  useEffect(() => {
    const list = Array.isArray(allProducts) ? allProducts : [];
    let result = [...list];
    
    // 1. Category filter (Local)
    if (selectedCategory !== 'ทั้งหมด') {
      result = result.filter(p => p.category === selectedCategory);
    }
    
    // 2. Search filter
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) => p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q)
      );
    }

    // 3. Sort
    if (sortBy === 'price-low') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'latest') {
      result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    setFiltered(result);
  }, [search, allProducts, sortBy, selectedCategory]);

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mb-16"
        >
          <div className="w-16 h-16 bg-slate-50 border border-slate-50 rounded-2xl flex items-center justify-center text-slate-900 mb-8 shadow-sm">
             <Globe size={32} />
          </div>
          <h1 className="text-6xl font-black text-slate-900 mb-4 tracking-tighter">รายการสินค้า</h1>
          <p className="text-xl text-slate-400 font-bold tracking-tight">เลือกซื้อสินค้าคุณภาพที่คัดสรรมาเพื่อคุณโดยเฉพาะ</p>
        </motion.div>

        {/* Filters & Search */}
        <div className="space-y-10 mb-16 px-2">
          <div className="flex flex-col md:flex-row gap-8 items-center justify-between">
            {/* Category Tabs */}
            <div className="flex bg-slate-50 border border-slate-100 p-2 rounded-[28px] w-full md:w-auto shadow-sm">
              {['ทั้งหมด', 'มือ1', 'มือสอง'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`flex-1 md:px-10 py-4 rounded-[20px] text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${
                    selectedCategory === cat
                      ? 'bg-slate-900 text-white shadow-soft scale-[1.02]'
                      : 'text-slate-400 hover:text-slate-900 hover:bg-white'
                  }`}
                >
                  {cat === 'มือสอง' ? 'มือ2' : cat}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4 w-full md:w-auto">
              {/* Sort Selection */}
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-white border border-slate-200 rounded-2xl px-6 py-4 text-slate-700 text-xs font-black uppercase tracking-widest focus:outline-none focus:border-slate-900 transition-all cursor-pointer shadow-sm w-full md:w-64 appearance-none text-center"
              >
                <option value="latest">จัดตาม: ล่าสุด</option>
                <option value="price-low">ราคา: ต่ำ - สูง</option>
                <option value="price-high">ราคา: สูง - ต่ำ</option>
              </select>
            </div>
          </div>

          {/* Search Input */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative max-w-4xl"
          >
            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300"><Search size={22} /></div>
            <input
              type="text"
              placeholder="ค้นตามชื่อสินค้าหรือหมวดหมู่..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-16 py-6 text-xl tracking-tight border-slate-100 focus:border-slate-900"
            />
          </motion.div>
        </div>

        {/* Grid */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-10"
            >
              {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
            </motion.div>
          ) : filtered.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-40 bg-white rounded-[48px] border-2 border-dashed border-slate-100"
            >
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-10 text-5xl shadow-inner">
                 <Search size={40} className="text-slate-200" />
              </div>
              <h3 className="text-4xl font-black text-slate-900 mb-4 tracking-tight uppercase">ไม่พบสินค้า</h3>
              <p className="text-slate-400 font-bold mb-10 max-w-md mx-auto">ไม่มีสินค้าที่คุณเลือกในขณะนี้ ลองเปลี่ยนคำค้นหาหรือหมวดหมู่ใหม่ครับ</p>
              <button 
                onClick={() => { setSearch(''); setSelectedCategory('ทั้งหมด'); }}
                className="bg-slate-900 text-white font-black px-12 py-5 rounded-2xl shadow-soft hover:brightness-110 active:scale-95 transition-all"
              >
                รีเซ็ตการค้นหาของฉัน
              </button>
            </motion.div>
          ) : (
            <motion.div 
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-10"
            >
              {filtered.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
