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
import { GuideModal } from '../components/common/GuideModal';
import { GUIDE_IDS } from '../services/guideService';
import { useAuth } from '../contexts/AuthContext';
import {
  FileText,
  Printer,
  Download,
  AlertCircle,
  ChevronLeft,
  Calendar,
  Clock,
  HelpCircle,
  Target,
  ListChecks,
  Sparkles,
} from 'lucide-react';

import { getReportById } from '../services/reportService';
import {
  NonDiagnosticNotice,
  ResponsibleUseFooter,
} from '../components/report/NonDiagnosticNotice';

export const ReportPage: React.FC = () => {
  const navigate = useNavigate();
  const params = useParams<{ sessionId?: string; reportId?: string }>();
  const sessionIdentifier = params.sessionId ?? params.reportId;
  const [showGuideModal, setShowGuideModal] = React.useState(false); // Task 8.9: Guide modal state
  const { user } = useAuth();

  // Task 6.9-6.10: Use dedicated useReport hook (SSOT pattern)
  const { data: report, isLoading, error, isRefetching } = useReport(
    sessionIdentifier,
    {
      enablePolling: true,
      stopPollingWhen: (data) => Boolean(data?.raw || data?.style || data?.percentiles),
      fetcher: params.reportId ? getReportById : undefined,
      pollingInterval: 1000,
      retry: false,
    }
  );

  const friendlyErrorMessage = React.useMemo(() => {
    if (!error) {
      return null;
    }
    const baseMessage =
      error instanceof Error
        ? error.message
        : typeof error === 'string'
        ? error
        : 'Terjadi kesalahan';
    return baseMessage.toLowerCase().includes('not found')
      ? 'Laporan tidak ditemukan'
      : baseMessage;
  }, [error]);

  // Print functionality (Task 49)
  const handlePrint = () => {
    window.print();
  };

  // Download as PDF (future enhancement)
  const handleDownload = () => {
    // Placeholder - would integrate with PDF generation library
    alert('Fitur download PDF akan segera hadir!');
  };

  if (!sessionIdentifier) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="glass-regular rounded-xl p-8 max-w-md text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
          <h2 className="text-2xl text-foreground">Error</h2>
          <p className="text-muted-foreground">ID sesi laporan tidak ditemukan.</p>
          <button
            onClick={() => navigate('/reports')}
            className="rounded-lg bg-primary text-primary-foreground px-6 py-3 transition-spring hover:opacity-90"
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  // Loading state (Task 39 - initial loading)
  if (isLoading && !error) {
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
    const message = friendlyErrorMessage ?? 'Laporan tidak ditemukan';
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="glass-regular rounded-xl p-8 max-w-md text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
          <h2 className="text-2xl text-foreground">Error</h2>
          <p className="text-muted-foreground">{message}</p>
          <button
            onClick={() => navigate('/reports')}
            className="rounded-lg bg-primary text-primary-foreground px-6 py-3 transition-spring hover:opacity-90"
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  const normGroupLabel = report.percentiles?.norm_group_used ?? 'Tidak tersedia';
  const sourceProvenance = report.percentiles?.source_provenance ?? 'Tidak tercatat';
  const fallbackLabel = report.percentiles?.used_fallback_any ? 'Ya, menggunakan fallback' : 'Tidak, data utama';
  const styleBlock = report.style;
  const backupSummary = styleBlock?.backup_detail ?? styleBlock?.backup_brief;
  const learningSpace = report.learning_space;
  const sessionDesigns = report.session_designs ?? [];
  const notes = report.notes;
  const responsibleUseNotice = report.responsible_use_notice ?? undefined;
  const suggestionsBlock = learningSpace?.suggestions ?? null;
  const metaLearningBlock = learningSpace?.meta_learning ?? null;
  const developmentBlock = learningSpace?.development ?? null;
  const suggestions = suggestionsBlock?.items ?? [];
  const metaLearning = metaLearningBlock?.items ?? [];
  const isMediator = user?.role === 'MEDIATOR';
  const showEnhancedAnalytics = isMediator && Boolean(report.enhanced_analytics);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/10 to-background print:bg-white">
      {/* Header - Glass Material (Guidelines §4.2) */}
      <header className="glass-regular sticky top-0 z-50 border-b border-border print:hidden">
        <div className="mx-auto max-w-6xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/reports')}
                className="inline-flex items-center gap-2 text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded print:hidden"
                aria-label="Kembali ke beranda"
              >
                <ChevronLeft className="h-4 w-4" />
                Kembali ke Beranda
              </button>
              <div className="hidden sm:block h-6 w-px bg-border" />
              <div className="hidden sm:flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <p className="text-lg text-foreground">
                  Laporan Learning Style
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownload}
                className="inline-flex items-center gap-2 rounded-lg bg-secondary text-secondary-foreground px-4 py-2 transition-spring hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Unduh PDF laporan"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">PDF</span>
              </button>
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 transition-spring hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Cetak laporan"
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
            Laporan Hasil Asesmen
          </h1>
          <p className="text-lg text-muted-foreground print:text-base leading-relaxed">
            Kolb Learning Style Inventory 4.0
          </p>

          {/* Metadata */}
          <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground flex-wrap">
            <div className="inline-flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Sesi #{report.session_id}</span>
            </div>
            <div className="inline-flex items-center gap-2">
              <Target className="h-4 w-4" />
              <span>Style Utama: {styleBlock?.primary_name ?? 'Belum tersedia'}</span>
            </div>
            <div className="inline-flex items-center gap-2">
              <ListChecks className="h-4 w-4" />
              <span>Norm: {normGroupLabel}</span>
            </div>
          </div>
        </div>

        {/* NonDiagnosticNotice (Task 53 - Responsible Use) */}
        <NonDiagnosticNotice
          className="print:border print:border-gray-300"
          message={responsibleUseNotice}
        />

        {/* Learning Style Classification (Task 46, 50) - Guidelines §8.4.1 */}
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="material-regular rounded-xl p-8 space-y-6 print:border print:border-gray-300">
            <h3 className="text-lg text-foreground leading-relaxed">Gaya Belajar Utama</h3>
            {styleBlock ? (
              <>
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <Target className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="text-xl text-foreground">{styleBlock.primary_name}</p>
                    {styleBlock.primary_code && (
                      <p className="text-sm text-muted-foreground">
                        Kode gaya: {styleBlock.primary_code}
                      </p>
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {styleBlock.primary_detail ?? styleBlock.primary_brief ?? 'Deskripsi gaya utama akan muncul setelah asesmen tervalidasi.'}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Data gaya belajar belum tersedia. Pastikan sesi telah diselesaikan sepenuhnya.
              </p>
            )}
          </div>

          <div className="material-regular rounded-xl p-8 space-y-4 print:border print:border-gray-300">
            <h3 className="text-lg text-foreground leading-relaxed">Cadangan & Intensitas</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Intensitas Polaritas</span>
                <span className="text-foreground font-semibold">{styleBlock?.intensity ?? '–'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Rekomendasi Fasilitator</span>
                <span className="text-right text-foreground">
                  {styleBlock?.educator_reco ?? 'Tidak tersedia'}
                </span>
              </div>
              {styleBlock?.backup_name && (
                <div className="pt-2 border-t border-border/40">
                  <p className="text-muted-foreground mb-1">Backup Style</p>
                  <p className="text-foreground font-semibold">{styleBlock.backup_name}</p>
                  {backupSummary && (
                    <p className="text-sm text-muted-foreground mt-1">{backupSummary}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Learning Style Chart (Task 44-45) */}
        <div className="print:break-inside-avoid">
          <LearningStyleChart visualization={report.visualization} style={styleBlock ?? null} />
        </div>

        {/* Flexibility Chart (Task 49) */}
        <div className="print:break-inside-avoid">
          <FlexibilityChart lfi={report.lfi} />
        </div>

        {/* Score Display (Task 47-48) */}
        <div className="print:break-inside-avoid">
          <ScoreDisplay raw={report.raw} percentiles={report.percentiles} />
        </div>

        {learningSpace && (
          <div className="material-regular rounded-xl p-6 space-y-6 print:break-inside-avoid">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-chart-2" />
              <h3 className="text-lg text-foreground">Learning Space Insights</h3>
            </div>
            <p className="text-sm text-muted-foreground">{learningSpace.meta.note}</p>
            {developmentBlock && (
              <div className="material-thin rounded-lg p-4 bg-secondary/30 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    Spiral Stage
                  </p>
                  {developmentBlock.is_heuristic && (
                    <span className="inline-flex items-center rounded-full bg-chart-2/20 text-chart-2 text-[11px] px-2 py-0.5">
                      {developmentBlock.label ?? 'Heuristik'}
                    </span>
                  )}
                </div>
                <p className="text-foreground font-semibold">
                  {developmentBlock.spiral_stage}
                </p>
                <p className="text-sm text-muted-foreground">
                  {developmentBlock.rationale}
                </p>
                <p className="text-xs text-muted-foreground">
                  {developmentBlock.disclaimer}
                </p>
              </div>
            )}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-sm text-muted-foreground">Saran Prioritas</p>
                  {suggestionsBlock?.is_heuristic && (
                    <span className="inline-flex items-center rounded-full bg-chart-3/15 text-chart-3 text-[11px] px-2 py-0.5">
                      {suggestionsBlock.label ?? 'Heuristik'}
                    </span>
                  )}
                </div>
                <ul className="space-y-2 text-sm text-foreground">
                  {suggestions.map((tip) => (
                    <li key={tip} className="flex gap-2 items-start">
                      <span className="text-primary">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-sm text-muted-foreground">Meta-Learning</p>
                  {metaLearningBlock?.is_heuristic && (
                    <span className="inline-flex items-center rounded-full bg-chart-3/15 text-chart-3 text-[11px] px-2 py-0.5">
                      {metaLearningBlock.label ?? 'Heuristik'}
                    </span>
                  )}
                </div>
                <ul className="space-y-2 text-sm text-foreground">
                  {metaLearning.map((tip) => (
                    <li key={tip} className="flex gap-2 items-start">
                      <span className="text-chart-3">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            {learningSpace.educator_roles?.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Peran Fasilitator</p>
                <div className="grid md:grid-cols-2 gap-3">
                  {learningSpace.educator_roles.slice(0, 4).map((role, idx) => (
                    <div key={`${role.role}-${idx}`} className="material-thin rounded-lg p-3">
                      <p className="text-sm font-semibold text-foreground">
                        {role.step ? `Langkah ${role.step}` : 'Catatan'}
                      </p>
                      {role.role && (
                        <p className="text-sm text-muted-foreground">{role.role}</p>
                      )}
                      {role.actions && (
                        <ul className="list-disc list-inside text-xs text-muted-foreground mt-2 space-y-1">
                          {role.actions.map((action) => (
                            <li key={action}>{action}</li>
                          ))}
                        </ul>
                      )}
                      {role.note && (
                        <p className="text-xs text-muted-foreground mt-2">{role.note}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {sessionDesigns.length > 0 && (
          <div className="material-regular rounded-xl p-6 space-y-4 print:break-inside-avoid">
            <div className="flex items-center gap-2">
              <ListChecks className="h-5 w-5 text-primary" />
              <h3 className="text-lg text-foreground">Rekomendasi Sesi</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {sessionDesigns.map((design) => (
                <div key={design.code} className="material-thin rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-foreground font-semibold">{design.title}</p>
                    <span className="text-xs text-muted-foreground">{design.duration_min} menit</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{design.summary}</p>
                  {design.activates?.length > 0 && (
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {design.activates.map((mode) => (
                        <span key={`${design.code}-${mode}`} className="rounded-full bg-secondary/40 px-2 py-1">
                          {mode}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {showEnhancedAnalytics && report.enhanced_analytics && (
          <div className="print:break-inside-avoid">
            <EnhancedAnalyticsPanel analytics={report.enhanced_analytics} />
          </div>
        )}

        <div className="material-thin rounded-xl p-6 space-y-3 print:border print:border-gray-300">
          <h3 className="text-lg text-foreground">Informasi Norma & Provenance</h3>
          <div className="grid sm:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Kelompok Norm</p>
              <p className="text-foreground font-medium">{normGroupLabel}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Sumber</p>
              <p className="text-foreground font-medium break-words">{sourceProvenance}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Fallback Digunakan?</p>
              <p className="text-foreground font-medium">{fallbackLabel}</p>
            </div>
          </div>
        </div>

        {notes && (
          <div className="material-thin rounded-xl p-6 space-y-3 print:border print:border-gray-300">
            <h3 className="text-lg text-foreground">Catatan Interpretasi</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {notes.interpretation_summary && <li>{notes.interpretation_summary}</li>}
              {notes.psychometric_terms && <li>{notes.psychometric_terms}</li>}
              {notes.acc_assm_definition && <li>{notes.acc_assm_definition}</li>}
              {notes.conv_div_definition && <li>{notes.conv_div_definition}</li>}
              {notes.balance_definition && <li>{notes.balance_definition}</li>}
            </ul>
          </div>
        )}

        <ResponsibleUseFooter className="print:hidden" />

        {/* Footer (print only) */}
        <div className="hidden print:block text-center text-xs text-gray-500 pt-8 border-t border-gray-300">
          <p>Kolb Learning Style Inventory 4.0 - Sesi #{report.session_id}</p>
          <p className="mt-1">Dicetak pada {new Date().toLocaleString('id-ID')}</p>
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