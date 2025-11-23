import { useQuery } from '@tanstack/react-query'

import { fetchUserChallenges } from '../../challenges'
import { fetchLatestResults } from '../../results'

export function useFutureDashboardData() {
  const resultsQuery = useQuery({
    queryKey: ['results', 'latest'],
    queryFn: fetchLatestResults,
  })

  const challengesQuery = useQuery({
    queryKey: ['challenges', 'user'],
    queryFn: fetchUserChallenges,
  })

  return {
    results: resultsQuery.data,
    isLoadingResults: resultsQuery.isLoading,
    resultsError: resultsQuery.error as Error | null,
    challenges: challengesQuery.data ?? [],
    isLoadingChallenges: challengesQuery.isLoading,
    challengesError: challengesQuery.error as Error | null,
  }
}
