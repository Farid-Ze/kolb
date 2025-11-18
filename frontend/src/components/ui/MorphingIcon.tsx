/**
 * KLSI 4.0 - MorphingIcon Component
 * Task TODO2.md Phase 3.4: Icon morphing menggunakan SVG path interpolation
 * 
 * Implementasi sesuai Guidelines.md §2.3.2:
 * - Morphing = Transisi mulus antar status fungsional
 * - Interpolasi SVG path dengan spring physics
 * - Interruptible mid-flight
 * 
 * Use Cases:
 * - Play ↔ Pause button
 * - Menu ↔ Close (hamburger to X)
 * - Expand ↔ Collapse chevron
 * - Mute ↔ Unmute
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { SPRING_SMOOTH, CROSS_FADE, usePrefersReducedMotionSetting } from '../../lib/motion';
import { cn } from '../../lib/utils';

interface MorphingIconProps {
  /** Current state */
  isActive: boolean;
  /** Toggle handler */
  onToggle?: () => void;
  /** Icon variant */
  variant?: 'play-pause' | 'menu-close' | 'chevron' | 'check-cross' | 'plus-minus' | 'drag-button';
  /** Icon size */
  size?: number;
  /** Color (CSS color or Tailwind class) */
  color?: string;
  /** Additional className */
  className?: string;
  /** Accessible label */
  'aria-label'?: string;
}

/**
 * SVG Path definitions untuk morphing animations
 * Paths harus memiliki jumlah titik yang sama untuk smooth interpolation
 */
const ICON_PATHS = {
  'play-pause': {
    inactive: 'M8 5v14l11-7z', // Play triangle
    active: 'M6 4h4v16H6V4zm8 0h4v16h-4V4z', // Pause bars
  },
  'menu-close': {
    inactive: 'M3 12h18M3 6h18M3 18h18', // Hamburger
    active: 'M18 6L6 18M6 6l12 12', // X
  },
  'chevron': {
    inactive: 'M19 9l-7 7-7-7', // Chevron down
    active: 'M5 15l7-7 7 7', // Chevron up
  },
  'check-cross': {
    inactive: 'M20 6L9 17l-5-5', // Checkmark
    active: 'M18 6L6 18M6 6l12 12', // X
  },
  'plus-minus': {
    inactive: 'M12 5v14m-7-7h14', // Plus
    active: 'M5 12h14', // Minus
  },
  'drag-button': {
    inactive: 'M9 5h6M9 12h6M9 19h6', // Button mode (horizontal lines - ranking buttons)
    active: 'M9 3v18M15 3v18', // Drag mode (vertical lines - drag handles)
  },
};

/**
 * MorphingIcon - Icon yang smooth morph antar dua states
 * 
 * Features:
 * - SVG path interpolation dengan spring physics
 * - Interruptible animations
 * - Reduce motion fallback (instant switch)
 * - Accessible button dengan proper ARIA
 * 
 * Guidelines.md §2.3.2:
 * - Morphing menunjukkan hubungan antar states
 * - Spring physics untuk natural feel
 * - Visual continuity (tidak hilang lalu muncul kembali)
 * 
 * @example
 * // Play/Pause toggle
 * <MorphingIcon
 *   variant="play-pause"
 *   isActive={isPlaying}
 *   onToggle={() => setIsPlaying(!isPlaying)}
 *   aria-label={isPlaying ? "Pause" : "Play"}
 * />
 * 
 * @example
 * // Expandable section
 * <MorphingIcon
 *   variant="chevron"
 *   isActive={isExpanded}
 *   onToggle={() => setIsExpanded(!isExpanded)}
 *   size={20}
 *   color="currentColor"
 * />
 */
export const MorphingIcon: React.FC<MorphingIconProps> = ({
  isActive,
  onToggle,
  variant = 'play-pause',
  size = 24,
  color = 'currentColor',
  className = '',
  'aria-label': ariaLabel,
}) => {
  const reduceMotion = usePrefersReducedMotionSetting();
  const paths = ICON_PATHS[variant];

  const Component = onToggle ? motion.button : motion.div;

  return (
    <Component
      onClick={onToggle}
      className={cn(
        'inline-flex items-center justify-center',
        onToggle && 'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className
      )}
      whileHover={onToggle && !reduceMotion ? { scale: 1.05 } : undefined}
      whileTap={onToggle && !reduceMotion ? { scale: 0.95 } : undefined}
      aria-label={ariaLabel}
      aria-pressed={onToggle ? isActive : undefined}
      type={onToggle ? 'button' : undefined}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <motion.path
          d={isActive ? paths.active : paths.inactive}
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={false}
          animate={{ d: isActive ? paths.active : paths.inactive }}
          transition={reduceMotion ? CROSS_FADE : SPRING_SMOOTH}
        />
      </svg>
    </Component>
  );
};

/**
 * PlayPauseIcon - Shortcut untuk play/pause toggle
 */
export const PlayPauseIcon: React.FC<
  Omit<MorphingIconProps, 'variant'>
> = (props) => {
  return <MorphingIcon variant="play-pause" {...props} />;
};

/**
 * MenuCloseIcon - Shortcut untuk menu/close toggle
 */
export const MenuCloseIcon: React.FC<
  Omit<MorphingIconProps, 'variant'>
> = (props) => {
  return <MorphingIcon variant="menu-close" {...props} />;
};

/**
 * ChevronIcon - Shortcut untuk expandable chevron
 */
export const ChevronIcon: React.FC<
  Omit<MorphingIconProps, 'variant'>
> = (props) => {
  return <MorphingIcon variant="chevron" {...props} />;
};

/**
 * ToggleableIcon - Controlled morphing icon dengan internal state
 */
export const ToggleableIcon: React.FC<
  Omit<MorphingIconProps, 'isActive' | 'onToggle'> & {
    defaultActive?: boolean;
    onChange?: (isActive: boolean) => void;
  }
> = ({ defaultActive = false, onChange, ...props }) => {
  const [isActive, setIsActive] = useState(defaultActive);

  const handleToggle = () => {
    const newState = !isActive;
    setIsActive(newState);
    onChange?.(newState);
  };

  return (
    <MorphingIcon
      isActive={isActive}
      onToggle={handleToggle}
      {...props}
    />
  );
};