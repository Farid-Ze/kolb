import type { AssessmentResultsResponse, UserChallengeOut } from '../../shared/api/generated'

export type AssessmentResults = AssessmentResultsResponse
export type UserChallenge = UserChallengeOut

export interface KiteChartData {
  subject: string
  A: number
  fullMark: number
}

export interface DashboardState {
  isLoading: boolean
  results: AssessmentResults | null
  error: Error | null
}
