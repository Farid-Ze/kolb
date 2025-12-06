/**
 * 3D SPHERE EXPERIENCE
 * 
 * "Cabinet of Curiosities" - An immersive 3D milestone gallery
 * 
 * Design Philosophy:
 * - Floating orbs representing milestones in 3D space
 * - Particles and ambient lighting creating depth
 * - Smooth camera movements and interactions
 * - Post-processing effects for premium feel
 * 
 * Inspired by: Apple Vision Pro spatial UI, Raycast, Linear
 */

import { Suspense, useRef, useMemo, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { 
  Float, 
  Stars, 
  MeshDistortMaterial,
  OrbitControls,
  Html
} from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'
import { motion } from 'framer-motion'

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

interface MilestoneOrb {
  id: string
  position: [number, number, number]
  label: string
  description: string
  color: string
  size: number
  unlockDate: Date
}

interface SphereNode {
  id: number
  posX: number
  posY: number
  posZ: number
  unlockDate: string
}

interface Reflection {
  id: number
  content: string
  reflectionType: string
  sphereNodeId?: number | null
  createdAt: string
}

// ═══════════════════════════════════════════════════════════════════
// FLOATING ORB COMPONENT
// ═══════════════════════════════════════════════════════════════════

function MilestoneOrb3D({ 
  milestone, 
  isSelected,
  onSelect 
}: { 
  milestone: MilestoneOrb
  isSelected: boolean
  onSelect: () => void
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)
  
  // Animate rotation and pulse
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.1
      meshRef.current.rotation.y += 0.005
      
      // Pulse effect when hovered or selected
      const scale = isSelected ? 1.3 : hovered ? 1.15 : 1
      meshRef.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.1)
    }
  })

  return (
    <Float
      speed={1.5}
      rotationIntensity={0.5}
      floatIntensity={0.5}
      position={milestone.position}
    >
      <group>
        {/* Main Orb */}
        <mesh
          ref={meshRef}
          onClick={onSelect}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
        >
          <sphereGeometry args={[milestone.size, 64, 64]} />
          <MeshDistortMaterial
            color={milestone.color}
            envMapIntensity={0.8}
            roughness={0.1}
            metalness={0.8}
            distort={hovered || isSelected ? 0.4 : 0.2}
            speed={2}
            transparent
            opacity={0.9}
          />
        </mesh>
        
        {/* Glow Ring */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[milestone.size * 1.2, milestone.size * 1.4, 64]} />
          <meshBasicMaterial 
            color={milestone.color} 
            transparent 
            opacity={isSelected ? 0.6 : hovered ? 0.4 : 0.2}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Inner Core Glow */}
        <pointLight 
          color={milestone.color} 
          intensity={isSelected ? 2 : hovered ? 1.5 : 0.8} 
          distance={3} 
        />

        {/* Label */}
        {(hovered || isSelected) && (
          <Html
            position={[0, milestone.size + 0.5, 0]}
            center
            distanceFactor={10}
          >
            <div className="pointer-events-none px-3 py-2 rounded-xl bg-black/80 backdrop-blur-xl border border-white/10 text-center whitespace-nowrap">
              <p className="text-white font-medium text-sm">{milestone.label}</p>
              <p className="text-gray-400 text-xs mt-0.5">{milestone.description}</p>
            </div>
          </Html>
        )}
      </group>
    </Float>
  )
}

// ═══════════════════════════════════════════════════════════════════
// AMBIENT PARTICLES
// ═══════════════════════════════════════════════════════════════════

// Generate particle data outside component for purity
function generateSphereParticleData() {
  const count = 1000
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  
  const colorPalette = [
    new THREE.Color('#6366F1'), // Indigo
    new THREE.Color('#A855F7'), // Purple
    new THREE.Color('#22D3EE'), // Cyan
    new THREE.Color('#D4A853'), // Gold
  ]
  
  for (let i = 0; i < count; i++) {
    const i3 = i * 3
    
    // Spherical distribution using deterministic pseudo-random
    const seed = i * 0.1
    const radius = 15 + (Math.sin(seed * 127.1) * 0.5 + 0.5) * 20
    const theta = (Math.sin(seed * 311.7) * 0.5 + 0.5) * Math.PI * 2
    const phi = Math.acos(2 * (Math.sin(seed * 543.3) * 0.5 + 0.5) - 1)
    
    positions[i3] = radius * Math.sin(phi) * Math.cos(theta)
    positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
    positions[i3 + 2] = radius * Math.cos(phi)
    
    const colorIndex = Math.abs(Math.floor(Math.sin(seed * 789.5) * colorPalette.length)) % colorPalette.length
    const color = colorPalette[colorIndex]
    colors[i3] = color.r
    colors[i3 + 1] = color.g
    colors[i3 + 2] = color.b
  }
  
  return { positions, colors }
}

// Pre-generate data at module level
const sphereParticleData = generateSphereParticleData()

function AmbientParticles() {
  const particlesRef = useRef<THREE.Points>(null)
  
  const { positions, colors } = sphereParticleData
  
  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = state.clock.elapsedTime * 0.02
      particlesRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.01) * 0.1
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
      />
    </points>
  )
}

