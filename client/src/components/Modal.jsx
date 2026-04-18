import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function Modal({ isOpen, onClose, children, title, maxWidth = 'max-w-md' }) {
  // Close on Escape
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // Prevent body scroll
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[9999] grid place-items-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto no-scrollbar"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 30 }}
            transition={{ type: 'spring', stiffness: 450, damping: 35 }}
            className={`bg-white border border-slate-100 rounded-[40px] shadow-2xl w-full ${maxWidth} my-auto relative`}
          >
            {/* Header */}
            {title && (
              <div className="flex items-center justify-between p-6 border-b border-slate-50">
                <div className="w-10"></div> {/* Spacer for symmetry */}
                <h3 className="text-xl font-black text-slate-900 flex-1 text-center truncate">{title}</h3>
                <button
                  onClick={onClose}
                  className="p-2 text-slate-300 hover:text-slate-900 hover:bg-slate-50 rounded-2xl transition-all duration-200"
                >
                  <X size={20} />
                </button>
              </div>
            )}

            {/* Body */}
            <div className="p-8">
              {!title && (
                <button
                  onClick={onClose}
                  className="absolute top-6 right-6 p-2 text-slate-300 hover:text-slate-900 hover:bg-slate-50 rounded-2xl transition-all duration-200"
                >
                  <X size={20} />
                </button>
              )}
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
