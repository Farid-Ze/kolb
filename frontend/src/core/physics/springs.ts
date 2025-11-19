import { Spring } from 'framer-motion';

export const springs: Record<string, Spring> = {
  // Physical / Legacy definitions
  heavy: { stiffness: 120, damping: 20 },
  interactive: { stiffness: 400, damping: 30 },
  snappy: { stiffness: 500, damping: 25 },

  // Speed-based definitions (used in Phase 2)
  slow: { stiffness: 200, damping: 30 },
  medium: { stiffness: 300, damping: 30 },
  fast: { stiffness: 400, damping: 25 },
};

export const transitions = {
  layout: { type: 'spring', ...springs.medium },
  interaction: { type: 'spring', ...springs.interactive },
  roomTransition: { type: 'spring', ...springs.medium },
};
