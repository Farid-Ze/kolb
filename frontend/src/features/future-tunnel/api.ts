import { apiClient } from '../../shared/api/client'
import type {
  SessionStartResponse,
  SessionSubmissionPayload,
  SessionOperationResult,
  AssessmentItem,
  EngineSessionResponse,
  SessionAutosavePayload,
} from '../../entities/session/model'

export async function startSession(instrumentCode = 'KLSI', instrumentVersion = '4.0'): Promise<SessionStartResponse> {
  const { data } = await apiClient.post<SessionStartResponse>('/sessions/start', {
    instrumentCode,
    instrumentVersion,
  })
  return data
}

export async function fetchSessionItems(sessionId: number): Promise<AssessmentItem[]> {
  const { data } = await apiClient.get<{ items: AssessmentItem[] }>(`/sessions/${sessionId}/delivery`)
  return data.items
}

export async function submitAllResponses(sessionId: number, payload: SessionSubmissionPayload): Promise<SessionOperationResult> {
  const { data } = await apiClient.post<SessionOperationResult>(`/sessions/${sessionId}/submit_all_responses`, payload)
  return data
}

export async function submitSingleResponse(
  sessionId: number,
  itemId: number,
  responseMap: Record<number, number>,
): Promise<{ ok: boolean }> {
  const { data } = await apiClient.post<{ ok: boolean }>(`/sessions/${sessionId}/response`, {
    item_id: itemId,
    response_map: responseMap,
  })
  return data
}

export async function finalizeSession(sessionId: number): Promise<SessionOperationResult> {
  const { data } = await apiClient.post<SessionOperationResult>(`/sessions/${sessionId}/finalize`, {})
  return data
}

export async function fetchSessionState(sessionId: number): Promise<EngineSessionResponse> {
  const { data } = await apiClient.get<EngineSessionResponse>(`/sessions/${sessionId}/items`)
  return data
}

export async function autosaveSession(sessionId: number, payload: SessionAutosavePayload): Promise<SessionOperationResult> {
  const { data } = await apiClient.post<SessionOperationResult>(`/sessions/${sessionId}/autosave`, payload)
  return data
}
