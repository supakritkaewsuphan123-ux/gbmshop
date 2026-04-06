import React from 'react';
import { motion } from 'framer-motion';

export default function Background() {
  return (
    <div className="fixed inset-0 w-full h-full bg-[#0f0f0f] z-[-1] overflow-hidden pointer-events-none">
      {/* Animated Diagonal Lines Layer */}
      <motion.div 
        initial={{ backgroundPosition: '0 0' }}
        animate={{ backgroundPosition: '100px 0' }}
        transition={{ 
          duration: 15, 
          repeat: Infinity, 
          ease: "linear" 
        }}
        className="absolute inset-0 opacity-[0.05]" 
        style={{ 
          backgroundImage: `repeating-linear-gradient(
            45deg, 
            #ff003c 0, 
            #ff003c 1px, 
            transparent 0, 
            transparent 24px
          )`,
          backgroundSize: '34px 34px'
        }}
      />

      {/* Main Soft Red Gradient */}
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.03, 0.05, 0.03],
          x: [-20, 20, -20],
          y: [-10, 10, -10]
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] bg-gradient-to-br from-[#ff003c]/20 to-transparent rounded-full blur-[120px]"
      />

      {/* Secondary Pulse Glows */}
      <motion.div
        animate={{
          opacity: [0.02, 0.04, 0.02],
          scale: [0.9, 1.1, 0.9]
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1
        }}
        className="absolute bottom-[5%] right-[5%] w-[40%] h-[40%] bg-[#ff003c] rounded-full blur-[100px]"
      />

      <motion.div
        animate={{
          opacity: [0, 0.03, 0],
          x: [0, -30, 0]
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 3
        }}
        className="absolute top-[40%] left-[30%] w-[30%] h-[30%] bg-[#ff003c] rounded-full blur-[140px]"
      />

      {/* Overlay vignette to keep center clean */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-transparent to-[#0f0f0f] opacity-60" />
    </div>
  );
}
