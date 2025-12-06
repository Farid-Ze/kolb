/**
 * AWWWARDS-LEVEL LANDING PAGE (OPSI B)
 * 
 * 7-Scene Storytelling Structure:
 * 1. SpectacleScene (0-16%): Brand reveal with particles
 * 2. PlatformScene (16-28%): Ecosystem overview
 * 3. FutureScene (28-42%): Assessment product + Kite
 * 4. SphereScene (42-56%): Milestone Gallery + Constellation
 * 5. PhotoGalleryScene (56-70%): Journey photos with 3D frames
 * 6. TeamsScene (70-85%): Team analytics + Scatter plot
 * 7. BeginScene (85-100%): Triple-path CTA
 * 
 * Architecture inspired by Citrix Red Bull Racing / Igloo.inc:
 * - Single scroll listener (ScrollOrchestrator)
 * - WebGL distortion layer (DistortionCanvas)
 * - Geometric scene transitions
 * - DOM text synced to scroll progress
 * 
 * Performance Targets:
 * - FCP < 1.5s
 * - LCP < 2.5s
 * - TBT < 200ms
 * 
 * Key Techniques:
 * - LazyMotion with 'm' imports for tree-shaking
 * - content-visibility: auto for off-screen scenes
 * - Intersection Observer for lazy scene loading
 * - GPU-accelerated transforms only
 */

import { useRef, useEffect } from 'react'
import { 
  useScroll, 
  useSpring, 
  useReducedMotion,
  useVelocity,
  useTransform,
  LazyMotion,
  domAnimation,
  m,
} from 'framer-motion'
import { ScrollOrchestrator } from '@/shared/lib/ScrollOrchestrator'
import { LazyScene } from '@/shared/hooks/useIntersectionObserver'
import { SceneNav } from '@/features/landing/SceneNav'
import { 
  SpectacleScene,
  PlatformScene,
  FutureScene, 
  SphereScene,
  PhotoGalleryScene,
  TeamsScene, 
  BeginScene,
} from '@/features/landing/scenes'

// ═══════════════════════════════════════════════════════════════════
// SPRING CONFIG
// ═══════════════════════════════════════════════════════════════════

const SPRING_CONFIG = { stiffness: 50, damping: 20, restDelta: 0.001 }

// ═══════════════════════════════════════════════════════════════════
// CHROMATIC ABERRATION OVERLAY
// Per Design Paradigm: "Chromatic aberration on fast scroll"
// ═══════════════════════════════════════════════════════════════════

function ChromaticAberrationOverlay({ 
  scrollVelocity 
}: { 
  scrollVelocity: ReturnType<typeof useVelocity> 
}) {
  // Map velocity to offset (0-8px max)
  const offset = useTransform(scrollVelocity, [-2000, 0, 2000], [8, 0, 8])
  const opacity = useTransform(scrollVelocity, [-2000, -500, 0, 500, 2000], [0.6, 0.3, 0, 0.3, 0.6])
  
  return (
    <>
      {/* Red channel offset */}
      <m.div 
        className="fixed inset-0 pointer-events-none z-[100]"
        style={{
          mixBlendMode: 'screen',
          backgroundColor: 'transparent',
          boxShadow: 'inset 0 0 100px rgba(255,0,0,0.1)',
          x: offset,
          opacity,
        }}
      />
      {/* Cyan channel offset (opposite direction) */}
      <m.div 
        className="fixed inset-0 pointer-events-none z-[100]"
        style={{
          mixBlendMode: 'screen',
          backgroundColor: 'transparent',
          boxShadow: 'inset 0 0 100px rgba(0,255,255,0.1)',
          x: useTransform(offset, v => -v),
          opacity,
        }}
      />
    </>
  )
}

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════

