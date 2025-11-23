import { apiClient } from '../../shared/api/client'
import type { UserChallenge } from '../../entities/challenge/model'

export async function fetchUserChallenges(): Promise<UserChallenge[]> {
  const { data } = await apiClient.get<UserChallenge[]>('/challenges/user')
  return data
}
