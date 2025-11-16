/**
 * KLSI 4.0 - useOptimisticSubmit Hook
 * Task TODO3.md Phase 4: Optimistic UI for instant feedback
 * 
 * Guidelines.md §2.4.1: <100ms perceived as instant
 * Note: React 19 useOptimistic not yet available - using standard approach
 */

import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';

interface UseOptimisticSubmitOptions<TData, TVariables> {
  mutationFn: (variables: TVariables) => Promise<TData>;
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: Error, variables: TVariables) => void;
  optimisticUpdater?: (state: TData | null, variables: TVariables) => TData;
}

/**
 * useOptimisticSubmit - Hook for instant form submissions with optimistic updates
 * 
 * Guidelines.md §2.4.1: <100ms perceived as instant
 * - Immediately shows optimistic state
 * - Reverts only if mutation fails
 * 
 * @example
 * const { data, submit, isOptimistic } = useOptimisticSubmit({
 *   mutationFn: updateProfile,
 *   optimisticUpdater: (current, newData) => ({ ...current, ...newData }),
 * });
 */
export function useOptimisticSubmit<TData = unknown, TVariables = unknown>({
  mutationFn,
  onSuccess,
  onError,
  optimisticUpdater,
}: UseOptimisticSubmitOptions<TData, TVariables>) {
  const [optimisticData, setOptimisticData] = useState<TData | null>(null);
  const [previousData, setPreviousData] = useState<TData | null>(null);

  const mutation = useMutation({
    mutationFn,
    onSuccess: (data, variables) => {
      // Update with real data after success
      setOptimisticData(data);
      setPreviousData(data);
      onSuccess?.(data, variables);
    },
    onError: (error: Error, variables) => {
      // Revert to previous state on error
      setOptimisticData(previousData);
      onError?.(error, variables);
    },
  });

  const submit = useCallback((variables: TVariables) => {
    // Save current state for revert
    setPreviousData(optimisticData);
    
    // Apply optimistic update immediately (<100ms)
    if (optimisticUpdater) {
      const newData = optimisticUpdater(optimisticData, variables);
      setOptimisticData(newData);
    }
    
    // Trigger mutation
    mutation.mutate(variables);
  }, [mutation, optimisticData, optimisticUpdater]);

  return {
    data: optimisticData,
    submit,
    isOptimistic: mutation.isPending,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  };
}
