import React from 'react';
import { SectionTitle } from '../../core/design-system/Typography';
import { GlassMaterial } from '../../core/design-system/Materials';
import type { ReportStyleBlock } from '../../types/api';

interface StyleSummaryCardProps {
  style: ReportStyleBlock | null;
}

export const StyleSummaryCard: React.FC<StyleSummaryCardProps> = ({ style }) => {
  if (!style) {
    return null;
  }

  return (
    <GlassMaterial className="p-6 space-y-4" intensity="high">
      <div className="flex items-center justify-between">
        <SectionTitle>Ringkasan gaya</SectionTitle>
        {style.intensity !== null && style.intensity !== undefined && (
          <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
            Intensitas {style.intensity}
          </span>
        )}
      </div>
      <div>
        <p className="text-2xl font-semibold text-foreground">{style.primary_name ?? 'Tidak tersedia'}</p>
        <p className="text-muted-foreground">{style.primary_brief ?? 'Ringkasan sedang disiapkan.'}</p>
      </div>
      {style.primary_detail && (
        <p className="text-sm text-muted-foreground whitespace-pre-line">{style.primary_detail}</p>
      )}
      {style.backup_name && (
        <div className="rounded-lg bg-secondary/30 p-3">
          <p className="text-xs uppercase text-muted-foreground">Gaya cadangan</p>
          <p className="text-sm text-foreground">{style.backup_name}</p>
          {style.backup_brief && <p className="text-xs text-muted-foreground">{style.backup_brief}</p>}
        </div>
      )}
    </GlassMaterial>
  );
};