export function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const prefersReducedMotion = useReducedMotion()
  
  // Initialize ScrollOrchestrator on mount
  useEffect(() => {
    if (!prefersReducedMotion) {
      ScrollOrchestrator.init()
    }
    
    return () => {
      ScrollOrchestrator.destroy()
    }
  }, [prefersReducedMotion])
  
  // Framer Motion scroll hook (fallback/compatibility)
  const { scrollYProgress, scrollY } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  })
  
  // Scroll velocity for chromatic aberration
  const scrollVelocity = useVelocity(scrollY)
  
  // Always call useSpring - spring is applied only when reduced motion is not preferred
  const springProgress = useSpring(scrollYProgress, SPRING_CONFIG)
  
  // Use raw progress for reduced motion, otherwise use spring
  const smoothProgress = prefersReducedMotion ? scrollYProgress : springProgress

  return (
    <LazyMotion features={domAnimation} strict>
      <div ref={containerRef} className="relative bg-black">
        {/* Chromatic Aberration Overlay - Triggered on fast scroll */}
        {!prefersReducedMotion && (
          <ChromaticAberrationOverlay scrollVelocity={scrollVelocity} />
        )}
        
        {/* Scene Navigation (fixed position) */}
        <SceneNav progress={smoothProgress} />

        {/* ═══════════════════════════════════════════════════════════
            SCENE 1: SPECTACLE (0% - 18%)
            Brand reveal with particles. Critical for LCP.
        ═══════════════════════════════════════════════════════════ */}
        <section className="relative h-[200vh]">
          <div className="sticky top-0 h-screen overflow-hidden">
            <SpectacleScene 
              progress={smoothProgress} 
              reduced={prefersReducedMotion} 
            />
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            SCENE 2: PLATFORM (18% - 32%)
            Ecosystem overview with three orbiting products.
        ═══════════════════════════════════════════════════════════ */}
        <LazyScene rootMargin="300px" minHeight="180vh" className="cv-auto">
          <section className="relative h-[180vh]">
            <div className="sticky top-0 h-screen overflow-hidden">
              <PlatformScene 
                progress={smoothProgress} 
                reduced={prefersReducedMotion} 
              />
            </div>
          </section>
        </LazyScene>

        {/* ═══════════════════════════════════════════════════════════
            SCENE 3: FUTURE (32% - 48%)
            Assessment product with Kite visualization.
        ═══════════════════════════════════════════════════════════ */}
        <LazyScene rootMargin="300px" minHeight="200vh" className="cv-auto">
          <section className="relative h-[200vh]">
            <div className="sticky top-0 h-screen overflow-hidden">
              <FutureScene 
                progress={smoothProgress} 
                reduced={prefersReducedMotion} 
              />
            </div>
          </section>
        </LazyScene>

        {/* ═══════════════════════════════════════════════════════════
            SCENE 4: SPHERE (48% - 58%)
            Milestone Gallery with constellation visualization.
        ═══════════════════════════════════════════════════════════ */}
        <LazyScene rootMargin="300px" minHeight="200vh" className="cv-auto">
          <section className="relative h-[200vh]">
            <div className="sticky top-0 h-screen overflow-hidden">
              <SphereScene 
                progress={smoothProgress} 
                reduced={prefersReducedMotion} 
              />
            </div>
          </section>
        </LazyScene>

        {/* ═══════════════════════════════════════════════════════════
            SCENE 5: PHOTO GALLERY (58% - 70%)
            Journey photos with 3D frames.
        ═══════════════════════════════════════════════════════════ */}
        <LazyScene rootMargin="300px" minHeight="180vh" className="cv-auto">
          <section className="relative h-[180vh]">
            <div className="sticky top-0 h-screen overflow-hidden">
              <PhotoGalleryScene 
                progress={smoothProgress} 
                reduced={prefersReducedMotion} 
              />
            </div>
          </section>
        </LazyScene>

        {/* ═══════════════════════════════════════════════════════════
            SCENE 6: TEAMS (70% - 85%)
            Organizational analytics with scatter plot.
        ═══════════════════════════════════════════════════════════ */}
        <LazyScene rootMargin="300px" minHeight="200vh" className="cv-auto">
          <section className="relative h-[200vh]">
            <div className="sticky top-0 h-screen overflow-hidden">
              <TeamsScene 
                progress={smoothProgress} 
                reduced={prefersReducedMotion} 
              />
            </div>
          </section>
        </LazyScene>

        {/* ═══════════════════════════════════════════════════════════
            SCENE 7: BEGIN (85% - 100%)
            Triple-path CTA: Future / Sphere / Teams.
        ═══════════════════════════════════════════════════════════ */}
        <LazyScene rootMargin="200px" minHeight="200vh" className="cv-auto">
          <section className="relative h-[200vh]">
            <div className="sticky top-0 h-screen overflow-hidden">
              <BeginScene 
                progress={smoothProgress} 
                reduced={prefersReducedMotion} 
              />
            </div>
          </section>
        </LazyScene>
      </div>
    </LazyMotion>
  )
}

export default LandingPage
