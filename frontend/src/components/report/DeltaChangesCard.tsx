/**
 * KLSI 4.0 - DeltaChangesCard Component
 * Task Phase 8: Display longitudinal changes (delta) from previous assessment
 * 
 * Implementasi sesuai Guidelines.md & frontend_blueprint.md:
 * - Material-regular untuk content cards
 * - Visualisasi perubahan ACCE, AERO, LFI
 * - Color-coded positive/negative changes
 */

import React from 'react';
import { motion } from 'motion/react';
import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';
import { GlassPanel } from '../ui/GlassPanel';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

interface DeltaData {
  delta_acce: number;
  delta_aero: number;
  delta_lfi: number;
  previous_session_id: number;
  previous_session_date: string;
}

interface DeltaChangesCardProps {
  delta: DeltaData;
  className?: string;
}

/**
 * DeltaChangesCard - Visualize changes from previous assessment
 */
export const DeltaChangesCard: React.FC<DeltaChangesCardProps> = ({
  delta,
  className = '',
}) => {
  const springConfig = {
    type: 'spring' as const,
    stiffness: 300,
    damping: 25,
  };

  const formatDelta = (value: number): string => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}`;
  };

  const getDeltaIcon = (value: number) => {
    if (value > 0.5) return <TrendingUp className="h-5 w-5 text-chart-4" />;
    if (value < -0.5) return <TrendingDown className="h-5 w-5 text-chart-1" />;
    return <Minus className="h-5 w-5 text-muted-foreground" />;
  };

  const getDeltaColor = (value: number): string => {
    if (value > 0.5) return 'text-chart-4'; // Green for increase
    if (value < -0.5) return 'text-chart-1'; // Red for decrease
    return 'text-muted-foreground'; // Gray for no change
  };

  const getDeltaBgColor = (value: number): string => {
    if (value > 0.5) return 'bg-chart-4/10';
    if (value < -0.5) return 'bg-chart-1/10';
    return 'bg-secondary/10';
  };

  const getInterpretation = (value: number): string => {
    if (Math.abs(value) < 0.5) return 'Perubahan minimal';
    if (value >= 0.5 && value < 2) return 'Peningkatan ringan';
    if (value >= 2) return 'Peningkatan signifikan';
    if (value <= -0.5 && value > -2) return 'Penurunan ringan';
    if (value <= -2) return 'Penurunan signifikan';
    return '';
  };

  const metrics = [
    {
      label: 'ACCE (Abstrak-Konkret)',
      value: delta.delta_acce,
      description: 'Perubahan pada dimensi Abstrak-Konkret',
    },
    {
      label: 'AERO (Aktif-Reflektif)',
      value: delta.delta_aero,
      description: 'Perubahan pada dimensi Aktif-Reflektif',
    },
    {
      label: 'LFI (Learning Flexibility)',
      value: delta.delta_lfi,
      description: 'Perubahan pada indeks fleksibilitas belajar',
    },
  ];

  return (
    <div className={className}>
      {/* Info Notice */}
      <Alert className="mb-6">
        <Info className="h-4 w-4" />
        <AlertTitle>Perubahan dari Asesmen Sebelumnya</AlertTitle>
        <AlertDescription>
          Data ini membandingkan hasil asesmen saat ini dengan asesmen sebelumnya pada{' '}
          <strong>
            {new Date(delta.previous_session_date).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </strong>
          . Perubahan adalah hal normal karena gaya belajar dapat berkembang seiring
          pengalaman.
        </AlertDescription>
      </Alert>

      {/* Delta Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springConfig, delay: index * 0.1 }}
          >
            <GlassPanel
              density="regular"
              emphasis="medium"
              className="p-6 space-y-4"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <h4 className="text-foreground">{metric.label}</h4>
                {getDeltaIcon(metric.value)}
              </div>

              {/* Delta Value */}
              <div
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 ${getDeltaBgColor(
                  metric.value
                )}`}
              >
                <span className={`text-2xl ${getDeltaColor(metric.value)}`}>
                  {formatDelta(metric.value)}
                </span>
              </div>

              {/* Description */}
              <p className="text-sm text-muted-foreground">{metric.description}</p>

              {/* Interpretation - Guidelines §1.5: Remove separator line */}
              <div className="pt-4 mt-4">
                <p className="text-xs text-muted-foreground">{getInterpretation(metric.value)}</p>
              </div>
            </GlassPanel>
          </motion.div>
        ))}
      </div>
    </div>
  );
};