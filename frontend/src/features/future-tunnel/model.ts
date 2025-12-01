import type { AssessmentItem, SessionOperationResult } from '../../entities/session/model'
import type { ItemRank, ContextRank } from '../../shared/api/generated'

export type TunnelPhase = 'idle' | 'loading' | 'in-progress' | 'submitting' | 'completed'

// Extend generated ItemRank with telemetry fields
export interface TunnelItemDraft extends Omit<ItemRank, 'ranks'> {
  // Frontend uses number keys for ranks, backend defines Record<string, number>
  // We keep number keys here for strictness during editing
  ranks: Record<number, number>
  responseLatencyMs: number
  blurEvents: number
}

// Draft state allows nulls, whereas final ContextRank requires numbers
export type TunnelContextDraft = {
  [K in keyof ContextRank]: ContextRank[K] | null
}

export type ContextDraftMap = Record<string, TunnelContextDraft>

export interface TunnelState {
  sessionId: number | null
  phase: TunnelPhase
  items: AssessmentItem[]
  drafts: Record<number, TunnelItemDraft>
  contextDrafts: ContextDraftMap
  submissionResult: SessionOperationResult | null
  submissionError: Error | null
  lastAutosaveAt: number | null
  restoredFromDraft: boolean
}
