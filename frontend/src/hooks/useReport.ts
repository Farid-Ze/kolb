/**
 * KLSI 4.0 - useReport Hook
 * Task TODO3.md Phase 4: React Query hook for report data (SSOT)
 * 
 * Guidelines.md §6.1: Single Source of Truth for report state
 */

import {
  useQuery,
  type UseQueryOptions,
  type UseQueryResult,
} from '@tanstack/react-query';
import { getReport } from '../services/reportService';
import type { Report } from '../types/api';

type RefetchContext = {
  state: {
    data?: Report;
  };
};

interface UseReportOptions {
  /** Enable polling for report generation */
  enablePolling?: boolean;
  /** Polling interval in ms (default: 3000) */
  pollingInterval?: number;
  /** Stop polling when condition met */
  stopPollingWhen?: (data: Report | undefined) => boolean;
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
): UseQueryResult<Report, Error> {
  const {
    enablePolling = false,
    pollingInterval = 3000,
    stopPollingWhen,
  } = options;

  const queryOptions: UseQueryOptions<Report, Error, Report, [string, string]> = {
    queryKey: ['report', sessionId],
    queryFn: () => getReport(sessionId),
    staleTime: enablePolling ? 0 : 5 * 60 * 1000,
    retry: 3,
  };

  if (enablePolling) {
    queryOptions.refetchInterval = (query: RefetchContext) => {
      const data = query.state.data;

      if (stopPollingWhen && stopPollingWhen(data)) {
        return false;
      }

      return pollingInterval;
    };
  }

  return useQuery(queryOptions);
}
