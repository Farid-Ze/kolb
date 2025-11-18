/**
 * KLSI 4.0 - PrimaryButton Component
 * Task TODO2.md Phase 3.3: Flexing animation dengan spring physics
 * Phase 3.2: Reduce motion fallbacks
 * 
 * Implementasi sesuai Guidelines.md:
 * §2.2.1: Feedback instan (<100ms)
 * §2.3.2: Flexing = "melentur" dengan spring
 * §2.5: Reduce motion fallback ke cross-fade/simple scale
 */

import React, { ReactNode } from 'react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';
import {
  useMotionConfig,
  SPRING_FAST,
  CROSS_FADE_FAST,
  usePrefersReducedMotionSetting,
} from '../../lib/motion';

interface PrimaryButtonProps {
  children: ReactNode;
  /** Button click handler */
  onClick?: () => void;
  /** Button type */
  type?: 'button' | 'submit' | 'reset';
  /** Disabled state */
  disabled?: boolean;
  /** Visual variant */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'default' | 'destructive';
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Loading state */
  loading?: boolean;
  /** Full width */
  fullWidth?: boolean;
  /** Icon before text */
  icon?: ReactNode;
  /** Icon after text */
  iconAfter?: ReactNode;
  className?: string;
}

/**
 * PrimaryButton - Button dengan spring physics dan flexing motion
 * 
 * Features:
 * - Flexing animation (scale down + glow) saat tap
 * - Spring physics untuk natural feel
 * - Reduce motion fallback
 * - Loading states
 * - Accessible (keyboard, screen reader)
 * 
 * Guidelines.md §2.2.1 & §2.3.2:
 * - Instant feedback (<100ms perceived)
 * - Flexing = "melentur" dengan spring
 * - Glow effect untuk visual confirmation
 * 
 * @example
 * <PrimaryButton onClick={handleSubmit} variant="primary">
 *   Submit
 * </PrimaryButton>
 * 
 * @example
 * <PrimaryButton
 *   variant="primary"
 *   size="lg"
 *   icon={<CheckIcon />}
 *   loading={isLoading}
 * >
 *   Save Changes
 * </PrimaryButton>
 */
export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  children,
  onClick,
  type = 'button',
  disabled = false,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  icon,
  iconAfter,
  className = '',
}) => {
  const transition = useMotionConfig(SPRING_FAST, CROSS_FADE_FAST);
  const prefersReducedMotion = usePrefersReducedMotionSetting();

  // Variant styles (Guidelines.md §3.4.1 - Accent untuk interaktivitas)
  const variantClasses = {
    primary:
      'bg-primary text-primary-foreground hover:bg-primary/90 shadow-md',
    secondary:
      'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    outline:
      'border-2 border-input bg-transparent hover:bg-accent hover:text-accent-foreground',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
    default: 'bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:bg-primary/90',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  };

  // Size styles (Guidelines.md §1.4.1 - 8px grid)
  const sizeClasses = {
    sm: 'h-8 px-3 text-sm', // 32px height, 12px padding
    md: 'h-10 px-4', // 40px height, 16px padding
    lg: 'h-12 px-6', // 48px height, 24px padding
  };

  const baseClasses = cn(
    'inline-flex items-center justify-center gap-2',
    'rounded-lg',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    'disabled:pointer-events-none disabled:opacity-50',
    variantClasses[variant],
    sizeClasses[size],
    fullWidth ? 'w-full' : '',
    className
  );

  const isDisabled = disabled || loading;

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={baseClasses}
      whileHover={prefersReducedMotion ? undefined : { scale: 1.02 }}
      whileTap={
        prefersReducedMotion ? undefined : { scale: 0.97, filter: 'brightness(1.1)' }
      }
      transition={transition}
      // Accessibility
      aria-disabled={isDisabled}
      aria-busy={loading}
    >
      {/* Loading spinner */}
      {loading && (
        prefersReducedMotion ? (
          <div
            className="h-4 w-4 border-2 border-current border-t-transparent rounded-full opacity-70"
            aria-label="Loading"
          />
        ) : (
          <motion.div
            className="h-4 w-4 border-2 border-current border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            aria-label="Loading"
          />
        )
      )}

      {/* Icon before */}
      {icon && !loading && (
        <span className="flex-shrink-0" aria-hidden="true">
          {icon}
        </span>
      )}

      {/* Button text */}
      <span>{children}</span>

      {/* Icon after */}
      {iconAfter && (
        <span className="flex-shrink-0" aria-hidden="true">
          {iconAfter}
        </span>
      )}
    </motion.button>
  );
};

/**
 * SecondaryButton - Shortcut untuk secondary variant
 */
export const SecondaryButton: React.FC<Omit<PrimaryButtonProps, 'variant'>> = (
  props
) => {
  return <PrimaryButton variant="secondary" {...props} />;
};

/**
 * OutlineButton - Shortcut untuk outline variant
 */
export const OutlineButton: React.FC<Omit<PrimaryButtonProps, 'variant'>> = (
  props
) => {
  return <PrimaryButton variant="outline" {...props} />;
};

/**
 * GhostButton - Shortcut untuk ghost variant
 */
export const GhostButton: React.FC<Omit<PrimaryButtonProps, 'variant'>> = (
  props
) => {
  return <PrimaryButton variant="ghost" {...props} />;
};

/**
 * IconButton - Square button untuk icon-only
 */
export const IconButton: React.FC<
  Omit<PrimaryButtonProps, 'children'> & {
    icon: ReactNode;
    'aria-label': string;
  }
> = ({ icon, size = 'md', ...props }) => {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  };

  return (
    <PrimaryButton
      size={size}
      className={cn('p-0', sizeClasses[size])}
      {...props}
    >
      {icon}
    </PrimaryButton>
  );
};