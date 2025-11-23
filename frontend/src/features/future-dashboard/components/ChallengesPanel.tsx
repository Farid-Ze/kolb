import type { UserChallenge } from '../../../entities/challenge/model'

interface ChallengesPanelProps {
  challenges: UserChallenge[]
  isLoading: boolean
}

export function ChallengesPanel({ challenges, isLoading }: ChallengesPanelProps) {
  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">Growth Challenges</p>
          <h2 className="text-xl font-semibold text-slate-900">Your Assignments</h2>
        </div>
        <span className="text-sm text-slate-500">{challenges.length} active</span>
      </div>
      {isLoading ? (
        <p className="text-sm text-slate-500">Loading challenges…</p>
      ) : challenges.length === 0 ? (
        <p className="text-sm text-slate-500">No challenges assigned yet. Finalize a tunnel to unlock personalized prompts.</p>
      ) : (
        <ul className="space-y-3">
          {challenges.map((challenge) => (
            <li key={challenge.id} className="rounded-lg border border-slate-100 bg-slate-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Challenge #{challenge.challengeId}</p>
                  <p className="text-xs text-slate-500">Status: {challenge.status}</p>
                </div>
                {challenge.completedAt && (
                  <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                    Completed
                  </span>
                )}
              </div>
              {challenge.proofUrl && (
                <a
                  className="mt-2 inline-flex text-xs font-medium text-indigo-600"
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
