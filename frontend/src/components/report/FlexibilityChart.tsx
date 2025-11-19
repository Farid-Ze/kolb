/**
 * KLSI 4.0 - FlexibilityChart Component
 * Task 46: Visualisasi Learning Flexibility Index (LFI) dengan Radar Chart untuk 9-region
 * 
 * Implementasi sesuai Guidelines.md:
 * - Radar chart untuk visualisasi 9-region learning style
 * - Bar chart untuk overall LFI score
 * - Material-regular untuk content layer
 */

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { ReportLfiBlock } from '../../types/api';
import { Activity } from 'lucide-react';

interface FlexibilityChartProps {
  lfi: ReportLfiBlock | null;
}

export const FlexibilityChart: React.FC<FlexibilityChartProps> = ({
  lfi,
}) => {
  const rawScore = lfi?.value ?? 0;
  const percentageScore = Math.max(0, Math.min(100, rawScore * 100));

  const lfiData = [
    {
      name: 'Learning Flexibility',
      score: percentageScore,
      max: 100,
    },
  ];

  // Color based on category
  const getColor = () => {
    switch (lfi?.level) {
      case 'High':
        return 'hsl(var(--chart-4))';
      case 'Moderate':
        return 'hsl(var(--chart-2))';
      case 'Low':
        return 'hsl(var(--chart-3))';
      default:
        return 'hsl(var(--primary))';
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="space-y-2">
        <h3 className="text-foreground">Fleksibilitas Belajar</h3>
        <p className="text-muted-foreground">
          Mengukur kemampuan adaptasi Anda di berbagai mode belajar
        </p>
      </div>

      {/* Overall LFI Score */}
      <div className="material-regular rounded-xl p-6">
        {/* Score Badge */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${getColor()}20` }}
            >
              <Activity className="h-6 w-6" style={{ color: getColor() }} />
            </div>
            <div>
              <div className="text-2xl text-foreground">
                {percentageScore.toFixed(1)}
              </div>
              <div className="text-muted-foreground">
                {lfi?.level_label ?? 'Level tidak tersedia'}
              </div>
            </div>
          </div>

          {/* Category Badge */}
          <div
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2"
            style={{
              backgroundColor: `${getColor()}20`,
              color: getColor(),
            }}
          >
            <span>{lfi?.level ?? '–'}</span>
          </div>
        </div>

        {/* Bar Chart */}
        <ResponsiveContainer width="100%" height={120}>
          <BarChart
            data-testid="lfi-bar-chart"
            data={lfiData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} data-testid="flexibility-grid" />
            <XAxis
              type="number"
              domain={[0, 100]}
              stroke="hsl(var(--muted-foreground))"
              data-testid="flexibility-x-axis"
            />
            <YAxis
              dataKey="name"
              type="category"
              stroke="hsl(var(--muted-foreground))"
              data-testid="flexibility-y-axis"
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="material-regular rounded-lg p-3 border border-border shadow-lg">
                        <p className="text-foreground">
                          LFI Score: {payload[0].value?.toFixed(1)}%
                        </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="score" radius={[0, 8, 8, 0]}>
              <Cell fill={getColor()} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Interpretation */}
        <div className="mt-6 p-4 rounded-lg bg-secondary/20">
          <p className="text-muted-foreground">
            {lfi?.level_label
              ? `Level ${lfi.level_label} dengan persentil ${lfi.percentile ?? '–'}`
              : 'Interpretasi fleksibilitas akan muncul setelah sesi lengkap.'}
          </p>
        </div>
      </div>
    </div>
  );
};
