/**
 * SPHERE PAGE
 * 
 * "Cabinet of Curiosities" - Immersive 3D Museum Experience
 * 
 * Reference: Audemars Piguet 150 Years "House of Wonders"
 * https://150years.audemarspiguet.com/en#/experience/enter_the_qp_verse
 * 
 * EXPERIENCE FLOW:
 * Entry Portal → Main Hall → Individual Room → Inspection Mode
 */

import { useState, Suspense, lazy } from 'react'
import { motion } from 'framer-motion'

import { useSphere } from '../features/sphere/hooks/useSphere'

// Lazy load the 3D Museum component
const SphereMuseum3D = lazy(() => 
  import('../features/sphere/components/SphereMuseum3D')
)

// Fallback for 3D loading - Museum style
function Sphere3DFallback() {
  return (
    <div className="w-full h-screen bg-[#0a0a0f] flex items-center justify-center">
      <div className="text-center">
        <motion.div 
          className="w-24 h-24 mx-auto mb-6 rounded-full border-2 border-[#D4A853]/30"
          style={{
            background: 'radial-gradient(circle, rgba(212,168,83,0.3) 0%, transparent 70%)'
          }}
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity, 
            ease: 'easeInOut' 
          }}
        />
        <p className="text-[#D4A853] text-lg font-headline tracking-wider">
          Preparing Your Sphere...
        </p>
        <p className="text-gray-500 text-xs mt-2 font-ui uppercase tracking-widest">
          Loading Museum Experience
        </p>
      </div>
    </div>
  )
}

// Error boundary fallback
function SphereErrorFallback({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="w-full h-[calc(100vh-8rem)] rounded-2xl bg-[#0a0a0f] flex items-center justify-center">
      <div className="text-center max-w-md px-6">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-red-500/10 flex items-center justify-center">
          <span className="text-2xl">⚠️</span>
        </div>
        <h3 className="text-white font-semibold text-lg mb-2">
          Unable to load 3D experience
        </h3>
        <p className="text-gray-400 text-sm mb-6">
          Your browser may not support WebGL, or there was an error loading the 3D scene.
        </p>
        <button
          onClick={onRetry}
          className="px-6 py-2.5 rounded-xl bg-indigo-500 text-white font-medium text-sm hover:bg-indigo-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  )
}

export function SpherePage() {
  const { nodes, reflections, isLoading } = useSphere()
  const [hasError, setHasError] = useState(false)

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <header>
          <p className="font-ui text-xs uppercase tracking-wider text-indigo-400">
            Sphere / Gallery
          </p>
          <h1 className="mt-2 font-headline text-3xl font-bold text-white">
            Zenosphere
          </h1>
        </header>
        <Sphere3DFallback />
      </div>
    )
  }

  // Error state
  if (hasError) {
    return (
      <div className="space-y-6">
        <header>
          <p className="font-ui text-xs uppercase tracking-wider text-indigo-400">
            Sphere / Gallery
          </p>
          <h1 className="mt-2 font-headline text-3xl font-bold text-white">
            Zenosphere
          </h1>
        </header>
        <SphereErrorFallback onRetry={() => setHasError(false)} />
      </div>
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 bg-[#0A0A0F]"
    >
      {/* Full-screen 3D Museum Experience */}
      <Suspense fallback={<Sphere3DFallback />}>
        <SphereMuseum3D
          nodes={nodes}
          reflections={reflections}
        />
      </Suspense>
    </motion.div>
  )
}

export default SpherePage
