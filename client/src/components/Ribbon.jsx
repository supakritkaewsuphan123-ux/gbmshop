import React from 'react';
import { motion } from 'framer-motion';

export default function Ribbon() {
  return (
    <div className="fixed top-0 left-0 w-64 h-64 pointer-events-none z-[99999] overflow-hidden">
      <motion.div
        animate={{
          boxShadow: [
            "0 0 10px rgba(255, 0, 0, 0.5)",
            "0 0 25px rgba(255, 0, 0, 0.8)",
            "0 0 10px rgba(255, 0, 0, 0.5)"
          ],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute top-10 -left-16 w-[350px] py-3 bg-gradient-to-r from-red-600 via-red-700 to-red-900 -rotate-45 flex items-center justify-center border-y-2 border-white/30 shadow-2xl origin-center"
      >
        <span className="text-white text-sm font-bold uppercase tracking-[0.2em] font-prompt drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
          จำหน่าย ของมือสองราคาถูก
        </span>
      </motion.div>
    </div>
  );
}
