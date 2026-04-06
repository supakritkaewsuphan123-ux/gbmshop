import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Maximize2, X, Play, ZoomIn } from 'lucide-react';

/**
 * ProductGallery Component
 * Represents a professional-grade media gallery for product details.
 * Supports: Multiple images, videos, thumbnails, slider, zoom, and fullscreen modal.
 * 
 * Props:
 * - media: Array of objects { type: 'image' | 'video', src: string }
 */
export default function ProductGallery({ media = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [direction, setDirection] = useState(0); // 1 for next, -1 for prev
  const [isZoomed, setIsZoomed] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') paginate(-1);
      if (e.key === 'ArrowRight') paginate(1);
      if (e.key === 'Escape') setIsFullScreen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex]);

  if (!media || media.length === 0) {
    return (
      <div className="w-full h-[400px] bg-surface border border-border rounded-2xl flex items-center justify-center text-gray-500">
        ไม่มีรูปภาพสินค้า
      </div>
    );
  }

  const paginate = (newDirection) => {
    setDirection(newDirection);
    const nextIndex = (currentIndex + newDirection + media.length) % media.length;
    setCurrentIndex(nextIndex);
    setIsZoomed(false);
  };

  const currentMedia = media[currentIndex];

  // Helper for image URLs
  const getUrl = (src) => {
    if (!src) return '';
    return src.startsWith('http') ? src : `/uploads/${src}`;
  };

  // Zoom Logic
  const handleMouseMove = (e) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.pageX - left) / width) * 100;
    const y = ((e.pageY - top) / height) * 100;
    setMousePos({ x, y });
  };

  // Variants for Framer Motion slider
  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction) => ({
      zIndex: 0,
      x: direction < 0 ? 300 : -300,
      opacity: 0,
    }),
  };

  return (
    <div className="flex flex-col gap-4 w-full select-none">
      {/* Main Display Area */}
      <div className="relative aspect-square md:aspect-[4/3] bg-white rounded-2xl overflow-hidden border border-border shadow-soft group">
        
        {/* Main Media Content */}
        <div className="w-full h-full relative cursor-crosshair overflow-hidden"
             onMouseMove={isZoomed ? handleMouseMove : null}
             onMouseEnter={() => currentMedia.type === 'image' && setIsZoomed(true)}
             onMouseLeave={() => setIsZoomed(false)}
             onClick={() => setIsFullScreen(true)}
        >
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={currentIndex}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              {currentMedia.type === 'video' ? (
                <div className="relative w-full h-full pointer-events-auto">
                   <video 
                     src={getUrl(currentMedia.src)}
                     className="w-full h-full object-contain"
                     controls
                     autoPlay
                     muted
                   />
                </div>
              ) : (
                <div 
                  className="w-full h-full bg-no-repeat bg-contain bg-center transition-transform duration-200"
                  style={{
                    backgroundImage: `url(${getUrl(currentMedia.src)})`,
                    transform: isZoomed ? `scale(1.8)` : `scale(1)`,
                    transformOrigin: `${mousePos.x}% ${mousePos.y}%`
                  }}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Floating Icons/Badges */}
        <div className="absolute top-4 left-4 z-10 flex gap-2">
           <div className="bg-black/60 backdrop-blur-md text-white text-[10px] px-2 py-1 rounded-md uppercase font-bold tracking-widest border border-white/10">
              {currentMedia.type}
           </div>
           {currentMedia.type === 'image' && (
             <div className="bg-primary/20 backdrop-blur-md text-primary p-1 rounded-md border border-primary/20 invisible group-hover:visible transition-all">
                <ZoomIn size={14} />
             </div>
           )}
        </div>

        {/* Expand Button */}
        <button 
          onClick={(e) => { e.stopPropagation(); setIsFullScreen(true); }}
          className="absolute top-4 right-4 z-10 bg-white/10 hover:bg-white/20 backdrop-blur-md p-2 rounded-xl text-white opacity-0 group-hover:opacity-100 transition-all border border-white/20 shadow-lg"
        >
          <Maximize2 size={18} />
        </button>

        {/* Navigation Arrows */}
        {media.length > 1 && (
          <>
            <button 
              onClick={(e) => { e.stopPropagation(); paginate(-1); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/10 hover:bg-white/30 backdrop-blur-md p-3 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all border border-white/20 shadow-xl"
            >
              <ChevronLeft size={24} />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); paginate(1); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/10 hover:bg-white/30 backdrop-blur-md p-3 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all border border-white/20 shadow-xl"
            >
              <ChevronRight size={24} />
            </button>
          </>
        )}

        {/* Index Dots (Mobile) */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-1.5 md:hidden">
          {media.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all ${i === currentIndex ? 'w-4 bg-primary' : 'w-1.5 bg-white/50'}`} />
          ))}
        </div>
      </div>

      {/* Thumbnails Row */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide px-0.5">
        {media.map((item, idx) => (
          <motion.div
            key={idx}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setCurrentIndex(idx)}
            className={`
              relative flex-shrink-0 w-20 h-20 rounded-xl border-2 cursor-pointer transition-all overflow-hidden bg-white
              ${idx === currentIndex ? 'border-primary shadow-glow-sm shadow-primary/20 scale-95' : 'border-transparent opacity-60 hover:opacity-100 hover:border-gray-300'}
            `}
          >
            {item.type === 'video' ? (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                <Play size={20} className="text-primary fill-primary/20" />
                <div className="absolute bottom-1 right-1 bg-black/60 text-[8px] text-white px-1 rounded uppercase">Video</div>
              </div>
            ) : (
              <img src={getUrl(item.src)} className="w-full h-full object-cover" alt={`thumb-${idx}`} loading="lazy" />
            )}
            
            {/* Active Overlay */}
            {idx === currentIndex && (
              <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
            )}
          </motion.div>
        ))}
      </div>

      {/* Fullscreen Overlay Modal */}
      <AnimatePresence>
        {isFullScreen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 md:p-10"
          >
            {/* Close Button */}
            <button 
              onClick={() => setIsFullScreen(false)}
              className="absolute top-10 right-10 text-white/60 hover:text-white transition-colors p-2"
            >
              <X size={32} />
            </button>

            {/* Slider Controls */}
            <button onClick={() => paginate(-1)} className="absolute left-4 md:left-10 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors p-4">
              <ChevronLeft size={48} />
            </button>
            <button onClick={() => paginate(1)} className="absolute right-4 md:right-10 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors p-4">
              <ChevronRight size={48} />
            </button>

            {/* Main Content (High Res) */}
            <div className="w-full h-full max-w-6xl max-h-[80vh] flex items-center justify-center pointer-events-none">
              {currentMedia.type === 'video' ? (
                <video src={getUrl(currentMedia.src)} controls autoPlay className="max-w-full max-h-full pointer-events-auto" />
              ) : (
                <img src={getUrl(currentMedia.src)} className="max-w-full max-h-full object-contain shadow-2xl" alt="fullscreen" />
              )}
            </div>

            {/* Fullscreen Thumbnails */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-3 px-4 max-w-full overflow-x-auto scrollbar-hide">
              {media.map((item, idx) => (
                <div 
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-16 h-16 rounded-lg border-2 transition-all overflow-hidden cursor-pointer flex-shrink-0 ${idx === currentIndex ? 'border-primary' : 'border-white/10 opacity-40'}`}
                >
                  {item.type === 'image' ? (
                    <img src={getUrl(item.src)} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-white/5"><Play size={16} className="text-white" /></div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
