/**
 * KLSI 4.0 - LargeTitleHeader Component
 * Task 28: Header yang collapses saat di-scroll
 * Task TODO3.md Phase 3.15: Use ScrollEdgeHandler untuk glass material transition
 * 
 * Implementasi sesuai Guidelines.md §1.2.1:
 * - Large title yang collapse menjadi compact saat scroll
 * - Glass material dengan scroll-edge interaction (§4.5.3)
 * - Spring-based animations (§2.3.1)
 */

import React, { ReactNode } from 'react';
import { motion } from 'motion/react';
import { useUIPreferences } from '../../contexts/useUIPreferences';
import { VibrantText } from './VibrantText';
import { useScrollEdge, useScrollProgress } from './scrollEdgeHooks';

interface LargeTitleHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  onBack?: () => void;
  backLabel?: string;
  className?: string;
}

/**
 * LargeTitleHeader - Header yang collapse saat scroll
 * 
 * Guidelines.md §4.5.3: Scroll-edge interaction
 * - Saat di top: Title besar dan prominent
 * - Saat scroll: Title collapse dengan glass material aktif
 */
export const LargeTitleHeader: React.FC<LargeTitleHeaderProps> = ({
  title,
  subtitle,
  actions,
  onBack,
  backLabel = 'Kembali',
  className = '',
}) => {
  const { reduceMotion } = useUIPreferences();
  
  // Task TODO3.md Phase 3.15: Use ScrollEdgeHandler
  const { isScrolled } = useScrollEdge({ threshold: 20 });
  const scrollProgress = useScrollProgress({ max: 100 });

  // Interpolate values based on scroll progress (0-1)
  const headerHeight = 120 - (56 * scrollProgress); // 120px -> 64px
  const titleSize = 2 - (0.75 * scrollProgress); // 2rem -> 1.25rem
  const titleOpacity = 1 - (0.1 * Math.min(scrollProgress * 2, 1)); // 1 -> 0.9
  const subtitleOpacity = 1 - Math.min(scrollProgress * 2, 1); // 1 -> 0

  // Spring config (Guidelines.md §2.3.1 - Damped Harmonic Oscillation)
  const springConfig = {
    type: 'spring' as const,
    stiffness: 300,
    damping: 30,
  };

  // Fallback for reduced motion (Guidelines.md §2.5)
  const transition = reduceMotion
    ? { duration: 0.2, ease: [0.4, 0, 0.2, 1] as const }
    : springConfig;

  return (
    <motion.header
      className={`sticky top-0 z-50 border-b border-border ${
        isScrolled ? 'glass-regular' : 'bg-transparent'
      } ${className}`.trim()}
      style={{
        height: reduceMotion ? (isScrolled ? 64 : 120) : headerHeight,
      }}
      initial={false}
      animate={{
        backgroundColor: isScrolled
          ? 'rgba(255, 255, 255, 0.75)'
          : 'rgba(255, 255, 255, 0)',
      }}
      transition={transition}
    >
      <div className="mx-auto max-w-7xl px-4 md:px-6 h-full flex items-end pb-4">
        <div className="flex-1 min-w-0">
          {/* Back button */}
          {onBack && (
            <motion.button
              onClick={onBack}
              className="mb-2 text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded px-2 py-1"
              whileHover={!reduceMotion ? { x: -4 } : undefined}
              transition={springConfig}
            >
              ← {backLabel}
            </motion.button>
          )}

          {/* Title */}
          <motion.h1
            style={{
              fontSize: reduceMotion ? (isScrolled ? '1.25rem' : '2rem') : `${titleSize}rem`,
              opacity: reduceMotion ? 1 : titleOpacity,
            }}
          >
            <VibrantText hierarchy="primary" as="span">
              {title}
            </VibrantText>
          </motion.h1>

          {/* Subtitle - hides on scroll */}
          {subtitle && (
            <motion.p
              className="mt-1"
              style={{
                opacity: reduceMotion ? (isScrolled ? 0 : 1) : subtitleOpacity,
                display: isScrolled ? 'none' : 'block',
              }}
            >
              <VibrantText hierarchy="secondary" as="span">
                {subtitle}
              </VibrantText>
            </motion.p>
          )}
        </div>

        {/* Actions (always visible) */}
        {actions && (
          <div className="flex items-center gap-2 ml-4">
            {actions}
          </div>
        )}
      </div>
    </motion.header>
  );
};