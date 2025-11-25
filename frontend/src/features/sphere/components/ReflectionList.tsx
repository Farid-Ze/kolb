import type { Reflection } from '../model'

interface ReflectionListProps {
  reflections: Reflection[]
}

export function ReflectionList({ reflections }: ReflectionListProps) {
  if (reflections.length === 0) {
    return <p className="text-sm text-[var(--zen-text-muted)]">No reflections yet.</p>
  }

  return (
    <div className="space-y-4">
      {reflections.map((reflection) => (
        <div key={reflection.id} className="rounded-lg border border-[var(--zen-border)] bg-[var(--zen-bg)] p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="rounded-full bg-[var(--zen-bg-elevated)] px-2 py-0.5 text-xs font-medium text-[var(--zen-text-muted)]">
              {reflection.reflectionType}
            </span>
            <span className="text-xs text-[var(--zen-text-muted)]">
              {new Date(reflection.createdAt).toLocaleDateString()}
            </span>
          </div>
          <p className="text-sm text-[var(--zen-text)]">{reflection.content}</p>
        </div>
      ))}
    </div>
  )
}
