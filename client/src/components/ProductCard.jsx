import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { ShoppingCart, Eye, Star, User, Box } from 'lucide-react';
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
      transition={{ duration: 0.6, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
      className="group relative bg-brand-navy/60 backdrop-blur-md border border-primary/10 rounded-[32px] overflow-hidden transition-all duration-500 hover:shadow-glow-sm hover:border-primary/30 flex flex-col"
    >
      {/* Badges */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
         <div className="bg-brand-dark/95 backdrop-blur-md text-primary text-[9px] font-black px-3 py-1.5 rounded-xl shadow-sm border border-primary/10 uppercase tracking-widest leading-none">
           Cond: {product.condition_percent}%
         </div>
      </div>

      <div className="absolute top-4 right-4 z-10">
         <div className={`text-white text-[9px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest shadow-glow-sm leading-none ${
           product.category === 'มือสอง' 
             ? 'bg-primary/60' 
             : 'bg-primary'
         }`}>
           {product.category === 'มือสอง' ? 'Used' : (product.category || 'New')}
         </div>
      </div>

      {/* Out of stock overlay */}
      {product.stock <= 0 && (
        <div className="absolute inset-0 z-30 bg-brand-dark/80 backdrop-blur-[2px] flex items-center justify-center">
            <span className="bg-primary text-white font-black px-6 py-2 rounded-xl text-[10px] shadow-glow-sm tracking-widest uppercase">
              Sold Out
            </span>
        </div>
      )}

      {/* Image */}
      <Link to={`/products/${product.id}`} className="block relative overflow-hidden bg-[#0a192f] aspect-square">
        <img
          src={getImageUrl(product.image_url, 'product-images')}
          alt={product.name}
          className="w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-110 group-hover:opacity-100"
          onError={(e) => { e.target.src = 'https://ui-avatars.com/api/?name=GB&background=050B18&color=EE4D2D'; }}
        />
        <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-all duration-500" />
      </Link>

      {/* Info */}
      <div className="p-6 flex flex-col flex-1">
        <div className="flex items-center gap-1 mb-3 text-primary">
           <Star size={10} fill="currentColor" />
           <Star size={10} fill="currentColor" />
           <Star size={10} fill="currentColor" />
           <Star size={10} fill="currentColor" />
           <Star size={10} fill="currentColor" />
        </div>
        
        <Link to={`/products/${product.id}`} className="block mb-2">
            <h3 className="font-black text-primary text-lg line-clamp-1 leading-tight tracking-tight hover:text-primary transition-colors uppercase">{product.name}</h3>
        </Link>
        
        <div className="flex items-center justify-between mb-4">
          <p className="text-primary/60 text-[10px] font-bold uppercase tracking-widest">
            By <span className="text-primary font-black">{product.seller_name}</span>
          </p>
          <div className="flex items-center gap-1 text-primary/60 text-[10px] font-black uppercase tracking-widest">
            <Box size={10} /> {product.stock}
          </div>
        </div>

         <div className="mt-auto flex items-center justify-between pt-4 border-t border-primary/10">
          <span className="text-primary font-black text-2xl tracking-tighter">฿{product.price.toLocaleString()}</span>
          
          <div className="flex gap-2">
            {product.stock > 0 && !inCart && (
              <button
                onClick={handleAddToCart}
                className="w-10 h-10 bg-primary/10 text-primary hover:text-white hover:bg-primary border border-primary/20 rounded-xl transition-all flex items-center justify-center shadow-sm"
                title="Add to Cart"
              >
                <ShoppingCart size={16} />
              </button>
            )}
            <Link
              to={`/products/${product.id}`}
              className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center hover:brightness-110 shadow-glow-sm transition-all"
            >
              <Eye size={16} />
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
