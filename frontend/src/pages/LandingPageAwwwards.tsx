/**
 * AWWWARDS-LEVEL LANDING PAGE (OPSI B)
 * 
 * 6-Scene Storytelling Structure:
 * 1. SpectacleScene (0-18%): Brand reveal with particles
 * 2. PlatformScene (18-32%): Ecosystem overview
 * 3. FutureScene (32-48%): Assessment product + Kite
 * 4. SphereScene (48-65%): Milestone Gallery + Constellation
 * 5. TeamsScene (65-82%): Team analytics + Scatter plot
 * 6. BeginScene (82-100%): Triple-path CTA
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
  LazyMotion,
  domAnimation,
} from 'framer-motion'
import { ScrollOrchestrator } from '@/shared/lib/ScrollOrchestrator'
import { LazyScene } from '@/shared/hooks/useIntersectionObserver'
import { SceneNav } from '@/features/landing/SceneNav'
import { 
  SpectacleScene,
  PlatformScene,
  FutureScene, 
  SphereScene, 
  TeamsScene, 
  BeginScene,
} from '@/features/landing/scenes'

// ═══════════════════════════════════════════════════════════════════
// SPRING CONFIG
// ═══════════════════════════════════════════════════════════════════

const SPRING_CONFIG = { stiffness: 50, damping: 20, restDelta: 0.001 }

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════

export function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const prefersReducedMotion = useReducedMotion()
  
  // Initialize ScrollOrchestrator on mount
  useEffect(() => {
    ScrollOrchestrator.init()
    
    return () => {
      ScrollOrchestrator.destroy()
    }
  }, [])
  
  // Framer Motion scroll hook (fallback/compatibility)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  })
  
  // Always call useSpring - spring is applied only when reduced motion is not preferred
  const springProgress = useSpring(scrollYProgress, SPRING_CONFIG)
  
  // Use raw progress for reduced motion, otherwise use spring
  const smoothProgress = prefersReducedMotion ? scrollYProgress : springProgress

  return (
    <LazyMotion features={domAnimation} strict>
      <div ref={containerRef} className="relative bg-black">
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
            SCENE 4: SPHERE (48% - 65%)
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
            SCENE 5: TEAMS (65% - 82%)
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
            SCENE 6: BEGIN (82% - 100%)
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
