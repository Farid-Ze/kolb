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
import { EnhancedAnalytics } from '../../types/api';
import { GlassPanel } from '../ui/GlassPanel';
import {
  Brain,
  TrendingUp,
  Users,
  AlertCircle,
  CheckCircle2,
  Zap,
} from 'lucide-react';
import { motion } from 'motion/react';

interface EnhancedAnalyticsPanelProps {
  analytics: EnhancedAnalytics;
}

/**
 * EnhancedAnalyticsPanel - Display comprehensive diagnostics for MEDIATOR role
 */
export const EnhancedAnalyticsPanel: React.FC<EnhancedAnalyticsPanelProps> = ({
  analytics,
}) => {
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

      {/* Contextual Profile (8 LFI Contexts) */}
      {analytics.contextual_profile && analytics.contextual_profile.length > 0 && (
        <div className="material-regular rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="h-5 w-5 text-chart-2" />
            <h4 className="text-lg text-foreground">Profil Kontekstual</h4>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Gaya belajar di 8 konteks berbeda (berdasarkan LFI):
          </p>
          <div className="grid md:grid-cols-2 gap-3">
            {analytics.contextual_profile.map((context, idx) => (
              <div
                key={idx}
                className="material-thin rounded-lg p-3 border-l-4 border-l-chart-2"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-foreground">
                    {context.context_name}
                  </span>
                  <span className="text-xs px-2 py-1 rounded bg-chart-2/10 text-chart-2">
                    {context.style_code}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {context.style_name}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Heatmap (Flexibility per Context) */}
      {analytics.heatmap && analytics.heatmap.length > 0 && (
        <div className="material-regular rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-chart-3" />
            <h4 className="text-lg text-foreground">Heatmap Fleksibilitas</h4>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Tingkat fleksibilitas (Kendall's W) per konteks:
          </p>
          <div className="space-y-2">
            {analytics.heatmap.map((context, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <span className="text-sm text-foreground flex-1 truncate">
                  {context.context_name}
                </span>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="w-32 h-2 bg-secondary rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(1 - context.kendall_w) * 100}%` }}
                      transition={{
                        type: 'spring',
                        stiffness: 200,
                        damping: 25,
                      }}
                      className={`h-full ${
                        context.flexibility_level === 'High'
                          ? 'bg-chart-3'
                          : context.flexibility_level === 'Moderate'
                          ? 'bg-chart-2'
                          : 'bg-chart-1'
                      }`}
                    />
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      context.flexibility_level === 'High'
                        ? 'bg-chart-3/10 text-chart-3'
                        : context.flexibility_level === 'Moderate'
                        ? 'bg-chart-2/10 text-chart-2'
                        : 'bg-chart-1/10 text-chart-1'
                    }`}
                  >
                    {context.flexibility_level}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Integrative Development */}
      {analytics.integrative_development && (
        <div className="material-regular rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="h-5 w-5 text-chart-4" />
            <h4 className="text-lg text-foreground">Fase Pengembangan</h4>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Fase:</span>
              <span className="px-3 py-1 rounded-lg bg-chart-4/10 text-chart-4">
                {analytics.integrative_development.phase}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {analytics.integrative_development.interpretation}
            </p>
            {analytics.integrative_development.recommendation && (
              <div className="material-thin rounded-lg p-3 mt-3">
                <p className="text-sm text-foreground">
                  <strong>Rekomendasi:</strong>{' '}
                  {analytics.integrative_development.recommendation}
                </p>
              </div>
            )}
          </div>
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

      {/* Educator Role Suggestions */}
      {analytics.educator_role_suggestions &&
        analytics.educator_role_suggestions.length > 0 && (
          <div className="material-regular rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-primary" />
              <h4 className="text-lg text-foreground">Saran Peran Fasilitator</h4>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Pendekatan fasilitasi yang disarankan berdasarkan profil:
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              {analytics.educator_role_suggestions.map((suggestion, idx) => (
                <div
                  key={idx}
                  className="material-thin rounded-lg p-4 space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    <h5 className="text-foreground">{suggestion.role}</h5>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {suggestion.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
    </div>
  );
};