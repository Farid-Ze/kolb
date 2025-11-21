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
import type { TooltipProps } from 'recharts';
import type { Payload } from 'recharts/types/component/DefaultTooltipContent';
import type { TeamRollupDataPoint } from '../../services/teamService';
import { Users } from 'lucide-react';

interface TeamRollupChartProps {
  dataPoints: TeamRollupDataPoint[];
  avgAcCe?: number;
  avgAeRo?: number;
  ariaDescribedById?: string;
}

type TeamScatterPoint = {
  x: number;
  y: number;
  name: string;
  email?: string | null;
  style?: string | null;
  styleCode?: string | null;
  userId?: string | number | null;
  isAverage?: boolean;
};

// Color mapping untuk learning styles
const STYLE_COLORS: Record<string, string> = {
  DIV: 'hsl(var(--chart-1))', // Diverging - Orange
  ASM: 'hsl(var(--chart-2))', // Assimilating - Blue
  CON: 'hsl(var(--chart-3))', // Converging - Purple
  ACC: 'hsl(var(--chart-4))', // Accommodating - Green
  BAL: 'hsl(var(--chart-5))', // Balancing - Yellow
};

const getStyleColor = (styleCode?: string | null): string => {
  if (!styleCode) {
    return 'hsl(var(--primary))';
  }
  return STYLE_COLORS[styleCode] || 'hsl(var(--primary))';
};

export const TeamRollupChart: React.FC<TeamRollupChartProps> = ({
  dataPoints,
  avgAcCe,
  avgAeRo,
  ariaDescribedById,
}) => {
  const scatterPoints: TeamScatterPoint[] = dataPoints
    .map((point): TeamScatterPoint | null => {
      if (typeof point.ac_ce !== 'number' || typeof point.ae_ro !== 'number') {
        return null;
      }
      return {
        x: point.ac_ce,
        y: point.ae_ro,
        name: point.name,
        email: point.email ?? null,
        style: point.learning_style ?? null,
        styleCode: point.style_code ?? null,
        userId: point.user_id ?? null,
      };
    })
    .filter((point): point is TeamScatterPoint => point !== null);

  const averagePoints: TeamScatterPoint[] =
    avgAcCe !== undefined && avgAeRo !== undefined
      ? [{ x: avgAcCe, y: avgAeRo, name: 'Team Average', isAverage: true }]
      : [];

  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg text-foreground">Peta Gaya Belajar Tim</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Visualisasi sebaran anggota tim pada Learning Space Grid berdasarkan gaya belajar KLSI 4.0
        </p>
      </div>

      {/* Chart Container */}
      <div
        className="material-regular rounded-xl p-6"
        role="img"
        aria-label="Sebaran koordinat AC-CE dan AE-RO anggota tim"
        aria-describedby={ariaDescribedById}
        data-testid="team-rollup-analytics"
      >
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
            <Tooltip cursor={{ strokeDasharray: '3 3' }} content={renderTeamRollupTooltip} />

            {/* Team Members */}
            <Scatter data={scatterPoints} shape="circle">
              {scatterPoints.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={getStyleColor(entry.styleCode)}
                  stroke="hsl(var(--background))"
                  strokeWidth={1.5}
                />
              ))}
            </Scatter>

            {/* Team Average (if provided) */}
            {averagePoints.length > 0 && (
              <Scatter
                data={averagePoints}
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
            {averagePoints.length > 0 && (
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

type TeamTooltipEntry = Omit<Payload<number, string>, 'payload'> & { payload?: unknown };

type TooltipRenderProps = TooltipProps<number, string> & {
  payload?: ReadonlyArray<Payload<number, string>>;
};

const sanitizeTeamTooltipPayload = (
  payload?: TooltipRenderProps['payload'],
): TeamTooltipEntry[] =>
  Array.isArray(payload)
    ? payload.filter((entry): entry is TeamTooltipEntry => typeof entry === 'object' && entry !== null)
    : [];

const renderTeamRollupTooltip = ({ active, payload }: TooltipRenderProps) => {
  const tooltipPayload = sanitizeTeamTooltipPayload(payload);
  if (!active || tooltipPayload.length === 0) {
    return null;
  }
  const point = extractTeamPoint(tooltipPayload[0]);
  if (!point) {
    return null;
  }
  if (point.isAverage) {
    return (
      <div className="material-regular rounded-lg p-3 border border-border shadow-lg">
        <p className="text-sm text-foreground mb-1">
          <strong>Team Average</strong>
        </p>
        <p className="text-xs text-muted-foreground">AC-CE: {point.x.toFixed(1)}</p>
        <p className="text-xs text-muted-foreground">AE-RO: {point.y.toFixed(1)}</p>
      </div>
    );
  }

  return (
    <div className="material-regular rounded-lg p-3 border border-border shadow-lg max-w-xs">
      <p className="text-sm text-foreground mb-1">
        <strong>{point.name}</strong>
      </p>
      {point.email ? (
        <p className="text-xs text-muted-foreground mb-2">{point.email}</p>
      ) : null}
      <div className="space-y-1">
        {point.style ? (
          <p className="text-xs">
            <span className="text-muted-foreground">Style:</span>{' '}
            <span className="text-foreground">{point.style}</span>
          </p>
        ) : null}
        <p className="text-xs text-muted-foreground">AC-CE: {point.x.toFixed(1)}</p>
        <p className="text-xs text-muted-foreground">AE-RO: {point.y.toFixed(1)}</p>
      </div>
    </div>
  );
};

const extractTeamPoint = (payload: TeamTooltipEntry | undefined): TeamScatterPoint | null => {
  if (!payload) {
    return null;
  }
  const raw: unknown = payload.payload;
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const candidate = raw as Partial<TeamScatterPoint>;
  if (typeof candidate.x !== 'number' || typeof candidate.y !== 'number' || typeof candidate.name !== 'string') {
    return null;
  }
  return {
    x: candidate.x,
    y: candidate.y,
    name: candidate.name,
    email: candidate.email ?? null,
    style: candidate.style,
    styleCode: candidate.styleCode,
    userId: candidate.userId,
    isAverage: candidate.isAverage,
  };
};
