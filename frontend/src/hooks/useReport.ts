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
  /** Custom fetcher, defaults to session-based getReport */
  fetcher?: (identifier: string) => Promise<Report>;
  /** Override retry behaviour (default: 3 attempts) */
  retry?: number | boolean;
  /** Additional toggle to control query execution */
  enabled?: boolean;
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
  sessionId: string | undefined,
  options: UseReportOptions = {}
): UseQueryResult<Report, Error> {
  const {
    enablePolling = false,
    pollingInterval = 3000,
    stopPollingWhen,
    fetcher,
    retry = 3,
    enabled,
  } = options;

  const queryOptions: UseQueryOptions<Report, Error, Report, [string, string | undefined]> = {
    queryKey: ['report', sessionId],
    queryFn: () => {
      if (!sessionId) {
        return Promise.reject(new Error('Session ID tidak tersedia'));
      }
      const fetchReport = fetcher ?? getReport;
      return fetchReport(sessionId);
    },
    staleTime: enablePolling ? 0 : 5 * 60 * 1000,
    retry,
    enabled: enabled ?? Boolean(sessionId),
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
