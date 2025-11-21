/**
 * KLSI 4.0 - WindowFocusIndicator
 * Task TODO2.md Phase 5.11: Desktop window focus state testing
 * 
 * Debug component untuk menguji dan memvisualisasi window focus state
 * Implementasi sesuai Guidelines.md §8.5.4
 */

import React from 'react';
import { motion } from 'motion/react';
import { useWindowFocus, getWindowFocusClasses } from '../../hooks/useWindowFocus';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '../../lib/utils';

interface WindowFocusIndicatorProps {
  /** Show indicator in UI (default: true for development) */
  visible?: boolean;
  
  /** Position of indicator */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

/**
 * WindowFocusIndicator - Visual debug tool
 * Shows current window focus state with animations
 * 
 * Usage:
 * ```tsx
 * // In development mode only
 * {process.env.NODE_ENV === 'development' && <WindowFocusIndicator />}
 * ```
 */
export const WindowFocusIndicator: React.FC<WindowFocusIndicatorProps> = ({
  visible = true,
  position = 'bottom-right',
}) => {
  const { isFocused, isVisible } = useWindowFocus();

  if (!visible) return null;

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  };

  // Spring configuration (Guidelines §2.3.1)
  const springConfig = {
    type: "spring" as const,
    stiffness: 300,
    damping: 20,
  };

  return (
    <motion.div
      className={cn(
        'fixed z-[9999] pointer-events-none',
        positionClasses[position]
      )}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={springConfig}
    >
      <div className="glass-regular rounded-xl p-3 shadow-lg pointer-events-auto">
        <div className="flex items-center gap-3">
          {/* Icon indicator */}
          <motion.div
            animate={{
              scale: isFocused ? 1 : 0.9,
              opacity: isFocused ? 1 : 0.6,
            }}
            transition={springConfig}
          >
            {isFocused ? (
              <Eye className="h-5 w-5 text-primary" />
            ) : (
              <EyeOff className="h-5 w-5 text-muted-foreground" />
            )}
          </motion.div>

          {/* Status text */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <motion.div
                className={cn(
                  'h-2 w-2 rounded-full',
                  isFocused ? 'bg-chart-2' : 'bg-muted-foreground'
                )}
                animate={{
                  scale: isFocused ? [1, 1.2, 1] : 1,
                }}
                transition={{
                  duration: 2,
                  repeat: isFocused ? Infinity : 0,
                  ease: "easeInOut",
                }}
              />
              <span className={cn(
                "text-sm",
                isFocused ? "text-foreground" : "text-muted-foreground"
              )}>
                {isFocused ? 'Focused' : 'Unfocused'}
              </span>
            </div>
            
            <span className="text-xs text-muted-foreground">
              {isVisible ? 'Visible' : 'Hidden'}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

/**
 * Demo component for testing window focus behavior
 */
export const WindowFocusDemo: React.FC = () => {
  const { isFocused } = useWindowFocus();

  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <h3 className="text-foreground">Window Focus State Testing</h3>
        <p className="text-muted-foreground">
          Switch to another window/tab to see material adaptation
        </p>
      </div>

      {/* Demo glass panels with focus-aware styling */}
      <div className="grid md:grid-cols-2 gap-4">
        <div
          className={cn(
            'glass-regular rounded-xl p-6 space-y-2 transition-all duration-300',
            getWindowFocusClasses(isFocused)
          )}
        >
          <h4 className="text-foreground">Functional Glass Panel</h4>
          <p className="text-muted-foreground">
            This panel adapts saturation and brightness based on window focus state.
          </p>
          <div className="flex items-center gap-2 pt-2">
            <div className={cn(
              'h-3 w-3 rounded-full',
              isFocused ? 'bg-chart-2' : 'bg-muted-foreground'
            )} />
            <span className="text-sm text-muted-foreground">
              Window is {isFocused ? 'focused' : 'unfocused'}
            </span>
          </div>
        </div>

        <div className="material-regular rounded-xl p-6 space-y-2">
          <h4 className="text-foreground">Content Material (Reference)</h4>
          <p className="text-muted-foreground">
            Content layer material maintains consistency regardless of focus state.
          </p>
          <div className="flex items-center gap-2 pt-2">
            <div className="h-3 w-3 rounded-full bg-primary/50" />
            <span className="text-sm text-muted-foreground">
              Always same opacity
            </span>
          </div>
        </div>
      </div>

      {/* Info box */}
      <div className="material-thin rounded-xl p-4 border-l-4 border-l-primary">
        <p className="text-muted-foreground text-sm">
          <strong className="text-foreground">Guidelines §8.5.4:</strong> Material should
          become less saturated or slightly more opaque when window loses focus,
          maintaining clear visual hierarchy between active and inactive windows.
        </p>
      </div>
    </div>
  );
};
