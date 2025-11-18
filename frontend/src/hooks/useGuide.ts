/**
 * KLSI 4.0 - useGuide Hook
 * Task Phase 7: Hook untuk fetching guide content
 * 
 * Custom hook untuk fetching markdown guides dengan locale fallback
 */

import { useQuery } from '@tanstack/react-query';
import { getGuideContent } from '../services/guideService';
import { useTelemetry } from './useTelemetry';
import { useEffect } from 'react';

interface UseGuideParams {
  guideId: string;
  locale?: string;
  enabled?: boolean;
  trackOpen?: boolean;
  context?: string;
}

/**
 * Hook untuk fetching guide content dengan telemetry tracking
 */
export const useGuide = ({
  guideId,
  locale = 'id-ID',
  enabled = true,
  trackOpen = true,
  context,
}: UseGuideParams) => {
  const { trackGuideOpen } = useTelemetry();

  // Query untuk guide content
  const query = useQuery({
    queryKey: ['guide', guideId, locale],
    queryFn: () => getGuideContent(guideId, locale),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes (guides rarely change)
    retry: 2, // Retry twice (primary locale + fallback)
  });

  // Track guide open when successfully loaded
  useEffect(() => {
    if (trackOpen && query.isSuccess && query.data) {
      trackGuideOpen(guideId, locale, context);
    }
  }, [trackOpen, query.isSuccess, query.data, guideId, locale, context, trackGuideOpen]);

  return query;
};

