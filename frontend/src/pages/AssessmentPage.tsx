/**
 * KLSI 4.0 - AssessmentPage
 * Task 31-32: Assessment UI dengan drag-and-drop + button ranking
 * 
 * Implementasi sesuai Guidelines.md & frontend_blueprint.md:
 * - AssessmentLayout dengan LargeTitleHeader
 * - Navigation & control layer menggunakan GlassPanel functional material
 * - Content layer menggunakan material-regular
 * - BottomToolbar untuk navigasi (Zona Hijau)
 * - Spring-based animations
 * - React Query untuk data fetching dan autosave
 * - Drag-and-drop support dengan @dnd-kit (Task 31)
 */

import React, { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAssessment } from '../hooks/useAssessment';
import { useSessionGuard } from '../hooks/useSessionGuard';
import { RankingCard } from '../components/assessment/RankingCard';
import { LFIContextCard } from '../components/assessment/LFIContextCard'; // Added import

import { Skeleton } from '../components/ui/skeleton';
import { GuideModal } from '../components/common/GuideModal';
import { GUIDE_IDS } from '../services/guideService';
import { toast } from 'sonner';
import { 
  ChevronLeft, 
  ChevronRight, 
  HelpCircle, 
  Save,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Lock,
} from 'lucide-react';
import { PageShell, RoomContent } from '../core/design-system/Layout';
import { GlassMaterial } from '../core/design-system/Materials';
import { DisplayTitle } from '../core/design-system/Typography';
import { staggerContainer } from '../core/physics/motionPrimitives';
import { useNonBlockingNavigate } from '../hooks/useNonBlockingNavigate';


