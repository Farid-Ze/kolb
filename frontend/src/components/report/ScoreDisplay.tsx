/**
 * KLSI 4.0 - ScoreDisplay Component
 * Task 47-48: Display raw scores, dialectic scores, dan percentiles
 * Task TODO3.md Phase 3.13: Replace Separator with negative space (Guidelines.md §1.5)
 * 
 * Implementasi sesuai Guidelines.md:
 * - Material-regular untuk content cards
 * - Grid layout responsive
 * - Negative space over explicit separators
 */

import React from 'react';
import type {
  RawScores,
  DialecticScores,
  PercentileScores,
} from '../../types/api';
import { TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';

interface ScoreDisplayProps {
  rawScores: RawScores;
  dialecticScores: DialecticScores;
  percentileScores: PercentileScores;
}

export const ScoreDisplay: React.FC<ScoreDisplayProps> = ({
  rawScores,
  dialecticScores,
  percentileScores,
}) => {
  // Mode descriptions
  const modeDescriptions: Record<string, { label: string; description: string }> = {
    CE: {
      label: 'Concrete Experience',
      description: 'Belajar melalui pengalaman langsung',
    },
    RO: {
      label: 'Reflective Observation',
      description: 'Belajar melalui pengamatan dan refleksi',
    },
    AC: {
      label: 'Abstract Conceptualization',
      description: 'Belajar melalui analisis konseptual',
    },
    AE: {
      label: 'Active Experimentation',
      description: 'Belajar melalui eksperimen aktif',
    },
  };

  return (
    <div className="space-y-6">
      {/* Raw Scores */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h3 className="text-foreground">Skor Mentah</h3>
          <TrendingUp className="h-5 w-5 text-muted-foreground" />
        </div>
        
        <div className="grid sm:grid-cols-2 gap-4">
          {(Object.entries(rawScores) as [keyof RawScores, number][]).map(
            ([mode, score]) => {
              const info = modeDescriptions[mode as keyof typeof modeDescriptions];
              if (!info) {
                return null;
              }
              const percentile = percentileScores[mode] ?? 0;
              
              return (
                <div
                  key={mode}
                  className="material-regular rounded-xl p-4 space-y-3"
                >
                  {/* Mode Header */}
                  <div className="flex items-center justify-between">
                    <div className="inline-flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-1">
                      <span className="text-primary">{mode}</span>
                    </div>
                    <div className="text-foreground">
                      <span className="sr-only">{`${mode}: ${score}`}</span>
                      {score}
                    </div>
                  </div>

                  {/* Mode Info */}
                  <div>
                    <div className="text-foreground mb-1">
                      {info.label}
                    </div>
                    <div className="text-muted-foreground">
                      {info.description}
                    </div>
                  </div>

                  {/* Percentile - Guidelines.md §1.5: Use negative space instead of separator */}
                  <div className="pt-6 mt-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Persentil</span>
                      <span className="text-foreground">{percentile}%</span>
                    </div>
                    {/* Percentile bar */}
                    <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentile}%` }}
                        transition={{
                          type: 'spring',
                          stiffness: 200,
                          damping: 25,
                        }}
                        className="h-full rounded-full bg-primary"
                      />
                    </div>
                  </div>
                </div>
              );
            }
          )}
        </div>
      </div>

      {/* Dialectic Scores */}
      <div className="space-y-4">
        <h3 className="text-foreground">Skor Dialektik</h3>
        <p className="text-muted-foreground">
          Kombinasi mode belajar yang menunjukkan preferensi gaya belajar Anda
        </p>
        
        <div className="grid sm:grid-cols-2 gap-4">
          {(
            Object.entries(dialecticScores) as [keyof DialecticScores, number][]
          ).map(([dimension, score]) => {
            const percentile = percentileScores[dimension] ?? 0;
            const isPositive = score > 0;
            const [pole1, pole2] = dimension.split('-');
            const preciseScore = Number.isInteger(score)
              ? score.toFixed(0)
              : score.toFixed(1);
            const signedDisplay = isPositive ? `+${preciseScore}` : preciseScore;
            
            return (
              <div
                key={dimension}
                className="material-regular rounded-xl p-4 space-y-3"
              >
                {/* Dimension Header */}
                <div className="flex items-center justify-between">
                  <div className="text-foreground">{dimension}</div>
                  <div className="text-foreground">
                    {signedDisplay}
                  </div>
                </div>
                <span className="sr-only">
                  {`${dimension}: ${preciseScore}`}
                </span>

                {/* Visual Bar (bi-directional) */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>{pole1}</span>
                    <span>{pole2}</span>
                  </div>
                  <div className="relative h-2 rounded-full bg-secondary overflow-hidden">
                    <div className="absolute inset-y-0 left-1/2 w-0.5 bg-border z-10" />
                    {isPositive ? (
                      <div
                        className="absolute inset-y-0 bg-primary transition-spring"
                        style={{
                          left: '50%',
                          right: `${50 - (Math.abs(score) / 2)}%`,
                        }}
                      />
                    ) : (
                      <div
                        className="absolute inset-y-0 bg-primary transition-spring"
                        style={{
                          right: '50%',
                          left: `${50 - (Math.abs(score) / 2)}%`,
                        }}
                      />
                    )}
                  </div>
                </div>

                {/* Percentile - Guidelines.md §1.5: Use negative space instead of separator */}
                <div className="pt-4 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Persentil</span>
                    <span className="text-foreground">
                      {percentile.toFixed(0)}th
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};