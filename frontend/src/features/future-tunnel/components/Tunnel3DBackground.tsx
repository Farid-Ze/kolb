/**
 * TUNNEL 3D BACKGROUND
 * 
 * Immersive 3D background with particles and bloom effects
 * for the assessment tunnel experience.
 * 
 * Design: Sci-fi warp tunnel aesthetic with floating particles
 */

import { useRef, useMemo, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Stars, Float } from '@react-three/drei'
import { EffectComposer, Bloom, ChromaticAberration } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import * as THREE from 'three'

// ═══════════════════════════════════════════════════════════════════
// TUNNEL RINGS
// ═══════════════════════════════════════════════════════════════════

function TunnelRings() {
  const groupRef = useRef<THREE.Group>(null)
  
  const rings = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      z: -i * 4,
      rotation: (i * Math.PI) / 6,
      scale: 1 + i * 0.1,
    }))
  }, [])
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.z = (state.clock.elapsedTime * 0.5) % 4
      groupRef.current.rotation.z = state.clock.elapsedTime * 0.05
    }
  })
  
  return (
    <group ref={groupRef}>
      {rings.map((ring, i) => (
        <mesh key={i} position={[0, 0, ring.z]} rotation={[0, 0, ring.rotation]}>
          <ringGeometry args={[4 * ring.scale, 4.1 * ring.scale, 6]} />
          <meshBasicMaterial
            color="#6366F1"
            transparent
            opacity={0.1 - i * 0.008}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  )
}

// ═══════════════════════════════════════════════════════════════════
// FLOWING PARTICLES
// ═══════════════════════════════════════════════════════════════════

// Generate particle data outside of component to satisfy purity rules
function generateParticleData(count: number) {
  const positions = new Float32Array(count * 3)
  const velocities = new Float32Array(count)
  const colors = new Float32Array(count * 3)
  
  const colorPalette = [
    new THREE.Color('#6366F1'),
    new THREE.Color('#A855F7'),
    new THREE.Color('#22D3EE'),
  ]
  
  for (let i = 0; i < count; i++) {
    const i3 = i * 3
    
    // Cylindrical distribution using seeded random
    const seed = i * 0.1
    const theta = (Math.sin(seed * 127.1) * 0.5 + 0.5) * Math.PI * 2
    const radius = 2 + (Math.sin(seed * 311.7) * 0.5 + 0.5) * 3
    
    positions[i3] = Math.cos(theta) * radius
    positions[i3 + 1] = Math.sin(theta) * radius
    positions[i3 + 2] = (Math.sin(seed * 543.3) * 0.5 + 0.5) * -50
    
    velocities[i] = 0.02 + (Math.sin(seed * 789.5) * 0.5 + 0.5) * 0.05
    
    const colorIndex = Math.abs(Math.floor(Math.sin(seed * 997.9) * colorPalette.length)) % colorPalette.length
    const color = colorPalette[colorIndex]
    colors[i3] = color.r
    colors[i3 + 1] = color.g
    colors[i3 + 2] = color.b
  }
  
  return { positions, velocities, colors }
}

// Pre-generate data for default count
const DEFAULT_PARTICLE_COUNT = 500
const defaultParticleData = generateParticleData(DEFAULT_PARTICLE_COUNT)

function FlowingParticles({ count = DEFAULT_PARTICLE_COUNT }: { count?: number }) {
  const particlesRef = useRef<THREE.Points>(null)
  
  // Use pre-generated data or generate new if count differs
  const { positions, velocities, colors } = count === DEFAULT_PARTICLE_COUNT 
    ? defaultParticleData 
    : generateParticleData(count)
  
  useFrame(() => {
    if (particlesRef.current) {
      const positionAttr = particlesRef.current.geometry.attributes.position
      const posArray = positionAttr.array as Float32Array
      
      for (let i = 0; i < count; i++) {
        const i3 = i * 3
        posArray[i3 + 2] += velocities[i]
        
        // Reset particle when it passes the camera
        if (posArray[i3 + 2] > 5) {
          posArray[i3 + 2] = -50
        }
      }
      
      positionAttr.needsUpdate = true
    }
  })
  
  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

// ═══════════════════════════════════════════════════════════════════
// ENERGY CORE
// ═══════════════════════════════════════════════════════════════════

function EnergyCore({ progress = 0 }: { progress?: number }) {
  const meshRef = useRef<THREE.Mesh>(null)
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.3
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.5
      
      // Pulse based on progress
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.1
      const progressScale = 0.5 + (progress / 100) * 0.5
      meshRef.current.scale.setScalar(pulse * progressScale)
    }
  })
  
  return (
    <Float speed={2} floatIntensity={0.5}>
      <mesh ref={meshRef} position={[0, 0, -30]}>
        <icosahedronGeometry args={[1, 2]} />
        <meshBasicMaterial
          color="#6366F1"
          wireframe
          transparent
          opacity={0.6}
        />
      </mesh>
      <pointLight color="#6366F1" intensity={2} distance={15} position={[0, 0, -30]} />
    </Float>
  )
}

// ═══════════════════════════════════════════════════════════════════
// SCENE CONTENT
// ═══════════════════════════════════════════════════════════════════

function SceneContent({ progress = 0 }: { progress?: number }) {
  return (
    <>
      {/* Ambient Lighting */}
      <ambientLight intensity={0.1} />
      
      {/* Stars Background */}
      <Stars
        radius={100}
        depth={50}
        count={2000}
        factor={4}
        saturation={0}
        fade
        speed={0.3}
      />
      
      {/* Tunnel Elements */}
      <TunnelRings />
      <FlowingParticles count={400} />
      <EnergyCore progress={progress} />
      
      {/* Post-processing */}
      <EffectComposer>
        <Bloom
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
          intensity={1.2}
        />
        <ChromaticAberration
          blendFunction={BlendFunction.NORMAL}
          offset={new THREE.Vector2(0.001, 0.001)}
        />
      </EffectComposer>
    </>
  )
}

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════

interface Tunnel3DBackgroundProps {
  progress?: number
  className?: string
}

export function Tunnel3DBackground({ 
  progress = 0, 
  className = '' 
}: Tunnel3DBackgroundProps) {
  return (
    <div className={`fixed inset-0 -z-10 ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 60 }}
        dpr={[1, 1.5]}
        style={{ background: 'linear-gradient(180deg, #0a0a0f 0%, #0c0c18 100%)' }}
      >
        <Suspense fallback={null}>
          <SceneContent progress={progress} />
        </Suspense>
      </Canvas>
      
      {/* Gradient overlay for readability */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 50% 40%, transparent 0%, rgba(10, 10, 15, 0.8) 100%),
            linear-gradient(to bottom, transparent 0%, rgba(10, 10, 15, 0.9) 100%)
          `
        }}
      />
    </div>
  )
}

export default Tunnel3DBackground
