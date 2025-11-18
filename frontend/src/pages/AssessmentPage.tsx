/**
 * KLSI 4.0 - AssessmentPage
 * Task 31-32: Assessment UI dengan drag-and-drop + button ranking
 * 
 * Implementasi sesuai Guidelines.md & frontend_blueprint.md:
 * - AssessmentLayout dengan LargeTitleHeader
 * - Navigation & control layer menggunakan glass-regular
 * - Content layer menggunakan material-regular
 * - BottomToolbar untuk navigasi (Zona Hijau)
 * - Spring-based animations
 * - React Query untuk data fetching dan autosave
 * - Drag-and-drop support dengan @dnd-kit (Task 31)
 */

import React, { useCallback, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAssessment } from '../hooks/useAssessment';
import { RankingItem } from '../components/assessment/RankingItem';
import { ProgressBar } from '../components/assessment/ProgressBar';
import { Skeleton } from '../components/ui/skeleton';
import { GuideModal } from '../components/common/GuideModal';
import { GUIDE_IDS } from '../services/guideService';
import { toast } from 'sonner';
import { MorphingIcon } from '../components/ui/MorphingIcon';
import { BottomToolbar, BottomToolbarButton } from '../components/ui/BottomToolbar';
import { 
  ChevronLeft, 
  ChevronRight, 
  HelpCircle, 
  Save,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

export const AssessmentPage: React.FC = () => {
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();
  const [dragMode, setDragMode] = useState(false); // Toggle drag mode
  const [showGuideModal, setShowGuideModal] = useState(false); // Task 8.9: Guide modal state

  // Task 27, 28, 30, 31, 32: useAssessment hook dengan React Query
  const {
    items,
    currentItem,
    currentItemIndex,
    totalItems,
    progress,
    responses,
    isComplete,
    isLoading,
    isSaving,
    setRank,
    setItemRanks,
    nextItem,
    prevItem,
    goToItem,
    canGoNext,
    canGoPrev,
    isCurrentItemComplete,
  } = useAssessment({
    sessionId: sessionId!,
    onComplete: () => {
      toast.success('Semua item telah dijawab! Silahkan review jawaban Anda.');
    },
  });

  // Spring configuration (Guidelines.md Section 2.3.1)
  const springConfig = {
    type: "spring" as const,
    stiffness: 300,
    damping: 20,
  };

  // Task 31: Setup drag-and-drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement to activate drag (prevents accidental drags)
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Task 31: Sortable options array (sorted by current rank)
  const sortedOptions = currentItem 
    ? [...currentItem.options].sort((a, b) => {
        const rankA = responses[currentItem.item_id]?.ranks?.[a.option_code] || 999;
        const rankB = responses[currentItem.item_id]?.ranks?.[b.option_code] || 999;
        return rankA - rankB;
      })
    : [];

  // Task 31: Handle drag end - reassign ranks based on new order (Task 6.5: Declarative)
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || !currentItem) return;
    
    if (active.id !== over.id) {
      const oldIndex = sortedOptions.findIndex(opt => opt.option_code === active.id);
      const newIndex = sortedOptions.findIndex(opt => opt.option_code === over.id);
      
      const newOrder = arrayMove(sortedOptions, oldIndex, newIndex);
      
      // Task 6.5: Declarative batch update - compute new ranks object
      const newRanks: Record<string, number> = {};
      newOrder.forEach((option, index) => {
        newRanks[option.option_code] = index + 1;
      });
      
      // Single state update (declarative)
      setItemRanks(currentItem.item_id, newRanks);
      
      toast.success('Urutan diperbarui!', { duration: 1000 });
    }
  }, [currentItem, sortedOptions, setItemRanks]);

  // Handler untuk kembali
  const handleBack = useCallback(() => {
    if (window.confirm('Apakah Anda yakin ingin keluar? Progress Anda telah tersimpan otomatis.')) {
      navigate('/');
    }
  }, [navigate]);

  // Handler untuk review
  const handleReview = useCallback(() => {
    if (!isComplete) {
      const unansweredCount = totalItems - Math.floor(progress / 100 * totalItems);
      toast.error(`Masih ada ${unansweredCount} item yang belum dijawab lengkap`);
      return;
    }
    navigate(`/assessment/${sessionId}/review`);
  }, [isComplete, totalItems, progress, sessionId, navigate]);

  // Task 8.9: Handler untuk buka panduan
  const handleOpenGuide = useCallback(() => {
    setShowGuideModal(true);
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/10 to-background">
        <div role="status" aria-live="polite" className="sr-only">Memuat asesmen...</div>
        <header className="glass-regular sticky top-0 z-50 border-b border-border">
          <div className="mx-auto max-w-4xl p-4">
            <Skeleton className="mb-2 h-8 w-[200px]" />
            <Skeleton className="mb-4 h-5 w-[150px]" />
            <Skeleton className="h-2 w-full" />
          </div>
        </header>
        <main className="mx-auto max-w-4xl p-6 space-y-6">
          <Skeleton className="h-[100px] w-full" />
          <Skeleton className="h-[150px] w-full" />
          <div className="space-y-4">
            <Skeleton className="h-[120px] w-full" />
            <Skeleton className="h-[120px] w-full" />
            <Skeleton className="h-[120px] w-full" />
            <Skeleton className="h-[120px] w-full" />
          </div>
        </main>
      </div>
    );
  }

  // Error state (no items)
  if (!currentItem || totalItems === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/10 to-background flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={springConfig}
          className="material-regular rounded-xl p-8 max-w-md text-center space-y-4"
        >
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 mx-auto">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="text-foreground">Data Tidak Ditemukan</h2>
          <p className="text-muted-foreground">
            Tidak ada item asesmen yang tersedia untuk sesi ini.
          </p>
          <motion.button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-6 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring touch-manipulation"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={springConfig}
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Beranda
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/10 to-background">
      {/* Header dengan Glass Material (Guidelines §4.2 - Navigation Layer) */}
      <header className="glass-regular sticky top-0 z-50 border-b border-border">
        <div className="mx-auto max-w-4xl p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <motion.button
                onClick={handleBack}
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded touch-manipulation"
                whileHover={{ x: -4 }}
                transition={springConfig}
                aria-label="Kembali"
              >
                <ArrowLeft className="h-5 w-5" />
              </motion.button>
              <div>
                <h1 className="text-foreground">KLSI 4.0 Assessment</h1>
                <p className="text-muted-foreground">
                  Item {currentItemIndex + 1} dari {totalItems}
                </p>
              </div>
            </div>
            
            {/* Save indicator (Task 30: Autosave visual feedback) */}
            <div className="flex items-center gap-2">
              {isSaving && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 text-muted-foreground"
                >
                  <Save className="h-4 w-4 animate-pulse" />
                  <span>Menyimpan...</span>
                </motion.div>
              )}
            </div>
          </div>

          {/* Progress Bar - Task 31 */}
          <ProgressBar
            current={Math.floor(progress / 100 * totalItems)}
            total={totalItems}
            label={`Progress: ${Math.round(progress)}%`}
          />
        </div>
      </header>

      {/* Main Content - Material Regular (Guidelines §4.3 - Content Layer) */}
      <main className="mx-auto max-w-4xl p-6 pb-32">
        {/* Instructions Banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springConfig}
          className="material-thin rounded-xl p-6 border-l-4 border-l-chart-2 mb-6"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <HelpCircle className="h-5 w-5 text-chart-2 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h3 className="text-foreground">Instruksi</h3>
                <p className="text-muted-foreground">
                  {dragMode ? (
                    <>
                      <strong>Drag Mode:</strong> Seret opsi untuk mengurutkannya, atau gunakan tombol ranking.
                    </>
                  ) : (
                    <>
                      Klik tombol <strong>1 (paling sesuai)</strong> hingga{' '}
                      <strong>4 (paling tidak sesuai)</strong> untuk setiap pernyataan.
                    </>
                  )}
                </p>
              </div>
            </div>
            
            {/* Task 31: Toggle drag mode */}
            <motion.button
              onClick={() => setDragMode(!dragMode)}
              className={`
                flex-shrink-0 inline-flex items-center gap-2 rounded-lg px-4 py-2
                ${dragMode 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-secondary text-secondary-foreground'
                }
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                touch-manipulation
              `}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={springConfig}
              aria-label={dragMode ? 'Disable drag mode' : 'Enable drag mode'}
            >
              <MorphingIcon
                variant="drag-button"
                isActive={dragMode}
                size={16}
                color="currentColor"
                className="pointer-events-none"
              />
              <span className="hidden sm:inline">
                {dragMode ? 'Drag Mode' : 'Button Mode'}
              </span>
            </motion.button>
          </div>
        </motion.div>

        {/* Current Item (Task 31: RankingItem implementation) */}
        <motion.div
          key={currentItem.item_id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={springConfig}
          className="space-y-6"
        >
          {/* Item Prompt */}
          <div className="material-regular rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                {currentItemIndex + 1}
              </div>
              <div className="flex-1">
                <h2 className="text-foreground">
                  {currentItem.prompt || 'Ketika saya belajar...'}
                </h2>
              </div>
            </div>
          </div>

          {/* Ranking Items - Task 31: Drag-and-drop OR button ranking */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sortedOptions.map(opt => opt.option_code)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-4">
                {(dragMode ? sortedOptions : currentItem.options).map((option) => (
                  <RankingItem
                    key={option.option_code}
                    dragId={option.option_code}
                    mode={{
                      mode: option.option_code,
                      statement: option.text,
                      rank: responses[currentItem.item_id]?.ranks?.[option.option_code],
                    }}
                    onRankChange={(optionCode, rank) => {
                      setRank(currentItem.item_id, optionCode, rank);
                    }}
                    isDraggable={dragMode}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {/* Task 32: Completion indicator */}
          {isCurrentItemComplete && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={springConfig}
              className="flex items-center justify-center gap-2 text-chart-4 py-4"
            >
              <CheckCircle className="h-5 w-5" />
              <span>Item ini sudah lengkap</span>
            </motion.div>
          )}
        </motion.div>

        {/* Item Navigation Dots (Optional) */}
        <div className="mt-8 flex items-center justify-center gap-2">
          {items.slice(0, Math.min(totalItems, 12)).map((item, idx) => {
            const itemResponse = responses[item.item_id];
            const isAnswered = itemResponse && 
              Object.keys(itemResponse.ranks || {}).length === 4;
            const isCurrent = idx === currentItemIndex;
            
            return (
              <motion.button
                key={item.item_id}
                onClick={() => goToItem(idx)}
                className={`
                  h-2 rounded-full transition-all touch-manipulation
                  ${isCurrent ? 'w-8 bg-primary' : 'w-2'}
                  ${isAnswered && !isCurrent ? 'bg-chart-4' : ''}
                  ${!isAnswered && !isCurrent ? 'bg-border' : ''}
                `}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                transition={springConfig}
                aria-label={`Go to item ${idx + 1}`}
              />
            );
          })}
          {totalItems > 12 && (
            <span className="text-muted-foreground ml-2">
              +{totalItems - 12} lagi
            </span>
          )}
        </div>
      </main>

      {/* Bottom Toolbar - Task 32 (Guidelines §1.3.2 - Zona Hijau, §4.2 - Glass Material) */}
      <BottomToolbar>
        <BottomToolbarButton
          onClick={prevItem}
          disabled={!canGoPrev}
          className="inline-flex items-center gap-2 rounded-xl bg-secondary text-secondary-foreground px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring touch-manipulation"
        >
          <ChevronLeft className="h-5 w-5" />
          <span className="hidden sm:inline">Sebelumnya</span>
        </BottomToolbarButton>

        {/* Center Info */}
        <div className="flex items-center gap-2 text-muted-foreground">
          <span className="hidden md:inline">
            {Math.round(progress)}% selesai
          </span>
          
          {/* Task 8.9: Help Button untuk buka panduan */}
          <motion.button
            onClick={handleOpenGuide}
            className="inline-flex items-center gap-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring touch-manipulation"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={springConfig}
            aria-label="Bantuan"
          >
            <HelpCircle className="h-5 w-5" />
            <span className="hidden lg:inline">Bantuan</span>
          </motion.button>
        </div>

        {/* Next/Review Button - Task 32 */}
        {canGoNext ? (
          <BottomToolbarButton
            onClick={nextItem}
            className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-6 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring touch-manipulation"
          >
            <span className="hidden sm:inline">Selanjutnya</span>
            <ChevronRight className="h-5 w-5" />
          </BottomToolbarButton>
        ) : (
          <BottomToolbarButton
            onClick={handleReview}
            disabled={!isComplete}
            className="inline-flex items-center gap-2 rounded-xl bg-chart-4 text-primary-foreground px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring touch-manipulation"
          >
            <CheckCircle className="h-5 w-5" />
            <span>Review & Selesai</span>
          </BottomToolbarButton>
        )}
      </BottomToolbar>

      {/* Task 8.9: Guide Modal untuk student_profile.md */}
      <GuideModal
        guideId={GUIDE_IDS.ASSESSMENT_INSTRUCTIONS}
        title="Panduan Asesmen"
        isOpen={showGuideModal}
        onClose={() => setShowGuideModal(false)}
        context="assessment_page"
      />
    </div>
  );
};