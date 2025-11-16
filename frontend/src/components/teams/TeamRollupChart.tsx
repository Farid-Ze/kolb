/**
 * KLSI 4.0 - TeamRollupChart Component
 * Task 69-70: Visualisasi scatterplot anggota tim di Learning Space
 * 
 * Implementasi sesuai Guidelines.md:
 * - Material-regular untuk content layer
 * - Recharts untuk visualization
 * - Tooltips dengan nama anggota
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
  Cell,
} from 'recharts';
import type { TeamRollupDataPoint } from '../../services/teamService';
import { Users } from 'lucide-react';

interface TeamRollupChartProps {
  dataPoints: TeamRollupDataPoint[];
  avgAcCe?: number;
  avgAeRo?: number;
}

// Color mapping untuk learning styles
const STYLE_COLORS: Record<string, string> = {
  DIV: 'hsl(var(--chart-1))', // Diverging - Orange
  ASM: 'hsl(var(--chart-2))', // Assimilating - Blue
  CON: 'hsl(var(--chart-3))', // Converging - Purple
  ACC: 'hsl(var(--chart-4))', // Accommodating - Green
  BAL: 'hsl(var(--chart-5))', // Balancing - Yellow
};

const getStyleColor = (styleCode: string): string => {
  return STYLE_COLORS[styleCode] || 'hsl(var(--primary))';
};

export const TeamRollupChart: React.FC<TeamRollupChartProps> = ({
  dataPoints,
  avgAcCe,
  avgAeRo,
}) => {
  // Transform data for scatter plot
  const chartData = dataPoints.map((point) => ({
    x: point.ac_ce,
    y: point.ae_ro,
    name: point.name,
    email: point.email,
    style: point.learning_style,
    styleCode: point.style_code,
    userId: point.user_id,
  }));

  // Average point if provided
  const avgPoint = avgAcCe !== undefined && avgAeRo !== undefined
    ? [{ x: avgAcCe, y: avgAeRo, name: 'Team Average' }]
    : [];

  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg text-foreground">Team Learning Space Distribution</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Posisi setiap anggota tim dalam Learning Space Grid berdasarkan gaya belajar mereka
        </p>
      </div>

      {/* Chart Container */}
      <div className="material-regular rounded-xl p-6">
        <ResponsiveContainer width="100%" height={500}>
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
                  if (point.name === 'Team Average') {
                    return (
                      <div className="material-regular rounded-lg p-3 border border-border shadow-lg">
                        <p className="text-sm text-foreground mb-1">
                          <strong>Team Average</strong>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          AC-CE: {point.x.toFixed(1)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          AE-RO: {point.y.toFixed(1)}
                        </p>
                      </div>
                    );
                  }
                  return (
                    <div className="material-regular rounded-lg p-3 border border-border shadow-lg max-w-xs">
                      <p className="text-sm text-foreground mb-1">
                        <strong>{point.name}</strong>
                      </p>
                      <p className="text-xs text-muted-foreground mb-2">
                        {point.email}
                      </p>
                      <div className="space-y-1">
                        <p className="text-xs">
                          <span className="text-muted-foreground">Style:</span>{' '}
                          <span className="text-foreground">{point.style}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          AC-CE: {point.x.toFixed(1)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          AE-RO: {point.y.toFixed(1)}
                        </p>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />

            {/* Team Members */}
            <Scatter data={chartData} shape="circle">
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={getStyleColor(entry.styleCode)}
                />
              ))}
            </Scatter>

            {/* Team Average (if provided) */}
            {avgPoint.length > 0 && (
              <Scatter
                data={avgPoint}
                fill="hsl(var(--destructive))"
                shape="diamond"
              />
            )}
          </ScatterChart>
        </ResponsiveContainer>

        {/* Quadrant Labels */}
        <div className="relative mt-4 grid grid-cols-2 gap-4 text-center text-xs text-muted-foreground">
          <div className="p-2 rounded-lg bg-secondary/20">
            <div className="text-foreground">Diverging</div>
            <div className="text-[10px]">Feeling + Watching</div>
          </div>
          <div className="p-2 rounded-lg bg-secondary/20">
            <div className="text-foreground">Accommodating</div>
            <div className="text-[10px]">Feeling + Doing</div>
          </div>
          <div className="p-2 rounded-lg bg-secondary/20">
            <div className="text-foreground">Assimilating</div>
            <div className="text-[10px]">Thinking + Watching</div>
          </div>
          <div className="p-2 rounded-lg bg-secondary/20">
            <div className="text-foreground">Converging</div>
            <div className="text-[10px]">Thinking + Doing</div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground mb-3">Learning Style Legend:</p>
          <div className="flex flex-wrap gap-3">
            {Object.entries({
              DIV: 'Diverging',
              ASM: 'Assimilating',
              CON: 'Converging',
              ACC: 'Accommodating',
              BAL: 'Balancing',
            }).map(([code, name]) => (
              <div key={code} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: STYLE_COLORS[code] }}
                />
                <span className="text-xs text-muted-foreground">{name}</span>
              </div>
            ))}
            {avgPoint.length > 0 && (
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rotate-45"
                  style={{ backgroundColor: 'hsl(var(--destructive))' }}
                />
                <span className="text-xs text-muted-foreground">Team Average</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
