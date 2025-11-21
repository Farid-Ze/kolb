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
  // Light mode: High opacity white for frosted glass look + dark border
  // Dark mode: Low opacity white/black for tinted glass look + light border
  const styles = {
    low: 'backdrop-blur-sm bg-white/40 dark:bg-black/5 border-slate-200/50 dark:border-white/5',
    medium: 'backdrop-blur-md bg-white/60 dark:bg-white/5 border-slate-200/60 dark:border-white/10',
    high: 'backdrop-blur-lg bg-white/80 dark:bg-white/10 border-slate-200/80 dark:border-white/20',
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
