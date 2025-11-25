import type {
  SessionStartResponse as GenSessionStartResponse,
  SessionSubmissionPayload as GenSessionSubmissionPayload,
  ItemRank as GenItemRank,
  ContextRank as GenContextRank,
  SessionOperationResult as GenSessionOperationResult,
  SessionAutosavePayload as GenSessionAutosavePayload,
  AutosaveItemRank as GenAutosaveItemRank
} from '../../shared/api/generated'

export type SessionStartResponse = GenSessionStartResponse
export type SessionSubmissionPayload = GenSessionSubmissionPayload
export type ItemRankPayload = GenItemRank
export type ContextRankPayload = GenContextRank
export type SessionOperationResult = GenSessionOperationResult
export type SessionAutosavePayload = GenSessionAutosavePayload
export type AutosaveItemRank = GenAutosaveItemRank

export interface AssessmentItemOption {
  id: number
  label: string
  code?: string
}

export interface AssessmentItem {
  id: number
  number: number
  type: string
  stem: string
  options: AssessmentItemOption[]
  category?: string | null
}

export interface AssessmentItemResponsePayload {
  itemId: number
  responseRank: number
  responseLatencyMs: number
  blurEvents?: number | null
  meta?: Record<string, unknown> | null
}

export interface AssessmentResponseBatch {
  responses: AssessmentItemResponsePayload[]
}

export interface EngineSessionResponse {
  session_id: number
  status: string
  responses: Array<{
    item_id: number
    ranks: Record<string, number>
  }>
  contexts: Array<{
    context_name: string
    CE: number
    RO: number
    AC: number
    AE: number
  }>
  delivery?: {
    items?: AssessmentItem[]
  }
}
