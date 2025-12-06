/**
 * FUTURE TUNNEL PAGE
 * 
 * "Speed & Energy" - F1-Inspired Assessment Experience
 * 
 * Reference: Citrix F1 "The New Mobile Workforce"
 * https://thenewmobileworkforce.imm-g-prod.com/
 * 
 * MANDATORY PRINCIPLES:
 * 1. MOTION-DRIVEN INTERFACE
 * 2. VISUAL FEEDBACK - Every answer triggers response
 * 3. DUAL-LAYER - Top (experience), Bottom (data)
 */

import { useState, useCallback, useMemo } from 'react'
import { FutureTunnelExperience } from '../features/future-tunnel/components/FutureTunnelExperience'
import { TunnelCitrixF1 } from '../features/future-tunnel/components/TunnelCitrixF1'
import { useTunnelSession } from '../features/future-tunnel/hooks/useTunnelSession'

export function FutureTunnelPage() {
  const { 
    phase, 
    rankedItemsCount, 
    totalItems,
    itemsProgressPercent,
    result,
  } = useTunnelSession()
  
  const [lastAnswerIntensity, setLastAnswerIntensity] = useState<'high' | 'medium' | 'low' | null>(null)
  
  // Determine visual phase for 3D background
  const visualPhase = useMemo(() => {
    if (!phase || phase === 'loading') return 'intro'
    if (phase === 'in-progress') return 'questions'
    if (phase === 'submitting') return 'processing'
    if (phase === 'completed' || result) return 'results'
    return 'questions'
  }, [phase, result])
  
  // Current question number for display
  const currentQuestion = rankedItemsCount + 1
  
  // Handle answer intensity for visual feedback
  const handleAnswerIntensity = useCallback((intensity: 'high' | 'medium' | 'low') => {
    setLastAnswerIntensity(intensity)
  }, [])
  
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Immersive 3D Citrix F1 Background */}
      <TunnelCitrixF1
        progress={itemsProgressPercent}
        currentQuestion={currentQuestion}
        totalQuestions={totalItems}
        lastAnswerIntensity={lastAnswerIntensity}
        phase={visualPhase}
        onAnswerSelect={handleAnswerIntensity}
      />
      
      {/* Content Layer - Assessment Experience */}
      <section className="relative z-20 mx-auto min-h-screen max-w-4xl px-4 py-10">
        <FutureTunnelExperience />
      </section>
    </div>
  )
}
