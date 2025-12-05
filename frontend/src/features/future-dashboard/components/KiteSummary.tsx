import { motion } from 'framer-motion'
import type { AssessmentResults } from '../model'
import { KiteChart } from './KiteChart'
import { StrengthsBlindspots } from './StrengthsBlindspots'

// Premium card animation variants
const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 100,
      damping: 15,
      duration: 0.6,
    },
  },
}

interface KiteSummaryProps {
  results?: AssessmentResults
}

export function KiteSummary({ results }: KiteSummaryProps) {
  if (!results) {
    return (
      <motion.div 
        className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        variants={cardVariants}
      >
        <p className="text-sm text-[var(--zen-text-muted)]">No finalized session yet. Complete the future tunnel to unlock insights.</p>
      </motion.div>
    )
  }

  return (
    <motion.div 
      className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={cardVariants}
      whileHover={{ scale: 1.01, transition: { type: 'spring', stiffness: 300, damping: 20 } }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-ui text-xs uppercase tracking-wider text-[var(--zen-text-muted)]">Latest Session</p>
          <h2 className="font-display text-xl font-semibold text-[var(--zen-text)]">Session #{results.sessionId}</h2>
        </div>
        {results.lfiScore !== undefined && results.lfiScore !== null && (
          <div className="rounded-lg border border-[var(--zen-accent)]/30 bg-[var(--zen-accent)]/10 px-4 py-2 text-[var(--zen-accent)]">
            LFI Score: <span className="font-semibold">{results.lfiScore.toFixed(2)}</span>
          </div>
        )}
      </div>
      
      <div className="grid gap-8 md:grid-cols-2">
        <section className="flex flex-col items-center justify-center">
          {results.kiteCoordinates && (
            <KiteChart results={results} />
          )}
        </section>

        <section className="space-y-6">
          <StrengthsBlindspots results={results} />
        </section>
      </div>
    </motion.div>
  )
}
