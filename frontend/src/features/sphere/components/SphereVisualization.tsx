import { useMemo } from 'react'
import type { SphereNode } from '../model'

interface SphereVisualizationProps {
  nodes: SphereNode[]
  onNodeSelect?: (node: SphereNode) => void
}

export function SphereVisualization({ nodes, onNodeSelect }: SphereVisualizationProps) {
  // Determine bounds to normalize coordinates if needed
  // For now, assuming coordinates are roughly in a -100 to 100 range or similar, 
  // we'll map them to an SVG viewbox.
  
  const viewBoxSize = 400
  const center = viewBoxSize / 2
  const scale = 2 // Adjust scale factor as needed

  const renderedNodes = useMemo(() => {
    return nodes.map((node) => {
      // Simple projection: use X and Y directly, centered in SVG
      const cx = center + node.posX * scale
      const cy = center + node.posY * scale // Invert Y if needed for standard cartesian vs screen coords

      return {
        ...node,
        cx,
        cy,
      }
    })
  }, [nodes, center, scale])

  return (
    <div className="aspect-square w-full max-w-[500px] overflow-hidden rounded-full border border-[var(--zen-border)] bg-[var(--zen-bg-elevated)] shadow-inner">
      <svg viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`} className="h-full w-full">
        {/* Background Grid/Circles */}
        <circle cx={center} cy={center} r={viewBoxSize * 0.1} fill="none" stroke="var(--zen-border)" strokeDasharray="4 4" />
        <circle cx={center} cy={center} r={viewBoxSize * 0.3} fill="none" stroke="var(--zen-border)" strokeDasharray="4 4" />
        
        {/* Nodes */}
        {renderedNodes.map((node) => (
          <g key={node.id} onClick={() => onNodeSelect?.(node)} className="cursor-pointer transition-opacity hover:opacity-80">
            <circle
              cx={node.cx}
              cy={node.cy}
              r={6}
              fill="var(--zen-accent)"
              stroke="var(--zen-bg)"
              strokeWidth={2}
            />
            <text
              x={node.cx}
              y={node.cy + 15}
              textAnchor="middle"
              className="fill-[var(--zen-text-muted)] text-[10px] uppercase"
              style={{ fontSize: '10px' }}
            >
              {node.id}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}
