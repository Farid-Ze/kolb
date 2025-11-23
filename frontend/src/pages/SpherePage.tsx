import { useState } from 'react'

import { useSphere } from '../features/sphere/hooks/useSphere'
import { Button } from '../shared/ui/Button'

export function SpherePage() {
  const { nodes, reflections, prompt, isLoading, createReflection, isCreating } = useSphere()
  const [reflectionContent, setReflectionContent] = useState('')

  if (isLoading) {
    return <div className="py-10 text-center text-[var(--zen-text-muted)]">Loading Zenosphere...</div>
  }

  return (
    <section className="space-y-8">
      <header>
        <p className="text-sm uppercase tracking-wide text-[var(--zen-text-muted)]">Sphere / Past</p>
        <h1 className="text-2xl font-semibold">Zenosphere</h1>
        {prompt && <p className="mt-2 text-lg italic text-[var(--zen-accent)]">"{prompt}"</p>}
      </header>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-xl font-medium">Nodes ({nodes.length})</h2>
          <div className="grid grid-cols-3 gap-4">
            {nodes.map((node) => (
              <div
                key={node.id}
                className="flex aspect-square items-center justify-center rounded-full border border-[var(--zen-border)] bg-[var(--zen-bg-elevated)]"
              >
                <span className="text-xs">Node {node.id}</span>
              </div>
            ))}
            {nodes.length === 0 && <p className="col-span-3 text-sm text-[var(--zen-text-muted)]">No nodes unlocked yet.</p>}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-medium">Reflections</h2>
          <div className="space-y-4">
            <div className="rounded-lg border border-[var(--zen-border)] p-4">
              <textarea
                className="w-full bg-transparent p-2 text-sm outline-none placeholder:text-[var(--zen-text-muted)]"
                placeholder="Write a reflection..."
                rows={3}
                value={reflectionContent}
                onChange={(e) => setReflectionContent(e.target.value)}
              />
              <div className="mt-2 flex justify-end">
                <Button
                  disabled={!reflectionContent || isCreating}
                  onClick={() => {
                    createReflection({ content: reflectionContent, reflectionType: 'Thinking' }).then(() =>
                      setReflectionContent(''),
                    )
                  }}
                >
                  {isCreating ? 'Saving...' : 'Save Reflection'}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              {reflections.map((ref) => (
                <div key={ref.id} className="rounded-md bg-[var(--zen-bg-elevated)] p-3 text-sm">
                  <div className="mb-1 flex items-center justify-between text-xs text-[var(--zen-text-muted)]">
                    <span className="uppercase">{ref.reflectionType}</span>
                    <span>{new Date(ref.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p>{ref.content}</p>
                </div>
              ))}
              {reflections.length === 0 && <p className="text-sm text-[var(--zen-text-muted)]">No reflections yet.</p>}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
