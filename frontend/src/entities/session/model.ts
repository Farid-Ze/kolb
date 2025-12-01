import type {
  SessionStartResponse as GenSessionStartResponse,
  SessionSubmissionPayload as GenSessionSubmissionPayload,
  ItemRank as GenItemRank,
  ContextRank as GenContextRank,
  SessionOperationResult as GenSessionOperationResult,
  SessionAutosavePayload as GenSessionAutosavePayload,
  AutosaveItemRank as GenAutosaveItemRank,
  AssessmentItemResponsePayload as GenAssessmentItemResponsePayload
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

export type AssessmentItemResponsePayload = GenAssessmentItemResponsePayload & {
  meta?: Record<string, unknown> | null
}

export interface AssessmentResponseBatch {
  responses: AssessmentItemResponsePayload[]
}

export interface EngineSessionResponse {
  sessionId: number
  instrumentCode: string
  instrumentVersion?: string | null
  status: string
  delivery?: {
    items?: AssessmentItem[]
  }
  responses: ItemRankPayload[]
  contexts: ContextRankPayload[]
  totalItems: number
  completedItems: number
  progress: number
  currentItemIndex: number
}
