/**
 * KLSI 4.0 - Spinner Component
 * Task TODO2.md Phase 3.13: Modern loader dengan pulsing dots
 * 
 * Implementasi sesuai Guidelines.md §2.4.1:
 * - Visual feedback untuk operasi > 500ms
 * - Smooth animation untuk reduce motion
 * - Accessible dengan proper ARIA labels
 * 
 * Variants:
 * - dots: Pulsing dots (default)
 * - circle: Spinning circle
 * - ring: Spinning ring with tail
 */

import React from 'react';
import { motion } from 'motion/react';
import { cn } from './utils';
import { VibrantText } from './VibrantText';
import { useUIPreferences } from '../../contexts/UIPreferencesContext';

interface SpinnerProps {
  /** Spinner variant */
  variant?: 'dots' | 'circle' | 'ring';
  /** Size preset */
  size?: 'sm' | 'md' | 'lg';
  /** Custom size in pixels (overrides preset) */
  customSize?: number;
  /** Color (CSS color or Tailwind class) */
  color?: string;
  /** Additional className */
  className?: string;
  /** Accessible label */
  label?: string;
}

/**
 * Spinner - Modern loading indicator
 * 
 * Guidelines.md §2.4.1:
 * - Digunakan untuk operasi > 500ms (perceived delay)
 * - Lebih modern daripada spinner generik
 * - Smooth animation dengan reduce motion support
 * 
 * @example
 * // Default pulsing dots
 * <Spinner />
 * 
 * @example
 * // Large spinning ring
 * <Spinner variant="ring" size="lg" color="text-primary" />
 * 
 * @example
 * // Custom size
 * <Spinner variant="circle" customSize={32} label="Loading data..." />
 */
export const Spinner: React.FC<SpinnerProps> = ({
  variant = 'dots',
  size = 'md',
  customSize,
  color = 'text-primary',
  className = '',
  label = 'Loading...',
}) => {
  const { reduceMotion } = useUIPreferences();

  // Size presets
  const sizeMap = {
    sm: 16,
    md: 24,
    lg: 32,
  };

  const actualSize = customSize || sizeMap[size];

  if (variant === 'dots') {
    return (
      <div
        className={cn('inline-flex items-center gap-1', className)}
        role="status"
        aria-label={label}
      >
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            className={cn('rounded-full', color)}
            style={{
              width: actualSize / 3,
              height: actualSize / 3,
              backgroundColor: 'currentColor',
            }}
            animate={
              reduceMotion
                ? { opacity: 0.5 }
                : {
                    opacity: [0.3, 1, 0.3],
                    scale: [0.8, 1, 0.8],
                  }
            }
            transition={
              reduceMotion
                ? { duration: 0 }
                : {
                    duration: 1.4,
                    repeat: Infinity,
                    delay: index * 0.2,
                    // Use spring for organic pulsing (Guidelines.md §2.3.1)
                    type: 'spring',
                    stiffness: 50,
                    damping: 10,
                  }
            }
          />
        ))}
        <span className="sr-only">{label}</span>
      </div>
    );
  }

  if (variant === 'circle') {
    return (
      <div
        className={cn('inline-block', className)}
        role="status"
        aria-label={label}
      >
        <motion.div
          className={cn('rounded-full border-2 border-current', color)}
          style={{
            width: actualSize,
            height: actualSize,
            borderTopColor: 'transparent',
          }}
          animate={
            reduceMotion
              ? {}
              : { rotate: 360 }
          }
          transition={
            reduceMotion
              ? { duration: 0 }
              : {
                  duration: 1,
                  repeat: Infinity,
                  ease: 'linear',
                }
          }
        />
        <span className="sr-only">{label}</span>
      </div>
    );
  }

  // ring variant
  return (
    <div
      className={cn('inline-block', className)}
      role="status"
      aria-label={label}
    >
      <svg
        width={actualSize}
        height={actualSize}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={color}
      >
        <motion.circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="60"
          strokeDashoffset="60"
          animate={
            reduceMotion
              ? {}
              : {
                  rotate: 360,
                  strokeDashoffset: [60, 0, 60],
                }
          }
          transition={
            reduceMotion
              ? { duration: 0 }
              : {
                  rotate: {
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'linear',
                  },
                  strokeDashoffset: {
                    duration: 1.5,
                    repeat: Infinity,
                    // Use spring for organic movement (Guidelines.md §2.3.1)
                    type: 'spring',
                    stiffness: 40,
                    damping: 15,
                  },
                }
          }
          style={{ originX: '50%', originY: '50%' }}
        />
      </svg>
      <span className="sr-only">{label}</span>
    </div>
  );
};

/**
 * LoadingOverlay - Full-screen loading overlay dengan backdrop
 * 
 * @example
 * {isLoading && <LoadingOverlay />}
 */
export const LoadingOverlay: React.FC<{
  message?: string;
  variant?: 'dots' | 'circle' | 'ring';
}> = ({ message = 'Loading...', variant = 'ring' }) => {
  return (
    <motion.div
      className="fixed inset-0 z-notification flex items-center justify-center bg-black/20 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="glass-regular rounded-xl p-8 space-y-4 text-center">
        <Spinner variant={variant} size="lg" />
        {message && (
          <VibrantText hierarchy="primary" as="p">
            {message}
          </VibrantText>
        )}
      </div>
    </motion.div>
  );
};

/**
 * InlineSpinner - Smaller spinner untuk inline loading states
 */
export const InlineSpinner: React.FC<{
  className?: string;
}> = ({ className }) => {
  return (
    <Spinner
      variant="circle"
      size="sm"
      color="text-muted-foreground"
      className={className}
      label="Loading"
    />
  );
};