import { useEffect, useRef, useCallback } from 'react'

import { useAuth } from '../../auth'
import { apiClient } from '../../../shared/api/client'
import { recordAssessmentTelemetry } from '../api'

interface TelemetryInput {
  itemId: number
  responseRank?: number
  responseLatencyMs: number
  blurEvents?: number | null
  meta?: Record<string, unknown> | null
}

/**
 * Hook for recording assessment telemetry events.
 * 
 * Provides methods to send telemetry data for assessment sessions,
 * including item interactions, response latency, and blur events.
 * 
 * @param sessionId - The session ID (string or number, will be coerced to string)
 */
export function useAssessmentTelemetry(sessionId: string | number | null | undefined) {
  const { isAuthenticated } = useAuth()
  const startTimeRef = useRef<number>(Date.now())
  const blurCountRef = useRef<number>(0)

  useEffect(() => {
    // Reset timer and blur count when session changes
    startTimeRef.current = Date.now()
    blurCountRef.current = 0

    const handleBlur = () => {
      blurCountRef.current += 1
    }

    window.addEventListener('blur', handleBlur)
    return () => {
      window.removeEventListener('blur', handleBlur)
    }
  }, [sessionId])

  const sendTelemetry = useCallback(
    async (input: TelemetryInput) => {
      if (!sessionId || !isAuthenticated) {
        return
      }
      
      const payload = {
        sessionId: String(sessionId),
        ...input,
      }
      
      // Use beacon for reliable transmission during unload/visibility change
      if (input.meta && (input.meta as Record<string, unknown>).event === 'unload_snapshot') {
        const blob = new Blob([JSON.stringify({
          ...payload,
          timestamp: Date.now(),
          meta: {
            userAgent: navigator.userAgent,
            screenResolution: `${window.screen.width}x${window.screen.height}`,
            ...input.meta,
          }
        })], { type: 'application/json' })

        if (navigator.sendBeacon) {
          navigator.sendBeacon('/api/v1/telemetry/assessment', blob)
          return
        }
      }
      
      await recordAssessmentTelemetry({ 
        sessionId: String(sessionId), 
        itemId: input.itemId,
        responseRank: input.responseRank ?? 0,
        responseLatencyMs: input.responseLatencyMs,
        blurEvents: input.blurEvents ?? 0,
        meta: input.meta ?? null,
      })
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
        sessionId: String(sessionId),
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

  const recordTelemetry = useCallback(async (responseRank: number, itemId?: number) => {
    if (!sessionId || !itemId) return

    const endTime = Date.now()
    const latency = endTime - startTimeRef.current

    await sendTelemetry({
      itemId,
      responseRank,
      responseLatencyMs: latency,
      blurEvents: blurCountRef.current,
      meta: {
        userAgent: navigator.userAgent,
        screenResolution: `${window.screen.width}x${window.screen.height}`
      }
    })
  }, [sessionId, sendTelemetry])

  return { sendTelemetry, sendItemChanged, recordTelemetry }
}
