import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { ShoppingCart, Eye, Star } from 'lucide-react';
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
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
      className={`group relative bg-white border border-slate-100 rounded-[32px] overflow-hidden transition-all duration-500 hover:shadow-soft hover:border-slate-200 flex flex-col ${
        product.stock <= 0 ? 'opacity-60' : ''
      }`}
    >
      {/* Badges */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
         <div className="bg-white/95 backdrop-blur-md text-slate-900 text-[9px] font-black px-3 py-1.5 rounded-xl shadow-sm border border-slate-100 uppercase tracking-widest leading-none">
           Cond: {product.condition_percent}%
         </div>
      </div>

      <div className="absolute top-4 right-4 z-10">
         <div className={`text-white text-[9px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest shadow-sm leading-none ${
           product.category === 'มือสอง' 
             ? 'bg-slate-400' 
             : 'bg-slate-900'
         }`}>
           {product.category === 'มือสอง' ? 'Used' : (product.category || 'New')}
         </div>
      </div>

      {/* Out of stock overlay */}
      {product.stock <= 0 && (
        <div className="absolute inset-0 z-30 bg-white/80 backdrop-blur-[2px] flex items-center justify-center">
            <span className="bg-slate-900 text-white font-black px-6 py-2 rounded-xl text-[10px] shadow-soft tracking-widest uppercase">
              Sold Out
            </span>
        </div>
      )}

      {/* Wishlist Button Overlay */}
      {user && (
        <div className="absolute bottom-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
          <WishlistButton productId={product.id} size={14} />
        </div>
      )}

      {/* Image */}
      <Link to={`/products/${product.id}`} className="block relative overflow-hidden bg-slate-50 aspect-square">
        <img
          src={getImageUrl(product.image_url, 'product-images')}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          onError={(e) => { e.target.src = 'https://ui-avatars.com/api/?name=GB&background=f1f5f9&color=cbd5e1'; }}
        />
        <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/5 transition-all duration-500" />
      </Link>

      {/* Info */}
      <div className="p-6 flex flex-col flex-1">
        <div className="flex items-center gap-1 mb-3 text-slate-900">
           <Star size={10} fill="currentColor" />
           <Star size={10} fill="currentColor" />
           <Star size={10} fill="currentColor" />
           <Star size={10} fill="currentColor" />
           <Star size={10} fill="currentColor" />
        </div>
        
        <Link to={`/products/${product.id}`} className="block mb-2">
            <h3 className="font-black text-slate-900 text-lg line-clamp-1 leading-tight tracking-tight group-hover:text-primary transition-colors">{product.name}</h3>
        </Link>
        
        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-6">
          By <span className="text-slate-900">{product.seller_name}</span>
        </p>

        <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-50">
          <span className="text-slate-900 font-black text-2xl tracking-tighter">฿{product.price.toLocaleString()}</span>
          
          <div className="flex gap-2">
            {product.stock > 0 && !inCart && (
              <button
                onClick={handleAddToCart}
                className="w-10 h-10 bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-white border border-transparent hover:border-slate-100 rounded-xl transition-all flex items-center justify-center"
                title="Add to Cart"
              >
                <ShoppingCart size={16} />
              </button>
            )}
            <Link
              to={`/products/${product.id}`}
              className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center hover:brightness-110 shadow-soft transition-all"
            >
              <Eye size={16} />
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