// ═══════════════════════════════════════════════════════════════════
// CENTRAL SPHERE (Brand Element)
// ═══════════════════════════════════════════════════════════════════

function CentralSphere() {
  const meshRef = useRef<THREE.Mesh>(null)
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.1
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.05) * 0.2
    }
  })
  
  return (
    <Float speed={0.5} floatIntensity={0.3}>
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[0.8, 2]} />
        <MeshDistortMaterial
          color="#6366F1"
          envMapIntensity={1}
          roughness={0}
          metalness={1}
          distort={0.3}
          speed={3}
          wireframe
        />
      </mesh>
      
      {/* Inner Glow */}
      <mesh>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshBasicMaterial color="#6366F1" transparent opacity={0.3} />
      </mesh>
      
      <pointLight color="#6366F1" intensity={3} distance={5} />
    </Float>
  )
}

// ═══════════════════════════════════════════════════════════════════
// SCENE CONTENT
// ═══════════════════════════════════════════════════════════════════

function SceneContent({ 
  milestones, 
  selectedId, 
  onSelect 
}: { 
  milestones: MilestoneOrb[]
  selectedId: string | null
  onSelect: (id: string | null) => void
}) {
  return (
    <>
      {/* Environment & Lighting */}
      <ambientLight intensity={0.2} />
      <directionalLight position={[10, 10, 5]} intensity={0.5} />
      
      {/* Stars Background */}
      <Stars 
        radius={100} 
        depth={50} 
        count={3000} 
        factor={4} 
        saturation={0} 
        fade 
        speed={0.5}
      />
      
      {/* Ambient Particles */}
      <AmbientParticles />
      
      {/* Central Brand Sphere */}
      <CentralSphere />
      
      {/* Milestone Orbs */}
      {milestones.map((milestone) => (
        <MilestoneOrb3D
          key={milestone.id}
          milestone={milestone}
          isSelected={selectedId === milestone.id}
          onSelect={() => onSelect(selectedId === milestone.id ? null : milestone.id)}
        />
      ))}
      
      {/* Camera Controls */}
      <OrbitControls 
        enablePan={false}
        minDistance={5}
        maxDistance={25}
        autoRotate
        autoRotateSpeed={0.3}
        dampingFactor={0.05}
      />
      
      {/* Post-processing */}
      <EffectComposer>
        <Bloom 
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
          intensity={1.5}
        />
        <Vignette eskil={false} offset={0.1} darkness={0.8} />
      </EffectComposer>
    </>
  )
}

// ═══════════════════════════════════════════════════════════════════
// SIDE PANEL
// ═══════════════════════════════════════════════════════════════════

