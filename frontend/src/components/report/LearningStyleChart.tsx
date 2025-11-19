/**
 * KLSI 4.0 - LearningStyleChart Component
 * Task 44-45: Visualisasi Learning Space Grid (2D Scatterplot)
 * 
 * Implementasi sesuai Guidelines.md:
 * - Material-regular untuk content layer
 * - Responsive design
 * - Accessibility (reduce-motion support)
 */

import React from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Label,
} from 'recharts';
import type { ReportVisualizationBlock, ReportStyleBlock } from '../../types/api';

interface LearningStyleChartProps {
  visualization: ReportVisualizationBlock | null;
  style: ReportStyleBlock | null;
}

export const LearningStyleChart: React.FC<LearningStyleChartProps> = ({
  visualization,
  style,
}) => {
  const acce = visualization?.dialectic?.ACCE ?? 0;
  const aero = visualization?.dialectic?.AERO ?? 0;

  const data = [
    {
      x: acce,
      y: aero,
      name: 'Posisi Anda',
    },
  ];

  const quadrantSummaries = [
    { name: 'Diverging', description: 'Feeling + Watching' },
    { name: 'Accommodating', description: 'Feeling + Doing' },
    { name: 'Assimilating', description: 'Thinking + Watching' },
    { name: 'Converging', description: 'Thinking + Doing' },
  ];

  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="space-y-2">
        <h3 className="text-foreground">Learning Space Position</h3>
        <p className="text-muted-foreground">
          Posisi Anda dalam Learning Space Grid berdasarkan skor dialektik
        </p>
      </div>

      {/* Chart Container */}
      <div className="material-regular rounded-xl p-6">
        <ResponsiveContainer width="100%" height={400}>
          <ScatterChart
            data-testid="learning-style-scatter"
            margin={{ top: 20, right: 20, bottom: 40, left: 40 }}
          >
            {/* Grid */}
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} data-testid="cartesian-grid" />

            {/* X-Axis: Abstract-Concrete */}
            <XAxis
              type="number"
              dataKey="x"
              domain={[-50, 50]}
              ticks={[-40, -20, 0, 20, 40]}
              stroke="hsl(var(--muted-foreground))"
              data-testid="learning-style-x-axis"
            >
              <Label
                value="Abstract ← AC-CE → Concrete"
                position="bottom"
                offset={0}
                style={{ fill: 'hsl(var(--muted-foreground))' }}
              />
            </XAxis>

            {/* Y-Axis: Active-Reflective */}
            <YAxis
              type="number"
              dataKey="y"
              domain={[-50, 50]}
              ticks={[-40, -20, 0, 20, 40]}
              stroke="hsl(var(--muted-foreground))"
              data-testid="learning-style-y-axis"
            >
              <Label
                value="Reflective ← AE-RO → Active"
                angle={-90}
                position="left"
                offset={0}
                style={{ fill: 'hsl(var(--muted-foreground))' }}
              />
            </YAxis>

            {/* Center Lines (Axes) */}
            <ReferenceLine
              x={0}
              stroke="hsl(var(--border))"
              strokeWidth={2}
            />
            <ReferenceLine
              y={0}
              stroke="hsl(var(--border))"
              strokeWidth={2}
            />

            {/* Tooltip */}
            <Tooltip
              cursor={{ strokeDasharray: '3 3' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const point = payload[0].payload;
                  return (
                    <div className="material-regular rounded-lg p-3 border border-border shadow-lg">
                      <p className="text-foreground mb-2">
                        {style?.primary_name ?? 'Posisi saat ini'}
                      </p>
                      <p className="text-muted-foreground">
                        AC-CE: {point.x.toFixed(1)}
                      </p>
                      <p className="text-muted-foreground">
                        AE-RO: {point.y.toFixed(1)}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />

            {/* User Position */}
            <Scatter data={data} fill="hsl(var(--primary))" shape="circle" />
          </ScatterChart>
        </ResponsiveContainer>

        {/* Quadrant Labels Overlay (positioned absolutely) */}
        <div className="relative mt-4 grid grid-cols-2 gap-4 text-center text-muted-foreground">
          {quadrantSummaries.map((quadrant) => (
            <div key={quadrant.name} className="p-2 rounded-lg bg-secondary/20">
              <div className="text-foreground">{quadrant.name}</div>
              <div>{quadrant.description}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Current Style Badge */}
      <div className="material-thin rounded-xl p-4 border-l-4 border-l-primary">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {style?.primary_code ?? 'LS'}
          </div>
          <div className="flex-1">
            <h4 className="text-foreground mb-1">
              {style?.primary_name ?? 'Profil gaya belajar tidak tersedia'}
            </h4>
            <p className="text-sm text-muted-foreground">
              {style?.primary_detail ??
                `Koordinat ACCE ${acce.toFixed(1)} dan AERO ${aero.toFixed(1)} menempatkan Anda dalam posisi unik pada learning space.`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
