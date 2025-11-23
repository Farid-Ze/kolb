import type { AssessmentItem } from '../../entities/session/model'

export type TunnelPhase = 'idle' | 'loading' | 'in-progress' | 'submitting' | 'completed'

export interface TunnelItemDraft {
  itemId: number
  ranks: Record<number, number>
  responseLatencyMs: number
  blurEvents: number
}

export interface TunnelContextDraft {
  contextName: string
  CE: number | null
  RO: number | null
  AC: number | null
  AE: number | null
}

export interface TunnelState {
  sessionId: number | null
  phase: TunnelPhase
  items: AssessmentItem[]
  drafts: Record<number, TunnelItemDraft>
}
