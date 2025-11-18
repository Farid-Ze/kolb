/**
 * KLSI 4.0 - TintedGlassButton Component
 * Task TODO2.md Phase 5.7: CTA button dengan tinting volumetrik
 * 
 * Implementasi sesuai Guidelines.md §3.5.3:
 * - Tinting "volumetrik" pada material glass
 * - Bukan overlay warna datar
 * - Bereaksi dengan cahaya dan sorotan
 * - Untuk penekanan pada CTA utama
 * 
 * Justifikasi Teknis (§3.5.3):
 * - Tinting dicampur ke dalam "kaca" itu sendiri
 * - Berinteraksi dengan properti optik material
 * - Memengaruhi highlights dan shadows
 * - Digunakan hemat untuk emphasis
 */

import React, { ReactNode } from 'react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';
import { useMotionConfig, SPRING_FAST, CROSS_FADE_FAST } from '../../lib/motion';
import { useReduceTransparency } from '../../hooks/useReduceTransparency';

interface TintedGlassButtonProps {
  children: ReactNode;
  /** Button click handler */
  onClick?: () => void;
  /** Button type */
  type?: 'button' | 'submit' | 'reset';
  /** Disabled state */
  disabled?: boolean;
  /** Visual variant token for tests/design system */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  /** Tint color (CSS color value) */
  tintColor?: string;
  /** Tint intensity (0-1) */
  tintIntensity?: number;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Full width */
  fullWidth?: boolean;
  /** Icon before text */
  icon?: ReactNode;
  /** Icon after text */
  iconAfter?: ReactNode;
  className?: string;
}

/**
 * TintedGlassButton - CTA button dengan volumetric tinting
 * 
 * Features:
 * - Volumetric tinting pada glass material
 * - Spring physics untuk natural motion
 * - Reduce motion & transparency fallbacks
 * - Flexing animation on tap
 * - Accessible (keyboard, screen reader)
 * 
 * Guidelines.md §3.5.3:
 * - Tinting bukan overlay datar
 * - Bereaksi dengan cahaya (highlights)
 * - Digunakan untuk CTA utama
 * 
 * @example
 * <TintedGlassButton
 *   onClick={handleSubmit}
 *   tintColor="#3b82f6"
 *   tintIntensity={0.3}
 * >
 *   Mulai Asesmen
 * </TintedGlassButton>
 * 
 * @example
 * <TintedGlassButton
 *   tintColor="#10b981"
 *   size="lg"
 *   fullWidth
 *   icon={<Check />}
 * >
 *   Konfirmasi
 * </TintedGlassButton>
 */
export const TintedGlassButton: React.FC<TintedGlassButtonProps> = ({
  children,
  onClick,
  type = 'button',
  disabled = false,
  tintColor = '#3b82f6', // Default: accent blue
  tintIntensity = 0.25,
  size = 'md',
  fullWidth = false,
  variant = 'primary',
  icon,
  iconAfter,
  className = '',
}) => {
  const transition = useMotionConfig(SPRING_FAST, CROSS_FADE_FAST);
  const reduceTransparency = useReduceTransparency();

  // Size styles (Guidelines.md §1.4.1 - 8px grid)
  const sizeClasses = {
    sm: 'h-10 px-4 text-sm', // 40px height
    md: 'h-12 px-6', // 48px height
    lg: 'h-14 px-8 text-lg', // 56px height
  };

  // Parse tint color to RGB for glass backdrop
  const getTintStyle = () => {
    if (reduceTransparency) {
      // Fallback §8.5.3: Solid color dengan opacity
      return {
        backgroundColor: tintColor,
        opacity: 0.9,
      };
    }

    // Volumetric tinting (§3.5.3)
    // Mix tint into the glass itself via backdrop-filter and background
    return {
      // Background with tint mixed in
      background: `linear-gradient(135deg, 
        ${tintColor}${Math.round(tintIntensity * 255).toString(16).padStart(2, '0')}, 
        ${tintColor}${Math.round(tintIntensity * 0.6 * 255).toString(16).padStart(2, '0')}
      )`,
      // Backdrop blur for glass effect
      backdropFilter: 'blur(16px) saturate(180%)',
      WebkitBackdropFilter: 'blur(16px) saturate(180%)',
      // Border with subtle tint
      borderColor: `${tintColor}40`,
    };
  };

  const baseClasses = cn(
    'relative overflow-hidden',
    'inline-flex items-center justify-center gap-2',
    'rounded-xl border',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    'transition-shadow duration-200',
    // Text color - ensure contrast
    'text-white font-medium',
    // Shadow for depth
    'shadow-lg hover:shadow-xl',
    sizeClasses[size],
    {
      primary: '',
      secondary: 'text-secondary-foreground',
      outline: 'border-white/40 text-white/90',
      ghost: 'border-transparent text-white/80',
    }[variant],
    fullWidth ? 'w-full' : '',
    className
  );

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={baseClasses}
      style={getTintStyle()}
      whileHover={{
        scale: 1.02,
        // Increase tint on hover (simulate light interaction)
        filter: 'brightness(1.1)',
      }}
      whileTap={{
        scale: 0.97,
        // Glow effect on tap (Guidelines §2.2.1)
        filter: 'brightness(1.2)',
      }}
      transition={transition}
      // Accessibility
      aria-disabled={disabled}
    >
      {/* Highlight overlay - simulates light reflection on glass */}
      {!reduceTransparency && (
        <div 
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.4) 0%, transparent 60%)',
          }}
        />
      )}

      {/* Content */}
      <div className="relative z-10 flex items-center justify-center gap-2">
        {icon && <span className="flex-shrink-0">{icon}</span>}
        <span className="flex-shrink-0">{children}</span>
        {iconAfter && <span className="flex-shrink-0">{iconAfter}</span>}
      </div>
    </motion.button>
  );
};

/**
 * Preset tinted buttons untuk common use cases
 */

/** Primary CTA - Blue tint */
export const PrimaryTintedButton: React.FC<Omit<TintedGlassButtonProps, 'tintColor'>> = (props) => (
  <TintedGlassButton tintColor="#3b82f6" tintIntensity={0.25} {...props} />
);

/** Success CTA - Green tint */
export const SuccessTintedButton: React.FC<Omit<TintedGlassButtonProps, 'tintColor'>> = (props) => (
  <TintedGlassButton tintColor="#10b981" tintIntensity={0.25} {...props} />
);

/** Danger CTA - Red tint */
export const DangerTintedButton: React.FC<Omit<TintedGlassButtonProps, 'tintColor'>> = (props) => (
  <TintedGlassButton tintColor="#ef4444" tintIntensity={0.25} {...props} />
);

/** Warning CTA - Amber tint */
export const WarningTintedButton: React.FC<Omit<TintedGlassButtonProps, 'tintColor'>> = (props) => (
  <TintedGlassButton tintColor="#f59e0b" tintIntensity={0.25} {...props} />
);

/** Purple accent CTA */
export const AccentTintedButton: React.FC<Omit<TintedGlassButtonProps, 'tintColor'>> = (props) => (
  <TintedGlassButton tintColor="#8b5cf6" tintIntensity={0.3} {...props} />
);
