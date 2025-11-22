/**
 * KLSI 4.0 - useAssessment Hook
 * Task 27, 28, 30, 31, 32: State management dengan React Query autosave
 * Guidelines.md §6.1: Single Source of Truth (SSOT) for assessment state
 * 
 * Custom hook untuk manajemen state assessment dan autosave
 * Menggunakan useMutation untuk autosave dengan debounce
 */

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { submitAnswers, getAssessmentItems } from '../services/assessmentService';
import { api } from '../core/api/client';
import { toast } from 'sonner';
import type { AssessmentContextRank, AssessmentItem, GetAssessmentItemsResponse, ItemResponse, SubmitAnswersRequest } from '../types/api';
import { useAssessmentStore, selectResponses, selectResponseMeta, isCompleteRanks } from '../stores/assessmentStore';
import type { ResponseMeta } from '../stores/assessmentStore';

interface UseAssessmentParams {
  sessionId: string;
  onComplete?: () => void;
  enabled?: boolean;
}

interface UseAssessmentReturn {
  // Data
  items: AssessmentItem[];
  contexts: AssessmentContextRank[];
  currentItem: AssessmentItem | null;
  currentItemIndex: number;
  totalItems: number;
  progress: number;
  
  // State
  responses: Record<string, ItemResponse>;
  responseMeta: Record<string, ResponseMeta>;
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
  const responses = useAssessmentStore(selectResponses);
  const responseMeta = useAssessmentStore(selectResponseMeta);
  const hydrateStore = useAssessmentStore((state) => state.hydrateFromServer);
  const resetStore = useAssessmentStore((state) => state.reset);
  const setRankInStore = useAssessmentStore((state) => state.setRank);
  const setItemRanksInStore = useAssessmentStore((state) => state.setItemRanks);
  const markItemSynced = useAssessmentStore((state) => state.markSynced);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hydrationRef = useRef(false);
  const itemsRef = useRef<AssessmentItem[]>([]);
  const contextsRef = useRef<AssessmentContextRank[]>([]);
  const latestResponsesRef = useRef<Record<string, ItemResponse>>({});
  const saveQueueRef = useRef<{ payload: SubmitAnswersRequest; keepalive?: boolean; changedItemId?: string } | null>(null);
  const flushResolversRef = useRef<Array<{ resolve: () => void; reject: (error: Error) => void }>>([]);
  const isProcessingQueueRef = useRef(false);
  const hasPendingSaveRef = useRef(false);
  const [hasPendingSave, setHasPendingSave] = useState(false);
  const queryClient = useQueryClient();

