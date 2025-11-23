export interface SessionStartResponse {
  sessionId: number
}

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

export interface ItemRankPayload {
  itemId: number
  ranks: Record<number, number>
}

export interface ContextRankPayload {
  contextName: string
  CE: number
  RO: number
  AC: number
  AE: number
}

export interface AutosaveItemRank {
  itemId: number
  ranks: Record<string, number>
}

export interface SessionSubmissionPayload {
  items: ItemRankPayload[]
  contexts: ContextRankPayload[]
}

export interface SessionAutosavePayload {
  responses: AutosaveItemRank[]
  contexts: ContextRankPayload[]
}

export interface SessionOperationResult {
  ok: boolean
  result?: Record<string, unknown> | null
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
