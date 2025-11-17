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
export * from './useOptimisticLike';
interface UseOptimisticLikeOptions {
