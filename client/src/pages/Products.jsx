import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, SlidersHorizontal } from 'lucide-react';
import { supabase } from '../lib/supabase';
import ProductCard from '../components/ProductCard';
import { ProductCardSkeleton } from '../components/Spinner';
import { usePageMetadata } from '../hooks/usePageMetadata';

export default function Products() {
  usePageMetadata('ตลาดสินค้า', 'รวมสินค้าพรีเมียมคุณภาพดี ราคาคุ้มค่า พร้อมระบบตรวจสอบสินค้าและระบบวอลเล็ทที่ปลอดภัย 100%');
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
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-extrabold text-slate-900 mb-2">ตลาดสินค้า</h1>
        <p className="text-slate-500">ค้นหาสินค้ามือหนึ่งและมือสองคุณภาพพรีเมียม</p>
      </motion.div>

      {/* Filters & Search */}
      <div className="space-y-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Category Tabs */}
          <div className="flex bg-slate-50 border border-slate-200 p-1.5 rounded-2xl w-full md:w-auto shadow-sm">
            {['ทั้งหมด', 'มือ1', 'มือสอง'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`flex-1 md:px-8 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white shadow-lg shadow-slate-200 scale-[1.02]'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-white'
                }`}
              >
                {cat === 'มือสอง' ? 'มือ2' : cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Sort Selection */}
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-700 text-sm font-medium focus:outline-none focus:border-slate-400 transition-all cursor-pointer shadow-sm"
            >
              <option value="latest">เรียงตาม: ล่าสุด</option>
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
          className="relative max-w-2xl"
        >
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="ค้นหาตามชื่อสินค้าหรือรายละเอียด..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-12 py-4 text-lg"
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
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
          >
            {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
          </motion.div>
        ) : filtered.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-24 glass rounded-3xl border-dashed border-2 border-white/5"
          >
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl shadow-inner">
              🔍
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">ไม่พบสินค้าที่คุณค้นหา</h3>
            <p className="text-slate-500 max-w-sm mx-auto">ลองเปลี่ยนหมวดหมู่หรือใช้คำค้นหาอื่นแทน</p>
            <button 
              onClick={() => { setSearch(''); setSelectedCategory('ทั้งหมด'); }}
              className="mt-8 text-primary font-bold hover:underline"
            >
              รีเซ็ตการค้นหาทั้งหมด
            </button>
          </motion.div>
        ) : (
          <motion.div 
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
          >
            {filtered.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
