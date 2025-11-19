import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

export interface GlassMaterialProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  className?: string;
  intensity?: 'low' | 'medium' | 'high';
}

export const GlassMaterial: React.FC<GlassMaterialProps> = ({
  children,
  className = '',
  intensity = 'medium',
  ...props
}) => {
  // Map intensity to visual properties
  const styles = {
    low: 'backdrop-blur-sm bg-white/5 dark:bg-black/5 border-white/5',
    medium: 'backdrop-blur-md bg-white/10 dark:bg-black/10 border-white/10',
    high: 'backdrop-blur-lg bg-white/20 dark:bg-black/20 border-white/20',
  };

  return (
    <motion.div
      className={`
        relative overflow-hidden rounded-2xl border shadow-xl
        ${styles[intensity]}
        ${className}
      `}
      {...props}
    >
      {/* Noise texture overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-noise mix-blend-overlay" />
      
      {/* Content */}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
};
