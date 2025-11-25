import { useQuery } from '@tanstack/react-query'
import { fetchLatestResults } from '../../results/api'
import type { AssessmentResults } from '../model'

export function useLatestResults() {
  return useQuery<AssessmentResults, Error>({
    queryKey: ['results', 'latest'],
    queryFn: fetchLatestResults,
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}
