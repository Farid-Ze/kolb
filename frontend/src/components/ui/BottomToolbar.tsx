/**
 * KLSI 4.0 - BottomToolbar Component
 * Task TODO2.md Phase 4.2: Bottom toolbar di Zona Hijau ergonomis
 * Phase 3.2: Reduce motion fallbacks
 * 
 * Implementasi sesuai Guidelines.md:
 * §1.3.2: Zona Hijau - Bottom placement untuk mobile ergonomics
 * §1.3.1: Safe area insets untuk notch/pill devices
 * §4.2: Material Kaca Fluidik untuk navigation layer
 * §2.5: Reduce motion support
 */

import React, { ReactNode } from 'react';
import { motion, type HTMLMotionProps } from 'motion/react';
import { cn } from '../../lib/utils';
import { useMotionConfig, SPRING_FAST, CROSS_FADE_FAST } from '../../lib/motion';
import { useReduceMotion } from '../../hooks/useReduceMotion';

interface BottomToolbarProps {
  children: ReactNode;
  className?: string;
  visible?: boolean;
}

/**
 * BottomToolbar - Glass bar untuk navigasi mobile di Zona Hijau
 * 
 * Bagian 1.3.2: Zona Hijau Ergonomi
 * - Bottom area adalah zona termudah dijangkau ibu jari
 * - Fitts's Law: T = a + b log₂(1 + D/W)
 *   - D (distance) minimum dari ibu jari
 *   - W (width) maximum (full width bar)
 *   - Hasil: T (time to target) terendah
 * 
 * Bagian 4.2.3: Navigation Layer menggunakan Material Kaca Fluidik
 */
export const BottomToolbar: React.FC<BottomToolbarProps> = ({
  children,
  className = '',
  visible = true,
}) => {
  const reduceMotion = useReduceMotion();
  const transition = useMotionConfig();
  const animation = {
    initial: reduceMotion ? false : { y: 100 },
    animate: { y: visible ? 0 : 100 },
    transition: reduceMotion ? { duration: 0 } : transition,
  } as const;

  return (
    <motion.div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40 glass-regular border-t border-border',
        className
      )}
      style={{
        /* Zona Hijau Ergonomis (Guidelines.md §1.3.2 - Task TODO2.md Phase 4.2) */
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
      }}
      initial={animation.initial}
      animate={animation.animate}
      transition={animation.transition}
    >
      <div className="mx-auto max-w-7xl px-4 py-3">
        {/* 
          Guidelines.md §1.3.2 - Ergonomi:
          Zona Hijau (Bottom) = Jarak minimal + Lebar maksimal = Waktu minimal
          CTA utama (Primary actions) HARUS di sini untuk mobile
        */}
        <div className="flex items-center justify-between gap-4">
          {children}
        </div>
      </div>
    </motion.div>
  );
};

/**
 * BottomToolbarButton - Button khusus untuk BottomToolbar
 * Optimized untuk ergonomi mobile dengan touch target 48x48px minimum
 */
interface BottomToolbarButtonProps extends HTMLMotionProps<'button'> {
  variant?: 'primary' | 'secondary' | 'ghost';
}

export const BottomToolbarButton: React.FC<BottomToolbarButtonProps> = ({
  children,
  variant = 'primary',
  disabled = false,
  className = '',
  ...props
}) => {
  const transition = useMotionConfig(SPRING_FAST, CROSS_FADE_FAST);

  const variantClasses = {
    primary: 'bg-primary text-primary-foreground',
    secondary: 'bg-secondary text-secondary-foreground',
    ghost: 'bg-transparent text-foreground hover:bg-secondary/50',
  };

  const baseClass = variantClasses[variant];

  return (
    <motion.button
      disabled={disabled}
      className={`
        flex-1 
        rounded-lg 
        px-6 py-4 
        min-h-[48px]
        focus-visible:outline-none 
        focus-visible:ring-2 
        focus-visible:ring-ring
        disabled:opacity-50 
        disabled:cursor-not-allowed
        ${baseClass}
        ${className}
      `.trim()}
      whileHover={!disabled ? { scale: 1.02 } : undefined}
      whileTap={!disabled ? { scale: 0.98 } : undefined}
      transition={transition}
      {...props}
    >
      {children}
    </motion.button>
  );
};