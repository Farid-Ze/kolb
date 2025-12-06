/**
 * PLATFORM SCENE (18% - 32%)
 * 
 * Reveal the ecosystem. Three orbiting products.
 * 
 * Citrix Layered Information:
 * - Eyebrow: "THE ECOSYSTEM"
 * - Headline: "QUANTIFYING POTENTIAL"
 * - Visual labels: Three product icons (Future, Sphere, Teams) orbiting
 * - Data overlay: Connection lines between products
 * - Hotspot: Each product is interactive
 * - Fact: "One platform. Three experiences."
 * 
 * Animation:
 * - 18-22%: Scene enters, headline reveals
 * - 22-28%: Products orbit in, labels appear
 * - 28-32%: Connection lines pulse, transition to next
 */

import { memo } from 'react'
import { m, useTransform, type MotionValue } from 'framer-motion'

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

interface PlatformSceneProps {
  progress: MotionValue<number>
  reduced?: boolean | null
}

// ═══════════════════════════════════════════════════════════════════
// PRODUCT DATA
// ═══════════════════════════════════════════════════════════════════

const PRODUCTS = [
  { 
    id: 'future', 
    label: 'FUTURE', 
    description: 'Discover',
    icon: '◈',
    color: 'from-blue-500 to-blue-600',
    angle: -60, // Position on orbit circle (degrees)
  },
  { 
    id: 'sphere', 
    label: 'SPHERE', 
    description: 'Reflect',
    icon: '○',
    color: 'from-purple-500 to-purple-600',
    angle: 60,
  },
  { 
    id: 'teams', 
    label: 'TEAMS', 
    description: 'Collaborate',
    icon: '◇',
    color: 'from-emerald-500 to-emerald-600',
    angle: 180,
  },
]

// ═══════════════════════════════════════════════════════════════════
// ORBITING PRODUCTS
// ═══════════════════════════════════════════════════════════════════

const OrbitingProducts = memo(function OrbitingProducts({ 
  progress 
}: { 
  progress: MotionValue<number> 
}) {
  // Orbit rotation based on progress
  const rotation = useTransform(progress, [0.18, 0.32], [0, 30])
  const orbitOpacity = useTransform(progress, [0.20, 0.24, 0.30, 0.32], [0, 1, 1, 0])
  
  return (
    <m.div 
      className="relative w-[min(70vw,500px)] h-[min(70vw,500px)]"
      style={{ opacity: orbitOpacity }}
    >
      {/* Orbit ring */}
      <m.div 
        className="absolute inset-0 rounded-full border border-white/10"
        style={{ rotate: rotation }}
      />
      
      {/* Products on orbit */}
      {PRODUCTS.map((product, i) => (
        <OrbitingProduct 
          key={product.id}
          product={product}
          index={i}
          progress={progress}
        />
      ))}
      
      {/* Center core */}
      <CenterCore progress={progress} />
    </m.div>
  )
})

