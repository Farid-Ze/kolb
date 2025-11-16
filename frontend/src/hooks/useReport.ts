/**
 * KLSI 4.0 - useReport Hook
 * Task TODO3.md Phase 4: React Query hook for report data (SSOT)
 * 
 * Guidelines.md §6.1: Single Source of Truth for report state
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { getReport } from '../services/reportService';
import type { ReportData } from '../types/api';

interface UseReportOptions {
  /** Enable polling for report generation */
  enablePolling?: boolean;
  /** Polling interval in ms (default: 3000) */
  pollingInterval?: number;
  /** Stop polling when condition met */
  stopPollingWhen?: (data: ReportData | undefined) => boolean;
}

/**
 * useReport - React Query hook for report data
 * 
 * SSOT for report state with automatic polling support
 * 
 * @example
 * // Basic usage
 * const { data: report, isLoading } = useReport(sessionId);
 * 
 * // With polling (for report generation)
 * const { data: report, isLoading } = useReport(sessionId, {
 *   enablePolling: true,
 *   stopPollingWhen: (data) => data?.status === 'completed'
 * });
 */
export function useReport(
  sessionId: string,
  options: UseReportOptions = {}
): UseQueryResult<ReportData, Error> {
  const {
    enablePolling = false,
    pollingInterval = 3000,
    stopPollingWhen,
  } = options;

  return useQuery({
    queryKey: ['report', sessionId],
    queryFn: () => getReport(sessionId),
    // Polling configuration
    refetchInterval: (query) => {
      if (!enablePolling) return false;
      
      const data = query.state.data;
      
      // Stop polling if condition met
      if (stopPollingWhen && data && stopPollingWhen(data)) {
        return false;
      }
      
      return pollingInterval;
    },
    // Keep data fresh
    staleTime: enablePolling ? 0 : 5 * 60 * 1000, // 5 minutes if not polling
    // Retry on error
    retry: 3,
  });
}
