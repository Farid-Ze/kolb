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
import { toast } from 'sonner@2.0.3';
import type { AssessmentItem, ItemResponse, SubmitAnswersRequest } from '../types/api';

interface UseAssessmentParams {
  sessionId: string;
  onComplete?: () => void;
}

interface UseAssessmentReturn {
  // Data
  items: AssessmentItem[];
  currentItem: AssessmentItem | null;
  currentItemIndex: number;
  totalItems: number;
  progress: number;
  
  // State
  responses: Record<string, ItemResponse>;
  isComplete: boolean;
  isLoading: boolean;
  isSaving: boolean;
  
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
}: UseAssessmentParams): UseAssessmentReturn => {
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, ItemResponse>>({});
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Task 27: Query untuk fetch assessment items
  const { data: assessmentData, isLoading } = useQuery({
    queryKey: ['assessment-items', sessionId],
    queryFn: () => getAssessmentItems(sessionId),
    staleTime: Infinity, // Items don't change during session
  });

  const items = assessmentData?.items || [];
  const totalItems = items.length;
  const currentItem = items[currentItemIndex] || null;

  // Task 30: Autosave mutation dengan debounce
  const autosaveMutation = useMutation({
    mutationFn: (payload: SubmitAnswersRequest) => 
      submitAnswers(sessionId, payload),
    onSuccess: () => {
      // Silent success untuk autosave
    },
    onError: (error: Error) => {
      toast.error('Gagal menyimpan progress: ' + error.message);
    },
  });

  /**
   * Task 31: Set ranking untuk option tertentu dengan validation
   * React 19: Optimistic update for <100ms perceived speed
   */
  const setRank = useCallback(
    (itemId: string, optionCode: string, rank: number) => {
      // Validate rank (1-4)
      if (rank < 1 || rank > 4) {
        toast.error('Ranking harus antara 1-4');
        return;
      }

      const currentResponse = responses[itemId] || {
        item_id: itemId,
        ranks: {},
      };

      // Remove any existing option with this rank (swap logic)
      const newRanks = { ...currentResponse.ranks };
      Object.keys(newRanks).forEach((key) => {
        if (newRanks[key] === rank && key !== optionCode) {
          delete newRanks[key]; // Clear duplicate rank
        }
      });

      // Set new rank
      newRanks[optionCode] = rank;

      const newResponse: ItemResponse = {
        item_id: itemId,
        ranks: newRanks,
      };

      // Apply optimistic update immediately (<100ms perceived speed)
      setResponses((prev) => ({
        ...prev,
        [itemId]: newResponse,
      }));

      // Task 30: Trigger autosave (debounced)
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        const allResponses = {
          ...responses,
          [itemId]: newResponse,
        };
        const payload: SubmitAnswersRequest = {
          responses: Object.values(allResponses),
        };
        autosaveMutation.mutate(payload);
      }, 2000); // Autosave setelah 2 detik idle
    },
    [responses, autosaveMutation]
  );

  /**
   * Task 6.7: Batch rank update (declarative)
   * Accepts complete new ranks object for an item
   */
  const setItemRanks = useCallback(
    (itemId: string, newRanks: Record<string, number>) => {
      const newResponse: ItemResponse = {
        item_id: itemId,
        ranks: newRanks,
      };

      // Apply optimistic update immediately
      setResponses((prev) => ({
        ...prev,
        [itemId]: newResponse,
      }));

      // Trigger autosave (debounced)
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        const allResponses = {
          ...responses,
          [itemId]: newResponse,
        };
        const payload: SubmitAnswersRequest = {
          responses: Object.values(allResponses),
        };
        autosaveMutation.mutate(payload);
      }, 2000);
    },
    [responses, autosaveMutation]
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
  const completedItems = items.filter((item) => {
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

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    // Data
    items,
    currentItem,
    currentItemIndex,
    totalItems,
    progress,
    
    // State
    responses,
    isComplete,
    isLoading,
    isSaving: autosaveMutation.isPending,
    
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