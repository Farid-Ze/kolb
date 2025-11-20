/**
 * KLSI 4.0 - useAssessment Hook
 * Task 27, 28, 30, 31, 32: State management dengan React Query autosave
 * Guidelines.md §6.1: Single Source of Truth (SSOT) for assessment state
 * 
 * Custom hook untuk manajemen state assessment dan autosave
 * Menggunakan useMutation untuk autosave dengan debounce
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getAssessmentItems, submitAnswers } from '../services/assessmentService';
import { toast } from 'sonner';
import type { AssessmentItem, ItemResponse, SubmitAnswersRequest } from '../types/api';

interface UseAssessmentParams {
  sessionId: string;
  onComplete?: () => void;
  enabled?: boolean;
}

interface UseAssessmentReturn {
  // Data
  items: AssessmentItem[];
  contexts: any[]; // Add contexts
  currentItem: AssessmentItem | null;
  currentItemIndex: number;
  totalItems: number;
  progress: number;
  
  // State
  responses: Record<string, ItemResponse>;
  isComplete: boolean;
  isLoading: boolean;
  isSaving: boolean;
  isError: boolean;
  error: Error | null;
  hasPendingSave: boolean;
  flushPendingSaves: () => Promise<void | undefined>;
  isAutosaveBusy: boolean;
  
  // Actions
  setRank: (itemId: string, optionCode: string, rank: number) => void;
  setItemRanks: (itemId: string, newRanks: Record<string, number>) => void;
  nextItem: () => void;
  prevItem: () => void;
  goToItem: (index: number) => void;
  
  // Validation
  canGoNext: boolean;
  canGoPrev: boolean;
  isCurrentItemComplete: boolean;
}

/**
 * Task 27-28: Main hook untuk assessment logic dengan React Query
 */
