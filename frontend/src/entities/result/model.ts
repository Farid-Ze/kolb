export interface AssessmentResults {
  sessionId: number
  finalizedAt?: string | null
  kiteCoordinates?: Record<string, number> | null
  blindspots: string[]
  strengths: string[]
  lfiScore?: number | null
  percentiles?: Record<string, unknown> | null
}
