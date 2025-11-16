/**
 * KLSI 4.0 - AnimatedListItem Component
 * Task TODO2.md Phase 3.11: List item dengan fade-in + slide-down animation
 * Phase 3.2: Reduce motion fallbacks
 * 
 * Implementasi sesuai Guidelines.md §2.2.3:
 * - Memandu fokus pengguna
 * - Fade-in + slide-down untuk item baru
 * - Staggered animations untuk multiple items
 * - Spring physics untuk natural motion
 * - Reduce motion fallback
 */

import React, { ReactNode } from 'react';
import { motion } from 'motion/react';
import { useReduceMotion } from '../../hooks/useReduceMotion';
import {
  useMotionConfig,
  useMotionVariants,
  SPRING_SMOOTH,
  CROSS_FADE,
} from '../../lib/motion';
import { cn } from '../../lib/utils';

interface AnimatedListItemProps {
  children: ReactNode;
  /** Delay for staggered animation (seconds) */
  delay?: number;
  /** Custom className */
  className?: string;
  /** Layout animation (untuk reordering) */
  layoutId?: string;
  /** Hover effect */
  hoverScale?: boolean;
  /** Click handler */
  onClick?: () => void;
}

/**
 * AnimatedListItem - List item dengan entrance animation
 * 
 * Features:
 * - Fade-in + slide-down entrance (Guidelines.md §2.2.3)
 * - Spring physics untuk smooth motion
 * - Stagger support untuk sequential animations
 * - Layout animations untuk reordering
 * - Reduce motion fallback
 * 
 * @example
 * // Simple list item
 * <AnimatedListItem>
 *   <div>Item content</div>
 * </AnimatedListItem>
 * 
 * @example
 * // Staggered list dengan delay
 * {items.map((item, index) => (
 *   <AnimatedListItem key={item.id} delay={index * 0.05}>
 *     <div>{item.name}</div>
 *   </AnimatedListItem>
 * ))}
 * 
 * @example
 * // Interactive item dengan hover
 * <AnimatedListItem
 *   hoverScale
 *   onClick={handleClick}
 *   className="cursor-pointer"
 * >
 *   <div>Clickable item</div>
 * </AnimatedListItem>
 */
export const AnimatedListItem: React.FC<AnimatedListItemProps> = ({
  children,
  delay = 0,
  className = '',
  layoutId,
  hoverScale = false,
  onClick,
}) => {
  const reduceMotion = useReduceMotion();
  const transition = useMotionConfig(SPRING_SMOOTH, CROSS_FADE);
  const variants = useMotionVariants('listItem');

  // Motion configuration
  const motionProps = reduceMotion
    ? {
        // Reduce motion: Simple fade
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { ...CROSS_FADE, delay },
      }
    : {
        // Normal: Spring with slide-down
        variants: variants,
        initial: 'hidden',
        animate: 'visible',
        exit: 'hidden',
        transition: {
          ...transition,
          delay,
        },
      };

  // Hover animation
  const hoverProps = hoverScale && !reduceMotion
    ? {
        whileHover: {
          scale: 1.02,
        },
        whileTap: {
          scale: 0.98,
        },
      }
    : {};

  const Component = onClick ? motion.button : motion.div;

  return (
    <Component
      className={cn(
        'w-full',
        onClick && 'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded',
        className
      )}
      onClick={onClick}
      layoutId={layoutId}
      {...motionProps}
      {...hoverProps}
    >
      {children}
    </Component>
  );
};

/**
 * AnimatedList - Container untuk list dengan stagger
 * 
 * @example
 * <AnimatedList>
 *   {items.map((item, index) => (
 *     <AnimatedListItem key={item.id} delay={index * 0.05}>
 *       <div>{item.name}</div>
 *     </AnimatedListItem>
 *   ))}
 * </AnimatedList>
 */
export const AnimatedList: React.FC<{
  children: ReactNode;
  className?: string;
  /** Stagger delay between items (seconds) */
  stagger?: number;
}> = ({ children, className = '', stagger = 0.05 }) => {
  const reduceMotion = useReduceMotion();

  return (
    <motion.div
      className={className}
      initial={reduceMotion ? undefined : 'hidden'}
      animate={reduceMotion ? undefined : 'visible'}
      variants={
        reduceMotion
          ? undefined
          : {
              visible: {
                transition: {
                  staggerChildren: stagger,
                  delayChildren: 0.02,
                },
              },
            }
      }
    >
      {children}
    </motion.div>
  );
};

/**
 * AnimatedGrid - Grid container dengan stagger
 * 
 * @example
 * <AnimatedGrid columns={3}>
 *   {items.map((item) => (
 *     <AnimatedListItem key={item.id}>
 *       <Card>{item.content}</Card>
 *     </AnimatedListItem>
 *   ))}
 * </AnimatedGrid>
 */
export const AnimatedGrid: React.FC<{
  children: ReactNode;
  columns?: number | { sm?: number; md?: number; lg?: number };
  gap?: number;
  className?: string;
  stagger?: number;
}> = ({
  children,
  columns = 3,
  gap = 4,
  className = '',
  stagger = 0.05,
}) => {
  const reduceMotion = useReduceMotion();

  // Generate grid columns classes
  const getGridCols = () => {
    if (typeof columns === 'number') {
      return `grid-cols-1 md:grid-cols-${Math.min(columns, 2)} lg:grid-cols-${columns}`;
    }
    return cn(
      'grid-cols-1',
      columns.sm && `sm:grid-cols-${columns.sm}`,
      columns.md && `md:grid-cols-${columns.md}`,
      columns.lg && `lg:grid-cols-${columns.lg}`
    );
  };

  return (
    <motion.div
      className={cn('grid', getGridCols(), `gap-${gap}`, className)}
      initial={reduceMotion ? undefined : 'hidden'}
      animate={reduceMotion ? undefined : 'visible'}
      variants={
        reduceMotion
          ? undefined
          : {
              visible: {
                transition: {
                  staggerChildren: stagger,
                  delayChildren: 0.02,
                },
              },
            }
      }
    >
      {children}
    </motion.div>
  );
};