export const AssessmentPage: React.FC = () => {
  const navigate = useNonBlockingNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();
  const sessionAccess = useSessionGuard(sessionId ?? null);
  const normalizedSessionId = sessionId ?? '';
  const [showGuideModal, setShowGuideModal] = useState(false); // Task 8.9: Guide modal state

  // Task 27, 28, 30, 31, 32: useAssessment hook dengan React Query
  const {
    currentItem,
    currentItemIndex,
    totalItems,
    progress,
    responses,
    responseMeta,
    isComplete,
    isLoading,
    isSaving,
    hasPendingSave,
    flushPendingSaves,
    setRank,
    setItemRanks,
    nextItem,
    prevItem,
    canGoNext,
    canGoPrev,
    isCurrentItemComplete,
  } = useAssessment({
    sessionId: normalizedSessionId,
    onComplete: () => {
      toast.success('Semua item telah dijawab! Silahkan review jawaban Anda.');
    },
    enabled: Boolean(sessionId) && sessionAccess.hasAccess,
  });
  
  const currentResponse = currentItem ? responses[currentItem.item_id] : undefined;
  const currentItemMeta = currentItem ? responseMeta[currentItem.item_id] : undefined;
  const normalizedProgress = Math.round(progress);

  // Spring configuration (Guidelines.md Section 2.3.1)
  const springConfig = {
    type: "spring" as const,
    stiffness: 300,
    damping: 20,
  };

  // Handler untuk kembali
  const handleBack = useCallback(() => {
    if (window.confirm('Apakah Anda yakin ingin keluar? Progress Anda telah tersimpan otomatis.')) {
      void flushPendingSaves().finally(() => {
        void navigate('/');
      });
    }
  }, [flushPendingSaves, navigate]);

  // Handler untuk review
  const handleReview = useCallback(() => {
    if (!isComplete) {
      const unansweredCount = totalItems - Math.floor(progress / 100 * totalItems);
      toast.error(`Masih ada ${unansweredCount} item yang belum dijawab lengkap`);
      return;
    }
    void flushPendingSaves().finally(() => {
      void navigate(`/assessment/${sessionId}/review`);
    });
  }, [flushPendingSaves, isComplete, totalItems, progress, sessionId, navigate]);

  // Task 8.9: Handler untuk buka panduan
  const handleOpenGuide = useCallback(() => {
    setShowGuideModal(true);
  }, []);

  if (sessionAccess.isChecking) {
    return (
      <PageShell>
        <RoomContent>
          <div className="flex items-center justify-center min-h-[60vh]">
            <GlassMaterial intensity="medium" className="p-8 text-center space-y-2">
              <p className="text-sm text-white/70">Memverifikasi akses sesi...</p>
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
              <DisplayTitle className="text-2xl md:text-3xl text-white">
                ID sesi tidak valid
              </DisplayTitle>
              <p className="text-white/70">Tidak dapat memuat asesmen tanpa ID sesi.</p>
              <motion.button
                onClick={() => {
                  void navigate('/');
                }}
                className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-6 py-3"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ArrowLeft className="h-4 w-4" />
                Kembali ke Beranda
              </motion.button>
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
              <DisplayTitle className="text-2xl md:text-3xl text-white">
                Akses sesi ditolak
              </DisplayTitle>
              <p className="text-white/70">
                {sessionAccess.reason ?? 'Anda tidak diizinkan mengakses sesi asesmen ini.'}
              </p>
              <motion.button
                onClick={() => {
                  void navigate('/');
                }}
                className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-6 py-3"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ArrowLeft className="h-4 w-4" />
                Kembali ke Beranda
              </motion.button>
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
            <GlassMaterial intensity="medium" className="p-6 space-y-2">
              <p className="text-sm text-white/70">Memuat asesmen...</p>
              <Skeleton className="h-8 w-[200px] mb-2 bg-white/10" />
              <Skeleton className="h-5 w-[150px] bg-white/10" />
            </GlassMaterial>
            <GlassMaterial intensity="high" className="p-8 min-h-[400px]">
              <Skeleton className="h-[100px] w-full mb-8 bg-white/10" />
              <div className="space-y-4">
                <Skeleton className="h-[80px] w-full bg-white/10" />
                <Skeleton className="h-[80px] w-full bg-white/10" />
                <Skeleton className="h-[80px] w-full bg-white/10" />
                <Skeleton className="h-[80px] w-full bg-white/10" />
              </div>
            </GlassMaterial>
          </div>
        </RoomContent>
      </PageShell>
    );
  }

  // Error state (no items)
  if (!currentItem || totalItems === 0) {
    return (
      <PageShell>
        <RoomContent>
          <div className="flex items-center justify-center min-h-[60vh]">
            <GlassMaterial intensity="medium" className="p-8 max-w-md text-center space-y-4">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 mx-auto">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
              <DisplayTitle className="text-2xl md:text-3xl text-white">
                Data Tidak Ditemukan
              </DisplayTitle>
              <p className="text-white/70">
                Tidak ada item asesmen yang tersedia untuk sesi ini.
              </p>
              <motion.button
                onClick={() => {
                  void navigate('/');
                }}
                className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-6 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring touch-manipulation"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={springConfig}
              >
                <ArrowLeft className="h-4 w-4" />
                Kembali ke Beranda
              </motion.button>
            </GlassMaterial>
          </div>
        </RoomContent>
      </PageShell>
    );
  }

  return (
    <PageShell>
      {/* Header - Minimal & Cinematic */}
      <div className="absolute top-0 left-0 right-0 z-50 p-6 flex justify-between items-start pointer-events-none">
        <motion.button
          onClick={handleBack}
          className="pointer-events-auto flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 backdrop-blur-md transition-all text-sm font-medium text-white/70 hover:text-white group"
          whileHover={{ x: -4 }}
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Exit Assessment</span>
        </motion.button>

        <div className="pointer-events-auto flex flex-col items-end gap-2">
            <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                    Item {currentItemIndex + 1} / {totalItems}
                </span>
                {(isSaving || hasPendingSave || currentItemMeta?.dirty) && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                    <Save className="h-3 w-3 text-white/50 animate-pulse" />
                    </motion.div>
                )}
            </div>
            <div
              role="progressbar"
              aria-label="Progress asesmen"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={normalizedProgress}
              aria-valuetext={`${normalizedProgress}% selesai`}
              className="w-32 h-1 bg-white/10 rounded-full overflow-hidden"
            >
                <motion.div 
                    className="h-full bg-emerald-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5 }}
                />
            </div>
        </div>
      </div>

        <RoomContent>
        <motion.div
          key={currentItem.item_id}
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="w-full max-w-3xl mx-auto space-y-4"
        >
          <h2 className="text-center text-lg font-semibold text-black">Instruksi</h2>
          <p className="text-center text-sm text-gray-700">
          Seret kartu atau ketuk angka 1-4 untuk memberi peringkat dari paling hingga paling tidak mencerminkan diri Anda.
          </p>
          <p
            className={`text-center text-xs ${
              isCurrentItemComplete ? 'text-emerald-600' : 'text-amber-600'
            }`}
          >
            {isCurrentItemComplete
              ? 'Item ini sudah lengkap.'
              : 'Pastikan ranking 1-4 unik sebelum melanjutkan.'}
          </p>
          {currentItem.type === 'Learning_Flexibility' ? (
            <LFIContextCard
              contextName={currentItem.context ?? currentItem.category ?? ''}
              stem={currentItem.prompt}
              options={currentItem.options.map((opt) => ({
                id: parseInt(opt.id),
                learning_mode: opt.option_code,
                text: opt.text,
              }))}
              currentRanks={currentItem.options.reduce((acc, opt) => {
                const rank = currentResponse?.ranks?.[opt.option_code];
                if (rank) acc[parseInt(opt.id)] = rank;
                return acc;
              }, {} as Record<number, number>)}
              onRankChange={(choiceId, rank) => {
                const option = currentItem.options.find((opt) => parseInt(opt.id) === choiceId);
                if (option) {
                  setRank(currentItem.item_id, option.option_code, rank);
                }
              }}
            />
          ) : (
            <RankingCard
              item={currentItem}
              response={currentResponse}
              onRankChange={(optionCode, rank) => {
                setRank(currentItem.item_id, optionCode, rank);
              }}
              onRanksCommitted={(ranks) => {
                setItemRanks(currentItem.item_id, ranks);
              }}
              isSaving={isSaving || hasPendingSave}
              isPending={Boolean(currentItemMeta?.dirty)}
              progress={progress}
            />
          )}
        </motion.div>
        </RoomContent>

      {/* Bottom Toolbar - Styled to match */}
      <div className="fixed bottom-0 left-0 right-0 p-6 z-50 pointer-events-none">
        <div className="max-w-4xl mx-auto flex items-center justify-between pointer-events-auto">
            <button
                onClick={prevItem}
                disabled={!canGoPrev}
              aria-label="Sebelumnya"
              className="p-4 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 backdrop-blur-md disabled:opacity-30 transition-all group"
            >
                <ChevronLeft className="w-6 h-6 text-white/70 group-hover:text-white" />
            </button>

            <button
                onClick={handleOpenGuide}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 backdrop-blur-md text-sm text-white/60 hover:text-white transition-all"
            >
                <HelpCircle className="w-4 h-4" />
                <span>Guide</span>
            </button>

            {canGoNext ? (
                <button
                    onClick={nextItem}
                aria-label="Selanjutnya"
                className="p-4 rounded-full bg-white text-black hover:scale-105 transition-transform shadow-lg shadow-white/10"
                >
                    <ChevronRight className="w-6 h-6" />
                </button>
            ) : (
                <button
                    onClick={handleReview}
                    disabled={!isComplete}
                    className="px-6 py-3 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    <CheckCircle className="w-5 h-5" />
                    <span>Finish</span>
                </button>
            )}
        </div>
      </div>

      {/* Task 8.9: Guide Modal */}
      <GuideModal
        guideId={GUIDE_IDS.ASSESSMENT_INSTRUCTIONS}
        title="Panduan Asesmen"
        isOpen={showGuideModal}
        onClose={() => setShowGuideModal(false)}
        context="assessment_page"
      />
    </PageShell>
  );
};