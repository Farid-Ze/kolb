import { useState } from 'react'
import { Link } from 'react-router-dom'

import { formatContextDescription, MODE_CODES } from '../../../entities/session/constants'
import { Button } from '../../../shared/ui/Button'
import { useAuth } from '../../auth'
import { useTunnelSession } from '../hooks/useTunnelSession'

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
          <Button disabled={isLoading || Boolean(sessionId)} isLoading={isLoading} onClick={handleStart} type="button">
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
              <p className="text-sm uppercase tracking-wide text-slate-400">Forced-choice items</p>
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
                <span>
                  {rankedItemsCount}/{totalItems} completed
                </span>
                <span>Progress: {itemsProgressPercent}%</span>
              </div>
              <p className="text-slate-500">Rank each option 1–4 with no duplicates per item.</p>
            </header>
            {isFetchingItems && <p className="text-slate-400">Loading assessment items…</p>}
            <div className="grid gap-4">
              {items.map((item) => (
                <article key={item.id} className="space-y-4 rounded-2xl border border-slate-800/40 bg-slate-900/40 p-5">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">Item #{item.number}</p>
                    <h3 className="text-xl font-semibold text-white">{item.stem}</h3>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {item.options?.map((option) => {
                      const currentRank = drafts[item.id]?.ranks?.[option.id] ?? null
                      return (
                        <label key={option.id} className="space-y-2 rounded-xl border border-slate-800/60 bg-slate-900/60 p-3 text-sm text-slate-200">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-white">{option.code ?? option.id}</span>
                            <span className="text-xs uppercase tracking-wide text-slate-500">Rank</span>
                          </div>
                          <p className="text-slate-400">{option.label}</p>
                          <select
                            className="mt-2 w-full rounded-md border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
                            onBlur={() => setActiveItem(null)}
                            onChange={(event) =>
                              setOptionRank(item.id, option.id, event.target.value ? Number(event.target.value) : null)
                            }
                            onFocus={() => setActiveItem(item.id)}
                            value={currentRank ?? ''}
                          >
                            <option value="">–</option>
                            {[1, 2, 3, 4].map((rank) => (
                              <option key={rank} value={rank}>
                                {rank}
                              </option>
                            ))}
                          </select>
                        </label>
                      )
                    })}
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <header className="flex flex-col gap-1">
              <p className="text-sm uppercase tracking-wide text-slate-400">Learning Flexibility contexts</p>
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
                <span>
                  {contextsCompleteCount}/{totalContexts} contexts ranked
                </span>
                <span>Progress: {contextsProgressPercent}%</span>
              </div>
              <p className="text-slate-500">Assign a unique rank (1–4) for each mode per context.</p>
            </header>
            <div className="grid gap-4 md:grid-cols-2">
              {contextNames.map((contextName) => {
                const context = contextDrafts[contextName]
                return (
                  <article key={contextName} className="space-y-3 rounded-2xl border border-slate-800/40 bg-slate-900/40 p-5">
                    <h3 className="text-lg font-semibold text-white">{formatContextDescription(contextName)}</h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {MODE_CODES.map((mode) => (
                        <label key={mode} className="space-y-2 text-sm">
                          <span className="text-xs uppercase tracking-wide text-slate-400">{mode}</span>
                          <select
                            className="w-full rounded-md border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
                            onChange={(event) =>
                              setContextRank(contextName, mode, event.target.value ? Number(event.target.value) : null)
                            }
                            value={context?.[mode] ?? ''}
                          >
                            <option value="">–</option>
                            {[1, 2, 3, 4].map((rank) => (
                              <option key={rank} value={rank}>
                                {rank}
                              </option>
                            ))}
                          </select>
                        </label>
                      ))}
                    </div>
                  </article>
                )
              })}
            </div>
          </section>

          <section className="space-y-4 rounded-2xl border border-slate-800/60 bg-slate-900/60 p-6">
            <header className="flex flex-col gap-1 text-white">
              <p className="text-sm uppercase tracking-wide text-slate-400">Finalize</p>
              <p className="text-slate-200">Both forced-choice items and contexts must be complete before submission.</p>
            </header>
            <div className="flex flex-wrap gap-6 text-sm text-slate-300">
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
        <p className="text-center text-slate-500">Start a session to unlock the forced-choice tunnel.</p>
      )}
    </div>
  )
}
