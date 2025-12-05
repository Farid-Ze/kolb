import { memo } from 'react'

import type { AssessmentItem } from '../../../entities/session/model'

interface AssessmentItemCardProps {
  item: AssessmentItem
  draftRanks: Record<number, number> | undefined
  onRankChange: (itemId: number, optionId: number, rank: number | null) => void
  onFocus: (itemId: number) => void
  onBlur: () => void
}

export const AssessmentItemCard = memo(function AssessmentItemCard({
  item,
  draftRanks,
  onRankChange,
  onFocus,
  onBlur,
}: AssessmentItemCardProps) {
  return (
    <article className="space-y-4 rounded-2xl border border-[var(--zen-border)] bg-[var(--zen-bg-elevated)] p-5">
      <div>
        <p className="text-xs uppercase tracking-wide text-[var(--zen-text-muted)]">Item #{item.number}</p>
        <h3 className="text-xl font-semibold text-[var(--zen-text)]">{item.stem}</h3>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {item.options?.map((option) => {
          const currentRank = draftRanks?.[option.id] ?? null
          return (
            <label
              key={option.id}
              className="space-y-2 rounded-xl border border-[var(--zen-border)] bg-[var(--zen-bg)] p-3 text-sm text-[var(--zen-text)]"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[var(--zen-text)]">{option.code ?? option.id}</span>
                <span className="text-xs uppercase tracking-wide text-[var(--zen-text-muted)]">Rank</span>
              </div>
              <p className="text-[var(--zen-text-muted)]">{option.label}</p>
              <select
                aria-label={`Rank for option ${option.code ?? option.id}`}
                className="mt-2 w-full rounded-md border border-[var(--zen-border)] bg-[var(--zen-bg-elevated)] px-3 py-2 text-sm text-[var(--zen-text)] focus:border-[var(--zen-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--zen-accent)]/50"
                onBlur={onBlur}
                onChange={(event) =>
                  onRankChange(item.id, option.id, event.target.value ? Number(event.target.value) : null)
                }
                onFocus={() => onFocus(item.id)}
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
  )
})
