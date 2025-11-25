import { apiClient } from '../../shared/api/client'
import type { UserChallengeOut } from '../../shared/api/generated'

export async function fetchUserChallenges(): Promise<UserChallengeOut[]> {
  const { data } = await apiClient.get<UserChallengeOut[]>('/challenges/user')
  return data
}
