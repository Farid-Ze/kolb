import { useCallback } from 'react'

import { useAuth } from '../../auth'
import { recordAssessmentTelemetry } from '../api'

interface TelemetryInput {
  itemId: number
  responseRank: number
  responseLatencyMs: number
  blurEvents?: number | null
  meta?: Record<string, unknown> | null
}

export function useAssessmentTelemetry(sessionId: number | null) {
  const { isAuthenticated } = useAuth()

  return useCallback(
    async (input: TelemetryInput) => {
      if (!sessionId || !isAuthenticated) {
        return
      }
      await recordAssessmentTelemetry({ sessionId, ...input })
    },
    [sessionId, isAuthenticated],
  )
}
