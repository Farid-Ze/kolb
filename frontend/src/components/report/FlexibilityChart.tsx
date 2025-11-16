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
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
} from 'recharts';
import type { FlexibilityIndex } from '../../services/reportService';
import { Activity, Layers } from 'lucide-react';

interface FlexibilityChartProps {
  flexibility: FlexibilityIndex;
}

export const FlexibilityChart: React.FC<FlexibilityChartProps> = ({
  flexibility,
}) => {
  // Data for bar chart (overall LFI)
  const lfiData = [
    {
      name: 'Learning Flexibility',
      score: flexibility.lfi_score,
      max: 100,
    },
  ];

  // Data for radar chart (9-region style distribution)
  // Mock data - in real implementation this would come from API
  const radarData = [
    { style: 'Initiating', score: flexibility.lfi_score * 0.8 },
    { style: 'Experiencing', score: flexibility.lfi_score * 0.9 },
    { style: 'Imagining', score: flexibility.lfi_score * 0.7 },
    { style: 'Reflecting', score: flexibility.lfi_score * 0.85 },
    { style: 'Analyzing', score: flexibility.lfi_score * 0.75 },
    { style: 'Thinking', score: flexibility.lfi_score * 0.8 },
    { style: 'Deciding', score: flexibility.lfi_score * 0.9 },
    { style: 'Acting', score: flexibility.lfi_score * 0.95 },
    { style: 'Balancing', score: flexibility.lfi_score },
  ];

  // Color based on category
  const getColor = () => {
    switch (flexibility.category) {
      case 'High':
        return 'hsl(var(--chart-4))'; // Green
      case 'Moderate':
        return 'hsl(var(--chart-2))'; // Blue
      case 'Low':
        return 'hsl(var(--chart-3))'; // Orange
      default:
        return 'hsl(var(--primary))';
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="space-y-2">
        <h3 className="text-foreground">Learning Flexibility Index</h3>
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
              <Activity
                className="h-6 w-6"
                style={{ color: getColor() }}
              />
            </div>
            <div>
              <div className="text-2xl text-foreground">
                {flexibility.lfi_score.toFixed(1)}
              </div>
              <div className="text-muted-foreground">
                {flexibility.category} Flexibility
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
            <span>{flexibility.category}</span>
          </div>
        </div>

        {/* Bar Chart */}
        <ResponsiveContainer width="100%" height={120}>
          <BarChart
            data={lfiData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis type="number" domain={[0, 100]} stroke="hsl(var(--muted-foreground))" />
            <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="material-regular rounded-lg p-3 border border-border shadow-lg">
                      <p className="text-foreground">
                        LFI Score: {payload[0].value}
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
            {flexibility.interpretation}
          </p>
        </div>
      </div>

      {/* 9-Region Radar Chart */}
      <div className="material-regular rounded-xl p-6 print:break-inside-avoid">
        <div className="flex items-center gap-2 mb-4">
          <Layers className="h-5 w-5 text-muted-foreground" />
          <h4 className="text-foreground">9-Style Flexibility Profile</h4>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Distribusi kemampuan Anda di 9 gaya belajar berbasis Kolb
        </p>
        
        <ResponsiveContainer width="100%" height={400}>
          <RadarChart data={radarData}>
            <PolarGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <PolarAngleAxis 
              dataKey="style" 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            />
            <PolarRadiusAxis 
              angle={90} 
              domain={[0, 100]}
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <Radar
              name="Flexibility Score"
              dataKey="score"
              stroke={getColor()}
              fill={getColor()}
              fillOpacity={0.3}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="material-regular rounded-lg p-3 border border-border shadow-lg">
                      <p className="text-foreground mb-1">{data.style}</p>
                      <p className="text-muted-foreground">
                        Score: {data.score.toFixed(1)}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend 
              wrapperStyle={{ 
                paddingTop: '20px',
                fontSize: '14px',
                color: 'hsl(var(--foreground))'
              }}
            />
          </RadarChart>
        </ResponsiveContainer>

        <div className="mt-4 p-4 rounded-lg bg-secondary/10">
          <p className="text-xs text-muted-foreground">
            Radar chart menunjukkan seberapa fleksibel Anda beradaptasi di 9 gaya belajar. 
            Semakin besar area yang terisi, semakin tinggi fleksibilitas belajar Anda.
          </p>
        </div>
      </div>
    </div>
  );
};
