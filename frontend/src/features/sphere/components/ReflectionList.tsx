import type { Reflection } from '../model'

interface ReflectionListProps {
  reflections: Reflection[]
}

export function ReflectionList({ reflections }: ReflectionListProps) {
  if (reflections.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur-sm">
        <p className="text-sm text-[var(--zen-text-muted)]">No reflections yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {reflections.map((reflection) => (
        <div key={reflection.id} className="rounded-xl border border-white/5 bg-[var(--zen-bg)] p-4 transition-colors hover:border-white/10">
          <div className="mb-2 flex items-center justify-between">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-[var(--zen-accent)]">
              {reflection.reflectionType}
            </span>
            <span className="text-xs text-[var(--zen-text-muted)]">
              {new Date(reflection.createdAt).toLocaleDateString()}
            </span>
          </div>
          <p className="text-sm leading-relaxed text-[var(--zen-text)]">{reflection.content}</p>
        </div>
      ))}
    </div>
  )
}
