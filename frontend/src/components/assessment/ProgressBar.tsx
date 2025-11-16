/**
 * KLSI 4.0 - ProgressBar Component
 * Task 34: Progress bar penyelesaian asesmen
 * 
 * Implementasi sesuai Guidelines.md §2.3 (Spring-based animation)
 * FIXED: Proper Motion spring animation, removed text-* classes
 */

import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2 } from 'lucide-react';

interface ProgressBarProps {
  current: number;
  total: number;
  label?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  current,
  total,
  label = 'Progress',
}) => {
  const percentage = total > 0 ? (current / total) * 100 : 0;
  const isComplete = current >= total;

  // Spring configuration (Bagian 2.3.1 - Damped Harmonic Oscillation)
  const springConfig = {
    type: "spring" as const,
    stiffness: 200,
    damping: 25,
  };

  return (
    <div className="space-y-2">
      {/* Label & Stats */}
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">{label}</span>
        <div className="flex items-center gap-2">
          <span>
            {current} / {total}
          </span>
          {isComplete && (
            <CheckCircle2 className="h-4 w-4 text-chart-4" />
          )}
        </div>
      </div>

      {/* Progress Bar (Guidelines §2.3.1 - Motion spring animation) */}
      <div className="h-2 overflow-hidden rounded-full bg-secondary">
        <motion.div
          className="h-full rounded-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={springConfig}
          role="progressbar"
          aria-valuenow={current}
          aria-valuemin={0}
          aria-valuemax={total}
        />
      </div>

      {/* Percentage */}
      <div className="text-right">
        <span className="text-muted-foreground">
          {percentage.toFixed(0)}% selesai
        </span>
      </div>
    </div>
  );
};
