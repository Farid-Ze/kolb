import { apiClient } from '../../shared/api/client'
import type { AssessmentResults } from '../../entities/result/model'

export async function fetchLatestResults(): Promise<AssessmentResults> {
  const { data } = await apiClient.get<AssessmentResults>('/results/latest')
  return data
}

export async function fetchLatestResultsAlias(): Promise<AssessmentResults> {
  const { data } = await apiClient.get<AssessmentResults>('/results/sessions/latest')
  return data
}
