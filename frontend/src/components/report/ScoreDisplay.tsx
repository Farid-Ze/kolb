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
  ReportRawBlock,
  ReportPercentiles,
} from '../../types/api';
import { TrendingUp, Info } from 'lucide-react';
import { motion } from 'motion/react';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

interface ScoreDisplayProps {
  raw: ReportRawBlock | null;
  percentiles: ReportPercentiles | null;
}

export const ScoreDisplay: React.FC<ScoreDisplayProps> = ({
  raw,
  percentiles,
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

  const primaryModes = ['CE', 'RO', 'AC', 'AE'] as const;
  type PrimaryMode = typeof primaryModes[number];

  const getModeScore = (key: PrimaryMode) => {
    const value = raw?.[key];
    return typeof value === 'number' ? value : null;
  };

  const getPercentile = (key: 'CE' | 'RO' | 'AC' | 'AE' | 'ACCE' | 'AERO') => {
    const value = percentiles?.[key];
    return typeof value === 'number' ? value : null;
  };

  const getNormSource = (key: string) => {
    const perScaleSources = percentiles?.per_scale_sources as Record<string, string | null> | undefined;
    const source = perScaleSources?.[key] ?? null;
    if (source && source.trim().length > 0) {
      return source.trim();
    }
    const fallback = percentiles?.source_provenance;
    return fallback && fallback.trim().length > 0 ? fallback.trim() : null;
  };

  const renderNormBadge = (key: string, label?: string) => {
    const source = getNormSource(key);
    if (!source) {
      return null;
    }
    const targetLabel = label ?? key;
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-full bg-secondary/50 px-2 py-0.5 text-[11px] text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`Sumber norm ${targetLabel}`}
          >
            <Info className="h-3.5 w-3.5" />
            <span>Norma</span>
          </button>
        </TooltipTrigger>
        <TooltipContent className="text-xs max-w-xs">
          <p className="font-semibold text-foreground">{targetLabel}</p>
          <p className="text-muted-foreground">{source}</p>
        </TooltipContent>
      </Tooltip>
    );
  };

  const formatPercentile = (value: number | null | undefined) =>
    typeof value === 'number' ? `${value.toFixed(0)}%` : '–';

  return (
    <div className="space-y-6">
      {/* Raw Scores */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h3 className="text-foreground">Skor Mentah</h3>
          <TrendingUp className="h-5 w-5 text-muted-foreground" />
        </div>
        
        <div className="grid sm:grid-cols-2 gap-4">
          {primaryModes.map((mode) => {
            const info = modeDescriptions[mode];
            const score = getModeScore(mode);
            const percentile = getPercentile(mode);
              return (
                <div
                  key={mode}
                  className="material-regular rounded-xl p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="inline-flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-1">
                        <span className="text-primary">{mode}</span>
                      </div>
                      {renderNormBadge(mode, info?.label)}
                    </div>
                    <div className="text-foreground">
                      <span className="sr-only">{`${mode}: ${score ?? 'Tidak tersedia'}`}</span>
                      {typeof score === 'number' ? score : '–'}
                    </div>
                  </div>

                  <div>
                    <div className="text-foreground mb-1">
                      {info?.label}
                    </div>
                    <div className="text-muted-foreground">
                      {info?.description}
                    </div>
                  </div>

                  <div className="pt-6 mt-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Persentil</span>
                      <span className="text-foreground">{formatPercentile(percentile)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.max(0, Math.min(100, percentile ?? 0))}%` }}
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
          })}
        </div>
      </div>

      {/* Dialectic Scores */}
      <div className="space-y-4">
        <h3 className="text-foreground">Skor Dialektik</h3>
        <p className="text-muted-foreground">
          Kombinasi mode belajar yang menunjukkan preferensi gaya belajar Anda
        </p>
        
        <div className="grid sm:grid-cols-2 gap-4">
          {([
            {
              key: 'ACCE' as const,
              label: 'AC-CE',
              poles: ['Abstract', 'Concrete'],
            },
            {
              key: 'AERO' as const,
              label: 'AE-RO',
              poles: ['Active', 'Reflective'],
            },
          ]).map(({ key, label, poles }) => {
            const score = raw?.[key] ?? null;
            const percentile = getPercentile(key);
            const numericScore = typeof score === 'number' ? score : 0;
            const isPositive = numericScore > 0;
            const preciseScore = numericScore.toFixed(1);
            const signedDisplay = isPositive ? `+${preciseScore}` : preciseScore;

            return (
              <div
                key={key}
                className="material-regular rounded-xl p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-foreground">
                    <span>{label}</span>
                    {renderNormBadge(key, label)}
                  </div>
                  <div className="text-foreground">{signedDisplay}</div>
                </div>
                <span className="sr-only">{`${label}: ${preciseScore}`}</span>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>{poles[0]}</span>
                    <span>{poles[1]}</span>
                  </div>
                  <div className="relative h-2 rounded-full bg-secondary overflow-hidden">
                    <div className="absolute inset-y-0 left-1/2 w-0.5 bg-border z-10" />
                    {isPositive ? (
                      <div
                        className="absolute inset-y-0 bg-primary transition-spring"
                        style={{
                          left: '50%',
                          right: `${50 - Math.min(50, Math.abs(numericScore) / 2)}%`,
                        }}
                      />
                    ) : (
                      <div
                        className="absolute inset-y-0 bg-primary transition-spring"
                        style={{
                          right: '50%',
                          left: `${50 - Math.min(50, Math.abs(numericScore) / 2)}%`,
                        }}
                      />
                    )}
                  </div>
                </div>

                <div className="pt-4 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Persentil</span>
                    <span className="text-foreground">{formatPercentile(percentile)}</span>
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