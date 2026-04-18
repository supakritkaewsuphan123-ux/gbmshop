import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { ShoppingCart, Eye } from 'lucide-react';
import WishlistButton from './WishlistButton';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { getImageUrl } from '../lib/urlHelper';

export default function ProductCard({ product, index = 0 }) {
  const { user } = useAuth();
  const { addToCart, items } = useCart();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const inCart = items.some((p) => p.id === product.id);

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      showToast('กรุณาเข้าสู่ระบบก่อนเพิ่มสินค้าลงตะกร้า', 'error');
      navigate('/login', { state: { from: location } });
      return;
    }

    if (inCart) {
      showToast('สินค้าอยู่ในตะกร้าแล้ว', 'info');
      return;
    }
    addToCart({ id: product.id, name: product.name, price: product.price, image: product.image_url });
    showToast('เพิ่มลงตะกร้าเรียบร้อย 🛒', 'success');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      whileHover={{ y: -8, transition: { duration: 0.25 } }}
      className={`card overflow-hidden flex flex-col group relative ${
        product.stock <= 0 ? 'opacity-60' : ''
      }`}
    >
      {/* Condition badge */}
      <div className="absolute top-3 left-3 z-10 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full shadow-glow-sm">
        สภาพ {product.condition_percent}%
      </div>

      {/* Category badge */}
      <div className={`absolute top-3 right-3 z-10 text-white text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-lg ${
        product.category === 'มือสอง' 
          ? 'bg-gradient-to-r from-orange-500 to-amber-500' 
          : 'bg-gradient-to-r from-emerald-500 to-teal-500'
      }`}>
        {product.category === 'มือสอง' ? 'มือ2' : (product.category || 'มือ1')}
      </div>

      {/* Out of stock overlay */}
      {product.stock <= 0 && (
        <div className="absolute inset-0 z-30 bg-black/70 backdrop-blur-[2px] flex items-center justify-center rounded-2xl">
          <div className="flex flex-col items-center gap-2">
            <span className="bg-red-600/90 text-white font-black px-6 py-2 rounded-full text-sm shadow-xl tracking-wider uppercase">
              หมดสต็อก
            </span>
            <span className="text-white/60 text-[10px] font-medium">Out of Stock</span>
          </div>
        </div>
      )}

      {/* Wishlist Button Overlay */}
      {user && (
        <div className="absolute top-14 right-3 z-10">
          <WishlistButton productId={product.id} size={16} />
        </div>
      )}

      {/* Image */}
      <div className="relative overflow-hidden bg-white" style={{ height: '220px' }}>
        <img
          src={getImageUrl(product.image_url, 'product-images')}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          onError={(e) => { e.target.src = 'https://via.placeholder.com/300x250?text=No+Image'; }}
        />
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-all duration-300" />
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-slate-800 text-base mb-1 line-clamp-2 leading-snug">{product.name}</h3>
        <p className="text-slate-500 text-sm mb-3">
          โดย <span className="text-slate-600 font-medium">{product.seller_name}</span>
          {product.stock > 0 && (
            <span className="float-right text-green-400 text-xs">สต็อก: {product.stock}</span>
          )}
        </p>

        <div className="flex items-center justify-between mt-auto gap-2">
          <span className="text-primary font-bold text-xl">฿{product.price.toLocaleString()}</span>
          <div className="flex gap-2">
            {product.stock > 0 && (
              <button
                onClick={handleAddToCart}
                className={`p-2 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95 ${
                  inCart
                    ? 'bg-green-500/20 text-green-400 border border-green-500/40'
                    : 'bg-slate-50 text-slate-500 hover:text-white hover:bg-primary border border-slate-100'
                }`}
                title={inCart ? 'อยู่ในตะกร้าแล้ว' : 'เพิ่มในตะกร้า'}
              >
                <ShoppingCart size={16} />
              </button>
            )}
            <Link
              to={`/products/${product.id}`}
              className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-900 hover:text-white text-slate-600 border border-slate-100 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <Eye size={14} /> ดู
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
