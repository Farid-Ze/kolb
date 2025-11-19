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
    <div className="space-y-6">
      {/* Header Banner */}
      <GlassPanel density="compact" emphasis="high" className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-chart-4/20">
            <Brain className="h-6 w-6 text-chart-4" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg text-foreground">Analitik Lanjutan (Mediator)</h3>
            <p className="text-sm text-muted-foreground">
              Diagnostik komprehensif untuk fasilitasi pembelajaran
            </p>
          </div>
        </div>
      </GlassPanel>
      {analytics.meta?.note && (
        <p className="text-xs text-muted-foreground px-1">
          {analytics.meta.note}
        </p>
      )}

      {/* Contextual Profile */}
      {contextualProfile && (
        <div className="material-regular rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="h-5 w-5 text-chart-2" />
            <h4 className="text-lg text-foreground">Profil Kontekstual</h4>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-muted-foreground">
              Pola fleksibilitas: {contextualProfile.flexibility_pattern}
            </p>
            {contextualProfile.context_styles.length === 8 && (
              <span className="text-xs px-2 py-1 rounded bg-chart-2/10 text-chart-2">
                8 konteks lengkap
              </span>
            )}
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {contextualProfile.context_styles.map((context) => (
              <div
                key={context.context}
                className="material-thin rounded-lg p-3 border-l-4 border-l-chart-2"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-foreground">
                    {formatContextName(context.context)}
                  </span>
                  <span className="text-xs px-2 py-1 rounded bg-chart-2/10 text-chart-2">
                    {context.style}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  ACCE {context.ACCE} · AERO {context.AERO}
                </p>
              </div>
            ))}
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Frekuensi gaya:</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(contextualProfile.style_frequency || {}).map(
                  ([style, count]) => (
                  <span
                    key={style}
                    className="text-xs px-3 py-1 rounded-full bg-secondary text-foreground"
                  >
                    {style}: {count}
                  </span>
                  )
                )}
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Dominasi mode:</p>
              <div className="space-y-1">
                {Object.entries(contextualProfile.mode_usage || {}).map(
                  ([mode, data]) => (
                  <div key={mode} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{mode}</span>
                    <span className="text-foreground font-medium">
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
        <div className="material-regular rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-chart-3" />
            <h4 className="text-lg text-foreground">Heatmap Fleksibilitas</h4>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            LFI band: {heatmap.lfi_percentile_band}
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Cakupan kuadran learning space
              </p>
              <div className="space-y-2">
                {Object.entries(heatmap.region_coverage || {}).map(
                  ([region, value]) => (
                    <div key={region}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">
                          {region.replace(/_/g, ' ')}
                        </span>
                        <span className="text-foreground font-medium">
                          {value}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(value, 8) * 12.5}%` }}
                          transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                          className="h-full bg-chart-3"
                        />
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Distribusi gaya (8 konteks)
              </p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(heatmap.style_matrix || {}).map(
                  ([style, value]) => (
                    <span
                      key={style}
                      className="text-xs px-3 py-1 rounded-full bg-chart-1/10 text-chart-1"
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
        <div className="material-regular rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-5 w-5 text-chart-4" />
            <h4 className="text-lg text-foreground">Integrative Development</h4>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="material-thin rounded-lg p-4">
              <p className="text-xs text-muted-foreground">Skor Diprediksi</p>
              <p className="text-2xl font-semibold text-foreground">
                {(integrativeDevelopment.predicted_score ?? 0).toFixed(2)}
              </p>
            </div>
            <div className="material-thin rounded-lg p-4">
              <p className="text-xs text-muted-foreground">Model Insight</p>
              <p className="text-sm text-foreground">
                {integrativeDevelopment.model_info}
              </p>
            </div>
            <div className="material-thin rounded-lg p-4">
              <p className="text-xs text-muted-foreground">Catatan</p>
              <p className="text-sm text-foreground">
                {integrativeDevelopment.note}
              </p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {integrativeDevelopment.interpretation}
          </p>
        </div>
      )}

      {/* Flexibility Narrative */}
      {analytics.flexibility_narrative && (
        <div className="material-regular rounded-xl p-6 space-y-4">
          <h4 className="text-lg text-foreground mb-2">Narasi Fleksibilitas</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {analytics.flexibility_narrative}
          </p>
        </div>
      )}
    </div>
  );
};