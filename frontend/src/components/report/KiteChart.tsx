import React from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { GlassMaterial } from '../../core/design-system/Materials';
import { SectionTitle, BodyText } from '../../core/design-system/Typography';

interface KiteChartProps {
  kiteData: Record<string, number> | null | undefined;
  className?: string;
}

export const KiteChart: React.FC<KiteChartProps> = ({ kiteData, className = '' }) => {
  if (!kiteData) {
    return null;
  }

  // Transform data for Recharts
  // Order: CE (Top), RO (Right), AC (Bottom), AE (Left)
  // Recharts RadarChart starts from top and goes clockwise by default?
  // Let's verify order. Usually it follows the order of data in the array.
  const data = [
    { subject: 'CE (Feeling)', A: kiteData.CE || 0, fullMark: 100 },
    { subject: 'RO (Watching)', A: kiteData.RO || 0, fullMark: 100 },
    { subject: 'AC (Thinking)', A: kiteData.AC || 0, fullMark: 100 },
    { subject: 'AE (Doing)', A: kiteData.AE || 0, fullMark: 100 },
  ];

  return (
    <GlassMaterial className={`p-6 flex flex-col items-center ${className}`}>
      <div className="w-full text-left mb-4">
        <SectionTitle>Profil Bentuk Layang-layang (Kite)</SectionTitle>
        <BodyText tone="muted" className="text-sm">
          Visualisasi preferensi relatif Anda pada empat mode belajar.
        </BodyText>
      </div>

      <div className="w-full h-[300px] print:h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
            <PolarGrid stroke="hsl(var(--border))" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={false}
              axisLine={false}
            />
            <Radar
              name="Learning Style"
              dataKey="A"
              stroke="hsl(var(--primary))"
              fill="hsl(var(--primary))"
              fillOpacity={0.3}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                borderColor: 'hsl(var(--border))',
                color: 'hsl(var(--foreground))',
                borderRadius: 'var(--radius)',
              }}
              itemStyle={{ color: 'hsl(var(--primary))' }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 grid grid-cols-2 gap-4 w-full text-sm text-muted-foreground print:text-black">
        <div className="flex justify-between border-b border-border/50 pb-1">
          <span>CE (Concrete Experience)</span>
          <span className="font-medium text-foreground">{kiteData.CE?.toFixed(1)}</span>
        </div>
        <div className="flex justify-between border-b border-border/50 pb-1">
          <span>RO (Reflective Observation)</span>
          <span className="font-medium text-foreground">{kiteData.RO?.toFixed(1)}</span>
        </div>
        <div className="flex justify-between border-b border-border/50 pb-1">
          <span>AC (Abstract Conceptualization)</span>
          <span className="font-medium text-foreground">{kiteData.AC?.toFixed(1)}</span>
        </div>
        <div className="flex justify-between border-b border-border/50 pb-1">
          <span>AE (Active Experimentation)</span>
          <span className="font-medium text-foreground">{kiteData.AE?.toFixed(1)}</span>
        </div>
      </div>
    </GlassMaterial>
  );
};
