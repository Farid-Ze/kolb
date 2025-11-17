/**
 * KLSI 4.0 - useOptimisticLike Hook
 * Task TODO2.md Phase 3.6: Optimistic UI untuk like button
 * 
 * Implementasi sesuai Guidelines.md §2.4.2:
 * - Response < 100ms (instant perceived speed)
 * - Optimistic UI: Assume success
 * - Revert jika mutation gagal
 * - Manage ekspektasi pengguna
 * 
 * Uses React 18 useOptimistic pattern (precursor to React 19)
 */

import { useState, useCallback, useTransition } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api';

interface LikeState {
  isLiked: boolean;
  likeCount: number;
}

interface UseOptimisticLikeOptions {
  /** Resource type (report, comment, dll) */
  resourceType: string;
  /** Resource ID */
  resourceId: string;
  /** Initial state */
  initialState: LikeState;
  /** Optional callback on success */
  onSuccess?: () => void;
  /** Optional callback on error */
  onError?: (error: Error) => void;
}

interface UseOptimisticLikeReturn {
  /** Current like state (optimistic) */
  state: LikeState;
  /** Toggle like action */
  toggleLike: () => void;
  /** Is mutation in flight */
  isPending: boolean;
  /** Is reverting after error */
  isReverting: boolean;
}

/**
 * useOptimisticLike - Instant like/unlike dengan optimistic updates
 * 
 * Guidelines.md §2.4.2:
 * - Updates UI instantly (<100ms perceived)
 * - No spinner/loader - assume success
 * - Silently reverts on error
 * - Toast notification jika gagal
 * 
 * Technical implementation:
 * - useTransition untuk non-blocking state update
 * - useMutation dengan onMutate optimistic update
 * - onError rollback to previous state
 * 
 * @example
 * const { state, toggleLike, isPending } = useOptimisticLike({
 *   resourceType: 'report',
 *   resourceId: reportId,
 *   initialState: { isLiked: false, likeCount: 5 }
 * });
 * 
 * return (
 *   <button onClick={toggleLike}>
 *     {state.isLiked ? 'Unlike' : 'Like'} ({state.likeCount})
 *   </button>
 * );
 */
export const useOptimisticLike = ({
  resourceType,
  resourceId,
  initialState,
  onSuccess,
  onError,
}: UseOptimisticLikeOptions): UseOptimisticLikeReturn => {
  const [isPending, startTransition] = useTransition();
  const [isReverting, setIsReverting] = useState(false);
  
  // Optimistic state (displayed immediately)
  const [optimisticState, setOptimisticState] = useState<LikeState>(initialState);
  
  // Server state (source of truth after mutation completes)
  const [serverState, setServerState] = useState<LikeState>(initialState);

  const queryClient = useQueryClient();

  // Mutation for like/unlike
  const likeMutation = useMutation({
    mutationFn: async (newState: LikeState) => {
      const endpoint = `/api/${resourceType}/${resourceId}/like`;
      
      if (newState.isLiked) {
        return apiClient.post(endpoint);
      } else {
        return apiClient.delete(endpoint);
      }
    },
    // Optimistic update (Guidelines §2.4.2)
    onMutate: async (newState: LikeState) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ 
        queryKey: [resourceType, resourceId, 'likes'] 
      });

      // Snapshot previous value
      const previousState = serverState;

      // Optimistically update (instant <100ms)
      setOptimisticState(newState);
      
      // Return context for rollback
      return { previousState };
    },
    // Success: sync server state
    onSuccess: (data, variables, context) => {
      setServerState(variables);
      setOptimisticState(variables);
      
      // Invalidate related queries
      queryClient.invalidateQueries({ 
        queryKey: [resourceType, resourceId] 
      });
      
      onSuccess?.();
    },
    // Error: rollback (Guidelines §2.4.2)
    onError: (error: Error, variables, context) => {
      setIsReverting(true);
      
      if (context?.previousState) {
        // Revert to previous state
        setOptimisticState(context.previousState);
        setServerState(context.previousState);
      }
      
      // Optional: Show toast notification
      onError?.(error);
      
      // Clear reverting flag setelah animasi selesai
      setTimeout(() => setIsReverting(false), 300);
    },
  });

  // Toggle like action
  const toggleLike = useCallback(() => {
    // Calculate new optimistic state
    const newState: LikeState = {
      isLiked: !optimisticState.isLiked,
      likeCount: optimisticState.isLiked
        ? optimisticState.likeCount - 1
        : optimisticState.likeCount + 1,
    };

    // Update immediately in transition (non-blocking)
    startTransition(() => {
      setOptimisticState(newState);
    });

    // Trigger mutation (async)
    likeMutation.mutate(newState);
  }, [optimisticState, likeMutation]);

  return {
    state: optimisticState,
    toggleLike,
    isPending: isPending || likeMutation.isPending,
    isReverting,
  };
};

/**
 * LikeButton - Example component menggunakan useOptimisticLike
 */
interface LikeButtonProps {
  resourceType: string;
  resourceId: string;
  initialState: LikeState;
  className?: string;
}

export const LikeButton: React.FC<LikeButtonProps> = ({
  resourceType,
  resourceId,
  initialState,
  className = '',
}) => {
  const { state, toggleLike, isReverting } = useOptimisticLike({
    resourceType,
    resourceId,
    initialState,
  });

  return (
    <button
      onClick={toggleLike}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
        state.isLiked
          ? 'bg-primary/10 text-primary'
          : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
      } ${isReverting ? 'animate-shake' : ''} ${className}`}
      aria-label={state.isLiked ? 'Unlike' : 'Like'}
    >
      <span className="text-lg">{state.isLiked ? '❤️' : '🤍'}</span>
      <span className="text-sm font-medium">{state.likeCount}</span>
    </button>
  );
};
