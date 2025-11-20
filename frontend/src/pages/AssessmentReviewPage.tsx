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

import React, { useCallback, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useAssessment } from '../hooks/useAssessment';
import { useSessionGuard } from '../hooks/useSessionGuard';
import { getSessionValidation } from '../services/sessionService';
import { api, SessionSubmissionPayload } from '../core/api/client';
import { queryClient } from '../config/api';
import { Skeleton } from '../components/ui/skeleton';
import { toast } from 'sonner';
import {
  AlertCircle,
  CheckCircle2,
  Lock,
  ArrowLeft,
  AlertTriangle,
  Loader2,
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
import { PageShell, RoomContent } from '../core/design-system/Layout';
import { GlassMaterial } from '../core/design-system/Materials';
import { LayeredIcon } from '../components/ui/LayeredIcon';
import { useNonBlockingNavigate } from '../hooks/useNonBlockingNavigate';
import { DisplayTitle, SectionTitle, BodyText } from '../core/design-system/Typography';
import { fadeInUp, staggerContainer } from '../core/physics/motionPrimitives';

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
  const navigate = useNonBlockingNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const sessionAccess = useSessionGuard(sessionId ?? null);
  const normalizedSessionId = sessionId ?? '';

  // Task 32: useAssessment untuk mengambil data jawaban
  const {
    items,
    responses,
    contexts,
    totalItems,
    progress,
    isLoading,
    isComplete,
    isSaving,
    hasPendingSave,
    flushPendingSaves,
    isError: assessmentHasError,
    error: assessmentError,
  } = useAssessment({
    sessionId: normalizedSessionId,
    enabled: Boolean(sessionId) && sessionAccess.hasAccess,
  });

  const {
    data: validationData,
    refetch: refetchValidation,
  } = useQuery({
    queryKey: ['session-validation', sessionId],
    queryFn: () => getSessionValidation(sessionId!),
    enabled: Boolean(sessionId),
    refetchOnWindowFocus: false,
  });

  const waitForAutosave = useCallback(async () => {
    if (!hasPendingSave) {
      return true;
    }

    const toastId = toast.loading('Menunggu autosave selesai...');
    try {
      await flushPendingSaves();
      return true;
    } catch (error) {
      console.error('Failed to flush pending autosave before finalizing', error);
      toast.error('Autosave belum selesai. Mohon coba lagi setelah tersinkron.');
      return false;
    } finally {
      toast.dismiss(toastId);
    }
  }, [flushPendingSaves, hasPendingSave]);



  // Task 34: useMutation untuk finalize session
  const finalizeMutation = useMutation({
    mutationFn: async () => {
        // Map responses to ItemRank[] with choice IDs
        const mappedItems = (items ?? []).map(item => {
            const response = responses[item.item_id];
            const ranks: Record<number, number> = {};
            if (response && response.ranks) {
                Object.entries(response.ranks).forEach(([code, rank]) => {
                    const option = item.options.find(o => o.option_code === code);
                    if (option) {
                        ranks[Number(option.id)] = rank;
                    }
                });
            }
            return {
                item_id: Number(item.item_id),
                ranks
            };
        });

        const payload: SessionSubmissionPayload = {
            items: mappedItems,
          contexts: (contexts ?? []).map(ctx => ({
                context_name: ctx.context_name,
                CE: Number(ctx.CE),
                RO: Number(ctx.RO),
                AC: Number(ctx.AC),
                AE: Number(ctx.AE)
            }))
        };

        return api.submitSession(Number(sessionId), payload);
    },
    onSuccess: () => {
      toast.success('Asesmen berhasil diselesaikan!');
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['report', sessionId] });
      
      // Navigate to report
      void navigate(`/report/${sessionId}`);
    },
    onError: (error) => {
      toast.error('Gagal memfinalisasi sesi: ' + error.message);
    },
  });

  // Handler untuk finalize dengan validation
  const handleFinalize = async () => {
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
    const autosaveReady = await waitForAutosave();
    if (!autosaveReady) {
      return;
    }
    setShowConfirmDialog(true);
  };

  const confirmFinalize = async () => {
    const autosaveReady = await waitForAutosave();
    if (!autosaveReady) {
      return;
    }
    finalizeMutation.mutate();
    setShowConfirmDialog(false);
  };

  if (sessionAccess.isChecking) {
    return (
      <PageShell>
        <RoomContent>
          <div className="flex items-center justify-center min-h-[60vh]">
            <GlassMaterial intensity="medium" className="p-8 text-center space-y-2">
              <p className="text-sm text-white/70">Verifying session access...</p>
            </GlassMaterial>
          </div>
        </RoomContent>
      </PageShell>
    );
  }

  if (!sessionId) {
    return (
      <PageShell>
        <RoomContent>
          <div className="flex items-center justify-center min-h-[60vh]">
            <GlassMaterial intensity="medium" className="p-8 max-w-md text-center space-y-4">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 mx-auto">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
              <h2 className="text-white text-xl font-bold">Invalid Session ID</h2>
              <p className="text-white/70">Please return to the dashboard and select a valid session.</p>
              <button
                onClick={() => {
                  void navigate('/');
                }}
                className="rounded-lg bg-primary text-primary-foreground px-6 py-3"
              >
                Back to Dashboard
              </button>
            </GlassMaterial>
          </div>
        </RoomContent>
      </PageShell>
    );
  }

  if (!sessionAccess.hasAccess) {
    return (
      <PageShell>
        <RoomContent>
          <div className="flex items-center justify-center min-h-[60vh]">
            <GlassMaterial intensity="medium" className="p-8 max-w-md text-center space-y-4">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 mx-auto">
                <Lock className="h-8 w-8 text-destructive" />
              </div>
              <h2 className="text-white text-xl font-bold">Access Denied</h2>
              <p className="text-white/70">
                {sessionAccess.reason ?? 'You do not have permission to review this session.'}
              </p>
              <button
                onClick={() => {
                  void navigate('/');
                }}
                className="rounded-lg bg-primary text-primary-foreground px-6 py-3"
              >
                Back to Dashboard
              </button>
            </GlassMaterial>
          </div>
        </RoomContent>
      </PageShell>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <PageShell>
        <RoomContent>
          <div className="max-w-4xl mx-auto space-y-6">
            <GlassMaterial intensity="medium" className="p-6">
              <Skeleton className="h-8 w-[200px] mb-2 bg-white/10" />
            </GlassMaterial>
            <GlassMaterial intensity="high" className="p-8 min-h-[400px]">
              <Skeleton className="h-[100px] w-full mb-8 bg-white/10" />
              <div className="space-y-4">
                <Skeleton className="h-[80px] w-full bg-white/10" />
                <Skeleton className="h-[80px] w-full bg-white/10" />
              </div>
            </GlassMaterial>
          </div>
        </RoomContent>
      </PageShell>
    );
  }

  if (assessmentHasError) {
    const message = assessmentError?.message || 'Failed to load review data.';
    return (
      <PageShell>
        <RoomContent>
          <div className="flex items-center justify-center min-h-[60vh]">
            <GlassMaterial intensity="medium" className="p-8 max-w-lg text-center space-y-4">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 mx-auto">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
              <h2 className="text-white text-xl font-bold">Error Loading Data</h2>
              <p className="text-white/70">
                {message}
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                <button
                  onClick={() => window.location.reload()}
                  className="rounded-lg bg-primary text-primary-foreground px-6 py-3"
                >
                  Try Again
                </button>
                <button
                  onClick={() => {
                    void navigate(`/assessment/${sessionId}`);
                  }}
                  className="rounded-lg border border-white/20 px-6 py-3 text-white hover:bg-white/5"
                >
                  Back to Assessment
                </button>
              </div>
            </GlassMaterial>
          </div>
        </RoomContent>
      </PageShell>
    );
  }

  if (!totalItems) {
    return (
      <PageShell>
        <RoomContent>
          <div className="flex items-center justify-center min-h-[60vh]">
            <GlassMaterial intensity="medium" className="p-8 max-w-lg text-center space-y-4">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 mx-auto">
                <AlertTriangle className="h-8 w-8 text-amber-500" />
              </div>
              <h2 className="text-white text-xl font-bold">Review Data Unavailable</h2>
              <p className="text-white/70">
                This session does not have complete assessment items yet.
              </p>
              <div className="space-y-2 text-sm text-white/50">
                <p>Please ensure the session has loaded items from the server.</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-center pt-4">
                <button
                  onClick={() => {
                    void navigate(`/assessment/${sessionId}`);
                  }}
                  className="rounded-lg bg-primary text-primary-foreground px-6 py-3"
                >
                  Back to Assessment
                </button>
                <button
                  onClick={() => {
                    void navigate('/reports');
                  }}
                  className="rounded-lg border border-white/20 px-6 py-3 text-white hover:bg-white/5"
                >
                  Go to Dashboard
                </button>
              </div>
            </GlassMaterial>
          </div>
        </RoomContent>
      </PageShell>
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
  const autosaveBusy = hasPendingSave || isSaving;

  return (
    <PageShell>
      {/* Header - Minimal & Cinematic */}
      <div className="absolute top-0 left-0 right-0 z-50 p-6 flex justify-between items-start pointer-events-none">
        <motion.button
          onClick={() => {
            void navigate(`/assessment/${sessionId}`);
          }}
          className="pointer-events-auto flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 backdrop-blur-md transition-all text-sm font-medium text-white/70 hover:text-white group"
          whileHover={{ x: -4 }}
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Assessment</span>
        </motion.button>
      </div>

      <RoomContent>
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="w-full max-w-4xl relative z-10 pb-32"
        >
            {/* Title Section */}
            <motion.div variants={fadeInUp} className="text-center mb-12 space-y-4">
                <div className="inline-flex p-4 rounded-2xl bg-white/5 border border-white/10 mb-4 shadow-2xl shadow-black/20">
                    <LayeredIcon icon={CheckCircle2} size="lg" color="primary" />
                </div>
                <DisplayTitle className="text-4xl md:text-5xl font-bold">
                    Review Your Answers
                </DisplayTitle>
                <BodyText className="text-white/60 max-w-xl mx-auto">
                    Ensure all items are complete before finalizing. Once submitted, answers cannot be changed.
                </BodyText>
            </motion.div>

            {/* Progress Summary */}
            <motion.div variants={fadeInUp} className="mb-8">
                <GlassMaterial intensity="medium" className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-full ${isComplete ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                            {isComplete ? <CheckCircle2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
                        </div>
                        <div>
                            <h3 className="text-white font-medium">Assessment Progress</h3>
                            <p className="text-sm text-white/50">
                                {completedCount} of {totalItems} items completed
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="text-2xl font-bold text-white">{Math.round(progress)}%</span>
                    </div>
                </GlassMaterial>
            </motion.div>

            {/* LFI Context Summary */}
            <motion.div variants={fadeInUp} className="mb-8">
                <GlassMaterial intensity="medium" className="p-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-white font-medium text-lg">Context Check</h3>
                            <p className="text-sm text-white/50">8 contexts required for Learning Flexibility Index</p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${hasMissingContexts ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                            {completedContexts}/8 Completed
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {contextStatus.map((context) => (
                            <div
                                key={context.name}
                                className={`rounded-xl border p-3 flex items-center gap-3 transition-colors ${
                                    context.present
                                    ? 'bg-emerald-500/5 border-emerald-500/20'
                                    : 'bg-amber-500/5 border-amber-500/20'
                                }`}
                            >
                                {context.present ? (
                                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                ) : (
                                    <AlertCircle className="h-4 w-4 text-amber-400" />
                                )}
                                <span className={`text-sm ${context.present ? 'text-white/80' : 'text-white/50'}`}>
                                    {formatContextLabel(context.name)}
                                </span>
                            </div>
                        ))}
                    </div>
                </GlassMaterial>
            </motion.div>

            {/* Items List */}
            <div className="space-y-4">
                <SectionTitle className="text-2xl mb-6">Item Responses</SectionTitle>
                {items.map((item, index) => {
                    const response = responses[item.item_id];
                    const ranks = response?.ranks || {};
                    const isItemComplete = Object.keys(ranks).length === 4 && new Set(Object.values(ranks)).size === 4;

                    return (
                        <motion.div
                            key={item.item_id}
                            variants={fadeInUp}
                            className="relative"
                        >
                            <GlassMaterial intensity="low" className={`p-6 transition-colors ${isItemComplete ? 'hover:bg-white/5' : 'border-amber-500/30 bg-amber-500/5'}`}>
                                <div className="flex items-start gap-4">
                                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-sm font-medium text-white/70">
                                        {index + 1}
                                    </span>
                                    <div className="flex-1 space-y-4">
                                        <div className="flex items-start justify-between">
                                            <p className="text-white/90 font-medium text-lg">
                                                {item.prompt || 'When I learn...'}
                                            </p>
                                            {isItemComplete ? (
                                                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                            ) : (
                                                <AlertCircle className="w-5 h-5 text-amber-400" />
                                            )}
                                        </div>

                                        {Object.keys(ranks).length > 0 && (
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                                {Object.entries(ranks)
                                                    .sort(([, a], [, b]) => a - b)
                                                    .map(([optionCode, rank]) => (
                                                        <div key={optionCode} className="bg-black/20 rounded-lg p-2 text-center border border-white/5">
                                                            <div className="text-xs text-white/40 uppercase tracking-wider mb-1">{optionCode}</div>
                                                            <div className="text-lg font-bold text-white">{rank}</div>
                                                        </div>
                                                    ))
                                                }
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </GlassMaterial>
                        </motion.div>
                    );
                })}
            </div>
        </motion.div>
      </RoomContent>

      {/* Floating Footer */}
      <div className="fixed bottom-8 left-0 right-0 z-50 flex justify-center pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-4 p-2 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl">
            <motion.button
              onClick={() => {
                void navigate(`/assessment/${sessionId}`);
              }}
                className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                Back to Edit
            </motion.button>

            <div className="h-8 w-px bg-white/10" />

            <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <AlertDialogTrigger asChild>
                    <motion.button
                        onClick={handleFinalize}
                        disabled={!isComplete || finalizeMutation.isPending}
                        className="px-8 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        whileHover={isComplete ? { scale: 1.05 } : {}}
                        whileTap={isComplete ? { scale: 0.95 } : {}}
                    >
                        {finalizeMutation.isPending ? (
                            <>
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />
                                <span>Processing...</span>
                            </>
                        ) : (
                            <>
                                <Lock className="w-4 h-4" />
                                <span>Finalize & Submit</span>
                            </>
                        )}
                    </motion.button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-slate-900 border-white/10 text-white">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Submission</AlertDialogTitle>
                        <AlertDialogDescription className="text-white/60">
                            Are you sure you want to lock your answers? Once submitted, you cannot change them.
                            The system will calculate your learning style profile immediately.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="bg-transparent border-white/10 text-white hover:bg-white/5 hover:text-white">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmFinalize} className="bg-emerald-500 text-white hover:bg-emerald-600">
                            Yes, Submit
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
      </div>
    </PageShell>
  );
};