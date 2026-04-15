import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function WishlistButton({ productId, initialStatus = false, size = 18 }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [inWishlist, setInWishlist] = useState(initialStatus);
  const [loading, setLoading] = useState(false);

  // Sync if initialStatus changes
  useEffect(() => {
    setInWishlist(initialStatus);
  }, [initialStatus]);

  const toggle = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!user) {
      showToast('กรุณาเข้าสู่ระบบก่อน', 'error');
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      if (inWishlist) {
        await supabase.from('wishlist').delete().eq('product_id', productId).eq('user_id', user.id);
        setInWishlist(false);
        showToast('ลบออกจากรายการโปรดแล้ว', 'success');
      } else {
        await supabase.from('wishlist').insert({ product_id: productId, user_id: user.id });
        setInWishlist(true);
        showToast('เพิ่มลงในรายการโปรดแล้ว', 'success');
      }
    } catch (err) {
      showToast('เกิดข้อผิดพลาด', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={toggle}
      disabled={loading}
      className={`p-2 rounded-full transition-all duration-300 ${
        inWishlist 
          ? 'bg-red-500/20 text-red-500 shadow-glow-sm' 
          : 'bg-white/5 text-gray-500 hover:text-white border border-white/5'
      }`}
    >
      <Heart 
        size={size} 
        fill={inWishlist ? 'currentColor' : 'none'} 
        className={loading ? 'opacity-50' : 'opacity-100'}
      />
    </motion.button>
  );
}
