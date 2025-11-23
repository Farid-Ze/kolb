import { useEffect, useState } from 'react'
import { Link, useBlocker } from 'react-router-dom'

import { Button } from '../../../shared/ui/Button'
import { useAuth } from '../../auth'
import { useTunnelSession } from '../hooks/useTunnelSession'
import { AssessmentContextCard } from './AssessmentContextCard'
import { AssessmentItemCard } from './AssessmentItemCard'

type FinalizeSnapshot = {
  ACCE?: number
  AERO?: number
  LFI?: number
  style_primary_id?: string
  override?: boolean
  validation?: { ready?: boolean; issues?: Array<{ code?: string; message?: string }> }
  percentiles?: Record<string, number>
}

export function FutureTunnelExperience() {
  const { isAuthenticated, isTimeLocked } = useAuth()
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const {
    sessionId,
    phase,
    items,
    drafts,
    contextNames,
    contextDrafts,
    totalItems,
    rankedItemsCount,
    totalContexts,
    contextsCompleteCount,
    itemsProgressPercent,
    contextsProgressPercent,
    isLoading,
    isFetchingItems,
    error,
    start,
    setOptionRank,
    setContextRank,
    setActiveItem,
    canSubmit,
    finalize,
    isSubmitting,
    submissionError,
    result,
    lastAutosaveAt,
    isAutosaving,
    restoredFromDraft,
    acknowledgeRestoredDraft,
  } = useTunnelSession()

  const finalizeSnapshot = (result as FinalizeSnapshot | null) ?? null
  const validationIssues = finalizeSnapshot?.validation?.issues ?? []

  const shouldBlock = Boolean(sessionId) && !result
  const blocker = useBlocker(shouldBlock)

  useEffect(() => {
    if (blocker.state === 'blocked') {
      const confirm = window.confirm(
        'You have an active session. Are you sure you want to leave? Your progress is saved incrementally, but you should finalize it to get your results.',
      )
      if (confirm) {
        blocker.proceed()
      } else {
        blocker.reset()
      }
    }
  }, [blocker])

  const handleStart = async () => {
    setStatusMessage(null)
    try {
      await start()
    } catch (err) {
      console.error(err)
      setStatusMessage(err instanceof Error ? err.message : 'Unable to start session')
    }
  }

  const handleFinalize = async () => {
    setStatusMessage(null)
    try {
      await finalize()
      setStatusMessage('Session finalized. Head to the dashboard or store to see new rewards!')
    } catch (err) {
      console.error(err)
      if (err instanceof Error) {
        setStatusMessage(err.message)
      } else {
        setStatusMessage('Unable to finalize session')
      }
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-slate-400">Sign in to access the Future Tunnel experience.</p>
        <Link
          className="inline-flex items-center justify-center rounded-md border border-slate-700 bg-white px-4 py-2 text-sm font-semibold text-slate-900"
          to="/auth"
        >
          Go to Auth
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-slate-800/40 bg-slate-900/60 p-6 text-left">
        <p className="text-sm uppercase tracking-wide text-slate-400">Session</p>
        <div className="mt-2 flex flex-wrap items-center gap-4 text-slate-100">
          <span>Phase: {phase}</span>
          {sessionId && <span>Session ID: {sessionId}</span>}
          {isTimeLocked && <span className="text-amber-300">Token TTL requires re-auth soon.</span>}
          {sessionId && (
            <span className="text-sm text-slate-300">
              {isAutosaving ? 'Autosaving…' : lastAutosaveAt ? `Last autosave ${new Date(lastAutosaveAt).toLocaleTimeString()}` : 'Draft not yet saved'}
            </span>
          )}
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button
            disabled={isLoading || Boolean(sessionId) || isTimeLocked}
            isLoading={isLoading}
            onClick={handleStart}
            type="button"
          >
            {sessionId ? 'Session Active' : 'Start Session'}
          </Button>
          {sessionId && (
            <Link
              className="inline-flex items-center justify-center rounded-md border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-200"
              to="/future/dashboard"
            >
              View Dashboard
            </Link>
          )}
        </div>
        {statusMessage && <p className="mt-3 text-sm text-slate-200">{statusMessage}</p>}
        {error && <p className="mt-3 text-sm text-rose-300">{error.message}</p>}
        {restoredFromDraft && (
          <div className="mt-4 flex flex-wrap items-start justify-between gap-3 rounded-xl border border-emerald-400/60 bg-emerald-50/10 p-4 text-sm text-emerald-100">
            <div>
              <p className="font-semibold text-emerald-200">Progress restored</p>
              <p className="text-emerald-100/90">Draft ranks were recovered from your last session so you can resume without losing work.</p>
            </div>
            <button
              className="rounded-md border border-emerald-300/70 px-3 py-1 text-xs uppercase tracking-wide text-emerald-100 hover:bg-emerald-300/10"
              onClick={acknowledgeRestoredDraft}
              type="button"
            >
              Dismiss
            </button>
          </div>
        )}
      </section>

      {sessionId ? (
        <>
          <section className="space-y-4">
            <header className="flex flex-col gap-1">
              <p className="text-sm uppercase tracking-wide text-[var(--zen-text-muted)]">Forced-choice items</p>
              <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--zen-text-muted)]">
                <span>
                  {rankedItemsCount}/{totalItems} items ranked
                </span>
                <span>Progress: {itemsProgressPercent}%</span>
              </div>
              <p className="text-[var(--zen-text-muted)]">Rank each option 1–4 with no duplicates per item.</p>
            </header>
            {isFetchingItems && <p className="text-[var(--zen-text-muted)]">Loading assessment items…</p>}
            <div className="grid gap-4">
              {items.map((item) => (
                <AssessmentItemCard
                  key={item.id}
                  item={item}
                  draftRanks={drafts[item.id]?.ranks}
                  onRankChange={setOptionRank}
                  onFocus={setActiveItem}
                  onBlur={() => setActiveItem(null)}
                />
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <header className="flex flex-col gap-1">
              <p className="text-sm uppercase tracking-wide text-[var(--zen-text-muted)]">Learning Flexibility contexts</p>
              <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--zen-text-muted)]">
                <span>
                  {contextsCompleteCount}/{totalContexts} contexts ranked
                </span>
                <span>Progress: {contextsProgressPercent}%</span>
              </div>
              <p className="text-[var(--zen-text-muted)]">Assign a unique rank (1–4) for each mode per context.</p>
            </header>
            <div className="grid gap-4 md:grid-cols-2">
              {contextNames.map((contextName) => (
                <AssessmentContextCard
                  key={contextName}
                  contextName={contextName}
                  draft={contextDrafts[contextName]}
                  onRankChange={setContextRank}
                />
              ))}
            </div>
          </section>

          <section className="space-y-4 rounded-2xl border border-[var(--zen-border)] bg-[var(--zen-bg-elevated)] p-6">
            <header className="flex flex-col gap-1 text-[var(--zen-text)]">
              <p className="text-sm uppercase tracking-wide text-[var(--zen-text-muted)]">Finalize</p>
              <p className="text-[var(--zen-text-muted)]">Both forced-choice items and contexts must be complete before submission.</p>
            </header>
            <div className="flex flex-wrap gap-6 text-sm text-[var(--zen-text-muted)]">
              <span>Items complete: {rankedItemsCount}/{totalItems}</span>
              <span>Contexts complete: {contextsCompleteCount}/{totalContexts}</span>
            </div>
            <Button
              className="w-full"
              disabled={!canSubmit}
              isLoading={isSubmitting}
              onClick={handleFinalize}
              type="button"
            >
              Finalize session
            </Button>
            {submissionError && <p className="text-sm text-rose-400">{submissionError.message}</p>}
          </section>

          {finalizeSnapshot && (
            <section className="space-y-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-6 text-emerald-900">
              <header>
                <p className="text-sm uppercase tracking-wide text-emerald-700">Scoring snapshot</p>
                <h3 className="text-2xl font-semibold">Results stored</h3>
              </header>
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-emerald-700">ACCE</dt>
                  <dd className="text-lg font-semibold">{finalizeSnapshot.ACCE ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-emerald-700">AERO</dt>
                  <dd className="text-lg font-semibold">{finalizeSnapshot.AERO ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-emerald-700">LFI score</dt>
                  <dd className="text-lg font-semibold">{finalizeSnapshot.LFI ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-emerald-700">Primary style</dt>
                  <dd className="text-lg font-semibold">{finalizeSnapshot.style_primary_id ?? '—'}</dd>
                </div>
              </dl>
              {validationIssues.length > 0 && (
                <p className="text-sm text-emerald-800">
                  Validation notes: {validationIssues.map((issue) => issue.code || 'issue').join(', ')}
                </p>
              )}
              <div className="flex flex-wrap gap-3 text-sm">
                <Link className="text-emerald-900 underline" to="/future/dashboard">
                  Review dashboard insights
                </Link>
                <Link className="text-emerald-900 underline" to="/store">
                  Visit ZenStore
                </Link>
              </div>
            </section>
          )}
        </>
      ) : (
        <p className="text-center text-[var(--zen-text-muted)]">Start a session to unlock the forced-choice tunnel.</p>
      )}
    </div>
  )
}
