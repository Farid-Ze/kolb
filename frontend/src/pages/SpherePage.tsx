import { useState } from 'react'

import { ReflectionForm } from '../features/sphere/components/ReflectionForm'
import { ReflectionList } from '../features/sphere/components/ReflectionList'
import { SphereVisualization } from '../features/sphere/components/SphereVisualization'
import { useSphere } from '../features/sphere/hooks/useSphere'
import type { ReflectionType, SphereNode } from '../features/sphere/model'

export function SpherePage() {
  const { nodes, reflections, prompt, isLoading, createReflection, isCreating } = useSphere()
  const [selectedNode, setSelectedNode] = useState<SphereNode | null>(null)

  const handleCreateReflection = async (content: string, type: ReflectionType) => {
    await createReflection({
      content,
      reflectionType: type,
      sphereNodeId: selectedNode?.id,
    })
  }

  if (isLoading) {
    return <div className="py-10 text-center text-[var(--zen-text-muted)]">Loading Zenosphere...</div>
  }

  const filteredReflections = selectedNode
    ? reflections.filter((r) => r.sphereNodeId === selectedNode.id)
    : reflections

  return (
    <section className="space-y-8">
      <header>
        <p className="font-ui text-xs uppercase tracking-wider text-[var(--zen-text-muted)]">Sphere / Past</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-[var(--zen-text)]">Zenosphere</h1>
        {prompt && <p className="mt-3 text-lg italic text-[var(--zen-accent)]">"{prompt}"</p>}
      </header>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="flex flex-col items-center space-y-4">
          <div className="flex w-full items-center justify-between">
            <h2 className="font-display text-xl font-medium text-[var(--zen-text)]">Nodes ({nodes.length})</h2>
            {selectedNode && (
              <button
                onClick={() => setSelectedNode(null)}
                className="text-xs text-[var(--zen-accent)] hover:underline transition-colors"
              >
                Clear Selection
              </button>
            )}
          </div>
          
          <SphereVisualization nodes={nodes} onNodeSelect={setSelectedNode} />
          
          {selectedNode && (
            <div className="w-full rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              <h3 className="font-medium text-[var(--zen-text)]">Node #{selectedNode.id}</h3>
              <p className="text-sm text-[var(--zen-text-muted)]">Unlocked: {new Date(selectedNode.unlockDate).toLocaleDateString()}</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="mb-4 font-display text-xl font-medium text-[var(--zen-text)]">
              {selectedNode ? `Reflections for Node #${selectedNode.id}` : 'All Reflections'}
            </h2>
            <ReflectionForm onSubmit={handleCreateReflection} isSubmitting={isCreating} />
          </div>
          
          <ReflectionList reflections={filteredReflections} />
        </div>
      </div>
    </section>
  )
}
