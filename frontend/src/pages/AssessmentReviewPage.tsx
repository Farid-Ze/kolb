/**
 * KLSI 4.0 - AssessmentReviewPage
 * Task 32, 34, 35: Review semua jawaban dengan React Query dan finalize mutation
 * 
 * Implementasi sesuai frontend_blueprint.md §5.1.4 dan Guidelines.md
 * - React Query untuk data fetching
 * - useMutation untuk finalize session
 * - AlertDialog untuk konfirmasi finalisasi
 * - Material hierarchy dan spring animations
 */

import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useAssessment } from '../hooks/useAssessment';
import { useSessionGuard } from '../hooks/useSessionGuard';
import { finalizeSession, getSessionValidation } from '../services/sessionService';
import { queryClient } from '../config/api';
import { Skeleton } from '../components/ui/skeleton';
import { toast } from 'sonner';
import {
  AlertCircle,
  CheckCircle2,
  Lock,
  ChevronLeft,
  ArrowLeft,
  AlertTriangle,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../components/ui/alert-dialog';
import { GlassPanel } from '../components/ui/GlassPanel';

const LFI_CONTEXT_LABELS: Record<string, string> = {
  Starting_Something_New: 'Memulai hal baru',
  Influencing_Someone: 'Mempengaruhi seseorang',
  Getting_To_Know_Someone: 'Mengenal seseorang',
  Learning_In_A_Group: 'Belajar dalam kelompok',
  Planning_Something: 'Merencanakan sesuatu',
  Analyzing_Something: 'Menganalisis sesuatu',
  Evaluating_An_Opportunity: 'Mengevaluasi peluang',
  Choosing_Between_Alternatives: 'Memilih alternatif',
};

const LFI_CONTEXT_ORDER = Object.keys(LFI_CONTEXT_LABELS);

const formatContextLabel = (contextName: string): string =>
  LFI_CONTEXT_LABELS[contextName] || contextName.replace(/_/g, ' ');

export const AssessmentReviewPage: React.FC = () => {
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const sessionAccess = useSessionGuard(sessionId ?? null);
  const normalizedSessionId = sessionId ?? '';

  // Task 32: useAssessment untuk mengambil data jawaban
  const {
    items,
    responses,
    totalItems,
    progress,
    isLoading,
    isComplete,
    isError: assessmentHasError,
    error: assessmentError,
  } = useAssessment({
    sessionId: normalizedSessionId,
    enabled: Boolean(sessionId) && sessionAccess.hasAccess,
  });

  const {
    data: validationData,
    isLoading: isValidationLoading,
    isError: isValidationError,
    refetch: refetchValidation,
  } = useQuery({
    queryKey: ['session-validation', sessionId],
    queryFn: () => getSessionValidation(sessionId!),
    enabled: Boolean(sessionId),
    refetchOnWindowFocus: false,
  });

  // Spring configuration (Guidelines.md Section 2.3.1)
  const springConfig = {
    type: "spring" as const,
    stiffness: 300,
    damping: 20,
  };

  // Task 34: useMutation untuk finalize session
  const finalizeMutation = useMutation({
    mutationFn: () => finalizeSession(sessionId!),
    onSuccess: (data) => {
      toast.success('Asesmen berhasil diselesaikan!');
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['session-validation', sessionId] });
      navigate(`/reports/${data.session_id}`);
    },
    onError: (error: Error) => {
      toast.error('Gagal finalisasi: ' + error.message);
      void refetchValidation();
    },
  });

  // Handler untuk finalize dengan validation
  const handleFinalize = () => {
    if (!isComplete) {
      const completedCount = Math.floor(progress / 100 * totalItems);
      const unansweredCount = totalItems - completedCount;
      toast.error(`Masih ada ${unansweredCount} item yang belum dijawab lengkap`);
      return;
    }
    if (hasMissingContexts) {
      toast.error('Semua 8 konteks LFI harus diisi sebelum finalisasi.');
      void refetchValidation();
      return;
    }
    setShowConfirmDialog(true);
  };

  const confirmFinalize = () => {
    finalizeMutation.mutate();
    setShowConfirmDialog(false);
  };

  if (sessionAccess.isChecking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/10 to-background flex items-center justify-center p-6">
        <div className="material-regular rounded-xl p-8 text-center space-y-2">
          <p className="text-sm text-muted-foreground">Memverifikasi akses sesi...</p>
        </div>
      </div>
    );
  }

  if (!sessionId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/10 to-background flex items-center justify-center p-6">
        <div className="material-regular rounded-xl p-8 max-w-md text-center space-y-4">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 mx-auto">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="text-foreground">ID sesi tidak valid</h2>
          <p className="text-muted-foreground">Silakan kembali ke daftar asesmen dan pilih sesi yang benar.</p>
          <button
            onClick={() => navigate('/')}
            className="rounded-lg bg-primary text-primary-foreground px-6 py-3"
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  if (!sessionAccess.hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/10 to-background flex items-center justify-center p-6">
        <div className="material-regular rounded-xl p-8 max-w-md text-center space-y-4">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 mx-auto">
            <Lock className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="text-foreground">Akses review ditolak</h2>
          <p className="text-muted-foreground">
            {sessionAccess.reason ?? 'Anda tidak memiliki izin untuk meninjau sesi ini.'}
          </p>
          <button
            onClick={() => navigate('/')}
            className="rounded-lg bg-primary text-primary-foreground px-6 py-3"
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/10 to-background">
        <GlassPanel
          as="header"
          material="functional"
          density="compact"
          className="sticky top-0 z-50 border-b border-border"
        >
          <div className="mx-auto max-w-4xl w-full">
            <Skeleton className="h-6 w-[150px]" />
          </div>
        </GlassPanel>
        <main className="mx-auto max-w-4xl p-6 space-y-6">
          <div className="text-center space-y-2 py-6">
            <Skeleton className="mx-auto h-10 w-[300px]" />
            <Skeleton className="mx-auto h-5 w-[400px]" />
          </div>
          <Skeleton className="h-[150px] w-full" />
          <Skeleton className="h-[120px] w-full" />
          <div className="space-y-4">
            <Skeleton className="h-[100px] w-full" />
            <Skeleton className="h-[100px] w-full" />
            <Skeleton className="h-[100px] w-full" />
          </div>
        </main>
      </div>
    );
  }

  if (assessmentHasError) {
    const message = assessmentError?.message || 'Gagal memuat data review.';
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/10 to-background flex items-center justify-center p-6">
        <div className="material-regular rounded-xl p-8 max-w-lg text-center space-y-4">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 mx-auto">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="text-foreground">Gagal Memuat Data Review</h2>
          <p className="text-muted-foreground">
            {message}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              onClick={() => window.location.reload()}
              className="rounded-lg bg-primary text-primary-foreground px-6 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Coba Lagi
            </button>
            <button
              onClick={() => navigate(`/assessment/${sessionId}`)}
              className="rounded-lg border border-border px-6 py-3 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Kembali ke Asesmen
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!totalItems) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/10 to-background flex items-center justify-center p-6">
        <div className="material-regular rounded-xl p-8 max-w-lg text-center space-y-4">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-secondary/10 mx-auto">
            <AlertTriangle className="h-8 w-8 text-secondary" />
          </div>
          <h2 className="text-foreground">Data Review Belum Tersedia</h2>
          <p className="text-muted-foreground">
            Sesi ini belum memiliki item asesmen yang lengkap sehingga halaman review belum dapat ditampilkan.
          </p>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Pastikan sesi telah memuat item dari server dan coba buka ulang halaman ini.</p>
            <p>Jika masalah berlanjut, hubungi fasilitator untuk memverifikasi status sesi.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              onClick={() => navigate(`/assessment/${sessionId}`)}
              className="rounded-lg bg-primary text-primary-foreground px-6 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Kembali ke Asesmen
            </button>
            <button
              onClick={() => navigate('/reports')}
              className="rounded-lg border border-border px-6 py-3 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Ke Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Calculate stats
  const completedCount = items.filter((item) => {
    const response = responses[item.item_id];
    if (!response || !response.ranks) return false;
    const ranks = Object.values(response.ranks);
    return ranks.length === 4 && new Set(ranks).size === 4;
  }).length;

  const contextStatus = useMemo(() => {
    const serverStatus = validationData?.diagnostics?.contexts?.status;
    if (serverStatus && serverStatus.length > 0) {
      return LFI_CONTEXT_ORDER.map((name) =>
        serverStatus.find((entry) => entry.name === name) || { name, present: false }
      );
    }
    return LFI_CONTEXT_ORDER.map((name) => ({ name, present: false }));
  }, [validationData]);

  const completedContexts = contextStatus.filter((context) => context.present).length;
  const hasMissingContexts = contextStatus.some((context) => !context.present);
  const missingContextNames: string[] = validationData?.diagnostics?.contexts?.missing_names || [];
  const contextIssues = (validationData?.issues || []).filter((issue) =>
    issue.code?.startsWith('LFI_CONTEXT')
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/10 to-background">
      {/* Header */}
      <GlassPanel
        as="header"
        material="functional"
        density="compact"
        className="sticky top-0 z-50 border-b border-border"
      >
        <div className="mx-auto max-w-4xl w-full">
          <motion.button
            onClick={() => navigate(`/assessment/${sessionId}`)}
            className="inline-flex items-center gap-2 text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded touch-manipulation"
            whileHover={{ x: -4 }}
            transition={springConfig}
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Asesmen
          </motion.button>
        </div>
      </GlassPanel>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl p-6 pb-32 space-y-8">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springConfig}
          className="text-center space-y-2 py-6"
        >
          <h1 className="text-foreground">Review Jawaban</h1>
          <p className="text-muted-foreground">
            Pastikan semua item sudah lengkap sebelum finalisasi
          </p>
        </motion.div>

        {/* NonDiagnosticNotice - Task 35 */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springConfig}
          className="material-thin rounded-xl p-6 border-l-4 border-l-chart-3"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-chart-3 flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <h3 className="text-foreground">Sebelum Finalisasi</h3>
              <p className="text-muted-foreground">
                Setelah Anda mengunci jawaban, Anda tidak dapat mengubahnya lagi.
                Pastikan semua jawaban sudah sesuai dengan preferensi belajar Anda
                yang sebenarnya.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Progress Summary */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={springConfig}
          className="material-regular rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-foreground">Progress Asesmen</h2>
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={springConfig}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 ${
                isComplete
                  ? 'bg-chart-4/10 text-chart-4'
                  : 'bg-chart-3/10 text-chart-3'
              }`}
            >
              {isComplete ? (
                <>
                  <CheckCircle2 className="h-5 w-5" />
                  <span>Lengkap</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5" />
                  <span>Belum Lengkap</span>
                </>
              )}
            </motion.div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Item Selesai</span>
              <span className="text-foreground">
                {completedCount} / {totalItems}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="h-3 overflow-hidden rounded-full bg-secondary">
              <motion.div
                className="h-full rounded-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={springConfig}
              />
            </div>

            <div className="text-right">
              <span className="text-muted-foreground">
                {Math.round(progress)}% selesai
              </span>
            </div>
          </div>
        </motion.div>

        {/* LFI Context Summary */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springConfig}
          className="material-regular rounded-xl p-6 space-y-6"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-foreground">Status Konteks LFI</h2>
              <p className="text-muted-foreground text-sm">
                8 konteks wajib untuk menghitung Learning Flexibility Index (LFI) secara valid.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={springConfig}
                className={`rounded-lg px-4 py-2 text-sm font-medium ${
                  hasMissingContexts ? 'bg-chart-3/10 text-chart-3' : 'bg-chart-4/10 text-chart-4'
                }`}
              >
                {isValidationLoading ? 'Memuat…' : `${completedContexts}/8 lengkap`}
              </motion.div>
              <motion.button
                type="button"
                onClick={() => refetchValidation()}
                disabled={isValidationLoading}
                className="rounded-lg border border-border/60 px-4 py-2 text-sm text-foreground disabled:opacity-50"
                whileHover={!isValidationLoading ? { scale: 1.05 } : {}}
                whileTap={!isValidationLoading ? { scale: 0.95 } : {}}
                transition={springConfig}
              >
                Perbarui
              </motion.button>
            </div>
          </div>

          {isValidationError ? (
            <div className="rounded-lg border border-chart-3/40 bg-chart-3/10 p-4 text-sm text-chart-3">
              Gagal memuat status konteks. Coba perbarui kembali.
            </div>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                {contextStatus.map((context) => (
                  <div
                    key={context.name}
                    className={`rounded-xl border p-4 flex items-center gap-3 ${
                      context.present
                        ? 'border-chart-4/40 bg-chart-4/10'
                        : 'border-chart-3/40 bg-chart-3/10'
                    }`}
                  >
                    {context.present ? (
                      <CheckCircle2 className="h-5 w-5 text-chart-4" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-chart-3" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {formatContextLabel(context.name)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {context.present ? 'Lengkap' : 'Belum diisi'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {hasMissingContexts && (
                <div className="rounded-lg border border-chart-3/40 bg-chart-3/10 p-4 text-sm text-chart-3 space-y-2">
                  <p>
                    Lengkapi konteks berikut agar sistem dapat menghitung fleksibilitas lintas konteks:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {missingContextNames.map((name) => (
                      <span key={name} className="rounded-full bg-background/60 px-3 py-1 text-xs font-medium">
                        {formatContextLabel(name)}
                      </span>
                    ))}
                  </div>
                  {contextIssues.map((issue) => (
                    <p key={issue.code} className="text-xs">
                      {issue.message}
                    </p>
                  ))}
                </div>
              )}
            </>
          )}
        </motion.div>

        {/* Items List - Task 32: Display read-only answers */}
        <div className="space-y-4">
          <h2 className="text-foreground">Daftar Item</h2>

          {items.map((item, index) => {
            const response = responses[item.item_id];
            const ranks = response?.ranks || {};
            const isItemComplete = Object.keys(ranks).length === 4 && 
              new Set(Object.values(ranks)).size === 4;

            return (
              <motion.div
                key={item.item_id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springConfig, delay: index * 0.05 }}
                className="material-regular rounded-xl p-6 space-y-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-foreground mb-2">
                        {item.prompt || 'Ketika saya belajar...'}
                      </p>
                      <p className="text-muted-foreground">
                        {Object.keys(ranks).length} / 4 option dijawab
                      </p>
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    {isItemComplete ? (
                      <CheckCircle2 className="h-6 w-6 text-chart-4" />
                    ) : (
                      <AlertCircle className="h-6 w-6 text-chart-3" />
                    )}
                  </div>
                </div>

                {/* Rankings Preview */}
                {Object.keys(ranks).length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {Object.entries(ranks)
                      .sort(([, a], [, b]) => a - b)
                      .map(([optionCode, rank]) => (
                        <div
                          key={optionCode}
                          className="rounded-lg bg-secondary p-3 text-center space-y-1"
                        >
                          <div className="text-primary">{optionCode}</div>
                          <div className="text-foreground">Rank {rank}</div>
                        </div>
                      ))}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </main>

      {/* Bottom Toolbar (Zona Hijau - Guidelines §1.3.2) */}
      <GlassPanel
        as="div"
        material="functional"
        density="compact"
        className="fixed bottom-0 left-0 right-0 border-t border-border safe-area-bottom"
      >
        <div className="mx-auto max-w-4xl w-full">
          <div className="flex items-center justify-between gap-4">
            <motion.button
              onClick={() => navigate(`/assessment/${sessionId}`)}
              className="inline-flex items-center gap-2 rounded-xl bg-secondary text-secondary-foreground px-6 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring touch-manipulation"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={springConfig}
            >
              <ChevronLeft className="h-5 w-5" />
              <span className="hidden sm:inline">Kembali</span>
            </motion.button>

            {/* Task 35: AlertDialog untuk konfirmasi finalize */}
            <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
              <AlertDialogTrigger asChild>
                <motion.button
                  onClick={handleFinalize}
                  disabled={!isComplete || finalizeMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring touch-manipulation"
                  whileHover={isComplete ? { scale: 1.05 } : {}}
                  whileTap={isComplete ? { scale: 0.95 } : {}}
                  transition={springConfig}
                >
                  {finalizeMutation.isPending ? (
                    <>
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" />
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="h-5 w-5" />
                      <span>Kunci Jawaban & Lihat Hasil</span>
                    </>
                  )}
                </motion.button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Konfirmasi Finalisasi</AlertDialogTitle>
                  <AlertDialogDescription>
                    Apakah Anda yakin ingin mengunci jawaban? Setelah dikunci, Anda tidak dapat
                    mengubah jawaban lagi. Sistem akan menghitung hasil asesmen dan menampilkan
                    laporan gaya belajar Anda.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction onClick={confirmFinalize}>
                    Ya, Kunci Jawaban
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </GlassPanel>
    </div>
  );
};