import { useQuery } from '@tanstack/react-query';
import { api, ApiError } from './client';

export const useLatestAssessmentSession = () => {
  const query = useQuery({
    queryKey: ['assessment', 'latest'],
    queryFn: api.getLatestAssessmentSession,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false,
  });

  // 404 is handled in client.ts to return null (no data), so it won't be an error here.
  // 401 throws ApiError, so we check for that.
  const isUnauthorized = query.error instanceof ApiError && (query.error as ApiError).isUnauthorized;

  return {
    ...query,
    isUnauthorized,
  };
};
