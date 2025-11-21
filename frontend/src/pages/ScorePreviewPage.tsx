import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calculator, RefreshCw, ArrowLeft } from 'lucide-react';
import { PageShell, RoomContent } from '../core/design-system/Layout';
import { GlassMaterial } from '../core/design-system/Materials';
import { DisplayTitle, BodyText, SectionTitle } from '../core/design-system/Typography';
import { fadeInUp, staggerContainer } from '../core/physics/motionPrimitives';
import { useNonBlockingNavigate } from '../hooks/useNonBlockingNavigate';
import { getScorePreview } from '../services/scoreService';
import type { ScorePreviewRequest, ScorePreviewResponse } from '../types/api';
import { ScoreDisplay } from '../components/report/ScoreDisplay';
import { LearningStyleChart } from '../components/report/LearningStyleChart';
import { KiteChart } from '../components/report/KiteChart';
import { FlexibilityChart } from '../components/report/FlexibilityChart';
import { EnhancedAnalyticsPanel } from '../components/report/EnhancedAnalyticsPanel';

export const ScorePreviewPage: React.FC = () => {
  const navigate = useNonBlockingNavigate();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScorePreviewResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [rawScores, setRawScores] = useState({
    CE_raw: 0,
    RO_raw: 0,
    AC_raw: 0,
    AE_raw: 0,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRawScores((prev) => ({
      ...prev,
      [name]: parseInt(value) || 0,
    }));
  };

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload: ScorePreviewRequest = {
        raw: rawScores,
        // Contexts can be added later if needed
        contexts: [],
      };
      const data = await getScorePreview(payload);
      setResult(data);
    } catch (err) {
      console.error('Failed to calculate score preview', err);
      setError('Gagal menghitung skor. Pastikan input valid.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell>
      <RoomContent>
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="space-y-8 w-full"
        >
          <header className="space-y-4">
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 rounded-full border border-border/60 px-4 py-2 text-sm font-semibold text-foreground hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </button>
            <div>
              <DisplayTitle variants={fadeInUp}>Score Preview Tool</DisplayTitle>
              <BodyText tone="muted" className="mt-2" variants={fadeInUp}>
                Simulasi perhitungan skor KLSI 4.0 tanpa menyimpan data ke database.
              </BodyText>
            </div>
          </header>

          <div className="grid gap-8 lg:grid-cols-[1fr_2fr]">
            {/* Input Form */}
            <GlassMaterial className="p-6 h-fit space-y-6">
              <SectionTitle>Input Raw Scores</SectionTitle>
              <form onSubmit={handleCalculate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="CE_raw" className="text-sm font-medium text-muted-foreground">
                      CE (Concrete Experience)
                    </label>
                    <input
                      id="CE_raw"
                      type="number"
                      name="CE_raw"
                      value={rawScores.CE_raw}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-border bg-input-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      min="12"
                      max="48"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="RO_raw" className="text-sm font-medium text-muted-foreground">
                      RO (Reflective Observation)
                    </label>
                    <input
                      id="RO_raw"
                      type="number"
                      name="RO_raw"
                      value={rawScores.RO_raw}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-border bg-input-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      min="12"
                      max="48"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="AC_raw" className="text-sm font-medium text-muted-foreground">
                      AC (Abstract Conceptualization)
                    </label>
                    <input
                      id="AC_raw"
                      type="number"
                      name="AC_raw"
                      value={rawScores.AC_raw}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-border bg-input-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      min="12"
                      max="48"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="AE_raw" className="text-sm font-medium text-muted-foreground">
                      AE (Active Experimentation)
                    </label>
                    <input
                      id="AE_raw"
                      type="number"
                      name="AE_raw"
                      value={rawScores.AE_raw}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-border bg-input-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      min="12"
                      max="48"
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-all"
                >
                  {loading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Calculator className="h-4 w-4" />
                  )}
                  Hitung Profil
                </button>
              </form>
            </GlassMaterial>

            {/* Results Display */}
            <div className="space-y-8">
              {!result ? (
                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground border-2 border-dashed border-border rounded-2xl">
                  <Calculator className="h-12 w-12 mb-4 opacity-20" />
                  <p>Masukkan skor raw untuk melihat preview hasil</p>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-8"
                >
                  <ScoreDisplay raw={result.raw} percentiles={result.percentiles} />
                  
                  <LearningStyleChart
                    visualization={result.visualization}
                    style={result.style}
                  />

                  <KiteChart kiteData={result.visualization?.kite} />

                  {result.lfi && (
                    <FlexibilityChart lfi={result.lfi} />
                  )}
                  
                  {result.enhancedAnalytics && (
                    <EnhancedAnalyticsPanel analytics={result.enhancedAnalytics} />
                  )}
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      </RoomContent>
    </PageShell>
  );
};
