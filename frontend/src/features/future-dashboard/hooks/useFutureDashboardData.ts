import { useLatestResults } from './useLatestResults'
import { useUserChallenges } from './useUserChallenges'
import type { UserChallenge } from '../model'

export function useFutureDashboardData() {
  const { data: results, isLoading: isLoadingResults, error: resultsError } = useLatestResults()
  const { data: challengesData, isLoading: isLoadingChallenges, error: challengesError } = useUserChallenges()

  const challenges: UserChallenge[] = challengesData ?? []

  return {
    results,
    isLoadingResults,
    resultsError,
    challenges,
    isLoadingChallenges,
    challengesError,
  }
}
