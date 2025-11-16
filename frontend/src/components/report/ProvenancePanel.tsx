/**
 * KLSI 4.0 - ProvenancePanel Component
 * Task 96: Tampilkan norm_group.norm_name dan percentile_scores provenance
 * 
 * Implementasi sesuai:
 * - frontend_blueprint.md §4.2: Provenance transparency
 * - psychometrics_spec.md §5: Normative data context
 */

import React from 'react';
import { Database, Users, Calendar, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import type { NormGroup } from '../../types/api';

interface ProvenancePanelProps {
  normGroup: NormGroup;
  percentileSource?: string;
  className?: string;
}

/**
 * ProvenancePanel - Transparansi sumber data normatif
 * 
 * frontend_blueprint.md §4.2:
 * - Menampilkan informasi norm group yang digunakan
 * - Transparansi tentang sample size dan karakteristik
 * - Contextualize percentile scores
 */
export const ProvenancePanel: React.FC<ProvenancePanelProps> = ({
  normGroup,
  percentileSource,
  className = '',
}) => {
  return (
    <Card className={`material-thin border-l-4 border-l-chart-4 ${className}`.trim()}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5 text-chart-4" />
          Data Normatif & Provenance
        </CardTitle>
        <CardDescription>
          Konteks perbandingan untuk skor persentil Anda
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Norm Group Info */}
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Users className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="text-foreground mb-1">
                {normGroup.norm_name}
              </div>
              <p className="text-sm text-muted-foreground">
                {normGroup.description}
              </p>
            </div>
          </div>

          {/* Sample Size */}
          <div className="flex items-center gap-3 pl-8">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">
                Ukuran Sampel
              </p>
            </div>
            <div className="text-foreground">
              {normGroup.sample_size.toLocaleString()} peserta
            </div>
          </div>

          {/* Norm ID (Technical detail) */}
          <div className="flex items-center gap-3 pl-8">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">
                Norm ID
              </p>
            </div>
            <div className="text-xs text-muted-foreground font-mono">
              {normGroup.norm_id}
            </div>
          </div>
        </div>

        {/* Percentile Source */}
        {percentileSource && (
          <div className="pt-4 mt-4">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground mb-1">
                  Sumber Persentil
                </p>
                <p className="text-sm text-muted-foreground">
                  {percentileSource}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Explanation */}
        <div className="pt-3 border-t border-border">
          <div className="flex items-start gap-3">
            <Info className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">
                <strong className="text-foreground">Apa artinya?</strong> Skor persentil Anda dibandingkan 
                dengan kelompok normatif ini. Misalnya, persentil 75 berarti skor Anda lebih tinggi 
                dari 75% peserta dalam kelompok normatif ini.
              </p>
            </div>
          </div>
        </div>

        {/* Contextual Warning */}
        <div className="pt-3 border-t border-border bg-muted/30 -mx-6 -mb-6 px-6 py-3 rounded-b-xl">
          <p className="text-xs text-muted-foreground">
            ⚠️ <strong className="text-foreground">Catatan:</strong> Perbandingan normatif hanya 
            memberikan konteks, bukan penilaian tentang "baik" atau "buruk". Gaya belajar yang 
            berbeda memiliki kekuatan yang berbeda dalam konteks yang berbeda.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};