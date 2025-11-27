import { useMutation, useQuery } from '@tanstack/react-query'
import { startTransition, useCallback, useEffect, useMemo, useRef } from 'react'

import { LFI_CONTEXTS, MODE_CODES } from '../../../entities/session/constants'
import type { ModeCode } from '../../../entities/session/constants'
import type {
  AssessmentItem,
  SessionAutosavePayload,
  SessionSubmissionPayload,
} from '../../../entities/session/model'
import { useAuth } from '../../auth'
import { useAssessmentTelemetry } from '../../telemetry'
import { autosaveSession, fetchSessionItems, fetchSessionState, startSession, submitAllResponses, submitSingleResponse } from '../api'
import type { TunnelContextDraft, TunnelItemDraft } from '../model'
import { useTunnelState } from './useTunnelState'

type ContextDraftMap = Record<string, TunnelContextDraft>

const isItemComplete = (draft: TunnelItemDraft | undefined): boolean => {
  if (!draft) {
    return false
  }
  return Object.keys(draft.ranks).length === MODE_CODES.length
}

const isContextComplete = (draft: TunnelContextDraft | undefined): draft is TunnelContextDraft => {
  if (!draft) {
    return false
  }
  const ranks = MODE_CODES.map((code) => draft[code] ?? 0)
  if (ranks.some((rank) => rank === 0)) {
    return false
  }
  return new Set(ranks).size === MODE_CODES.length
}

const deriveModeRanks = (item: AssessmentItem, draft?: TunnelItemDraft): Record<string, number> | null => {
  if (!draft) {
    return null
  }
  const ranks: Record<string, number> = {}
  item.options.forEach((option) => {
    const code = option.code?.toUpperCase()
    if (!code) {
      return
    }
    const rankValue = draft.ranks[option.id]
    if (rankValue) {
      ranks[code] = rankValue
    }
  })
  return Object.keys(ranks).length === MODE_CODES.length ? ranks : null
}

const mapResponseRanksToChoiceIds = (item: AssessmentItem, ranks: Record<string, number>) => {
  const lookup = item.options.reduce<Record<string, number>>((acc, option) => {
    if (option.code) {
      acc[option.code.toUpperCase()] = option.id
    }
    return acc
  }, {})
  const mapped: Record<number, number> = {}
  Object.entries(ranks).forEach(([modeCode, rankValue]) => {
    const choiceId = lookup[modeCode.toUpperCase()]
    if (choiceId) {
      mapped[choiceId] = rankValue
    }
  })
  return mapped
}

const SESSION_STORAGE_KEY = 'zenotika.tunnel.sessionId'
const ITEM_DRAFTS_STORAGE_KEY = 'zenotika.tunnel.itemDrafts'
const CONTEXT_DRAFTS_STORAGE_KEY = 'zenotika.tunnel.contextDrafts'
const START_TIME_STORAGE_KEY = 'zenotika.tunnel.startTime'

type ItemTelemetryMetrics = {
  startedAt: number
  blurEvents: number
  lastSignature?: string
}

const clampLatency = (value: number) => {
  if (!Number.isFinite(value) || value < 0) {
    return 0
  }
  return Math.min(Math.floor(value), 120000)
}

