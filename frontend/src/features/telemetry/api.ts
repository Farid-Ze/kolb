import { apiClient } from '../../shared/api/client'

export interface AssessmentTelemetryPayload {
  sessionId: number
  itemId: number
  responseRank: number
  responseLatencyMs: number
  blurEvents?: number | null
  meta?: Record<string, unknown> | null
}

export async function recordAssessmentTelemetry(payload: AssessmentTelemetryPayload) {
  await apiClient.post('/telemetry/assessment', payload)
}
