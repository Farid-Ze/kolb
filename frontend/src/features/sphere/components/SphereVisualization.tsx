import { memo, useMemo, useCallback } from 'react'
import type { SphereNode } from '../model'

interface SphereVisualizationProps {
  nodes: SphereNode[]
  onNodeSelect?: (node: SphereNode) => void
}

const VIEW_BOX_SIZE = 400
const CENTER = VIEW_BOX_SIZE / 2
const SCALE = 2

// Memoized node component to prevent unnecessary re-renders
const SphereNodeItem = memo(function SphereNodeItem({ 
  node, 
  cx, 
  cy, 
  onSelect 
}: { 
  node: SphereNode
  cx: number
  cy: number
  onSelect?: () => void 
}) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onSelect?.()
    }
  }

  return (
    <g 
      onClick={onSelect} 
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`Select learning style node ${node.id}`}
      className="cursor-pointer transition-opacity hover:opacity-80 focus:outline-none"
    >
      {/* Focus ring for accessibility */}
      <circle
        cx={cx}
        cy={cy}
        r={10}
        fill="transparent"
        stroke="transparent"
        strokeWidth={2}
        className="focus-within:stroke-indigo-400"
      />
      <circle
        cx={cx}
        cy={cy}
        r={6}
        fill="var(--zen-accent)"
        stroke="var(--zen-bg)"
        strokeWidth={2}
      />
      <text
        x={cx}
        y={cy + 15}
        textAnchor="middle"
        className="fill-[var(--zen-text-muted)] pointer-events-none"
        style={{ fontSize: '10px', textTransform: 'uppercase' }}
        aria-hidden="true"
      >
        {node.id}
      </text>
    </g>
  )
})

export const SphereVisualization = memo(function SphereVisualization({ 
  nodes, 
  onNodeSelect 
}: SphereVisualizationProps) {
  const renderedNodes = useMemo(() => {
    return nodes.map((node) => ({
      ...node,
      cx: CENTER + node.posX * SCALE,
      cy: CENTER + node.posY * SCALE,
    }))
  }, [nodes])

  const handleNodeSelect = useCallback((node: SphereNode) => {
    onNodeSelect?.(node)
  }, [onNodeSelect])

  return (
    <div className="aspect-square w-full max-w-[500px] overflow-hidden rounded-full border border-white/10 bg-white/5 shadow-inner">
      <svg viewBox={`0 0 ${VIEW_BOX_SIZE} ${VIEW_BOX_SIZE}`} className="h-full w-full">
        {/* Background Grid/Circles - static, no re-render needed */}
        <circle cx={CENTER} cy={CENTER} r={VIEW_BOX_SIZE * 0.1} fill="none" stroke="rgba(255,255,255,0.1)" strokeDasharray="4 4" />
        <circle cx={CENTER} cy={CENTER} r={VIEW_BOX_SIZE * 0.3} fill="none" stroke="rgba(255,255,255,0.1)" strokeDasharray="4 4" />

        {/* Nodes */}
        {renderedNodes.map((node) => (
          <SphereNodeItem
            key={node.id}
            node={node}
            cx={node.cx}
            cy={node.cy}
            onSelect={() => handleNodeSelect(node)}
          />
        ))}
      </svg>
    </div>
  )
})
