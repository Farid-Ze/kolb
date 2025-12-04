import type { UserChallenge } from '../model'

interface ChallengesPanelProps {
  challenges: UserChallenge[]
  isLoading: boolean
  blindspots?: string[]
}

export function ChallengesPanel({ challenges, isLoading, blindspots = [] }: ChallengesPanelProps) {
  return (
    <div className="space-y-6 rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-ui text-xs uppercase tracking-wider text-[var(--zen-text-muted)]">Growth Challenges</p>
          <h2 className="font-display text-xl font-semibold text-[var(--zen-text)]">Your Assignments</h2>
        </div>
        <span className="text-sm text-[var(--zen-accent)]">{challenges.length} active</span>
      </div>

      {blindspots.length > 0 && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
          <h3 className="mb-2 text-sm font-semibold text-amber-400">Recommended Focus Areas</h3>
          <p className="text-sm text-amber-300/80">
            Based on your assessment, consider selecting challenges that help you develop your{' '}
            <span className="font-medium text-amber-300">{blindspots.join(', ')}</span> capabilities.
          </p>
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-[var(--zen-text-muted)]">Loading challenges…</p>
      ) : challenges.length === 0 ? (
        <p className="text-sm text-[var(--zen-text-muted)]">No challenges assigned yet. Finalize a tunnel to unlock personalized prompts.</p>
      ) : (
        <ul className="space-y-3">
          {challenges.map((challenge) => (
            <li key={challenge.id} className="rounded-lg border border-white/5 bg-[var(--zen-bg)] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-[var(--zen-text)]">Challenge #{challenge.challengeId}</p>
                  <p className="text-xs text-[var(--zen-text-muted)]">Status: {challenge.status}</p>
                </div>
                {challenge.completedAt && (
                  <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
                    Completed
                  </span>
                )}
              </div>
              {challenge.proofUrl && (
                <a
                  className="mt-2 inline-flex text-xs font-medium text-[var(--zen-accent)]"
                  href={challenge.proofUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  View proof
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
