import React from 'react';
import { SectionTitle } from '../../core/design-system/Typography';
import type { SessionDesignRecommendation } from '../../types/api';

interface SessionDesignListProps {
  items: SessionDesignRecommendation[];
}

export const SessionDesignList: React.FC<SessionDesignListProps> = ({ items }) => (
  <div className="material-regular rounded-xl p-6 space-y-4">
    <SectionTitle>Rekomendasi Sesi</SectionTitle>
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.code} className="rounded-lg border border-border/60 p-4">
          <div className="flex items-center justify-between">
            <p className="text-foreground font-semibold">{item.title}</p>
            <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
              {item.duration_min} menit
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{item.summary}</p>
        </div>
      ))}
    </div>
  </div>
);