const OrbitingProduct = memo(function OrbitingProduct({
  product,
  index,
  progress,
}: {
  product: typeof PRODUCTS[number]
  index: number
  progress: MotionValue<number>
}) {
  const delay = index * 0.02
  
  // Staggered entry
  const opacity = useTransform(
    progress, 
    [0.22 + delay, 0.26 + delay, 0.30, 0.32], 
    [0, 1, 1, 0]
  )
  const scale = useTransform(progress, [0.22 + delay, 0.26 + delay], [0.5, 1])
  
  // Position on orbit (50% radius from center)
  const angleRad = (product.angle * Math.PI) / 180
  const x = Math.cos(angleRad) * 42 // % from center
  const y = Math.sin(angleRad) * 42
  
  return (
    <m.div
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
      style={{
        x: `${x}%`,
        y: `${y}%`,
        opacity,
        scale,
      }}
    >
      {/* Icon */}
      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${product.color} flex items-center justify-center mb-3`}>
        <span className="text-white text-2xl">{product.icon}</span>
      </div>
      
      {/* Label */}
      <span className="text-[10px] uppercase tracking-[0.3em] text-white/80 font-ui">
        {product.label}
      </span>
      
      {/* Description */}
      <span className="text-[10px] text-white/40 font-ui mt-1">
        {product.description}
      </span>
    </m.div>
  )
})

const CenterCore = memo(function CenterCore({ 
  progress 
}: { 
  progress: MotionValue<number> 
}) {
  const scale = useTransform(progress, [0.20, 0.24], [0, 1])
  const opacity = useTransform(progress, [0.20, 0.24, 0.30, 0.32], [0, 1, 1, 0])
  
  return (
    <m.div
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center"
      style={{ scale, opacity }}
    >
      <span className="font-headline text-white text-lg font-bold">Z</span>
    </m.div>
  )
})

// ═══════════════════════════════════════════════════════════════════
// HEADLINE
// ═══════════════════════════════════════════════════════════════════

const Headline = memo(function Headline({ 
  progress 
}: { 
  progress: MotionValue<number> 
}) {
  const opacity = useTransform(progress, [0.18, 0.22, 0.30, 0.32], [0, 1, 1, 0])
  const y = useTransform(progress, [0.18, 0.22], [40, 0])
  
  return (
    <m.div
      className="absolute top-[15%] left-1/2 -translate-x-1/2 text-center"
      style={{ opacity, y }}
    >
      {/* Eyebrow */}
      <span className="block text-[10px] uppercase tracking-[0.5em] text-white/40 font-ui mb-4">
        The Ecosystem
      </span>
      
      {/* Headline */}
      <h2 className="font-headline text-4xl sm:text-5xl lg:text-6xl text-white tracking-tight">
        QUANTIFYING
        <br />
        <span className="text-blue-400">POTENTIAL</span>
      </h2>
    </m.div>
  )
})

// ═══════════════════════════════════════════════════════════════════
// FACT LINE
// ═══════════════════════════════════════════════════════════════════

const FactLine = memo(function FactLine({ 
  progress 
}: { 
  progress: MotionValue<number> 
}) {
  const opacity = useTransform(progress, [0.26, 0.29, 0.30, 0.32], [0, 1, 1, 0])
  
  return (
    <m.div
      className="absolute bottom-[12%] left-1/2 -translate-x-1/2 text-center"
      style={{ opacity }}
    >
      <span className="text-xs text-white/40 font-ui tracking-wide">
        One platform. Three experiences.
      </span>
    </m.div>
  )
})

// ═══════════════════════════════════════════════════════════════════
// BACKGROUND
// ═══════════════════════════════════════════════════════════════════

const Background = memo(function Background({ 
  progress 
}: { 
  progress: MotionValue<number> 
}) {
  const opacity = useTransform(progress, [0.18, 0.22, 0.30, 0.32], [0, 0.4, 0.4, 0])
  
  return (
    <m.div 
      className="absolute inset-0 pointer-events-none"
      style={{ opacity }}
    >
      {/* Subtle radial gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 60% 50% at 50% 50%, rgba(59, 130, 246, 0.05) 0%, transparent 60%)
          `,
        }}
      />
    </m.div>
  )
})

// ═══════════════════════════════════════════════════════════════════
// MAIN PLATFORM SCENE
// ═══════════════════════════════════════════════════════════════════

export const PlatformScene = memo(function PlatformScene({ 
  progress,
}: PlatformSceneProps) {
  // Scene visibility
  const sceneOpacity = useTransform(progress, [0.16, 0.18, 0.30, 0.32], [0, 1, 1, 0])
  
  return (
    <m.div 
      className="absolute inset-0 flex items-center justify-center bg-black overflow-hidden"
      style={{ opacity: sceneOpacity }}
    >
      {/* Background */}
      <Background progress={progress} />
      
      {/* Headline (top) */}
      <Headline progress={progress} />
      
      {/* Orbiting Products (center) */}
      <OrbitingProducts progress={progress} />
      
      {/* Fact Line (bottom) */}
      <FactLine progress={progress} />
    </m.div>
  )
})

export default PlatformScene