const safeParseJSON = <T>(raw: string | null): T | null => {
  if (!raw) {
    return null
  }
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export function useTunnelSession() {
  const { isAuthenticated, isTimeLocked } = useAuth()
  const { state, dispatch } = useTunnelState()
  const {
    sessionId,
    phase,
    drafts,
    contextDrafts,
    submissionResult,
    submissionError,
    lastAutosaveAt,
    restoredFromDraft,
  } = state

  const telemetryMetricsRef = useRef<Record<number, ItemTelemetryMetrics>>({})
  const activeItemIdRef = useRef<number | null>(null)
  const autosaveSignatureRef = useRef<string | null>(null)
  const hydrationRef = useRef(false)
  const storageHydratedRef = useRef(false)

  const { sendTelemetry, sendItemChanged } = useAssessmentTelemetry(sessionId)

  const acknowledgeRestoredDraft = useCallback(() => {
    dispatch({ type: 'ACKNOWLEDGE_RESTORED' })
  }, [dispatch])

  const ensureItemMetrics = useCallback((itemId: number) => {
    let metrics = telemetryMetricsRef.current[itemId]
    if (!metrics) {
      metrics = { startedAt: Date.now(), blurEvents: 0 }
      telemetryMetricsRef.current[itemId] = metrics
    }
    return metrics
  }, [])

  const setActiveItem = useCallback(
    (itemId: number | null) => {
      if (itemId === null) {
        activeItemIdRef.current = null
        return
      }
      ensureItemMetrics(itemId)
      activeItemIdRef.current = itemId
    },
    [ensureItemMetrics],
  )

  const markItemInteraction = useCallback(
    (itemId: number) => {
      const metrics = ensureItemMetrics(itemId)
      metrics.startedAt = Date.now()
      metrics.lastSignature = undefined
      activeItemIdRef.current = itemId
    },
    [ensureItemMetrics],
  )

  const clearPersistentState = useCallback(() => {
    if (typeof window === 'undefined') {
      return
    }
    localStorage.removeItem(SESSION_STORAGE_KEY)
    localStorage.removeItem(ITEM_DRAFTS_STORAGE_KEY)
    localStorage.removeItem(CONTEXT_DRAFTS_STORAGE_KEY)
    localStorage.removeItem(START_TIME_STORAGE_KEY)
  }, [])

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' })
    telemetryMetricsRef.current = {}
    autosaveSignatureRef.current = null
    hydrationRef.current = false
    storageHydratedRef.current = false
    clearPersistentState()
  }, [clearPersistentState, dispatch])

  useEffect(() => {
    if (isAuthenticated) {
      return
    }
    startTransition(() => {
      reset()
    })
  }, [isAuthenticated, reset])

  useEffect(() => {
    if (!isAuthenticated || storageHydratedRef.current || typeof window === 'undefined') {
      return
    }
    storageHydratedRef.current = true
    const storedSession = localStorage.getItem(SESSION_STORAGE_KEY)
    const storedDrafts = safeParseJSON<Record<number, TunnelItemDraft>>(localStorage.getItem(ITEM_DRAFTS_STORAGE_KEY))
    const storedContexts = safeParseJSON<ContextDraftMap>(localStorage.getItem(CONTEXT_DRAFTS_STORAGE_KEY))

    if (storedSession) {
      const parsed = Number(storedSession)
      if (Number.isFinite(parsed)) {
        dispatch({
          type: 'HYDRATE',
          sessionId: parsed,
          drafts: storedDrafts ?? undefined,
          contextDrafts: storedContexts ?? undefined,
        })
      }
    }
  }, [isAuthenticated, dispatch])

  useEffect(() => {
    hydrationRef.current = false
  }, [sessionId])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    if (sessionId) {
      localStorage.setItem(SESSION_STORAGE_KEY, String(sessionId))
    }
  }, [sessionId])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    if (!sessionId) {
      localStorage.removeItem(ITEM_DRAFTS_STORAGE_KEY)
      return
    }
    localStorage.setItem(ITEM_DRAFTS_STORAGE_KEY, JSON.stringify(drafts))
  }, [sessionId, drafts])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    if (!sessionId) {
      localStorage.removeItem(CONTEXT_DRAFTS_STORAGE_KEY)
      return
    }
    localStorage.setItem(CONTEXT_DRAFTS_STORAGE_KEY, JSON.stringify(contextDrafts))
  }, [sessionId, contextDrafts])

  useEffect(() => {
    if (typeof document === 'undefined') {
      return
    }
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && activeItemIdRef.current != null) {
        const metrics = ensureItemMetrics(activeItemIdRef.current)
        metrics.blurEvents += 1
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [ensureItemMetrics])

  const startMutation = useMutation({
    mutationFn: () => startSession(),
    onMutate: () => dispatch({ type: 'SET_PHASE', phase: 'loading' }),
    onError: () => dispatch({ type: 'SET_PHASE', phase: 'idle' }),
    onSuccess: (response) => {
      dispatch({ type: 'START_SESSION', sessionId: response.sessionId })
      telemetryMetricsRef.current = {}
      autosaveSignatureRef.current = null
      hydrationRef.current = false
      if (typeof window !== 'undefined') {
        localStorage.setItem(SESSION_STORAGE_KEY, String(response.sessionId))
        localStorage.removeItem(ITEM_DRAFTS_STORAGE_KEY)
        localStorage.removeItem(CONTEXT_DRAFTS_STORAGE_KEY)
      }
    },
  })

  const itemsQuery = useQuery<AssessmentItem[], Error>({
    queryKey: ['tunnel-items', sessionId],
    queryFn: () => fetchSessionItems(sessionId as number),
    enabled: Boolean(sessionId),
    staleTime: 5 * 60 * 1000,
  })

  const sessionStateQuery = useQuery({
    queryKey: ['tunnel-session-state', sessionId],
    queryFn: () => fetchSessionState(sessionId as number),
    enabled: Boolean(sessionId),
    staleTime: 60 * 1000,
  })

  const autosaveMutation = useMutation({
    mutationFn: ({ sessionId: targetSessionId, payload }: { sessionId: number; payload: SessionAutosavePayload }) =>
      autosaveSession(targetSessionId, payload),
    onSuccess: () => dispatch({ type: 'SET_AUTOSAVE_SUCCESS' }),
  })

  const learningItems = useMemo(
    () => (itemsQuery.data ?? []).filter((item) => item.type === 'Learning_Style'),
    [itemsQuery.data],
  )

  useEffect(() => {
    const data = sessionStateQuery.data
    if (!sessionId || !data || hydrationRef.current || !learningItems.length) {
      return
    }
    if ((data.responses?.length ?? 0) === 0 && (data.contexts?.length ?? 0) === 0) {
      hydrationRef.current = true
      return
    }

    const newDrafts: Record<number, TunnelItemDraft> = {}
    let hasRestored = false

    data.responses?.forEach((response) => {
      const item = learningItems.find((entry) => entry.id === response.itemId)
      if (!item) {
        return
      }
      const mapped = mapResponseRanksToChoiceIds(item, response.ranks)
      if (Object.keys(mapped).length) {
        newDrafts[item.id] = {
          itemId: item.id,
          ranks: mapped,
          responseLatencyMs: 0,
          blurEvents: 0,
        }
        hasRestored = true
      }
    })

    const newContextDrafts: ContextDraftMap = {}
    data.contexts?.forEach((ctx) => {
      newContextDrafts[ctx.contextName] = {
        contextName: ctx.contextName,
        CE: ctx.CE,
        RO: ctx.RO,
        AC: ctx.AC,
        AE: ctx.AE,
      }
      hasRestored = true
    })

    if (hasRestored) {
      dispatch({
        type: 'HYDRATE',
        sessionId,
        drafts: Object.keys(newDrafts).length ? newDrafts : undefined,
        contextDrafts: Object.keys(newContextDrafts).length ? newContextDrafts : undefined,
      })
    }
    hydrationRef.current = true
  }, [sessionId, sessionStateQuery.data, learningItems, dispatch])

  const rankedItemsCount = useMemo(
    () => learningItems.filter((item) => isItemComplete(drafts[item.id])).length,
    [learningItems, drafts],
  )

  const contextsCompleteCount = useMemo(
    () => LFI_CONTEXTS.filter((contextName) => isContextComplete(contextDrafts[contextName])).length,
    [contextDrafts],
  )

  const totalItems = learningItems.length
  const totalContexts = LFI_CONTEXTS.length
  const canSubmit = Boolean(sessionId) && totalItems > 0 && rankedItemsCount === totalItems && contextsCompleteCount === totalContexts

  const submitMutation = useMutation({
    mutationFn: ({ sessionId: targetSessionId, payload }: { sessionId: number; payload: SessionSubmissionPayload }) =>
      submitAllResponses(targetSessionId, payload),
  })

  const singleResponseMutation = useMutation({
    mutationFn: ({
      sessionId: targetSessionId,
      itemId,
      responseMap,
    }: {
      sessionId: number
      itemId: number
      responseMap: Record<number, number>
    }) => submitSingleResponse(targetSessionId, itemId, responseMap),
  })

  const setOptionRank = useCallback(
    (itemId: number, choiceId: number, rank: number | null) => {
      markItemInteraction(itemId)

      let newRanks: Record<number, number> = {}

      // Calculate new ranks based on current state
      const existing = drafts[itemId] ?? {
        itemId,
        ranks: {},
        responseLatencyMs: 0,
        blurEvents: 0,
      }
      const ranks = { ...existing.ranks }

      // Capture previous rank for telemetry
      const fromRank = ranks[choiceId] ?? null

      if (rank === null) {
        delete ranks[choiceId]
      } else {
        Object.entries(ranks).forEach(([key, currentRank]) => {
          if (Number(key) !== choiceId && currentRank === rank) {
            delete ranks[Number(key)]
          }
        })
        ranks[choiceId] = rank
      }
      newRanks = ranks

      dispatch({ type: 'SET_ITEM_RANK', itemId, ranks: newRanks })

      // Send telemetry if rank changed and is not null (clearing not supported by backend event)
      if (rank !== null && fromRank !== rank) {
        sendItemChanged(itemId, fromRank, rank)
      }

      // Check if item is complete and submit incrementally
      const item = learningItems.find((i) => i.id === itemId)
      if (item && sessionId) {
        // Reconstruct draft to check completion
        const tempDraft: TunnelItemDraft = {
          itemId,
          ranks: newRanks,
          responseLatencyMs: 0,
          blurEvents: 0,
        }
        const modeRanks = deriveModeRanks(item, tempDraft)
        if (modeRanks) {
          singleResponseMutation.mutate({ sessionId, itemId, responseMap: newRanks })
        }
      }
    },
    [markItemInteraction, learningItems, sessionId, singleResponseMutation, drafts, dispatch, sendItemChanged],
  )

  const setContextRank = useCallback((contextName: string, mode: ModeCode, rank: number | null) => {
    const existing = contextDrafts[contextName] ?? {
      contextName,
      CE: null,
      RO: null,
      AC: null,
      AE: null,
    }
    const updated: TunnelContextDraft = { ...existing }
    if (rank === null) {
      updated[mode] = null
    } else {
      MODE_CODES.forEach((code) => {
        if (code !== mode && updated[code] === rank) {
          updated[code] = null
        }
      })
      updated[mode] = rank
    }

    dispatch({ type: 'SET_CONTEXT_RANK', contextName, draft: updated })
  }, [contextDrafts, dispatch])

  const buildSubmissionPayload = useCallback((): SessionSubmissionPayload => {
    const startTimeStr = typeof window !== 'undefined' ? window.localStorage.getItem(START_TIME_STORAGE_KEY) : null
    const startTime = startTimeStr ? parseInt(startTimeStr, 10) : Date.now()
    const duration = Date.now() - startTime

    return {
      items: learningItems.map((item) => {
        const ranks = drafts[item.id]?.ranks
        if (!ranks || Object.keys(ranks).length !== MODE_CODES.length) {
          throw new Error('Incomplete item ranks detected.')
        }
        return { itemId: item.id, ranks }
      }),
      contexts: LFI_CONTEXTS.map((contextName) => {
        const draft = contextDrafts[contextName]
        if (!isContextComplete(draft)) {
          throw new Error('Incomplete context ranks detected.')
        }
        return {
          contextName,
          CE: draft.CE!,
          RO: draft.RO!,
          AC: draft.AC!,
          AE: draft.AE!,
        }
      }),
      clientDurationMs: duration,
    }
  }, [learningItems, drafts, contextDrafts])

  useEffect(() => {
    if (!sessionId || !learningItems.length) {
      return
    }
    learningItems.forEach((item) => {
      const draft = drafts[item.id]
      if (!isItemComplete(draft)) {
        return
      }
      const modeRanks = deriveModeRanks(item, draft)
      if (!modeRanks) {
        return
      }
      const signature = JSON.stringify(modeRanks)
      const metrics = ensureItemMetrics(item.id)
      if (metrics.lastSignature === signature) {
        return
      }
      const topEntry = Object.entries(modeRanks).find(([, rank]) => rank === 1)
      sendTelemetry({
        itemId: item.id,
        responseRank: topEntry?.[1] ?? 1,
        responseLatencyMs: clampLatency(Date.now() - metrics.startedAt),
        blurEvents: metrics.blurEvents,
        meta: {
          ranks: modeRanks,
          topChoice: topEntry?.[0] ?? null,
        },
      })
      metrics.lastSignature = signature
      metrics.blurEvents = 0
      metrics.startedAt = Date.now()
    })
  }, [drafts, ensureItemMetrics, learningItems, sendTelemetry, sessionId])

  useEffect(() => {
    if (typeof window === 'undefined' || !sessionId || !learningItems.length) {
      return
    }
    const responses = learningItems
      .map((item) => {
        const modeRanks = deriveModeRanks(item, drafts[item.id])
        if (!modeRanks) {
          return null
        }
        return { itemId: item.id, ranks: modeRanks }
      })
      .filter(Boolean) as SessionAutosavePayload['responses']
    const contextsPayload = LFI_CONTEXTS.filter((contextName) => isContextComplete(contextDrafts[contextName])).map((contextName) => {
      const draft = contextDrafts[contextName] as TunnelContextDraft
      return {
        contextName,
        CE: draft.CE!,
        RO: draft.RO!,
        AC: draft.AC!,
        AE: draft.AE!,
      }
    })
    if ((!responses || !responses.length) && !contextsPayload.length) {
      return
    }
    const payload: SessionAutosavePayload = {
      responses,
      contexts: contextsPayload,
    }
    const nextSignature = JSON.stringify(payload)
    if (nextSignature === autosaveSignatureRef.current) {
      return
    }
    const timer = window.setTimeout(() => {
      autosaveSignatureRef.current = nextSignature
      autosaveMutation.mutate({ sessionId, payload })
    }, 800)
    return () => window.clearTimeout(timer)
  }, [autosaveMutation, contextDrafts, drafts, learningItems, sessionId])

  const finalize = useCallback(async () => {
    if (!sessionId) {
      throw new Error('No active session to finalize.')
    }
    if (!canSubmit) {
      throw new Error('Complete all items and contexts before finalizing.')
    }
    dispatch({ type: 'SET_PHASE', phase: 'submitting' })
    dispatch({ type: 'SET_SUBMISSION_ERROR', error: null as any }) // Reset error
    const payload = buildSubmissionPayload()
    try {
      const response = await submitMutation.mutateAsync({ sessionId, payload })
      dispatch({ type: 'SET_SUBMISSION_RESULT', result: response.result ?? null })
      clearPersistentState()
      return response
    } catch (error) {
      dispatch({ type: 'SET_SUBMISSION_ERROR', error: error instanceof Error ? error : new Error('Unable to finalize session') })
      throw error
    }
  }, [sessionId, canSubmit, buildSubmissionPayload, submitMutation, clearPersistentState, dispatch])

  const start = useCallback(async () => {
    if (!isAuthenticated) {
      throw new Error('You must be signed in to start an assessment session.')
    }
    if (isTimeLocked) {
      throw new Error('Token TTL is below the tunnel threshold. Please re-authenticate before starting.')
    }
    if (sessionId) {
      return sessionId
    }
    const response = await startMutation.mutateAsync()
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(START_TIME_STORAGE_KEY, Date.now().toString())
    }
    return response.sessionId
  }, [isAuthenticated, isTimeLocked, sessionId, startMutation])

  const stateSnapshot = useMemo(
    () => ({
      sessionId,
      phase,
      drafts,
      contextDrafts,
      contextNames: LFI_CONTEXTS,
      items: learningItems,
      totalItems,
      rankedItemsCount,
      totalContexts,
      contextsCompleteCount,
      canSubmit,
      result: submissionResult,
      submissionError,
      isSubmitting: phase === 'submitting' || submitMutation.status === 'pending',
      isLoading: phase === 'loading',
      isFetchingItems: itemsQuery.isFetching,
      error: itemsQuery.error ?? startMutation.error ?? null,
      start,
      setOptionRank,
      setContextRank,
      finalize,
      reset,
      setActiveItem,
      lastAutosaveAt,
      restoredFromDraft,
      acknowledgeRestoredDraft,
      isAutosaving: autosaveMutation.status === 'pending',
      itemsProgressPercent: totalItems ? Math.round((rankedItemsCount / totalItems) * 100) : 0,
      contextsProgressPercent: totalContexts ? Math.round((contextsCompleteCount / totalContexts) * 100) : 0,
    }),
    [
      sessionId,
      phase,
      drafts,
      contextDrafts,
      learningItems,
      totalItems,
      rankedItemsCount,
      totalContexts,
      contextsCompleteCount,
      canSubmit,
      submissionResult,
      submissionError,
      submitMutation.status,
      itemsQuery.isFetching,
      itemsQuery.error,
      startMutation.error,
      start,
      setOptionRank,
      setContextRank,
      finalize,
      reset,
      setActiveItem,
      autosaveMutation.status,
      lastAutosaveAt,
      restoredFromDraft,
      acknowledgeRestoredDraft,
    ],
  )

  return stateSnapshot
}
