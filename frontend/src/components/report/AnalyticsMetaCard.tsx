import React from 'react';
import { SectionTitle } from '../../core/design-system/Typography';

interface AnalyticsMetaCardProps {
  heuristic: boolean;
  note?: string;
}

export const AnalyticsMetaCard: React.FC<AnalyticsMetaCardProps> = ({ heuristic, note }) => (
  <div className="material-regular rounded-xl p-6 space-y-3">
    <SectionTitle>Informasi Analitik</SectionTitle>
    <p className="text-sm text-muted-foreground">
      Status heuristik: {heuristic ? 'Ya (Heuristik)' : 'Tidak'}
    </p>
    {note && <p className="text-sm text-foreground">{note}</p>}
  </div>
);
