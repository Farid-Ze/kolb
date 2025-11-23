import { memo } from 'react'

import { formatContextDescription, MODE_CODES } from '../../../entities/session/constants'
import type { LfiContextName, ModeCode } from '../../../entities/session/constants'
import type { TunnelContextDraft } from '../model'

interface AssessmentContextCardProps {
  contextName: LfiContextName
  draft: TunnelContextDraft | undefined
  onRankChange: (contextName: string, mode: ModeCode, rank: number | null) => void
}

export const AssessmentContextCard = memo(function AssessmentContextCard({
  contextName,
  draft,
  onRankChange,
}: AssessmentContextCardProps) {
  return (
    <article className="space-y-3 rounded-2xl border border-[var(--zen-border)] bg-[var(--zen-bg-elevated)] p-5">
      <h3 className="text-lg font-semibold text-[var(--zen-text)]">{formatContextDescription(contextName)}</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {MODE_CODES.map((mode) => (
          <label key={mode} className="space-y-2 text-sm">
            <span className="text-xs uppercase tracking-wide text-[var(--zen-text-muted)]">{mode}</span>
            <select
              className="w-full rounded-md border border-[var(--zen-border)] bg-[var(--zen-bg)] px-3 py-2 text-sm text-[var(--zen-text)] focus:border-[var(--zen-accent)] focus:outline-none"
              onChange={(event) =>
                onRankChange(contextName, mode, event.target.value ? Number(event.target.value) : null)
              }
              value={draft?.[mode] ?? ''}
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
})
