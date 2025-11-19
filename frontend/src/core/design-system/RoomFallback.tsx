import React from 'react';
import { motion } from 'framer-motion';

export const RoomFallback: React.FC = () => {
  return (
    <div className="w-full h-full flex items-center justify-center bg-slate-900">
      <div className="relative w-16 h-16">
        <motion.div
          className="absolute inset-0 border-4 border-white/20 rounded-full"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        />
        <motion.div
          className="absolute inset-0 border-t-4 border-emerald-500 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </div>
    </div>
  );
};
