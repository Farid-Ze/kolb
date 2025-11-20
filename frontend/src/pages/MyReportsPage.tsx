/**
 * KLSI 4.0 - MyReportsPage
 * Task 36: Implementasi useQuery untuk fetch completed sessions
 * 
 * Implementasi sesuai Guidelines.md:
 * - GlassPanel untuk navigation
 * - Material-regular untuk content cards
 * - Grid layout responsive
 * - React Query untuk data fetching
 */

import React from 'react';
import { useNonBlockingNavigate } from '../hooks/useNonBlockingNavigate';
import { useQuery } from '@tanstack/react-query';
import { getSelfReports } from '../services/reportService';
import { LoadingComponent } from '../components/common/LoadingComponent';
import {
  FileText,
  Calendar,
  ChevronRight,
  AlertCircle,
  TrendingUp,
  Activity,
} from 'lucide-react';
import { DescriptionText } from '../components/ui/DynamicType';
import { GlassPanel } from '../components/ui/GlassPanel';

export const MyReportsPage: React.FC = () => {
  const navigate = useNonBlockingNavigate();

  // Task 36: React Query untuk fetch reports
  const {
    data: reports = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['reports', 'self'],
    queryFn: getSelfReports,
    staleTime: 30000, // 30 seconds
    select: (data) => {
      const getTime = (value?: string | null) =>
        value ? new Date(value).getTime() : 0;
      // Sort by completion date (newest first)
      return [...data].sort((a, b) => getTime(b.generatedAt) - getTime(a.generatedAt));
    },
  });

  if (isLoading) {
    return <LoadingComponent message="Memuat laporan..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/10 to-background">
      {/* Header */}
      <GlassPanel
        as="header"
        material="functional"
        density="compact"
        className="sticky top-0 z-50 border-b border-border"
      >
        <div className="mx-auto max-w-6xl w-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
              >
                ← Beranda
              </button>
              <div className="h-6 w-px bg-border hidden sm:block" />
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <h1 className="text-foreground">Laporan Saya</h1>
              </div>
            </div>
          </div>
        </div>
      </GlassPanel>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl p-6 space-y-6">
        {/* Page Title */}
        <div className="space-y-2">
          <h1 className="text-3xl text-foreground">Riwayat Asesmen</h1>
          <p className="text-muted-foreground">
            Lihat semua hasil asesmen Learning Style Anda
          </p>
        </div>

        {/* Error State */}
        {error && (
          <div className="material-regular rounded-xl p-6 bg-destructive/10 border border-destructive/20">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-foreground mb-1">Error</h3>
                <p className="text-sm text-muted-foreground">
                  {error instanceof Error ? error.message : 'Gagal memuat laporan'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!error && reports.length === 0 && (
          <div className="material-regular rounded-xl p-12 text-center">
            <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl text-foreground mb-2">
              Belum Ada Laporan
            </h3>
            <p className="text-muted-foreground mb-6">
              Anda belum menyelesaikan asesmen apapun
            </p>
            <button
              onClick={() => navigate('/assessment/start')}
              className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-6 py-3 transition-spring hover:scale-105 active:scale-95"
            >
              Mulai Asesmen
            </button>
          </div>
        )}

        {/* Reports Grid */}
        {reports.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((report) => {
              const sessionId = report.sessionId;
              const generatedAt = report.generatedAt ? new Date(report.generatedAt) : null;
              const formattedDate = generatedAt
                ? generatedAt.toLocaleDateString('id-ID', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })
                : 'Tanggal tidak tersedia';
              const learningStyle = report.learningStyle;
              const styleCode = learningStyle?.styleCode ?? '—';
              const styleName = learningStyle?.styleName ?? 'Gaya belum tersedia';
              const styleDescription = learningStyle?.description ?? 'Deskripsi gaya akan muncul setelah laporan selesai.';
              const lfiScore = report.flexibility?.lfiScore;
              const lfiDisplay = typeof lfiScore === 'number' ? lfiScore.toFixed(0) : '—';
              const nineStyleCode = report.nineStyle?.styleCode ?? styleCode;

              return (
                <button
                  key={sessionId}
                  onClick={() => navigate(`/assessment/${sessionId}/report`)}
                  className="material-regular rounded-xl p-6 space-y-4 text-left transition-spring hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{formattedDate}</span>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>

                  {/* Learning Style */}
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-1 mb-2">
                      <div className="text-sm text-primary">{styleCode}</div>
                    </div>
                    <h3 className="text-lg text-foreground mb-1">{styleName}</h3>
                    <DescriptionText className="text-muted-foreground">
                      {styleDescription}
                    </DescriptionText>
                  </div>

                  {/* Metrics - Guidelines §1.5: Proximity > separator lines */}
                  <div className="grid grid-cols-2 gap-3 pt-4 mt-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Activity className="h-3 w-3" />
                        <span>LFI</span>
                      </div>
                      <div className="text-foreground">{lfiDisplay}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <TrendingUp className="h-3 w-3" />
                        <span>Style</span>
                      </div>
                      <div className="text-foreground">{nineStyleCode ?? '—'}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};