  // Task 27: Query untuk fetch assessment items
  const {
    data: assessmentData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['assessment-items', sessionId],
    queryFn: async () => {
      try {
        const result = await getAssessmentItems(sessionId);
        return result;
      } catch (err) {
        console.error('Failed to fetch assessment items:', err);
        throw err;
      }
    },
    staleTime: 60 * 1000, // Rehydrate regularly to keep state in sync
    refetchOnReconnect: true,
    refetchOnWindowFocus: 'always',
    refetchInterval: 3 * 60 * 1000,
    enabled,
  });

  const items = useMemo(() => assessmentData?.items ?? [], [assessmentData]);
  const contexts = useMemo<AssessmentContextRank[]>(() => assessmentData?.contexts ?? [], [assessmentData]);
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
    mutationFn: async ({ payload, keepalive, changedItemId }: { payload: SubmitAnswersRequest; keepalive?: boolean; changedItemId?: string }) => {
      if (changedItemId) {
        const response = payload.responses.find((r) => String(r.item_id) === changedItemId);
        if (response && isCompleteRanks(response.ranks)) {
          return api.submitSingleResponse(Number(sessionId), {
            item_id: Number(response.item_id),
            response_map: response.ranks,
            timestamp: new Date().toISOString(),
          });
        }
      }
      // Fallback to legacy submitAnswers for batch/context
      const { submitAnswers } = await import('../services/assessmentService');
      return submitAnswers(sessionId, payload, itemsRef.current, { keepalive });
    },
    onSuccess: (_data, variables) => {
      if (variables?.changedItemId) {
        markItemSynced(variables.changedItemId);
        return;
      }
      variables?.payload.responses.forEach((response) => {
        if (isCompleteRanks(response.ranks)) {
          markItemSynced(String(response.item_id));
        }
      });
    },
    onMutate: async ({ payload }) => {
      await queryClient.cancelQueries({ queryKey: ['assessment-items', sessionId] });
      const previousData = queryClient.getQueryData<GetAssessmentItemsResponse>(['assessment-items', sessionId]);

      queryClient.setQueryData(['assessment-items', sessionId], (old: GetAssessmentItemsResponse | undefined) => {
        if (!old) {
          return old;
        }
        const newResponses = payload.responses;
        const responseMap = new Map<string, ItemResponse>((old.responses ?? []).map((r) => [String(r.item_id), r]));
        newResponses.forEach((nr) => responseMap.set(String(nr.item_id), nr));
        return { ...old, responses: Array.from(responseMap.values()) };
      });

      return { previousData };
    },
    onError: (error: Error, _, context) => {
      toast.error('Gagal menyimpan progress: ' + error.message);
      if (context?.previousData) {
        queryClient.setQueryData(['assessment-items', sessionId], context.previousData);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['assessment-items', sessionId] });
    },
  });

  const updatePendingSaveFlag = useCallback((next: boolean) => {
    if (hasPendingSaveRef.current === next) {
      return;
    }
    hasPendingSaveRef.current = next;
    setHasPendingSave(next);
  }, []);

  const settleFlushResolvers = useCallback(() => {
    flushResolversRef.current.forEach(({ resolve }) => resolve());
    flushResolversRef.current = [];
  }, []);

  const processQueue = useCallback(async () => {
    if (isProcessingQueueRef.current || !saveQueueRef.current) {
      if (!isProcessingQueueRef.current && !saveQueueRef.current) {
        settleFlushResolvers();
      }
      return;
    }

    isProcessingQueueRef.current = true;
    const { payload, keepalive } = saveQueueRef.current;
    saveQueueRef.current = null; // Clear queue immediately to allow new updates

    try {
      await autosaveMutation.mutateAsync({ payload, keepalive });
      
      // If more items were queued while processing, process them
      if (saveQueueRef.current) {
        isProcessingQueueRef.current = false;
        processQueue();
      } else {
        isProcessingQueueRef.current = false;
        updatePendingSaveFlag(false);
        settleFlushResolvers();
      }
    } catch (error) {
      console.error('Autosave failed:', error);
      isProcessingQueueRef.current = false;
      // Don't clear pending flag on error so we can retry
      
      // Reject flush resolvers if we can't save
      if (!keepalive) {
        flushResolversRef.current.forEach(({ reject }) => reject(error instanceof Error ? error : new Error(String(error))));
        flushResolversRef.current = [];
      }
    }
  }, [autosaveMutation, settleFlushResolvers, updatePendingSaveFlag]);

  const enqueueAutosave = useCallback((payload: SubmitAnswersRequest, keepalive = false, changedItemId?: string) => {
    saveQueueRef.current = { payload, keepalive, changedItemId };
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
    (nextResponses: Record<string, ItemResponse>, changedItemId?: string) => {
      if (!itemsRef.current.length) {
        return;
      }
      const payload = buildSubmitPayload(nextResponses);
      if (!hasCompletedResponses(payload.responses)) {
        return;
      }

      const eligibleItemId = changedItemId && isCompleteRanks(nextResponses[changedItemId]?.ranks ?? {})
        ? changedItemId
        : undefined;

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }

      saveTimeoutRef.current = setTimeout(() => {
        enqueueAutosave(payload, false, eligibleItemId);
      }, 500);
    },
    [buildSubmitPayload, enqueueAutosave, hasCompletedResponses]
  );

  const flushPendingSaves = useCallback(async (): Promise<void | undefined> => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    const payload = buildSubmitPayload(latestResponsesRef.current);
    const hasCompleted = hasCompletedResponses(payload.responses);

    if (hasCompleted) {
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
      setRankInStore(itemId, optionCode, rank);
      const next = useAssessmentStore.getState().responses;
      latestResponsesRef.current = next;
      scheduleAutosave(next, itemId);
    },
    [scheduleAutosave, setRankInStore]
  );

  /**
   * Task 6.7: Batch rank update (declarative)
   * Accepts complete new ranks object for an item
   */
  const setItemRanks = useCallback(
    (itemId: string, newRanks: Record<string, number>) => {
      setItemRanksInStore(itemId, newRanks);
      const next = useAssessmentStore.getState().responses;
      latestResponsesRef.current = next;
      scheduleAutosave(next, itemId);
    },
    [scheduleAutosave, setItemRanksInStore]
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
  const canGoNext = currentItemIndex < totalItems - 1 && isCurrentItemComplete;
  const canGoPrev = currentItemIndex > 0;
  const isComplete = completedItems === totalItems && totalItems > 0;

  // Check completion and trigger callback
  useEffect(() => {
    if (isComplete && onComplete) {
      onComplete();
    }
  }, [isComplete, onComplete]);

  useEffect(() => {
    resetStore();
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
  }, [resetStore, sessionId, updatePendingSaveFlag]);

  useEffect(() => {
    if (!assessmentData || hydrationRef.current) {
      return;
    }
    if (typeof assessmentData.current_item_index === 'number') {
      const clamped = Math.max(0, Math.min(assessmentData.current_item_index, Math.max(totalItems - 1, 0)));
      setCurrentItemIndex(clamped);
    }
    if (assessmentData.responses?.length) {
      hydrateStore(assessmentData.responses, { force: true });
      latestResponsesRef.current = useAssessmentStore.getState().responses;
    }
    hydrationRef.current = true;
  }, [assessmentData, hydrateStore, totalItems]);

  useEffect(() => {
    latestResponsesRef.current = responses;
  }, [responses]);

  // Cleanup timeout on unmount
  const flushWithKeepaliveRef = useRef(flushWithKeepalive);
  useEffect(() => {
    flushWithKeepaliveRef.current = flushWithKeepalive;
  }, [flushWithKeepalive]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      flushWithKeepaliveRef.current();
    };
  }, []);

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
    responseMeta,
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

