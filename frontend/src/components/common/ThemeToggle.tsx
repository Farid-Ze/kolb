/**
 * KLSI 4.0 - ThemeToggle Component
 * Task 82: Toggle Light/Dark mode
 * 
 * Implementasi sesuai Guidelines.md:
 * - Bagian 2.3.1: Spring-based transitions (Motion)
 * - Bagian 2.2.2: Morphing animation
 * - Bagian 8: Accessible focus states
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sun, Moon } from 'lucide-react';
import { useUIPreferences } from '../../contexts/useUIPreferences';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useUIPreferences();

  // Determine current theme (system aware)
  const isDark =
    theme === 'dark' ||
    (theme === 'system' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  // Spring config (Bagian 2.3.1 - Damped Harmonic Oscillation)
  const springConfig = {
    type: "spring" as const,
    stiffness: 400,
    damping: 25,
  };

  return (
    <motion.button
      onClick={toggleTheme}
      className="relative inline-flex items-center justify-center rounded-lg p-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring bg-secondary text-secondary-foreground overflow-hidden"
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95, rotate: 15 }}
      transition={springConfig}
    >
      {/* Morphing icon animation (Bagian 2.2.2) */}
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.div
            key="moon"
            initial={{ scale: 0, rotate: -90, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0, rotate: 90, opacity: 0 }}
            transition={springConfig}
          >
            <Moon className="h-5 w-5" />
          </motion.div>
        ) : (
          <motion.div
            key="sun"
            initial={{ scale: 0, rotate: 90, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0, rotate: -90, opacity: 0 }}
            transition={springConfig}
          >
            <Sun className="h-5 w-5" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
};