function SidePanel({ 
  milestones,
  selectedId,
  onSelect,
  reflections,
  onCreateReflection,
  isCreating
}: {
  milestones: MilestoneOrb[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  reflections: Reflection[]
  onCreateReflection: (content: string, type: string) => void
  isCreating: boolean
}) {
  const [content, setContent] = useState('')
  const selectedMilestone = milestones.find(m => m.id === selectedId)
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (content.trim()) {
      onCreateReflection(content, 'insight')
      setContent('')
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="absolute top-4 right-4 bottom-4 w-80 flex flex-col gap-4 pointer-events-auto z-20"
    >
      {/* Header Card */}
      <div className="rounded-2xl bg-[#0c0c14]/90 backdrop-blur-xl border border-white/10 p-5">
        <p className="font-ui text-xs uppercase tracking-wider text-indigo-400 mb-2">
          Zenosphere
        </p>
        <h2 className="font-headline text-xl font-bold text-white">
          Cabinet of Curiosities
        </h2>
        <p className="text-gray-400 text-sm mt-2">
          Explore your growth journey in 3D space. Click on orbs to view details.
        </p>
      </div>

      {/* Selected Milestone */}
      {selectedMilestone && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-[#0c0c14]/90 backdrop-blur-xl border border-white/10 p-5"
        >
          <div className="flex items-start gap-3">
            <div 
              className="w-4 h-4 rounded-full mt-1"
              style={{ backgroundColor: selectedMilestone.color }}
            />
            <div className="flex-1">
              <h3 className="font-medium text-white">{selectedMilestone.label}</h3>
              <p className="text-gray-400 text-sm mt-1">{selectedMilestone.description}</p>
              <p className="text-gray-500 text-xs mt-2">
                Unlocked: {selectedMilestone.unlockDate.toLocaleDateString()}
              </p>
            </div>
          </div>
          
          <button
            onClick={() => onSelect(null)}
            className="mt-4 w-full py-2 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            Clear Selection
          </button>
        </motion.div>
      )}

      {/* Reflection Form */}
      <form 
        onSubmit={handleSubmit}
        className="rounded-2xl bg-[#0c0c14]/90 backdrop-blur-xl border border-white/10 p-5"
      >
        <label className="block font-ui text-xs uppercase tracking-wider text-gray-400 mb-3">
          Add Reflection
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What did you learn?"
          className="w-full h-24 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 resize-none focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all"
        />
        <button
          type="submit"
          disabled={!content.trim() || isCreating}
          className="mt-3 w-full py-2.5 rounded-xl bg-indigo-500 text-white font-medium text-sm hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isCreating ? 'Saving...' : 'Add Reflection'}
        </button>
      </form>

      {/* Reflections List */}
      <div className="flex-1 overflow-y-auto rounded-2xl bg-[#0c0c14]/90 backdrop-blur-xl border border-white/10 p-5">
        <p className="font-ui text-xs uppercase tracking-wider text-gray-400 mb-3">
          Recent Reflections
        </p>
        {reflections.length === 0 ? (
          <p className="text-gray-500 text-sm">No reflections yet</p>
        ) : (
          <div className="space-y-3">
            {reflections.slice(0, 5).map((r) => (
              <div 
                key={r.id}
                className="p-3 rounded-xl bg-white/5 border border-white/5"
              >
                <p className="text-gray-300 text-sm">{r.content}</p>
                <p className="text-gray-500 text-xs mt-2">
                  {new Date(r.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// MAIN SPHERE EXPERIENCE COMPONENT
// ═══════════════════════════════════════════════════════════════════

interface SphereExperience3DProps {
  nodes: SphereNode[]
  reflections: Reflection[]
  onCreateReflection: (content: string, type: string) => void
  isCreating: boolean
}

export function SphereExperience3D({ 
  nodes, 
  reflections, 
  onCreateReflection,
  isCreating
}: SphereExperience3DProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  
  // Transform nodes to 3D milestones
  const milestones: MilestoneOrb[] = useMemo(() => {
    const colors = ['#6366F1', '#A855F7', '#22D3EE', '#D4A853', '#EC4899', '#10B981']
    const labels = [
      'First Insight', 'Growth Moment', 'Breakthrough', 
      'New Connection', 'Deep Reflection', 'Skill Mastery',
      'Challenge Overcome', 'Pattern Recognition'
    ]
    const descriptions = [
      'Your learning journey begins',
      'A moment of growth',
      'Breaking through barriers',
      'Making new connections',
      'Deep introspection',
      'Mastering new skills',
      'Overcoming challenges',
      'Seeing patterns emerge'
    ]
    
    return nodes.map((node, i) => {
      // Position nodes in 3D space spherically around center
      const theta = (i / nodes.length) * Math.PI * 2
      const phi = Math.acos(2 * ((i % 5) / 5) - 1) * 0.6 + 0.5
      const radius = 4 + (i % 3)
      
      return {
        id: node.id.toString(),
        position: [
          radius * Math.sin(phi) * Math.cos(theta),
          radius * Math.sin(phi) * Math.sin(theta) - 1,
          radius * Math.cos(phi)
        ] as [number, number, number],
        label: labels[i % labels.length],
        description: descriptions[i % descriptions.length],
        color: colors[i % colors.length],
        size: 0.3 + (i % 3) * 0.1,
        unlockDate: new Date(node.unlockDate)
      }
    })
  }, [nodes])
  
  // Add some default milestones if no nodes
  const displayMilestones = milestones.length > 0 ? milestones : [
    {
      id: 'default-1',
      position: [3, 1, 0] as [number, number, number],
      label: 'First Insight',
      description: 'Your learning journey begins',
      color: '#6366F1',
      size: 0.4,
      unlockDate: new Date()
    },
    {
      id: 'default-2',
      position: [-2, -1, 2] as [number, number, number],
      label: 'Growth Moment',
      description: 'A moment of growth',
      color: '#A855F7',
      size: 0.35,
      unlockDate: new Date()
    },
    {
      id: 'default-3',
      position: [0, 2, -3] as [number, number, number],
      label: 'Breakthrough',
      description: 'Breaking through barriers',
      color: '#22D3EE',
      size: 0.45,
      unlockDate: new Date()
    },
    {
      id: 'default-4',
      position: [-3, 0, -1] as [number, number, number],
      label: 'New Connection',
      description: 'Making new connections',
      color: '#D4A853',
      size: 0.3,
      unlockDate: new Date()
    },
  ]

  return (
    <div className="relative w-full h-[calc(100vh-8rem)] rounded-2xl overflow-hidden bg-[#0a0a0f]">
      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [0, 0, 12], fov: 50 }}
        dpr={[1, 2]}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <SceneContent 
            milestones={displayMilestones}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </Suspense>
      </Canvas>
      
      {/* Side Panel */}
      <SidePanel 
        milestones={displayMilestones}
        selectedId={selectedId}
        onSelect={setSelectedId}
        reflections={reflections}
        onCreateReflection={onCreateReflection}
        isCreating={isCreating}
      />
      
      {/* Instructions */}
      <div className="absolute bottom-4 left-4 px-4 py-2 rounded-xl bg-black/50 backdrop-blur-sm border border-white/10">
        <p className="text-gray-400 text-xs">
          <span className="text-white">Drag</span> to rotate • <span className="text-white">Scroll</span> to zoom • <span className="text-white">Click</span> orbs to select
        </p>
      </div>
    </div>
  )
}

export default SphereExperience3D
