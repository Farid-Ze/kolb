import { SessionsService } from '../../shared/api/generated'
import type {
  SessionStartResponse,
  SessionSubmissionPayload,
  SessionOperationResult,
  AssessmentItem,
  EngineSessionResponse,
  SessionAutosavePayload,
} from '../../entities/session/model'

export async function startSession(instrumentCode = 'KLSI4', instrumentVersion = '4.0'): Promise<SessionStartResponse> {
  return SessionsService.startSessionApiV1SessionsStartPost({
    instrumentCode,
    instrumentVersion,
  })
}

export async function fetchSessionItems(sessionId: string): Promise<AssessmentItem[]> {
  // The generated client returns Record<string, any> for getDelivery, but we know it contains items.
  // We cast it to match the expected return type.
  const data = await SessionsService.getDeliveryApiV1SessionsSessionIdDeliveryGet(sessionId)
  return data.items as AssessmentItem[]
}

export async function submitAllResponses(sessionId: string, payload: SessionSubmissionPayload): Promise<SessionOperationResult> {
  return SessionsService.submitAllResponsesApiV1SessionsSessionIdSubmitAllResponsesPost(sessionId, payload)
}

export async function fetchSessionState(sessionId: string): Promise<EngineSessionResponse> {
  // Use the new state endpoint which returns the full EngineSessionResponse
  return SessionsService.getSessionStateApiV1SessionsSessionIdStateGet(sessionId)
}

export async function autosaveSession(sessionId: string, payload: SessionAutosavePayload): Promise<SessionOperationResult> {
  return SessionsService.autosaveSessionApiV1SessionsSessionIdAutosavePost(sessionId, payload)
}
