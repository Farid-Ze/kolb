import React from 'react';
import { motion } from 'motion/react';

/**
 * KLSI 4.0 - LoadingComponent
 * Global loading component dengan Liquid Glass design
 * Task 10: LoadingComponent global
 * 
 * Menggunakan skeleton loaders sesuai Guidelines.md:
 * - Bagian 2.4.2: Skeleton dengan shimmer animation
 * - Bagian 2.3.1: Spring-based animations
 * - Bagian 1.4.1: 8px grid spacing
 */

interface LoadingComponentProps {
  variant?: 'fullscreen' | 'inline' | 'skeleton';
  message?: string;
}

export const LoadingComponent: React.FC<LoadingComponentProps> = ({
  variant = 'fullscreen',
  message = 'Memuat...',
}) => {
  // Spinner animation config (spring-based rotation)
  const spinnerVariants = {
    animate: {
      rotate: 360,
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: "linear"
      }
    }
  };

  if (variant === 'skeleton') {
    return (
      <div className="space-y-4 w-full">
        <div className="skeleton h-12 rounded-xl" />
        <div className="skeleton h-24 rounded-xl" />
        <div className="skeleton h-8 w-2/3 rounded-xl" />
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <motion.div
            className="inline-block h-8 w-8 rounded-full border-4 border-solid border-primary border-r-transparent"
            variants={spinnerVariants}
            animate="animate"
          />
          {message && (
            <motion.p 
              className="text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {message}
            </motion.p>
          )}
        </div>
      </div>
    );
  }

  // Fullscreen variant with glass backdrop (Bagian 4.2)
  return (
    <motion.div 
      className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-md z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className="glass-regular rounded-2xl p-8 space-y-6 max-w-sm mx-4 shadow-2xl"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        <div className="flex justify-center">
          <motion.div
            className="h-12 w-12 rounded-full border-4 border-solid border-primary border-r-transparent"
            variants={spinnerVariants}
            animate="animate"
          />
        </div>
        {message && (
          <motion.p 
            className="text-center text-muted-foreground"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 25 }}
          >
            {message}
          </motion.p>
        )}
      </motion.div>
    </motion.div>
  );
};

/**
 * Skeleton Loader variants untuk berbagai use cases
 * Bagian 2.4.2 - Shimmer animation untuk perceived performance
 */
export const SkeletonCard: React.FC = () => (
  <motion.div 
    className="material-regular rounded-2xl p-6 space-y-4"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ type: "spring", stiffness: 300, damping: 30 }}
  >
    <div className="skeleton h-6 w-1/3 rounded-xl" />
    <div className="skeleton h-20 rounded-xl" />
    <div className="skeleton h-4 w-2/3 rounded-xl" />
  </motion.div>
);

export const SkeletonList: React.FC<{ items?: number }> = ({ items = 3 }) => (
  <div className="space-y-4">
    {Array.from({ length: items }).map((_, i) => (
      <motion.div 
        key={i} 
        className="skeleton h-16 rounded-xl"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ 
          type: "spring", 
          stiffness: 300, 
          damping: 30,
          delay: i * 0.1 
        }}
      />
    ))}
  </div>
);
