import { apiClient } from '../../shared/api/client'
import type {
  AssessmentItem,
  EngineSessionResponse,
  SessionAutosavePayload,
  SessionOperationResult,
  SessionStartResponse,
  SessionSubmissionPayload,
} from '../../entities/session/model'

export async function startSession(): Promise<SessionStartResponse> {
  const { data } = await apiClient.post<SessionStartResponse>('/sessions/start', {})
  return data
}

export async function fetchSessionItems(sessionId: number): Promise<AssessmentItem[]> {
  const { data } = await apiClient.get<AssessmentItem[]>(`/sessions/${sessionId}/items`)
  return data
}

export async function submitAllResponses(sessionId: number, payload: SessionSubmissionPayload): Promise<SessionOperationResult> {
  const { data } = await apiClient.post<SessionOperationResult>(`/sessions/${sessionId}/submit_all_responses`, payload)
  return data
}

export async function finalizeSession(sessionId: number): Promise<SessionOperationResult> {
  const { data } = await apiClient.post<SessionOperationResult>(`/sessions/${sessionId}/finalize`, {})
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
