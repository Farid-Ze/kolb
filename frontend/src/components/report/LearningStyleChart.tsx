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
import type { DialecticScores, LearningStyle } from '../../services/reportService';

interface LearningStyleChartProps {
  dialecticScores: DialecticScores;
  learningStyle: LearningStyle;
}

export const LearningStyleChart: React.FC<LearningStyleChartProps> = ({
  dialecticScores,
  learningStyle,
}) => {
  // Data point for the scatter plot
  const data = [
    {
      x: dialecticScores['AC-CE'], // X-axis: Abstract-Concrete
      y: dialecticScores['AE-RO'], // Y-axis: Active-Reflective
      name: 'Your Position',
    },
  ];

  // Quadrant labels & descriptions
  const quadrants = [
    { id: 1, name: 'Accommodating', position: { x: 30, y: 30 } },
    { id: 2, name: 'Diverging', position: { x: -30, y: 30 } },
    { id: 3, name: 'Assimilating', position: { x: -30, y: -30 } },
    { id: 4, name: 'Converging', position: { x: 30, y: -30 } },
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
            margin={{ top: 20, right: 20, bottom: 40, left: 40 }}
          >
            {/* Grid */}
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />

            {/* X-Axis: Abstract-Concrete */}
            <XAxis
              type="number"
              dataKey="x"
              domain={[-50, 50]}
              ticks={[-40, -20, 0, 20, 40]}
              stroke="hsl(var(--muted-foreground))"
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
                        {learningStyle.style_name}
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
            <Scatter
              data={data}
              fill="hsl(var(--primary))"
              shape="circle"
            />
          </ScatterChart>
        </ResponsiveContainer>

        {/* Quadrant Labels Overlay (positioned absolutely) */}
        <div className="relative mt-4 grid grid-cols-2 gap-4 text-center text-muted-foreground">
          <div className="p-2 rounded-lg bg-secondary/20">
            <div className="text-foreground">Diverging</div>
            <div>Feeling + Watching</div>
          </div>
          <div className="p-2 rounded-lg bg-secondary/20">
            <div className="text-foreground">Accommodating</div>
            <div>Feeling + Doing</div>
          </div>
          <div className="p-2 rounded-lg bg-secondary/20">
            <div className="text-foreground">Assimilating</div>
            <div>Thinking + Watching</div>
          </div>
          <div className="p-2 rounded-lg bg-secondary/20">
            <div className="text-foreground">Converging</div>
            <div>Thinking + Doing</div>
          </div>
        </div>
      </div>

      {/* Current Style Badge */}
      <div className="material-thin rounded-xl p-4 border-l-4 border-l-primary">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            Q{learningStyle.quadrant}
          </div>
          <div className="flex-1">
            <h4 className="text-foreground mb-1">
              {learningStyle.style_name}
            </h4>
            <p className="text-sm text-muted-foreground">
              {learningStyle.description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
