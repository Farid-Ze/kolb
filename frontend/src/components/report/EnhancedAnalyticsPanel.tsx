/**
 * KLSI 4.0 - EnhancedAnalyticsPanel
 * Task Phase 6: Display MEDIATOR-only enhanced analytics
 * 
 * Implementasi sesuai Guidelines.md:
 * - Material-regular untuk cards
 * - Glass-regular untuk emphasis
 * - Responsive grid layout
 * - Spring-based animations (Section 2.3.1)
 */

import React from 'react';
import { EnhancedAnalyticsPayload } from '../../types/api';
import { GlassPanel } from '../ui/GlassPanel';
import {
  Brain,
  TrendingUp,
  AlertCircle,
  Zap,
  Target,
} from 'lucide-react';
import { motion } from 'motion/react';

interface EnhancedAnalyticsPanelProps {
  analytics: EnhancedAnalyticsPayload | null;
}

/**
 * EnhancedAnalyticsPanel - Display comprehensive diagnostics for MEDIATOR role
 */
const formatContextName = (name: string) =>
  name
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

export const EnhancedAnalyticsPanel: React.FC<EnhancedAnalyticsPanelProps> = ({
  analytics,
}) => {
  if (!analytics) {
    return null;
  }
  const contextualProfile = analytics.contextual_profile;
  const heatmap = analytics.heatmap;
  const integrativeDevelopment = analytics.integrative_development;
  // If validation error exists, show warning
  if (analytics.validation_error) {
    return (
      <div className="material-regular rounded-xl p-6 bg-destructive/10 border border-destructive/20">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-foreground mb-1">
              Analitik Lanjutan Tidak Tersedia
            </h3>
            <p className="text-sm text-muted-foreground">
              {analytics.validation_error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 print:break-inside-avoid">
      {/* Header Banner */}
      <GlassPanel density="compact" emphasis="high" className="p-4 print:border print:border-gray-300 print:shadow-none">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-chart-4/20 print:bg-gray-100">
            <Brain className="h-6 w-6 text-chart-4 print:text-black" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg text-foreground print:text-black">Analitik Lanjutan (Mediator)</h3>
            <p className="text-sm text-muted-foreground print:text-gray-600">
              Diagnostik komprehensif untuk fasilitasi pembelajaran
            </p>
          </div>
        </div>
      </GlassPanel>
      {analytics.meta?.note && (
        <p className="text-xs text-muted-foreground px-1 print:text-gray-500">
          {analytics.meta.note}
        </p>
      )}

      {/* Contextual Profile */}
      {contextualProfile && (
        <div className="material-regular rounded-xl p-6 space-y-4 print:border print:border-gray-300">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="h-5 w-5 text-chart-2 print:text-black" />
            <h4 className="text-lg text-foreground print:text-black">Profil Kontekstual</h4>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-muted-foreground print:text-gray-600">
              Pola fleksibilitas: <span className="font-medium text-foreground print:text-black">{contextualProfile.flexibility_pattern}</span>
            </p>
            {contextualProfile.context_styles.length === 8 && (
              <span className="text-xs px-2 py-1 rounded bg-chart-2/10 text-chart-2 print:bg-gray-100 print:text-black print:border print:border-gray-300">
                8 konteks lengkap
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {contextualProfile.context_styles.map((context) => (
              <div
                key={context.context}
                className="material-thin rounded-lg p-3 border-l-4 border-l-chart-2 print:border-l-black print:border print:border-gray-300"
              >
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-foreground print:text-black truncate" title={formatContextName(context.context)}>
                    {formatContextName(context.context)}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-chart-2/10 text-chart-2 w-fit print:bg-gray-100 print:text-black">
                    {context.style}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-2 print:text-gray-500">
                  ACCE {context.ACCE} · AERO {context.AERO}
                </p>
              </div>
            ))}
          </div>
          <div className="grid md:grid-cols-2 gap-4 pt-2">
            <div>
              <p className="text-sm text-muted-foreground mb-2 print:text-gray-600">Frekuensi gaya:</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(contextualProfile.style_frequency || {}).map(
                  ([style, count]) => (
                  <span
                    key={style}
                    className="text-xs px-3 py-1 rounded-full bg-secondary text-foreground print:bg-gray-100 print:text-black print:border print:border-gray-300"
                  >
                    {style}: {count}
                  </span>
                  )
                )}
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2 print:text-gray-600">Dominasi mode:</p>
              <div className="space-y-1">
                {Object.entries(contextualProfile.mode_usage || {}).map(
                  ([mode, data]) => (
                  <div key={mode} className="flex justify-between text-sm">
                    <span className="text-muted-foreground print:text-gray-600">{mode}</span>
                    <span className="text-foreground font-medium print:text-black">
                      {data.count ?? 0} konteks
                    </span>
                  </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Heatmap Summary */}
      {heatmap && (
        <div className="material-regular rounded-xl p-6 space-y-4 print:border print:border-gray-300">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-chart-3 print:text-black" />
            <h4 className="text-lg text-foreground print:text-black">Heatmap Fleksibilitas</h4>
          </div>
          <p className="text-sm text-muted-foreground mb-4 print:text-gray-600">
            LFI band: <span className="font-medium text-foreground print:text-black">{heatmap.lfi_percentile_band}</span>
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-2 print:text-gray-600">
                Cakupan kuadran learning space
              </p>
              <div className="space-y-2">
                {Object.entries(heatmap.region_coverage || {}).map(
                  ([region, value]) => (
                    <div key={region}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground print:text-gray-600">
                          {region.replace(/_/g, ' ')}
                        </span>
                        <span className="text-foreground font-medium print:text-black">
                          {value}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-secondary rounded-full overflow-hidden print:bg-gray-200">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(value, 8) * 12.5}%` }}
                          transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                          className="h-full bg-chart-3 print:bg-black"
                        />
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2 print:text-gray-600">
                Distribusi gaya (8 konteks)
              </p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(heatmap.style_matrix || {}).map(
                  ([style, value]) => (
                    <span
                      key={style}
                      className="text-xs px-3 py-1 rounded-full bg-chart-1/10 text-chart-1 print:bg-gray-100 print:text-black print:border print:border-gray-300"
                    >
                      {style}: {value}
                    </span>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Integrative Development */}
      {integrativeDevelopment && (
        <div className="material-regular rounded-xl p-6 space-y-4 print:border print:border-gray-300">
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-5 w-5 text-chart-4 print:text-black" />
            <h4 className="text-lg text-foreground print:text-black">Integrative Development</h4>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="material-thin rounded-lg p-4 print:border print:border-gray-300">
              <p className="text-xs text-muted-foreground print:text-gray-600">Skor Diprediksi</p>
              <div className="flex items-end gap-2">
                <p className="text-2xl font-semibold text-foreground print:text-black">
                  {(integrativeDevelopment.predicted_score ?? 0).toFixed(2)}
                </p>
                <span className="text-xs text-muted-foreground mb-1 print:text-gray-500">/ 1.00</span>
              </div>
              <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden mt-2 print:bg-gray-200">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((integrativeDevelopment.predicted_score ?? 0) * 100, 100)}%` }}
                  transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                  className="h-full bg-chart-4 print:bg-black"
                />
              </div>
            </div>
            <div className="material-thin rounded-lg p-4 print:border print:border-gray-300">
              <p className="text-xs text-muted-foreground print:text-gray-600">Model Insight</p>
              <p className="text-sm text-foreground print:text-black mt-1">
                {integrativeDevelopment.model_info}
              </p>
            </div>
            <div className="material-thin rounded-lg p-4 print:border print:border-gray-300">
              <p className="text-xs text-muted-foreground print:text-gray-600">Catatan</p>
              <p className="text-sm text-foreground print:text-black mt-1">
                {integrativeDevelopment.note}
              </p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground print:text-gray-600">
            {integrativeDevelopment.interpretation}
          </p>
        </div>
      )}

      {/* Flexibility Narrative */}
      {analytics.flexibility_narrative && (
        <div className="material-regular rounded-xl p-6 space-y-4 print:border print:border-gray-300">
          <h4 className="text-lg text-foreground mb-2 print:text-black">Narasi Fleksibilitas</h4>
          <p className="text-sm text-muted-foreground leading-relaxed print:text-gray-700">
            {analytics.flexibility_narrative}
          </p>
        </div>
      )}
    </div>
  );
};