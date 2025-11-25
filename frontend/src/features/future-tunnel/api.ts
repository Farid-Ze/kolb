import { apiClient } from '../../shared/api/client'
import type {
  SessionStartResponse,
  SessionSubmissionPayload,
  SessionOperationResult,
  AssessmentItem,
  EngineSessionResponse,
  SessionAutosavePayload,
} from '../../entities/session/model'

export async function startSession(instrumentCode = 'KLSI'): Promise<SessionStartResponse> {
  const { data } = await apiClient.post<SessionStartResponse>('/engine/sessions/start', {
    instrumentCode,
  })
  return data
}

export async function fetchSessionItems(sessionId: number): Promise<AssessmentItem[]> {
  const { data } = await apiClient.get<{ items: AssessmentItem[] }>(`/engine/sessions/${sessionId}/delivery`)
  return data.items
}

export async function submitAllResponses(sessionId: number, payload: SessionSubmissionPayload): Promise<SessionOperationResult> {
  const { data } = await apiClient.post<SessionOperationResult>(`/engine/sessions/${sessionId}/submit_all`, payload)
  return data
}

export async function submitSingleResponse(
  sessionId: number,
  itemId: number,
  responseMap: Record<number, number>,
): Promise<{ ok: boolean }> {
  const { data } = await apiClient.post<{ ok: boolean }>(`/engine/sessions/${sessionId}/interactions`, {
    kind: 'item',
    item_id: itemId,
    ranks: responseMap,
  })
  return data
}

export async function finalizeSession(sessionId: number): Promise<SessionOperationResult> {
  const { data } = await apiClient.post<SessionOperationResult>(`/engine/sessions/${sessionId}/finalize`, {})
  return data
}

export async function fetchSessionState(sessionId: number): Promise<EngineSessionResponse> {
  const { data } = await apiClient.get<EngineSessionResponse>(`/engine/sessions/${sessionId}/items`)
  return data
}

export async function autosaveSession(sessionId: number, payload: SessionAutosavePayload): Promise<SessionOperationResult> {
  const { data } = await apiClient.post<SessionOperationResult>(`/engine/sessions/${sessionId}/items`, payload)
  return data
}
