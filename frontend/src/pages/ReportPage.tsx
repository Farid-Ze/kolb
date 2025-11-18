/**
 * KLSI 4.0 - ReportPage
 * Task 38-39: React Query dengan polling untuk report generation
 * Task 40-50: Complete report display dengan visualisasi
 * 
 * Implementasi sesuai Guidelines.md & frontend_blueprint.md:
 * - Glass-regular untuk navigation/header
 * - Material-regular untuk content cards
 * - React Query dengan polling untuk report generation
 * - Print functionality
 * - Responsible use notice
 */

import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useReport } from '../hooks/useReport';
import { LearningStyleChart } from '../components/report/LearningStyleChart';
import { FlexibilityChart } from '../components/report/FlexibilityChart';
import { ScoreDisplay } from '../components/report/ScoreDisplay';
import { EnhancedAnalyticsPanel } from '../components/report/EnhancedAnalyticsPanel';
import { DeltaChangesCard } from '../components/report/DeltaChangesCard';
import { GuideModal } from '../components/common/GuideModal';
import { GUIDE_IDS } from '../services/guideService';
import {
  FileText,
  Printer,
  Download,
  AlertCircle,
  ChevronLeft,
  Calendar,
  Users,
  Clock,
  HelpCircle,
  GraduationCap,
  Target,
} from 'lucide-react';

import { LayeredIcon } from '../components/ui/LayeredIcon';

