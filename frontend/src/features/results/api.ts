import { apiClient } from '../../shared/api/client'
import type { AssessmentResultsResponse } from '../../shared/api/generated'

export async function fetchLatestResults(): Promise<AssessmentResultsResponse> {
  const { data } = await apiClient.get<AssessmentResultsResponse>('/results/latest')
  return data
}
