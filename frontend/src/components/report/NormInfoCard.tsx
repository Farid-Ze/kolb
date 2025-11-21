import React from 'react';
import { SectionTitle } from '../../core/design-system/Typography';
import type { ReportPercentiles } from '../../types/api';

interface NormInfoCardProps {
  percentiles: ReportPercentiles | null;
}

export const NormInfoCard: React.FC<NormInfoCardProps> = ({ percentiles }) => {
  const normGroup = percentiles?.norm_group_used ?? 'Tidak tersedia';
  const normVersion = percentiles?.norm_version_used ?? 'default';
  const usedFallback = percentiles?.used_fallback_any ? 'Ya, menggunakan fallback' : 'Tidak';
  const rawOutside = percentiles?.raw_outside_norm_range ? 'Ya' : 'Tidak';
  const truncatedList = Object.keys(percentiles?.truncated_scales ?? {});

  return (
    <div className="material-regular rounded-xl p-6 space-y-3">
      <SectionTitle>Informasi Norma</SectionTitle>
      <dl className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">Kelompok Norm</dt>
          <dd className="text-foreground font-medium">{normGroup}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">Versi Norma</dt>
          <dd className="text-foreground font-medium">{normVersion}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">Gunakan fallback</dt>
          <dd className="text-foreground font-medium">{usedFallback}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">Raw di luar rentang</dt>
          <dd className="text-foreground font-medium">{rawOutside}</dd>
        </div>
      </dl>
      {truncatedList.length ? (
        <div className="text-xs text-muted-foreground">
          <p>Skala terpotong:</p>
          <ul className="list-disc list-inside">
            {truncatedList.map((scale) => (
              <li key={scale}>{scale}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
};
