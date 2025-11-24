import { useReducer } from 'react'
import { LFI_CONTEXTS } from '../../../entities/session/constants'
import type { SessionOperationResult } from '../../../entities/session/model'
import type { TunnelContextDraft, TunnelItemDraft, TunnelPhase } from '../model'

type ContextDraftMap = Record<string, TunnelContextDraft>

const buildInitialContextDrafts = (): ContextDraftMap =>
  LFI_CONTEXTS.reduce<ContextDraftMap>((acc, contextName) => {
    acc[contextName] = { contextName, CE: null, RO: null, AC: null, AE: null }
    return acc
  }, {})

export type TunnelState = {
  sessionId: number | null
  phase: TunnelPhase
  drafts: Record<number, TunnelItemDraft>
  contextDrafts: ContextDraftMap
  submissionResult: SessionOperationResult['result'] | null
  submissionError: Error | null
  lastAutosaveAt: number | null
  restoredFromDraft: boolean
}

export type TunnelAction =
  | { type: 'START_SESSION'; sessionId: number }
  | { type: 'SET_PHASE'; phase: TunnelPhase }
  | { type: 'SET_ITEM_RANK'; itemId: number; ranks: Record<number, number> }
  | { type: 'SET_CONTEXT_RANK'; contextName: string; draft: TunnelContextDraft }
  | { type: 'HYDRATE'; sessionId: number; drafts?: Record<number, TunnelItemDraft>; contextDrafts?: ContextDraftMap }
  | { type: 'RESET' }
  | { type: 'SET_SUBMISSION_RESULT'; result: SessionOperationResult['result'] }
  | { type: 'SET_SUBMISSION_ERROR'; error: Error }
  | { type: 'SET_AUTOSAVE_SUCCESS' }
  | { type: 'ACKNOWLEDGE_RESTORED' }

const initialState: TunnelState = {
  sessionId: null,
  phase: 'idle',
  drafts: {},
  contextDrafts: buildInitialContextDrafts(),
  submissionResult: null,
  submissionError: null,
  lastAutosaveAt: null,
  restoredFromDraft: false,
}

function tunnelReducer(state: TunnelState, action: TunnelAction): TunnelState {
  switch (action.type) {
    case 'START_SESSION':
      return {
        ...initialState,
        sessionId: action.sessionId,
        phase: 'in-progress',
      }
    case 'SET_PHASE':
      return { ...state, phase: action.phase }
    case 'SET_ITEM_RANK':
      return {
        ...state,
        drafts: {
          ...state.drafts,
          [action.itemId]: {
            itemId: action.itemId,
            ranks: action.ranks,
            responseLatencyMs: 0, // Managed by telemetry ref, not state
            blurEvents: 0,
          },
        },
      }
    case 'SET_CONTEXT_RANK':
      return {
        ...state,
        contextDrafts: {
          ...state.contextDrafts,
          [action.contextName]: action.draft,
        },
      }
    case 'HYDRATE':
      return {
        ...state,
        sessionId: action.sessionId,
        phase: 'in-progress',
        drafts: action.drafts ?? state.drafts,
        contextDrafts: action.contextDrafts ? { ...state.contextDrafts, ...action.contextDrafts } : state.contextDrafts,
        restoredFromDraft: true,
      }
    case 'RESET':
      return initialState
    case 'SET_SUBMISSION_RESULT':
      return { ...state, submissionResult: action.result, phase: 'completed' }
    case 'SET_SUBMISSION_ERROR':
      return { ...state, submissionError: action.error, phase: 'in-progress' }
    case 'SET_AUTOSAVE_SUCCESS':
      return { ...state, lastAutosaveAt: Date.now() }
    case 'ACKNOWLEDGE_RESTORED':
      return { ...state, restoredFromDraft: false }
    default:
      return state
  }
}

export function useTunnelState() {
  const [state, dispatch] = useReducer(tunnelReducer, initialState)
  return { state, dispatch }
}
