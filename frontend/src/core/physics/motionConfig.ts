/**
 * Shared motion primitives for "Apple HIG" inspired animations.
 * Ensures consistent spring responses across components (Blueprint §4.1).
 */
export const APPLE_SPRING = {
  type: 'spring' as const,
  stiffness: 500,
  damping: 30,
  mass: 1,
};
