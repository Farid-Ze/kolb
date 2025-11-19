import { useQuery } from '@tanstack/react-query';
import { api, AssessmentSession } from './client';

export const useLatestAssessmentSession = () => {
  return useQuery({
    queryKey: ['assessment', 'latest'],
    queryFn: api.getLatestAssessmentSession,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false,
  });
};
