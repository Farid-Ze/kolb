import { useCallback } from 'react'

import { useAuth } from '../../auth'
import { apiClient } from '../../../shared/api/client'
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

  const sendTelemetry = useCallback(
    async (input: TelemetryInput) => {
      if (!sessionId || !isAuthenticated) {
        return
      }
      await recordAssessmentTelemetry({ sessionId, ...input })
    },
    [sessionId, isAuthenticated],
  )

  const sendItemChanged = useCallback(
    async (itemId: number, fromRank: number | null, toRank: number) => {
      if (!sessionId || !isAuthenticated) {
        return
      }
      // Fire and forget - we don't want to block UI on telemetry
      apiClient.post('/telemetry/item-changed', {
        sessionId,
        itemId,
        fromRank,
        toRank,
        timestampMs: Date.now(),
      }).catch((err: unknown) => {
        console.warn('Failed to send item-changed telemetry', err)
      })
    },
    [sessionId, isAuthenticated],
  )

  return { sendTelemetry, sendItemChanged }
}
