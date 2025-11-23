import type { UserChallenge } from '../../../entities/challenge/model'

interface ChallengesPanelProps {
  challenges: UserChallenge[]
  isLoading: boolean
  blindspots?: string[]
}

export function ChallengesPanel({ challenges, isLoading, blindspots = [] }: ChallengesPanelProps) {
  return (
    <div className="space-y-6 rounded-xl border border-[var(--zen-border)] bg-[var(--zen-bg-elevated)] p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-[var(--zen-text-muted)]">Growth Challenges</p>
          <h2 className="text-xl font-semibold text-[var(--zen-text)]">Your Assignments</h2>
        </div>
        <span className="text-sm text-[var(--zen-text-muted)]">{challenges.length} active</span>
      </div>

      {blindspots.length > 0 && (
        <div className="rounded-lg border border-amber-100 bg-amber-50/50 p-4">
          <h3 className="mb-2 text-sm font-semibold text-amber-900">Recommended Focus Areas</h3>
          <p className="text-sm text-amber-800">
            Based on your assessment, consider selecting challenges that help you develop your{' '}
            <span className="font-medium">{blindspots.join(', ')}</span> capabilities.
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
            <li key={challenge.id} className="rounded-lg border border-[var(--zen-border)] bg-[var(--zen-bg)] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-[var(--zen-text)]">Challenge #{challenge.challengeId}</p>
                  <p className="text-xs text-[var(--zen-text-muted)]">Status: {challenge.status}</p>
                </div>
                {challenge.completedAt && (
                  <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
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
