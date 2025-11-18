/**
 * KLSI 4.0 - NotificationBadge Component
 * Task TODO3.md Phase 2: Notification badge with bounce/pulse
 * 
 * Guidelines.md §2.2.2 & §2.2.3:
 * - Pulse: Menunjukkan status (notifikasi baru)
 * - Bounce: Memandu fokus (elemen baru muncul)
 */

import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';
import {
  useMotionConfig,
  SPRING_FAST,
  usePrefersReducedMotionSetting,
} from '../../lib/motion';

export interface NotificationBadgeProps {
  /** Badge content (number or text) */
  count?: number | string;
  /** Visual variant */
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'destructive';
  /** Animation type */
  animation?: 'bounce' | 'pulse' | 'none';
  /** Show dot instead of count */
  dot?: boolean;
  /** Position relative to parent */
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'inline';
  /** Additional className */
  className?: string;
  /** Children to wrap (for positioned badges) */
  children?: React.ReactNode;
}

const variantStyles = {
  default: 'bg-muted text-muted-foreground',
  primary: 'bg-primary text-primary-foreground',
  success: 'bg-success text-success-foreground',
  warning: 'bg-warning text-warning-foreground',
  destructive: 'bg-destructive text-destructive-foreground',
};

const positionStyles = {
  'top-right': 'absolute -top-1 -right-1',
  'top-left': 'absolute -top-1 -left-1',
  'bottom-right': 'absolute -bottom-1 -right-1',
  'bottom-left': 'absolute -bottom-1 -left-1',
  'inline': 'relative',
};

/**
 * NotificationBadge - Badge with spring-based animations
 * Guidelines.md §2.2.2 (pulse) & §2.2.3 (bounce)
 */
export const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  count,
  variant = 'destructive',
  animation = 'bounce',
  dot = false,
  position = 'top-right',
  className,
  children,
}) => {
  const springTransition = useMotionConfig(SPRING_FAST);
  const reduceMotion = usePrefersReducedMotionSetting();
  const effectiveAnimation = reduceMotion ? 'none' : animation;

  // Bounce animation (Guidelines.md §2.2.3 - guide focus)
  const bounceAnimation = effectiveAnimation === 'bounce' ? {
    initial: { scale: 0, opacity: 0 },
    animate: { 
      scale: [0, 1.2, 1],
      opacity: 1,
    },
    transition: springTransition,
  } : {};

  // Pulse animation (Guidelines.md §2.2.2 - show status)
  const pulseAnimation = effectiveAnimation === 'pulse' ? {
    animate: {
      scale: [1, 1.1, 1],
      opacity: [1, 0.8, 1],
    },
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: [0.4, 0, 0.2, 1] as const,
    },
  } : {};

  const badgeElement = (
    <motion.span
      {...(effectiveAnimation === 'bounce' ? bounceAnimation : {})}
      {...(effectiveAnimation === 'pulse' ? pulseAnimation : {})}
      className={cn(
        'inline-flex items-center justify-center rounded-full font-medium',
        dot 
          ? 'size-2' 
          : count && count.toString().length > 2
            ? 'size-6 text-[10px]'
            : 'min-w-5 h-5 px-1.5 text-xs',
        variantStyles[variant],
        position !== 'inline' && positionStyles[position],
        'border-2 border-background',
        className
      )}
    >
      {!dot && count}
    </motion.span>
  );

  if (children) {
    return (
      <div className="relative inline-flex">
        {children}
        {badgeElement}
      </div>
    );
  }

  return badgeElement;
};

/**
 * NotificationDot - Simplified dot variant
 * 
 * @example
 * <NotificationDot variant="primary" animation="pulse" />
 */
export const NotificationDot: React.FC<Omit<NotificationBadgeProps, 'dot' | 'count'>> = (props) => {
  return <NotificationBadge {...props} dot />;
};
