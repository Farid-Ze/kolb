/**
 * SPHERE PAGE
 * 
 * "Cabinet of Curiosities" - Immersive 3D milestone gallery
 * 
 * This page showcases the learning journey through an interactive
 * 3D space with floating orbs representing milestones.
 */

import { useState, Suspense, lazy } from 'react'
import { motion } from 'framer-motion'

import { useSphere } from '../features/sphere/hooks/useSphere'
import type { ReflectionType } from '../features/sphere/model'

// Lazy load the 3D component for better initial load performance
const SphereExperience3D = lazy(() => 
  import('../features/sphere/components/SphereExperience3D')
)

// Fallback for 3D loading
function Sphere3DFallback() {
  return (
    <div className="w-full h-[calc(100vh-8rem)] rounded-2xl bg-[#0a0a0f] flex items-center justify-center">
      <div className="text-center">
        <motion.div 
          className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600"
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 180, 360]
          }}
          transition={{ 
            duration: 3, 
            repeat: Infinity, 
            ease: 'easeInOut' 
          }}
        />
        <p className="text-gray-400 text-sm font-ui uppercase tracking-wider">
          Loading Zenosphere...
        </p>
        <p className="text-gray-600 text-xs mt-2">
          Preparing your 3D experience
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
  const { nodes, reflections, isLoading, createReflection, isCreating } = useSphere()
  const [hasError, setHasError] = useState(false)

  const handleCreateReflection = async (content: string, type: string) => {
    await createReflection({
      content,
      reflectionType: type as ReflectionType,
      sphereNodeId: undefined,
    })
  }

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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-6"
    >
      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-ui text-xs uppercase tracking-wider text-indigo-400">
            Sphere / Gallery
          </p>
          <h1 className="mt-2 font-headline text-3xl font-bold text-white">
            Zenosphere
          </h1>
          <p className="mt-2 text-gray-400 max-w-md">
            Your personal growth visualized. Explore milestones, add reflections, 
            and witness your learning journey unfold in 3D space.
          </p>
        </div>
        
        {/* Stats */}
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-2xl font-bold text-white">{nodes.length}</p>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Milestones</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-white">{reflections.length}</p>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Reflections</p>
          </div>
        </div>
      </header>

      {/* 3D Experience */}
      <Suspense fallback={<Sphere3DFallback />}>
        <SphereExperience3D
          nodes={nodes}
          reflections={reflections}
          onCreateReflection={handleCreateReflection}
          isCreating={isCreating}
        />
      </Suspense>
    </motion.div>
  )
}

export default SpherePage
