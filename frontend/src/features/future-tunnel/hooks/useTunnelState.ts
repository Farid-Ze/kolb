import { useReducer, useRef, useCallback, useEffect } from 'react'
import { LFI_CONTEXTS } from '../../../entities/session/constants'
import type { SessionOperationResult } from '../../../entities/session/model'
import type { TunnelContextDraft, TunnelItemDraft, TunnelPhase, TunnelState } from '../model'

type ContextDraftMap = Record<string, TunnelContextDraft>

const buildInitialContextDrafts = (): ContextDraftMap =>
  LFI_CONTEXTS.reduce<ContextDraftMap>((acc, contextName) => {
    acc[contextName] = { contextName, CE: null, RO: null, AC: null, AE: null }
    return acc
  }, {})

export type TunnelAction =
  | { type: 'START_SESSION'; sessionId: string }
  | { type: 'SET_PHASE'; phase: TunnelPhase }
  | { type: 'SET_ITEM_RANK'; itemId: number; ranks: Record<number, number> }
  | { type: 'SET_CONTEXT_RANK'; contextName: string; draft: TunnelContextDraft }
  | { type: 'HYDRATE'; sessionId: string; drafts?: Record<number, TunnelItemDraft>; contextDrafts?: ContextDraftMap }
  | { type: 'RESET' }
  | { type: 'SET_SUBMISSION_RESULT'; result: SessionOperationResult['result'] }
  | { type: 'SET_SUBMISSION_ERROR'; error: Error | null }
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
  console.log('[tunnelReducer] Action:', action.type)
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

import { TelemetryService } from '../../../shared/api/generated'
import type { ReplayEvent } from '../../../shared/api/generated'

const ACTION_LOG_BATCH_SIZE = 10
const ACTION_LOG_INTERVAL = 10000

export function useTunnelState() {
  const [state, baseDispatch] = useReducer(tunnelReducer, initialState)
  const actionBufferRef = useRef<ReplayEvent[]>([])

  // Helper to flush logs
  const flushActions = useCallback((overrideSessionId?: string) => {
    const sid = overrideSessionId ?? state.sessionId
    if (actionBufferRef.current.length === 0 || !sid) return

    const events = [...actionBufferRef.current]
    actionBufferRef.current = []

    TelemetryService.recordReplayEventsApiV1TelemetryReplayEventsPost({
      sessionId: sid,
      events
    }).catch((err: unknown) => console.warn('Failed to upload replay events', err))
  }, [state.sessionId])

  // Flush on interval
  useEffect(() => {
    const interval = setInterval(() => flushActions(), ACTION_LOG_INTERVAL)
    return () => clearInterval(interval)
  }, [flushActions])

  // Flush on visibility hide
  useEffect(() => {
    if (typeof document === 'undefined') return
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') flushActions()
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [flushActions])

  const dispatch = useCallback((action: TunnelAction) => {
    console.log('[useTunnelState] Dispatch:', action.type)
    baseDispatch(action)

    // Determine session ID (handle START_SESSION case where state.sessionId is null)
    const currentSessionId = state.sessionId ?? (action.type === 'START_SESSION' ? action.sessionId : null)

    if (currentSessionId) {
      actionBufferRef.current.push({
        type: action.type,
        payload: action,
        timestampMs: Date.now()
      })

      if (actionBufferRef.current.length >= ACTION_LOG_BATCH_SIZE) {
        flushActions(currentSessionId)
      }
    }
  }, [state.sessionId, flushActions])

  return { state, dispatch }
}
