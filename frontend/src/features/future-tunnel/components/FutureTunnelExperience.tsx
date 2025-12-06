import { useEffect, useState, memo, useRef } from 'react'
import { Link, useBlocker } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

import { Button } from '../../../shared/ui/Button'
import { useAuth } from '../../auth'
import { useTunnelSession } from '../hooks/useTunnelSession'
import { AssessmentContextCard } from './AssessmentContextCard'
import { AssessmentItemCard } from './AssessmentItemCard'

/**
 * AWWWARDS-LEVEL TUNNEL EXPERIENCE
 * 
 * Premium animations:
 * - Staggered item entrance
 * - Progress celebration at milestones
 * - Smooth phase transitions
 * - Completion celebration
 */

// Premium animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
}

const celebrationVariants = {
  initial: { scale: 0.8, opacity: 0 },
  animate: {
    scale: 1,
    opacity: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 20,
    },
  },
  exit: { scale: 0.8, opacity: 0 },
}

// Progress celebration component
const ProgressCelebration = memo(function ProgressCelebration({ 
  percent 
}: { 
  percent: number 
}) {
  const [showCelebration, setShowCelebration] = useState(false)
  const [currentMilestone, setCurrentMilestone] = useState(0)
  const lastMilestoneRef = useRef(0)

  useEffect(() => {
    const milestones = [25, 50, 75, 100]
    const hitMilestone = milestones.find(m => percent >= m && m > lastMilestoneRef.current)
    
    if (hitMilestone) {
      lastMilestoneRef.current = hitMilestone
      setCurrentMilestone(hitMilestone)
      setShowCelebration(true)
      const timer = setTimeout(() => setShowCelebration(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [percent])

  return (
    <AnimatePresence>
      {showCelebration && (
        <motion.div
          variants={celebrationVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
        >
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.1 }}
              className="text-6xl mb-4"
            >
              {currentMilestone === 100 ? '🎉' : currentMilestone >= 75 ? '🔥' : currentMilestone >= 50 ? '⚡' : '✨'}
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="font-headline text-2xl font-bold text-white"
            >
              {currentMilestone === 100 ? 'Complete!' : `${currentMilestone}% Done!`}
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
})

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
  const { isTimeLocked } = useAuth()
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
    } catch (err: unknown) {
      console.error(err)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const detail = (err as any)?.response?.data?.detail
      if (detail) {
        if (typeof detail === 'string') {
          setStatusMessage(detail)
        } else if (detail.message) {
          setStatusMessage(detail.message)
        } else {
          setStatusMessage('Submission failed.')
        }
      } else if (err instanceof Error) {
        setStatusMessage(err.message)
      } else {
        setStatusMessage('Unable to finalize session')
      }
    }
  }

  // Auth is guaranteed by ProtectedRoute in App.tsx

  // Combined progress for celebration
  const overallProgress = Math.round((itemsProgressPercent + contextsProgressPercent) / 2)

  return (
    <div className="space-y-8">
      {/* Progress Celebration Overlay */}
      <ProgressCelebration percent={overallProgress} />
      
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-6 text-left"
      >
        <p className="font-ui text-xs uppercase tracking-[0.2em] text-gray-400">Session</p>
        <div className="mt-3 flex flex-wrap items-center gap-4 text-gray-100">
          <span className="font-ui text-sm">Phase: <span className="text-white font-semibold">{phase}</span></span>
          {sessionId && <span className="font-mono text-xs text-gray-500">ID: {sessionId.slice(0, 8)}...</span>}
          {isTimeLocked && <span className="text-amber-400 text-sm">⚠️ Session expiring soon</span>}
          {sessionId && (
            <span className="text-xs text-gray-500">
              {isAutosaving ? (
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                  Saving...
                </span>
              ) : lastAutosaveAt ? (
                `Saved ${new Date(lastAutosaveAt).toLocaleTimeString()}`
              ) : (
                'Not saved yet'
              )}
            </span>
          )}
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button
            disabled={isLoading || Boolean(sessionId) || isTimeLocked}
            isLoading={isLoading}
            onClick={handleStart}
            type="button"
          >
            {sessionId ? 'Session Active' : 'Begin Assessment'}
          </Button>
          {sessionId && (
            <Link
              className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/[0.03] px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/[0.06] hover:border-white/20 transition-all duration-300"
              to="/future/dashboard"
            >
              View Dashboard
            </Link>
          )}
        </div>
        {statusMessage && (
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 text-sm text-gray-300 bg-white/[0.03] rounded-lg px-4 py-3"
          >
            {statusMessage}
          </motion.p>
        )}
        {error && (
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 text-sm text-red-400 bg-red-500/10 rounded-lg px-4 py-3"
          >
            {error.message}
          </motion.p>
        )}
        <AnimatePresence>
          {restoredFromDraft && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 flex flex-wrap items-start justify-between gap-3 rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-4 text-sm text-cyan-100 overflow-hidden"
            >
              <div>
                <p className="font-semibold text-cyan-300">✓ Progress Restored</p>
                <p className="text-cyan-200/80 mt-1">Your previous work was recovered. Continue where you left off.</p>
              </div>
              <button
                className="rounded-full border border-cyan-400/40 px-4 py-1.5 text-xs uppercase tracking-wide text-cyan-200 hover:bg-cyan-400/10 transition-colors"
                onClick={acknowledgeRestoredDraft}
                type="button"
              >
                Dismiss
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>

      <AnimatePresence mode="wait">
        {sessionId ? (
          <motion.div
            key="session-active"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            {/* Items Section */}
            <section className="space-y-4">
              <header className="flex flex-col gap-2">
                <p className="font-ui text-xs uppercase tracking-[0.2em] text-gray-400">Forced-choice items</p>
                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400 w-full">
                  <span className="font-mono">
                    {rankedItemsCount}/{totalItems}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/[0.05]">
                    <motion.div
                      className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${itemsProgressPercent}%` }}
                      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </div>
                  <span className="font-mono font-semibold text-white">{itemsProgressPercent}%</span>
                </div>
                <p className="text-sm text-gray-500">Rank each option 1–4 with no duplicates per item.</p>
              </header>
              {isFetchingItems && (
                <div className="flex items-center gap-3 text-gray-400 py-8">
                  <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                  <span>Loading assessment items...</span>
                </div>
              )}
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid gap-4"
              >
                {items.map((item, index) => (
                  <motion.div
                    key={item.id}
                    variants={itemVariants}
                    custom={index}
                  >
                    <AssessmentItemCard
                      item={item}
                      draftRanks={drafts[item.id]?.ranks}
                      onRankChange={setOptionRank}
                      onFocus={setActiveItem}
                      onBlur={() => setActiveItem(null)}
                    />
                  </motion.div>
                ))}
              </motion.div>
            </section>

            {/* Contexts Section */}
            <section className="space-y-4">
              <header className="flex flex-col gap-2">
                <p className="font-ui text-xs uppercase tracking-[0.2em] text-gray-400">Learning Flexibility Contexts</p>
                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400 w-full">
                  <span className="font-mono">
                    {contextsCompleteCount}/{totalContexts}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/[0.05]">
                    <motion.div
                      className="h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${contextsProgressPercent}%` }}
                      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </div>
                  <span className="font-mono font-semibold text-white">{contextsProgressPercent}%</span>
                </div>
                <p className="text-sm text-gray-500">Assign a unique rank (1–4) for each mode per context.</p>
              </header>
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid gap-4 md:grid-cols-2"
              >
                {contextNames.map((contextName, index) => (
                  <motion.div
                    key={contextName}
                    variants={itemVariants}
                    custom={index}
                  >
                    <AssessmentContextCard
                      contextName={contextName}
                      draft={contextDrafts[contextName]}
                      onRankChange={setContextRank}
                    />
                  </motion.div>
                ))}
              </motion.div>
            </section>

            {/* Finalize Section */}
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-6"
            >
              <header className="flex flex-col gap-1">
                <p className="font-ui text-xs uppercase tracking-[0.2em] text-gray-400">Finalize</p>
                <p className="text-sm text-gray-500">Complete all items and contexts to submit your assessment.</p>
              </header>
              <div className="flex flex-wrap gap-6 text-sm text-gray-400">
                <span className="flex items-center gap-2">
                  {rankedItemsCount === totalItems ? (
                    <span className="text-cyan-400">✓</span>
                  ) : (
                    <span className="text-gray-600">○</span>
                  )}
                  Items: {rankedItemsCount}/{totalItems}
                </span>
                <span className="flex items-center gap-2">
                  {contextsCompleteCount === totalContexts ? (
                    <span className="text-cyan-400">✓</span>
                  ) : (
                    <span className="text-gray-600">○</span>
                  )}
                  Contexts: {contextsCompleteCount}/{totalContexts}
                </span>
              </div>
              <Button
                className="w-full"
                disabled={!canSubmit}
                isLoading={isSubmitting}
                onClick={handleFinalize}
                type="button"
              >
                {canSubmit ? 'Complete & See Results' : 'Complete All Items First'}
              </Button>
              {submissionError && (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-red-400 bg-red-500/10 rounded-lg px-4 py-3"
                >
                  {submissionError.message}
                </motion.p>
              )}
            </motion.section>

            {/* Results Section */}
            <AnimatePresence>
              {finalizeSnapshot && (
                <motion.section 
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  className="space-y-4 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 backdrop-blur-sm p-6"
                >
                  <header>
                    <p className="font-ui text-xs uppercase tracking-[0.2em] text-cyan-400">🎉 Assessment Complete</p>
                    <h3 className="font-headline text-2xl font-bold text-white mt-2">Your Results</h3>
                  </header>
                  <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                      { label: 'ACCE', value: finalizeSnapshot.ACCE },
                      { label: 'AERO', value: finalizeSnapshot.AERO },
                      { label: 'LFI Score', value: finalizeSnapshot.LFI },
                      { label: 'Primary Style', value: finalizeSnapshot.style_primary_id },
                    ].map((stat, i) => (
                      <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + i * 0.1 }}
                        className="rounded-xl bg-white/[0.05] p-4"
                      >
                        <dt className="font-ui text-xs uppercase tracking-[0.15em] text-cyan-400">{stat.label}</dt>
                        <dd className="font-display text-2xl font-bold text-white mt-1">{stat.value ?? '—'}</dd>
                      </motion.div>
                    ))}
                  </dl>
                  {validationIssues.length > 0 && (
                    <p className="text-sm text-cyan-300/70">
                      Notes: {validationIssues.map((issue) => issue.code || 'issue').join(', ')}
                    </p>
                  )}
                  <Link 
                    className="inline-flex items-center gap-2 text-cyan-300 hover:text-cyan-200 transition-colors font-semibold"
                    to="/future/dashboard"
                  >
                    View Full Dashboard Insights →
                  </Link>
                </motion.section>
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div
            key="no-session"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center py-16"
          >
            <p className="text-gray-500 text-lg">Begin an assessment to unlock your learning profile</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
