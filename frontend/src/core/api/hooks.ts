import { useQuery } from '@tanstack/react-query';
import { api, ApiError } from './client';

export const useLatestAssessmentSession = () => {
  const query = useQuery({
    queryKey: ['assessment', 'latest'],
    queryFn: api.getLatestAssessmentSession,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false,
  });

  const isUnauthorized = query.error instanceof ApiError && (query.error as ApiError).isUnauthorized;

  return {
    ...query,
    isUnauthorized,
  };
};
