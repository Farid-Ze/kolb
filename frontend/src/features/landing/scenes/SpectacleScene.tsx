/**
 * SPECTACLE SCENE (0% - 18%)
 * 
 * Pure brand impact. The "wow" moment.
 * 
 * Citrix Layered Information:
 * - Eyebrow: "LEARNING SCIENCE × TECHNOLOGY"
 * - Headline: "ZENOTIKA" (massive typography)
 * - Visual labels: Particle field with floating dimension words
 * - Fact: "Based on Kolb Learning Style Inventory 4.0"
 * 
 * Animation:
 * - 0-8%: Particles emerge from center
 * - 8-12%: ZENOTIKA letters reveal one by one
 * - 12-18%: Eyebrow and fact fade in, subtle zoom
 */

import { memo, useRef } from 'react'
import { m, useTransform, type MotionValue } from 'framer-motion'

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

interface SpectacleSceneProps {
  progress: MotionValue<number>
  reduced?: boolean | null
}

// ═══════════════════════════════════════════════════════════════════
// PARTICLE FIELD (Floating dimension words)
// ═══════════════════════════════════════════════════════════════════

const DIMENSION_WORDS = [
  { text: 'EXPERIENCING', x: 15, y: 20 },
  { text: 'REFLECTING', x: 75, y: 15 },
  { text: 'THINKING', x: 85, y: 65 },
  { text: 'ACTING', x: 20, y: 75 },
  { text: 'FEELING', x: 10, y: 45 },
  { text: 'WATCHING', x: 88, y: 35 },
  { text: 'ABSTRACT', x: 55, y: 10 },
  { text: 'CONCRETE', x: 45, y: 85 },
]

const ParticleField = memo(function ParticleField({ 
  progress 
}: { 
  progress: MotionValue<number> 
}) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {DIMENSION_WORDS.map((word, i) => (
        <FloatingWord 
          key={word.text}
          word={word}
          index={i}
          progress={progress}
        />
      ))}
    </div>
  )
})

const FloatingWord = memo(function FloatingWord({
  word,
  index,
  progress,
}: {
  word: typeof DIMENSION_WORDS[number]
  index: number
  progress: MotionValue<number>
}) {
  const delay = index * 0.01
  const opacity = useTransform(
    progress, 
    [0.02 + delay, 0.06 + delay, 0.14, 0.18], 
    [0, 0.15, 0.15, 0]
  )
  
  // Subtle parallax movement
  const y = useTransform(progress, [0, 0.18], [0, -20 - index * 3])
  
  return (
    <m.span
      className="absolute font-ui text-[10px] tracking-[0.5em] text-white/20"
      style={{
        left: `${word.x}%`,
        top: `${word.y}%`,
        opacity,
        y,
      }}
    >
      {word.text}
    </m.span>
  )
})

// ═══════════════════════════════════════════════════════════════════
// BRAND TYPOGRAPHY (ZENOTIKA)
// ═══════════════════════════════════════════════════════════════════

const BRAND_LETTERS = ['Z', 'E', 'N', 'O', 'T', 'I', 'K', 'A']

