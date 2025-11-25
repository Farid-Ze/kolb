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
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-[var(--zen-border)] bg-[var(--zen-bg-elevated)] p-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-[var(--zen-text)]">Type</label>
        <div className="flex flex-wrap gap-2">
          {Object.values(ReflectionType).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                type === t
                  ? 'bg-[var(--zen-accent)] text-white'
                  : 'bg-[var(--zen-bg)] text-[var(--zen-text-muted)] hover:bg-[var(--zen-border)]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-[var(--zen-text)]">Reflection</label>
        <textarea
          className="w-full rounded-md border border-[var(--zen-border)] bg-[var(--zen-bg)] p-3 text-sm outline-none focus:border-[var(--zen-accent)]"
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