export const useAssessment = ({
  sessionId,
  onComplete,
  enabled = true,
}: UseAssessmentParams): UseAssessmentReturn => {
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, ItemResponse>>({});
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hydrationRef = useRef(false);
  const itemsRef = useRef<AssessmentItem[]>([]);
  const contextsRef = useRef<any[]>([]);
  const latestResponsesRef = useRef<Record<string, ItemResponse>>({});
  const saveQueueRef = useRef<{ payload: SubmitAnswersRequest; keepalive?: boolean } | null>(null);
  const flushResolversRef = useRef<Array<{ resolve: () => void; reject: (error: Error) => void }>>([]);
  const isProcessingQueueRef = useRef(false);
  const hasPendingSaveRef = useRef(false);
  const [hasPendingSave, setHasPendingSave] = useState(false);

  // Task 27: Query untuk fetch assessment items
  const {
    data: assessmentData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['assessment-items', sessionId],
    queryFn: () => getAssessmentItems(sessionId),
    staleTime: 60 * 1000, // Rehydrate regularly to keep state in sync
    refetchOnReconnect: true,
    refetchOnWindowFocus: 'always',
    refetchInterval: 3 * 60 * 1000,
    enabled,
  });

  const items = assessmentData?.items || [];
  const contexts = assessmentData?.contexts || []; // Get contexts
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);
  useEffect(() => {
    contextsRef.current = contexts;
  }, [contexts]);
  const totalItems = items.length;
  const currentItem = items[currentItemIndex] || null;

  // Task 30: Autosave mutation dengan debounce
  const autosaveMutation = useMutation({
    mutationFn: ({ payload, keepalive }: { payload: SubmitAnswersRequest; keepalive?: boolean }) => 
      submitAnswers(sessionId, payload, itemsRef.current, { keepalive }),
    onSuccess: () => {
      // Silent success untuk autosave
    },
    onError: (error: Error) => {
      toast.error('Gagal menyimpan progress: ' + error.message);
    },
  });

  const updatePendingSaveFlag = useCallback((next: boolean) => {
    if (hasPendingSaveRef.current === next) {
      return;
    }
    hasPendingSaveRef.current = next;
    setHasPendingSave(next);
  }, []);

  const settleFlushResolvers = useCallback((error?: Error) => {
    if (!flushResolversRef.current.length) {
      return;
    }
    const pending = [...flushResolversRef.current];
    flushResolversRef.current = [];
    pending.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  }, []);

  const processQueue = useCallback(() => {
    if (isProcessingQueueRef.current) {
      return;
    }
    const job = saveQueueRef.current;
    if (!job) {
      updatePendingSaveFlag(false);
      return;
    }

    saveQueueRef.current = null;
    isProcessingQueueRef.current = true;

    void autosaveMutation
      .mutateAsync({ payload: job.payload, keepalive: job.keepalive })
      .then(
        () => {
          isProcessingQueueRef.current = false;
          if (saveQueueRef.current) {
            processQueue();
          } else {
            updatePendingSaveFlag(false);
            settleFlushResolvers();
          }
        },
        (error: Error) => {
          isProcessingQueueRef.current = false;
          settleFlushResolvers(error);
          if (saveQueueRef.current) {
            processQueue();
          } else {
            updatePendingSaveFlag(false);
          }
        }
      );
  }, [autosaveMutation, settleFlushResolvers, updatePendingSaveFlag]);

  const enqueueAutosave = useCallback((payload: SubmitAnswersRequest, keepalive = false) => {
    saveQueueRef.current = { payload, keepalive };
    updatePendingSaveFlag(true);
    processQueue();
  }, [processQueue, updatePendingSaveFlag]);

  const buildSubmitPayload = useCallback(
    (responsesMap: Record<string, ItemResponse>): SubmitAnswersRequest => ({
      responses: Object.values(responsesMap),
      contexts: contextsRef.current,
    }),
    []
  );

  const hasCompletedResponses = useCallback(
    (values: ItemResponse[]) => values.some((response) => isCompleteRanks(response.ranks)),
    []
  );

  const scheduleAutosave = useCallback(
    (nextResponses: Record<string, ItemResponse>) => {
      if (!itemsRef.current.length) {
        return;
      }
      const payload = buildSubmitPayload(nextResponses);
      if (!hasCompletedResponses(payload.responses)) {
        return;
      }

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }

      saveTimeoutRef.current = setTimeout(() => {
        enqueueAutosave(payload);
      }, 2000);
    },
    [buildSubmitPayload, enqueueAutosave, hasCompletedResponses]
  );

  const flushPendingSaves = useCallback(async (): Promise<void | undefined> => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    const payload = buildSubmitPayload(latestResponsesRef.current);
    if (hasCompletedResponses(payload.responses)) {
      saveQueueRef.current = { payload, keepalive: false };
      updatePendingSaveFlag(true);
      processQueue();
    }

    if (!hasPendingSaveRef.current && !isProcessingQueueRef.current && !saveQueueRef.current) {
      return;
    }

    return new Promise<void>((resolve, reject) => {
      flushResolversRef.current.push({ resolve, reject });
    });
  }, [buildSubmitPayload, hasCompletedResponses, processQueue, updatePendingSaveFlag]);

  const flushWithKeepalive = useCallback(() => {
    if (!sessionId) {
      return;
    }
    const payload = buildSubmitPayload(latestResponsesRef.current);
    if (!hasCompletedResponses(payload.responses)) {
      return;
    }
    try {
      void submitAnswers(sessionId, payload, itemsRef.current, { keepalive: true });
    } catch {
      // Swallow errors; keepalive flush is best-effort only
    }
  }, [buildSubmitPayload, hasCompletedResponses, sessionId]);

  /**
   * Task 31: Set ranking untuk option tertentu dengan validation
   * React 19: Optimistic update for <100ms perceived speed
   */
  const setRank = useCallback(
    (itemId: string, optionCode: string, rank: number) => {
      if (rank < 1 || rank > 4) {
        toast.error('Ranking harus antara 1-4');
        return;
      }

      setResponses((prev) => {
        const currentResponse = prev[itemId] || { item_id: itemId, ranks: {} };
        const newRanks = { ...currentResponse.ranks };
        Object.keys(newRanks).forEach((key) => {
          if (newRanks[key] === rank && key !== optionCode) {
            delete newRanks[key];
          }
        });
        newRanks[optionCode] = rank;
        const next = {
          ...prev,
          [itemId]: {
            item_id: itemId,
            ranks: newRanks,
          },
        };
        latestResponsesRef.current = next;
        scheduleAutosave(next);
        return next;
      });
    },
    [scheduleAutosave]
  );

  /**
   * Task 6.7: Batch rank update (declarative)
   * Accepts complete new ranks object for an item
   */
  const setItemRanks = useCallback(
    (itemId: string, newRanks: Record<string, number>) => {
      setResponses((prev) => {
        const next = {
          ...prev,
          [itemId]: {
            item_id: itemId,
            ranks: newRanks,
          },
        };
        latestResponsesRef.current = next;
        scheduleAutosave(next);
        return next;
      });
    },
    [scheduleAutosave]
  );

  /**
   * Task 32: Navigate to next item
   */
  const nextItem = useCallback(() => {
    setCurrentItemIndex((prev) => Math.min(prev + 1, totalItems - 1));
  }, [totalItems]);

  /**
   * Navigate to previous item
   */
  const prevItem = useCallback(() => {
    setCurrentItemIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  /**
   * Go to specific item by index
   */
  const goToItem = useCallback((index: number) => {
    setCurrentItemIndex(Math.max(0, Math.min(index, totalItems - 1)));
  }, [totalItems]);

  /**
   * Check if current item is complete (all 4 options ranked with 1,2,3,4)
   */
  const isCurrentItemComplete = 
    currentItem 
      ? (() => {
          const response = responses[currentItem.item_id];
          if (!response || !response.ranks) return false;
          
          const ranks = Object.values(response.ranks);
          const hasAllRanks = ranks.length === 4;
          const hasUniqueRanks = new Set(ranks).size === 4;
          const hasValidRanks = ranks.every(r => r >= 1 && r <= 4);
          
          return hasAllRanks && hasUniqueRanks && hasValidRanks;
        })()
      : false;

  // Calculate progress
  const completedItems = items.filter((item: AssessmentItem) => {
    const response = responses[item.item_id];
    if (!response || !response.ranks) return false;
    const ranks = Object.values(response.ranks);
    return ranks.length === 4 && new Set(ranks).size === 4;
  }).length;
  
  const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
  const canGoNext = currentItemIndex < totalItems - 1;
  const canGoPrev = currentItemIndex > 0;
  const isComplete = completedItems === totalItems && totalItems > 0;

  // Check completion and trigger callback
  useEffect(() => {
    if (isComplete && onComplete) {
      onComplete();
    }
  }, [isComplete, onComplete]);

  useEffect(() => {
    setResponses({});
    setCurrentItemIndex(0);
    hydrationRef.current = false;
    latestResponsesRef.current = {};
    saveQueueRef.current = null;
    isProcessingQueueRef.current = false;
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    updatePendingSaveFlag(false);
  }, [sessionId, updatePendingSaveFlag]);

  useEffect(() => {
    if (!assessmentData || hydrationRef.current) {
      return;
    }
    if (typeof assessmentData.current_item_index === 'number') {
      const clamped = Math.max(0, Math.min(assessmentData.current_item_index, Math.max(totalItems - 1, 0)));
      setCurrentItemIndex(clamped);
    }
    if (assessmentData.responses?.length) {
      const mapped = assessmentData.responses.reduce<Record<string, ItemResponse>>((acc, response) => {
        acc[response.item_id] = response;
        return acc;
      }, {});
      setResponses(mapped);
      latestResponsesRef.current = mapped;
    }
    hydrationRef.current = true;
  }, [assessmentData, totalItems]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      void flushPendingSaves();
    };
  }, [flushPendingSaves]);

  useEffect(() => {
    if (!sessionId) {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasPendingSaveRef.current) {
        return;
      }
      flushWithKeepalive();
      event.preventDefault();
      event.returnValue = '';
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && hasPendingSaveRef.current) {
        flushWithKeepalive();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [flushWithKeepalive, sessionId]);

  return {
    // Data
    items,
    contexts,
    currentItem,
    currentItemIndex,
    totalItems,
    progress,
    
    // State
    responses,
    isComplete,
    isLoading,
    isError,
    error: (error as Error) ?? null,
    isSaving: autosaveMutation.isPending,
    hasPendingSave,
    flushPendingSaves,
    isAutosaveBusy: hasPendingSave || autosaveMutation.isPending,
    
    // Actions
    setRank,
    setItemRanks,
    nextItem,
    prevItem,
    goToItem,
    
    // Validation
    canGoNext,
    canGoPrev,
    isCurrentItemComplete,
  };
};

const isCompleteRanks = (ranks: Record<string, number>): boolean => {
  const values = Object.values(ranks ?? {});
  if (values.length !== 4) return false;
  if (new Set(values).size !== 4) return false;
  return values.every((value) => value >= 1 && value <= 4);
};