const BrandTypography = memo(function BrandTypography({ 
  progress 
}: { 
  progress: MotionValue<number> 
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Scale effect as user scrolls
  const scale = useTransform(progress, [0, 0.08, 0.16, 0.18], [0.9, 1, 1.02, 1.05])
  const containerOpacity = useTransform(progress, [0.14, 0.18], [1, 0])
  
  return (
    <m.div 
      ref={containerRef}
      className="flex items-center justify-center"
      style={{ scale, opacity: containerOpacity }}
    >
      <div className="flex">
        {BRAND_LETTERS.map((letter, i) => (
          <AnimatedLetter 
            key={`${letter}-${i}`}
            letter={letter}
            index={i}
            progress={progress}
          />
        ))}
      </div>
    </m.div>
  )
})

const AnimatedLetter = memo(function AnimatedLetter({
  letter,
  index,
  progress,
}: {
  letter: string
  index: number
  progress: MotionValue<number>
}) {
  // Staggered reveal: each letter appears slightly after previous
  const delay = index * 0.008
  const start = 0.03 + delay
  const end = start + 0.04
  
  const opacity = useTransform(progress, [start, end], [0, 1])
  const y = useTransform(progress, [start, end], [60, 0])
  const blur = useTransform(progress, [start, end], [10, 0])
  const filter = useTransform(blur, (b) => `blur(${b}px)`)
  
  return (
    <m.span
      className="font-headline text-[12vw] sm:text-[10vw] md:text-[8vw] font-bold text-white tracking-tight gpu-layer"
      style={{
        opacity,
        y,
        filter,
      }}
    >
      {letter}
    </m.span>
  )
})

// ═══════════════════════════════════════════════════════════════════
// LAYERED TEXT (Eyebrow + Fact)
// ═══════════════════════════════════════════════════════════════════

const LayeredText = memo(function LayeredText({ 
  progress 
}: { 
  progress: MotionValue<number> 
}) {
  const eyebrowOpacity = useTransform(progress, [0.08, 0.12, 0.15, 0.18], [0, 1, 1, 0])
  const factOpacity = useTransform(progress, [0.10, 0.14, 0.16, 0.18], [0, 1, 1, 0])
  
  return (
    <>
      {/* Eyebrow - Above headline */}
      <m.div 
        className="absolute top-[30%] left-1/2 -translate-x-1/2 text-center"
        style={{ opacity: eyebrowOpacity }}
      >
        <span className="text-[10px] uppercase tracking-[0.5em] text-[#6366F1]/80 font-ui">
          Learning Science × Technology
        </span>
      </m.div>
      
      {/* Fact - Below headline */}
      <m.div 
        className="absolute bottom-[25%] left-1/2 -translate-x-1/2 text-center"
        style={{ opacity: factOpacity }}
      >
        <span className="text-xs text-white/40 font-ui tracking-wide">
          Powered by Kolb Learning Style Inventory 4.0
        </span>
      </m.div>
    </>
  )
})

// ═══════════════════════════════════════════════════════════════════
// GEOMETRIC BACKGROUND
// ═══════════════════════════════════════════════════════════════════

const GeometricBackground = memo(function GeometricBackground({ 
  progress 
}: { 
  progress: MotionValue<number> 
}) {
  const opacity = useTransform(progress, [0, 0.05, 0.15, 0.18], [0, 0.3, 0.3, 0])
  
  // Subtle radial gradient that expands
  const scale = useTransform(progress, [0, 0.18], [0.8, 1.2])
  
  return (
    <m.div 
      className="absolute inset-0 pointer-events-none"
      style={{ opacity }}
    >
      {/* Center radial glow */}
      <m.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150vw] h-[150vh]"
        style={{
          scale,
          background: `
            radial-gradient(ellipse 50% 40% at 50% 50%, rgba(99, 102, 241, 0.12) 0%, transparent 70%),
            radial-gradient(ellipse 40% 50% at 40% 60%, rgba(168, 85, 247, 0.08) 0%, transparent 60%),
            radial-gradient(ellipse 30% 30% at 60% 40%, rgba(34, 211, 238, 0.06) 0%, transparent 50%)
          `,
        }}
      />
      
      {/* Subtle grid overlay */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.01) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.01) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />
    </m.div>
  )
})

// ═══════════════════════════════════════════════════════════════════
// MAIN SPECTACLE SCENE
// ═══════════════════════════════════════════════════════════════════

export const SpectacleScene = memo(function SpectacleScene({ 
  progress,
  reduced,
}: SpectacleSceneProps) {
  // Scene opacity (visible for 0-18%)
  const sceneOpacity = useTransform(progress, [0.16, 0.18], [1, 0])
  
  return (
    <m.div 
      className="absolute inset-0 flex items-center justify-center bg-[#0A0A0F] overflow-hidden"
      style={{ opacity: sceneOpacity }}
    >
      {/* Layer 1: Geometric Background */}
      <GeometricBackground progress={progress} />
      
      {/* Layer 2: Particle Field (dimension words) */}
      {!reduced && <ParticleField progress={progress} />}
      
      {/* Layer 3: Brand Typography */}
      <BrandTypography progress={progress} />
      
      {/* Layer 4: Layered Text (eyebrow + fact) */}
      <LayeredText progress={progress} />
    </m.div>
  )
})

export default SpectacleScene
