/**
 * TUNNEL CITRIX F1
 * 
 * "Speed & Energy" - F1-Inspired Assessment Experience
 * 
 * Reference: Citrix F1 "The New Mobile Workforce"
 * https://thenewmobileworkforce.imm-g-prod.com/
 * 
 * MANDATORY PRINCIPLES (dari Design Paradigm Document):
 * 1. MOTION-DRIVEN INTERFACE - Questions revealed through motion/animation
 * 2. VISUAL FEEDBACK - Every answer triggers visual response
 * 3. ENGAGEMENT THROUGH EXPERIENCE - Assessment feels like experience, not test
 * 
 * TECHNICAL ELEMENTS:
 * - Background 3D yang berevolusi dengan progress
 * - Speed/energy visual language (dari Citrix F1)
 * - Dual-Layer paradigm: Top (experience), Bottom (data)
 * - Reactive elements yang respond terhadap jawaban
 * 
 * EXPERIENCE FLOW:
 * Intro → Questions (Loop) → Processing → Result Reveal
 */

import { useRef, useMemo, useEffect, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { 
  Stars, 
  Float,
  PerspectiveCamera,
  Sparkles,
} from '@react-three/drei'
import { EffectComposer, Bloom, ChromaticAberration, Vignette } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import * as THREE from 'three'
import { motion, AnimatePresence } from 'framer-motion'

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

interface TunnelCitrixF1Props {
  progress: number // 0-100
  currentQuestion: number
  totalQuestions: number
  onAnswerSelect?: (intensity: 'high' | 'medium' | 'low') => void
  lastAnswerIntensity?: 'high' | 'medium' | 'low' | null
  phase: 'intro' | 'questions' | 'processing' | 'results'
}

// ═══════════════════════════════════════════════════════════════════
// SPEED STREAKS - F1 Racing Lines
// ═══════════════════════════════════════════════════════════════════

function SpeedStreaks({ progress, intensity }: { progress: number; intensity: number }) {
  const groupRef = useRef<THREE.Group>(null)
  
  const streaks = useMemo(() => {
    return Array.from({ length: 40 }, (_, i) => {
      const seed = i * 0.1
      const angle = (Math.sin(seed * 127.1) * 0.5 + 0.5) * Math.PI * 2
      const radius = 3 + (Math.sin(seed * 311.7) * 0.5 + 0.5) * 5
      
      return {
        id: i,
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        z: -(Math.sin(seed * 543.3) * 0.5 + 0.5) * 100,
        length: 0.5 + (Math.sin(seed * 789.5) * 0.5 + 0.5) * 2,
        speed: 0.1 + (Math.sin(seed * 997.9) * 0.5 + 0.5) * 0.3,
        color: ['#6366F1', '#A855F7', '#22D3EE'][i % 3],
      }
    })
  }, [])
  
  useFrame((_, delta) => {
    if (groupRef.current) {
      // Speed based on progress and intensity
      const speedMultiplier = 1 + (progress / 100) * 2 + intensity * 2
      
      groupRef.current.children.forEach((child, i) => {
        const streak = streaks[i]
        if (child.position) {
          child.position.z += streak.speed * speedMultiplier * 60 * delta
          
          // Reset when past camera
          if (child.position.z > 10) {
            child.position.z = -100
          }
        }
      })
    }
  })
  
  return (
    <group ref={groupRef}>
      {streaks.map((streak) => (
        <mesh
          key={streak.id}
          position={[streak.x, streak.y, streak.z]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <cylinderGeometry args={[0.02, 0.02, streak.length, 4]} />
          <meshBasicMaterial
            color={streak.color}
            transparent
            opacity={0.4 + (progress / 100) * 0.4}
          />
        </mesh>
      ))}
    </group>
  )
}

// ═══════════════════════════════════════════════════════════════════
// F1 GRID FLOOR - Racing Track Energy
// ═══════════════════════════════════════════════════════════════════

function F1GridFloor({ progress }: { progress: number }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  
  const shader = useMemo(() => ({
    uniforms: {
      uTime: { value: 0 },
      uProgress: { value: 0 },
      uColor1: { value: new THREE.Color('#6366F1') },
      uColor2: { value: new THREE.Color('#22D3EE') },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float uProgress;
      uniform vec3 uColor1;
      uniform vec3 uColor2;
      varying vec2 vUv;
      
      void main() {
        // Grid pattern
        vec2 grid = abs(fract(vUv * 20.0 - vec2(0.0, uTime * 2.0)) - 0.5);
        float gridLine = min(step(0.45, grid.x), step(0.45, grid.y));
        
        // Distance fade
        float fade = 1.0 - vUv.y;
        
        // Color mix based on progress
        vec3 color = mix(uColor1, uColor2, uProgress);
        
        // Final color
        gl_FragColor = vec4(color, gridLine * fade * 0.3 * (0.5 + uProgress * 0.5));
      }
    `,
  }), [])
  
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime
      materialRef.current.uniforms.uProgress.value = progress / 100
    }
  })
  
  return (
    <mesh 
      ref={meshRef} 
      rotation={[-Math.PI / 2, 0, 0]} 
      position={[0, -3, -20]}
    >
      <planeGeometry args={[40, 60, 1, 1]} />
      <shaderMaterial
        ref={materialRef}
        {...shader}
        transparent
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

// ═══════════════════════════════════════════════════════════════════
// ENERGY PULSE - Reacts to Answers
// ═══════════════════════════════════════════════════════════════════

function EnergyPulse({ 
  trigger, 
  intensity 
}: { 
  trigger: boolean; 
  intensity: 'high' | 'medium' | 'low' 
}) {
  const groupRef = useRef<THREE.Group>(null)
  const [scale, setScale] = useState(0)
  
  useEffect(() => {
    if (trigger) {
      // Pulse animation
      setScale(intensity === 'high' ? 3 : intensity === 'medium' ? 2 : 1)
      const timer = setTimeout(() => setScale(0), 500)
      return () => clearTimeout(timer)
    }
  }, [trigger, intensity])
  
  useFrame(() => {
    if (groupRef.current) {
      // Smooth scale interpolation
      const currentScale = groupRef.current.scale.x
      const targetScale = scale
      const newScale = currentScale + (targetScale - currentScale) * 0.1
      groupRef.current.scale.setScalar(Math.max(0.01, newScale))
    }
  })
  
  const color = intensity === 'high' ? '#22D3EE' : intensity === 'medium' ? '#6366F1' : '#A855F7'
  
  return (
    <group ref={groupRef} position={[0, 0, -5]}>
      {/* Central pulse ring */}
      <mesh>
        <ringGeometry args={[0.9, 1, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>
      
      {/* Outer rings */}
      <mesh>
        <ringGeometry args={[1.4, 1.5, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>
      
      <mesh>
        <ringGeometry args={[1.9, 2, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.15} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

// ═══════════════════════════════════════════════════════════════════
// HORIZON GLOW - Progress-based evolution
// ═══════════════════════════════════════════════════════════════════

function HorizonGlow({ progress }: { progress: number }) {
  const meshRef = useRef<THREE.Mesh>(null)
  
  useFrame((state) => {
    if (meshRef.current) {
      // Subtle pulse
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.1
      meshRef.current.scale.set(30 * pulse, 8 * pulse, 1)
    }
  })
  
  // Color evolves with progress
  const color = useMemo(() => {
    if (progress < 33) return '#6366F1' // Indigo
    if (progress < 66) return '#A855F7' // Purple
    return '#22D3EE' // Cyan
  }, [progress])
  
  return (
    <mesh ref={meshRef} position={[0, 0, -80]}>
      <planeGeometry args={[1, 1, 1, 1]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.15 + (progress / 100) * 0.2}
      />
    </mesh>
  )
}

// ═══════════════════════════════════════════════════════════════════
// CAMERA CONTROLLER - Smooth movements
// ═══════════════════════════════════════════════════════════════════

function CameraController({ phase, progress }: { phase: string; progress: number }) {
  const { camera } = useThree()
  const targetZ = useRef(5)
  const targetY = useRef(0)
  
  useEffect(() => {
    switch (phase) {
      case 'intro':
        targetZ.current = 10
        targetY.current = 2
        break
      case 'questions':
        targetZ.current = 5 - (progress / 100) * 2 // Camera moves forward with progress
        targetY.current = 0
        break
      case 'processing':
        targetZ.current = 3
        targetY.current = 0
        break
      case 'results':
        targetZ.current = 8
        targetY.current = 1
        break
    }
  }, [phase, progress])
  
  useFrame(() => {
    camera.position.z += (targetZ.current - camera.position.z) * 0.02
    camera.position.y += (targetY.current - camera.position.y) * 0.02
  })
  
  return null
}

// ═══════════════════════════════════════════════════════════════════
// PROCESSING ANIMATION - Calculating State
// ═══════════════════════════════════════════════════════════════════

function ProcessingAnimation() {
  const groupRef = useRef<THREE.Group>(null)
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.z = state.clock.elapsedTime * 2
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime) * 0.3
    }
  })
  
  return (
    <group ref={groupRef} position={[0, 0, -10]}>
      {/* Orbiting data particles */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2
        const radius = 2
        return (
          <Float key={i} speed={3} floatIntensity={0.5}>
            <mesh
              position={[
                Math.cos(angle) * radius,
                Math.sin(angle) * radius,
                0,
              ]}
            >
              <boxGeometry args={[0.15, 0.15, 0.15]} />
              <meshBasicMaterial color="#6366F1" />
            </mesh>
          </Float>
        )
      })}
      
      {/* Central processing core */}
      <mesh>
        <icosahedronGeometry args={[0.5, 1]} />
        <meshBasicMaterial color="#22D3EE" wireframe />
      </mesh>
    </group>
  )
}

// ═══════════════════════════════════════════════════════════════════
// SCENE CONTENT
// ═══════════════════════════════════════════════════════════════════

function SceneContent({ 
  progress, 
  phase,
  answerTrigger,
  answerIntensity,
}: { 
  progress: number;
  phase: string;
  answerTrigger: boolean;
  answerIntensity: 'high' | 'medium' | 'low';
}) {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={70} />
      <CameraController phase={phase} progress={progress} />
      
      {/* Ambient */}
      <ambientLight intensity={0.1} />
      
      {/* Stars - Always present */}
      <Stars
        radius={100}
        depth={50}
        count={3000}
        factor={4}
        saturation={0}
        fade
        speed={phase === 'processing' ? 2 : 0.5}
      />
      
      {/* Speed Elements */}
      <SpeedStreaks progress={progress} intensity={phase === 'processing' ? 2 : 0.5} />
      <F1GridFloor progress={progress} />
      <HorizonGlow progress={progress} />
      
      {/* Energy Sparkles */}
      <Sparkles
        count={100}
        scale={[20, 10, 40]}
        size={1.5}
        speed={0.5 + (progress / 100) * 1.5}
        color="#6366F1"
      />
      
      {/* Answer Pulse Effect */}
      <EnergyPulse trigger={answerTrigger} intensity={answerIntensity} />
      
      {/* Processing State */}
      {phase === 'processing' && <ProcessingAnimation />}
      
      {/* Post-processing */}
      <EffectComposer>
        <Bloom
          luminanceThreshold={0.3}
          luminanceSmoothing={0.9}
          intensity={1.5 + (progress / 100) * 0.5}
        />
        <ChromaticAberration
          blendFunction={BlendFunction.NORMAL}
          offset={new THREE.Vector2(
            0.001 + (progress / 100) * 0.002, 
            0.001 + (progress / 100) * 0.002
          )}
        />
        <Vignette
          offset={0.3}
          darkness={0.6}
          blendFunction={BlendFunction.NORMAL}
        />
      </EffectComposer>
    </>
  )
}

// ═══════════════════════════════════════════════════════════════════
// DUAL-LAYER UI OVERLAY
// ═══════════════════════════════════════════════════════════════════

function DualLayerOverlay({ 
  progress, 
  currentQuestion, 
  totalQuestions,
  phase,
}: { 
  progress: number;
  currentQuestion: number;
  totalQuestions: number;
  phase: string;
}) {
  return (
    <>
      {/* TOP LAYER: Experience/Emotional */}
      <div className="absolute top-0 left-0 right-0 p-8 pointer-events-none">
        <AnimatePresence mode="wait">
          {phase === 'intro' && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <p className="text-cyan-400 font-mono text-xs tracking-[0.3em] uppercase mb-2">
                Futures Assessment
              </p>
              <h1 className="text-4xl md:text-5xl font-headline text-white mb-2">
                Discover Your Path
              </h1>
            </motion.div>
          )}
          
          {phase === 'questions' && (
            <motion.div
              key="questions"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-between"
            >
              <div className="text-white/60 font-mono text-sm">
                <span className="text-white">{String(currentQuestion).padStart(2, '0')}</span>
                <span className="mx-1">/</span>
                <span>{String(totalQuestions).padStart(2, '0')}</span>
              </div>
              
              {/* Speed indicator */}
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-cyan-400 font-mono text-xs tracking-wider">
                  ACTIVE
                </span>
              </div>
            </motion.div>
          )}
          
          {phase === 'processing' && (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center"
            >
              <p className="text-purple-400 font-mono text-xs tracking-[0.3em] uppercase animate-pulse">
                Processing Your Responses
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* BOTTOM LAYER: Data/Substance */}
      <div className="absolute bottom-0 left-0 right-0 p-8 pointer-events-none">
        <div className="max-w-2xl mx-auto">
          {/* Progress Bar - F1 Telemetry Style */}
          <div className="relative h-1 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                background: 'linear-gradient(90deg, #6366F1 0%, #A855F7 50%, #22D3EE 100%)',
              }}
              animate={{ width: `${progress}%` }}
              transition={{ type: 'spring', damping: 20 }}
            />
            
            {/* Glow effect */}
            <motion.div
              className="absolute inset-y-0 w-8 blur-sm"
              style={{
                background: 'linear-gradient(90deg, transparent, #22D3EE, transparent)',
              }}
              animate={{ left: `${progress - 2}%` }}
              transition={{ type: 'spring', damping: 20 }}
            />
          </div>
          
          {/* Telemetry data */}
          <div className="flex justify-between mt-4 text-white/40 font-mono text-xs">
            <span>{progress.toFixed(0)}% COMPLETE</span>
            <span>{totalQuestions - currentQuestion} REMAINING</span>
          </div>
        </div>
      </div>
    </>
  )
}

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════

export function TunnelCitrixF1({
  progress,
  currentQuestion,
  totalQuestions,
  lastAnswerIntensity,
  phase,
}: TunnelCitrixF1Props) {
  const [answerTrigger, setAnswerTrigger] = useState(false)
  const [answerIntensity, setAnswerIntensity] = useState<'high' | 'medium' | 'low'>('medium')
  
  // Trigger pulse on answer
  useEffect(() => {
    if (lastAnswerIntensity) {
      setAnswerIntensity(lastAnswerIntensity)
      setAnswerTrigger(true)
      const timer = setTimeout(() => setAnswerTrigger(false), 100)
      return () => clearTimeout(timer)
    }
  }, [lastAnswerIntensity, currentQuestion])
  
  return (
    <div className="fixed inset-0 overflow-hidden">
      {/* 3D Canvas - Full bleed */}
      <Canvas
        dpr={[1, 1.5]}
        style={{ 
          background: 'linear-gradient(180deg, #06060a 0%, #0a0a12 50%, #080810 100%)' 
        }}
      >
        <SceneContent 
          progress={progress}
          phase={phase}
          answerTrigger={answerTrigger}
          answerIntensity={answerIntensity}
        />
      </Canvas>
      
      {/* Dual-Layer UI Overlay */}
      <DualLayerOverlay 
        progress={progress}
        currentQuestion={currentQuestion}
        totalQuestions={totalQuestions}
        phase={phase}
      />
    </div>
  )
}

export default TunnelCitrixF1
