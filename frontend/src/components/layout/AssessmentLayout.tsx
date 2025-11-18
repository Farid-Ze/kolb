/**
 * KLSI 4.0 - AssessmentLayout Component
 * Task 36: Layout untuk halaman assessment
 * Task TODO2.md Phase 3.7: COMPLETED - Interruptible slide transitions
 * 
 * Implementasi sesuai frontend_blueprint.md §3.2:
 * - Full-screen immersive layout
 * - Bottom toolbar untuk navigation (Zona Hijau - Guidelines.md §1.3.2)
 * - Progress indication
 * - Minimal distractions
 * 
 * Guidelines.md §2.3.3:
 * - Interruptible animations (spring-based)
 * - User dapat change direction mid-animation
 * - Smooth handoff tanpa jank
 */

import React, { ReactNode } from 'react';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useUIPreferences } from '../../contexts/UIPreferencesContext';
import { SPRING_CONFIG, CROSS_FADE } from '../../lib/motion';

interface AssessmentLayoutProps {
  children: ReactNode;
  progressBar?: ReactNode;
  bottomToolbar?: ReactNode;
  showExitButton?: boolean;
  onExit?: () => void;
  /** Current question index for transition key */
  currentIndex?: number;
  /** Slide direction: forward or backward */
  direction?: 'forward' | 'backward';
  className?: string;
}

/**
 * AssessmentLayout - Layout untuk assessment flow dengan interruptible transitions
 * 
 * Guidelines.md §2.3.3 - Interruptibility:
 * - Spring physics allows interruption mid-flight
 * - User dapat navigate back saat forward animation active
 * - Smooth handoff tanpa jank atau delay
 * 
 * Sesuai Guidelines.md §1.3.2 & frontend_blueprint.md §3.2
 * - Full-screen untuk fokus maksimal
 * - Bottom toolbar di Zona Hijau (ergonomi mobile)
 * - Minimal header dengan exit button
 */
export const AssessmentLayout: React.FC<AssessmentLayoutProps> = ({
  children,
  progressBar,
  bottomToolbar,
  showExitButton = true,
  onExit,
  currentIndex = 0,
  direction = 'forward',
  className = '',
}) => {
  const navigate = useNavigate();
  const { reduceMotion } = useUIPreferences();

  const handleExit = () => {
    if (onExit) {
      onExit();
    } else {
      // Default: confirm and navigate home
      if (window.confirm('Keluar dari asesmen? Progress akan disimpan.')) {
        navigate('/');
      }
    }
  };

  // Slide animation variants (Guidelines §2.3.3)
  const slideVariants = {
    enter: (direction: 'forward' | 'backward') => ({
      x: direction === 'forward' ? 100 : -100,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: 'forward' | 'backward') => ({
      x: direction === 'forward' ? -100 : 100,
      opacity: 0,
    }),
  };

  // Fallback for reduce motion (Guidelines §2.5.2)
  const fadeVariants = {
    enter: { opacity: 0 },
    center: { opacity: 1 },
    exit: { opacity: 0 },
  };

  const variants = reduceMotion ? fadeVariants : slideVariants;
  const transition = reduceMotion ? CROSS_FADE : SPRING_CONFIG;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Bar - Minimal */}
      <div className="sticky top-0 z-40 glass-regular border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
          {/* Logo/Title */}
          <div className="flex items-center gap-3">
            <h2 className="text-foreground">KLSI Assessment</h2>
          </div>

          {/* Exit Button */}
          {showExitButton && (
            <motion.button
              onClick={handleExit}
              className="
                p-2 
                rounded-lg 
                text-muted-foreground 
                hover:text-foreground 
                hover:bg-secondary/50
                focus-visible:outline-none 
                focus-visible:ring-2 
                focus-visible:ring-ring
              "
              whileHover={!reduceMotion ? { scale: 1.05 } : undefined}
              whileTap={!reduceMotion ? { scale: 0.95 } : undefined}
              aria-label="Exit assessment"
            >
              <X className="h-5 w-5" />
            </motion.button>
          )}
        </div>

        {/* Progress Bar */}
        {progressBar && <div className="border-t border-border">{progressBar}</div>}
      </div>

      {/* Content Area - Interruptible Slide Transitions (Guidelines §2.3.3) */}
      <main className={`flex-1 overflow-hidden ${className}`.trim()}>
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={transition}
            className="h-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Toolbar - Zona Hijau (Guidelines.md §1.3.2) */}
      {bottomToolbar}
    </div>
  );
};