export const ReportPage: React.FC = () => {
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();
  const [showGuideModal, setShowGuideModal] = React.useState(false); // Task 8.9: Guide modal state

  // Task 6.9-6.10: Use dedicated useReport hook (SSOT pattern)
  const { data: report, isLoading, error, isRefetching } = useReport(
    sessionId!,
    {
      enablePolling: true,
      stopPollingWhen: (data) => data?.status === 'COMPLETED',
    }
  );

  // Print functionality (Task 49)
  const handlePrint = () => {
    window.print();
  };

  // Download as PDF (future enhancement)
  const handleDownload = () => {
    // Placeholder - would integrate with PDF generation library
    alert('Fitur download PDF akan segera hadir!');
  };

  // Loading state (Task 39 - initial loading)
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/10 to-background flex items-center justify-center p-6">
        <div className="glass-regular rounded-xl p-8 max-w-md text-center space-y-6">
          <div className="flex justify-center">
            <div className="relative">
              <Clock className="h-16 w-16 text-primary animate-pulse" />
              <div className="absolute inset-0 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl text-foreground">Memproses Laporan</h2>
            <p className="text-muted-foreground">
              {isRefetching
                ? 'Menyiapkan hasil asesmen Anda...'
                : 'Memuat laporan...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error state (Task 39 - error handling)
  if (error || !report) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="glass-regular rounded-xl p-8 max-w-md text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
          <h2 className="text-2xl text-foreground">Error</h2>
          <p className="text-muted-foreground">
            {error instanceof Error ? error.message : 'Laporan tidak ditemukan'}
          </p>
          <button
            onClick={() => navigate('/')}
            className="rounded-lg bg-primary text-primary-foreground px-6 py-3 transition-spring hover:opacity-90"
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/10 to-background print:bg-white">
      {/* Header - Glass Material (Guidelines §4.2) */}
      <header className="glass-regular sticky top-0 z-50 border-b border-border print:hidden">
        <div className="mx-auto max-w-6xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="inline-flex items-center gap-2 text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
              >
                <ChevronLeft className="h-4 w-4" />
                Beranda
              </button>
              <div className="hidden sm:block h-6 w-px bg-border" />
              <div className="hidden sm:flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <h1 className="text-lg text-foreground">
                  Laporan Learning Style
                </h1>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownload}
                className="inline-flex items-center gap-2 rounded-lg bg-secondary text-secondary-foreground px-4 py-2 transition-spring hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">PDF</span>
              </button>
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 transition-spring hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Printer className="h-4 w-4" />
                <span className="hidden sm:inline">Cetak</span>
              </button>
              <button
                onClick={() => setShowGuideModal(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-secondary text-secondary-foreground px-4 py-2 transition-spring hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <HelpCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Panduan</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl p-6 space-y-12 print:p-4">
        {/* Report Header - Guidelines §8.4.1: Increased padding & line-height */}
        <div className="text-center space-y-6 py-8 print:py-4">
          <h1 className="text-3xl text-foreground print:text-2xl leading-relaxed">
            Kolb Learning Style Inventory 4.0
          </h1>
          <p className="text-lg text-muted-foreground print:text-base leading-relaxed">
            Laporan Hasil Asesmen
          </p>

          {/* Metadata */}
          <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground flex-wrap">
            <div className="inline-flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>
                {new Date(report.generated_at).toLocaleDateString('id-ID', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
            <div className="inline-flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>Norm: {report.norm_group.norm_name}</span>
            </div>
          </div>
        </div>

        {/* NonDiagnosticNotice (Task 53 - Responsible Use) */}
        <div className="material-thin rounded-xl p-8 border-l-4 border-l-chart-3 print:border print:border-gray-300">
          <div className="flex items-start gap-4">
            <AlertCircle className="h-5 w-5 text-chart-3 flex-shrink-0 mt-1 print:text-gray-600" />
            <div className="space-y-3">
              <h3 className="text-foreground leading-relaxed">Panduan Penggunaan Bertanggung Jawab</h3>
              <p className="text-sm text-muted-foreground print:text-gray-600 leading-relaxed text-left max-w-[70ch]">
                {report.responsible_use_notice ||
                  'KLSI 4.0 adalah alat formatif untuk refleksi belajar dan desain pedagogi, bukan alat diagnostik klinis atau seleksi. Hasil dapat berubah seiring pengalaman dan konteks belajar Anda. Gunakan hasil ini sebagai titik awal diskusi dengan fasilitator, bukan sebagai label permanen.'}
              </p>
            </div>
          </div>
        </div>

        {/* Learning Style Classification (Task 46, 50) - Guidelines §8.4.1 */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Main Style (4-quadrant) */}
          <div className="material-regular rounded-xl p-8 space-y-6 print:border print:border-gray-300">
            <h3 className="text-lg text-foreground leading-relaxed">Gaya Belajar Utama</h3>
            <div className="flex items-center gap-6">
              <LayeredIcon icon={Target} size="lg" color="primary" enableParallax />
              <div className="flex-1">
                <h4 className="text-xl text-foreground mb-2 leading-relaxed">
                  {report.learning_style.style_name}
                </h4>
                <p className="text-sm text-muted-foreground print:text-gray-600">
                  Quadrant {report.learning_style.quadrant}
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground print:text-gray-600 leading-relaxed">
              {report.learning_style.description}
            </p>
          </div>

          {/* Nine-Style Classification */}
          <div className="material-regular rounded-xl p-8 space-y-6 print:border print:border-gray-300">
            <h3 className="text-lg text-foreground leading-relaxed">Gaya Belajar Spesifik</h3>
            <div className="flex items-center gap-6">
              <LayeredIcon icon={GraduationCap} size="lg" color="chart-2" enableParallax />
              <div className="flex-1">
                <h4 className="text-xl text-foreground mb-2 leading-relaxed">
                  {report.nine_style.style_name}
                </h4>
                <p className="text-sm text-muted-foreground print:text-gray-600">
                  9-Style Classification
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground print:text-gray-600 leading-relaxed">
              {report.nine_style.description}
            </p>
          </div>
        </div>

        {/* Learning Style Chart (Task 44-45) */}
        <div className="print:break-inside-avoid">
          <LearningStyleChart
            dialecticScores={report.dialectic_scores}
            learningStyle={report.learning_style}
          />
        </div>

        {/* Flexibility Chart (Task 49) */}
        <div className="print:break-inside-avoid">
          <FlexibilityChart flexibility={report.flexibility} />
        </div>

        {/* Score Display (Task 47-48) */}
        <div className="print:break-inside-avoid">
          <ScoreDisplay
            rawScores={report.raw_scores}
            dialecticScores={report.dialectic_scores}
            percentileScores={report.percentile_scores}
          />
        </div>

        {/* Longitudinal Delta (Task Phase 8) */}
        {report.delta && (
          <div className="print:break-inside-avoid">
            <DeltaChangesCard delta={report.delta} />
          </div>
        )}

        {/* Enhanced Analytics Panel (Task Phase 6 - MEDIATOR only) */}
        {report.enhanced_analytics && (
          <div className="print:break-inside-avoid">
            <EnhancedAnalyticsPanel analytics={report.enhanced_analytics} />
          </div>
        )}

        {/* Norm Group Info (Task 51) */}
        <div className="material-thin rounded-xl p-6 print:border print:border-gray-300">
          <h3 className="text-lg text-foreground mb-3">Informasi Norma</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground print:text-gray-600">Grup Norma</span>
              <span className="text-foreground">{report.norm_group.norm_name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground print:text-gray-600">Ukuran Sampel</span>
              <span className="text-foreground">N = {report.norm_group.sample_size}</span>
            </div>
            <p className="text-muted-foreground pt-2 print:text-gray-600">
              {report.norm_group.description}
            </p>
          </div>
        </div>

        {/* Footer (print only) */}
        <div className="hidden print:block text-center text-xs text-gray-500 pt-8 border-t border-gray-300">
          <p>Kolb Learning Style Inventory 4.0 - Generated on {new Date(report.generated_at).toLocaleString('id-ID')}</p>
          <p className="mt-1">© {new Date().getFullYear()} - For educational purposes only</p>
        </div>
      </main>

      {/* Task 8.9: Guide Modal untuk results interpretation */}
      <GuideModal
        guideId={GUIDE_IDS.RESULTS_INTERPRETATION}
        title="Interpretasi Hasil"
        isOpen={showGuideModal}
        onClose={() => setShowGuideModal(false)}
        context="report_page"
      />
    </div>
  );
};