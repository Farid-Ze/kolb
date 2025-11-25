import { useQuery } from '@tanstack/react-query'
import { fetchUserChallenges } from '../../challenges/api'
import type { UserChallenge } from '../model'

export function useUserChallenges() {
  return useQuery<UserChallenge[], Error>({
    queryKey: ['challenges', 'user'],
    queryFn: fetchUserChallenges,
    retry: false,
  })
}
