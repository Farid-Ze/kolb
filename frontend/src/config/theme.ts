/**
 * KLSI 4.0 - Theme Configuration
 * Design tokens konsisten dengan Guidelines.md
 * 
 * Centralized design tokens untuk:
 * - Spacing (8px grid - §1.4.1)
 * - Material System (§4.2 & §4.3)
 * - Colors (§3)
 * - Animation timings (§2.4.1)
 */

/**
 * Spacing System - 8-Point Grid (Guidelines.md §1.4.1)
 * Semua spacing harus kelipatan 8px untuk visual rhythm
 * Justifikasi Matematis: y = 8 × n (skala modular)
 */
export const spacing = {
  0: '0',
  1: '0.125rem', // 2px - micro spacing
  2: '0.25rem',  // 4px - half grid
  4: '0.5rem',   // 8px - base grid unit
  6: '0.75rem',  // 12px (1.5 × base)
  8: '1rem',     // 16px (2 × base)
  12: '1.5rem',  // 24px (3 × base)
  16: '2rem',    // 32px (4 × base)
  20: '2.5rem',  // 40px (5 × base)
  24: '3rem',    // 48px (6 × base)
  32: '4rem',    // 64px (8 × base)
  40: '5rem',    // 80px (10 × base)
  48: '6rem',    // 96px (12 × base)
  64: '8rem',    // 128px (16 × base)
} as const;

/**
 * Border Radius (Guidelines.md §1.4.1)
 * Consistent corner radii untuk material hierarchy
 */
export const radius = {
  none: '0',
  sm: '0.375rem',   // 6px
  md: '0.5rem',     // 8px (base grid)
  lg: '0.625rem',   // 10px (default - from globals.css)
  xl: '0.875rem',   // 14px
  '2xl': '1rem',    // 16px (2 × base)
  '3xl': '1.5rem',  // 24px (3 × base)
  full: '9999px',   // Pill shape
} as const;

/**
 * Material System Design Tokens (Guidelines.md §4)
 * Dua lapis: Functional (Fluid Glass) dan Content (Standard)
 */
export const materials = {
  // Functional Layer - Kaca Fluidik (§4.2)
  functional: {
    regular: 'glass-regular',  // Default untuk navigation & controls
    clear: 'glass-clear',      // Media-rich backgrounds only (§4.2.5)
    thick: 'glass-thick',      // Hover/active states
  },
  // Content Layer - Material Standar (§4.3)
  content: {
    thin: 'material-thin',       // Ultra transparent
    regular: 'material-regular', // Default balance
    thick: 'material-thick',     // Most opaque
  },
} as const;

/**
 * Blur Values untuk Glassmorphism (Guidelines.md §4.2)
 * Material Kaca Fluidik - Optical Physics simulation
 */
export const blur = {
  none: '0',
  sm: '4px',      // Subtle blur untuk material-thin
  md: '8px',      // Material-regular
  lg: '16px',     // Glass-clear
  xl: '20px',     // Glass-regular (default)
  '2xl': '24px',  // Glass-thick (hover/active)
  '3xl': '32px',  // Intense blur untuk emphasis
} as const;

/**
 * Animation Durations (Guidelines.md §2.4.1)
 * Perceptual Thresholds untuk perceived performance
 */
export const duration = {
  instant: 0,          // < 100ms
  fast: 100,           // 100ms - perceived as instant
  normal: 200,         // 100-300ms - responsive and smooth
  slow: 300,           // Upper bound of "responsive"
  slower: 500,         // Starts to feel slow
  slowest: 1000,       // 1s - requires loader/progress
} as const;

/**
 * Spring Animation Presets (Guidelines.md §2.3.1)
 * Physics-based animations - Damped Harmonic Oscillation
 * Model: F = -kx (Hooke's Law) + damping coefficient
 */
export const springs = {
  // Gentle - Smooth, slow bounce
  gentle: {
    type: 'spring' as const,
    stiffness: 200,
    damping: 30,
  },
  // Default - Balanced spring
  default: {
    type: 'spring' as const,
    stiffness: 300,
    damping: 25,
  },
  // Snappy - Quick, energetic
  snappy: {
    type: 'spring' as const,
    stiffness: 400,
    damping: 25,
  },
  // Bouncy - Prominent oscillation
  bouncy: {
    type: 'spring' as const,
    stiffness: 300,
    damping: 15,
  },
  // Stiff - Minimal bounce
  stiff: {
    type: 'spring' as const,
    stiffness: 500,
    damping: 35,
  },
} as const;

/**
 * Easing Functions - Fallback untuk Reduce Motion (Guidelines.md §2.5.2)
 * Bezier curves untuk static transitions
 */
export const easing = {
  linear: 'linear',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  // Custom spring-like easing (approximation)
  springOut: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
} as const;

/**
 * Z-Index Scale (Guidelines.md §4.1)
 * Layering hierarchy untuk material system
 */
export const zIndex = {
  base: 0,           // Default layer
  content: 1,        // Content layer (§4.3)
  elevated: 10,      // Elevated cards
  dropdown: 100,     // Dropdowns and popovers
  sticky: 200,       // Sticky headers
  overlay: 300,      // Overlay backgrounds
  modal: 400,        // Modal dialogs (§1.6)
  popover: 500,      // Popovers over modals
  toast: 600,        // Toast notifications
  tooltip: 700,      // Tooltips (highest)
} as const;

/**
 * Breakpoints - Responsive Layout (Guidelines.md §1.2)
 * Form Factor Strategy: Mobile → Tablet → Desktop
 */
export const breakpoints = {
  sm: '640px',   // Mobile landscape / Small tablets
  md: '768px',   // Tablet portrait
  lg: '1024px',  // Tablet landscape / Small desktop
  xl: '1280px',  // Desktop
  '2xl': '1536px', // Large desktop
} as const;

/**
 * Touch Target Sizes (Guidelines.md §1.3.2)
 * Ergonomics - Fitts's Law compliance
 * T = a + b log₂(1 + D/W)
 */
export const touchTarget = {
  min: '44px',      // Minimum WCAG 2.1 (48px recommended)
  recommended: '48px', // iOS/Android guideline
  comfortable: '56px', // Generous touch target
} as const;

/**
 * Safe Area Insets (Guidelines.md §1.3.1)
 * Mobile hardware obstructions (notch, pill, rounded corners)
 */
export const safeArea = {
  top: 'env(safe-area-inset-top)',
  right: 'env(safe-area-inset-right)',
  bottom: 'env(safe-area-inset-bottom)',
  left: 'env(safe-area-inset-left)',
} as const;

/**
 * Typography Scale - Dynamic Type (Guidelines.md §1.4.3)
 * NOTE: Avoid using these directly in Tailwind classes
 * Use default HTML element typography from globals.css instead
 */
export const fontSize = {
  xs: '0.75rem',    // 12px
  sm: '0.875rem',   // 14px
  base: '1rem',     // 16px
  lg: '1.125rem',   // 18px
  xl: '1.25rem',    // 20px
  '2xl': '1.5rem',  // 24px
  '3xl': '1.875rem', // 30px
  '4xl': '2.25rem', // 36px
} as const;

/**
 * Export all tokens as default
 */
export const theme = {
  spacing,
  radius,
  materials,
  blur,
  duration,
  springs,
  easing,
  zIndex,
  breakpoints,
  touchTarget,
  safeArea,
  fontSize,
} as const;

export default theme;