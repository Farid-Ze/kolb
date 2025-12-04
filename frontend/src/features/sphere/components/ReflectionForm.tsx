import { useState } from 'react'
import { Button } from '../../../shared/ui/Button'
import { ReflectionType } from '../model'

interface ReflectionFormProps {
  onSubmit: (content: string, type: ReflectionType) => Promise<void>
  isSubmitting: boolean
}

export function ReflectionForm({ onSubmit, isSubmitting }: ReflectionFormProps) {
  const [content, setContent] = useState('')
  const [type, setType] = useState<ReflectionType>(ReflectionType.THINKING)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return
    
    await onSubmit(content, type)
    setContent('')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
      <div className="space-y-2">
        <label className="font-ui text-xs uppercase tracking-wider text-[var(--zen-text-muted)]">Type</label>
        <div className="flex flex-wrap gap-2">
          {Object.values(ReflectionType).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                type === t
                  ? 'bg-[var(--zen-accent)] text-white shadow-lg shadow-[var(--zen-accent)]/25'
                  : 'border border-white/10 bg-white/5 text-[var(--zen-text-muted)] hover:border-[var(--zen-accent)]/50 hover:text-[var(--zen-text)]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="font-ui text-xs uppercase tracking-wider text-[var(--zen-text-muted)]">Reflection</label>
        <textarea
          className="w-full rounded-lg border border-white/10 bg-[var(--zen-bg)] p-4 text-sm text-[var(--zen-text)] outline-none placeholder:text-[var(--zen-text-muted)] focus:border-[var(--zen-accent)] focus:ring-2 focus:ring-[var(--zen-accent)]/20 transition-all"
          placeholder="What's on your mind?"
          rows={3}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={isSubmitting}
        />
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting || !content.trim()}>
          {isSubmitting ? 'Saving...' : 'Save Reflection'}
        </Button>
      </div>
    </form>
  )
}
