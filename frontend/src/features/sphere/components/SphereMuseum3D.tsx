/**
 * SPHERE MUSEUM 3D
 * 
 * "Cabinet of Curiosities" - Immersive 3D Museum Experience
 * 
 * Reference: Audemars Piguet 150 Years "House of Wonders"
 * https://150years.audemarspiguet.com/en#/experience/enter_the_qp_verse
 * 
 * MANDATORY PRINCIPLES (dari Design Paradigm Document):
 * 1. IMMERSIVE 3D ENVIRONMENT - Full 3D explorable space
 * 2. ROOM-BASED NAVIGATION - Multiple distinct "rooms"
 * 3. INTERACTIVE OBJECTS - Objects dapat di-inspect
 * 4. PROGRESS & GAMIFICATION - Locked/unlocked room states
 * 
 * VISUAL STYLE:
 * - Materials: Dark wood paneling, brushed gold/brass, beveled glass, white marble, velvet
 * - Lighting: Dramatic spotlights, volumetric god rays, warm ambient, dust particles
 * - Atmosphere: Subtle fog/haze, floating luminous particles, quiet reverence
 * 
 * EXPERIENCE FLOW:
 * Entry Portal → Main Hall → Individual Room → Inspection Mode
 */

import { Suspense, useRef, useState, useCallback, useMemo, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { 
  OrbitControls,
  PerspectiveCamera,
  Float,
  Html,
  MeshReflectorMaterial,
  Sparkles,
  Stars,
} from '@react-three/drei'
import { 
  EffectComposer, 
  Bloom, 
  Vignette,
  Noise,
} from '@react-three/postprocessing'
import { KernelSize } from 'postprocessing'
import * as THREE from 'three'
import { motion } from 'framer-motion'

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

type MuseumState = 'entry' | 'hall' | 'room' | 'inspect'

interface Room {
  id: string
  name: string
  position: [number, number, number]
  unlocked: boolean
  theme: 'achievement' | 'reflection' | 'milestone' | 'memory'
}

interface DisplayObject {
  id: string
  type: 'photo' | 'badge' | 'journal' | 'trophy'
  position: [number, number, number]
  label: string
  content: string
  roomId: string
}

interface SphereMuseumProps {
  nodes: Array<{ id: number; posX: number; posY: number; posZ: number; unlockDate: string }>
  reflections: Array<{ id: number; content: string; reflectionType: string; createdAt: string }>
}

// ═══════════════════════════════════════════════════════════════════
// FADE GROUP - Smooth Portal Transitions
// Per Design Paradigm: "Portal/door transitions between rooms"
// ═══════════════════════════════════════════════════════════════════

function FadeGroup({ 
  isVisible, 
  children,
  position = [0, 0, 0],
  fadeSpeed = 0.05,
}: { 
  isVisible: boolean
  children: React.ReactNode
  position?: [number, number, number]
  fadeSpeed?: number
}) {
  const groupRef = useRef<THREE.Group>(null)
  const targetOpacity = isVisible ? 1 : 0
  const [shouldRender, setShouldRender] = useState(isVisible)
  
  useEffect(() => {
    if (isVisible) {
      setShouldRender(true)
    }
  }, [isVisible])
  
  useFrame(() => {
    if (groupRef.current) {
      // Traverse all materials and animate opacity
      groupRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          const material = child.material as THREE.MeshStandardMaterial
          if (material.opacity !== undefined) {
            material.opacity += (targetOpacity - material.opacity) * fadeSpeed
            material.transparent = true
            
            // Only mark for removal when fully faded
            if (!isVisible && material.opacity < 0.01) {
              setShouldRender(false)
            }
          }
        }
      })
      
      // Scale-based fade for overall group
      const currentScale = groupRef.current.scale.x
      const targetScale = isVisible ? 1 : 0.95
      groupRef.current.scale.setScalar(
        currentScale + (targetScale - currentScale) * fadeSpeed
      )
    }
  })
  
  if (!shouldRender) return null
  
  return (
    <group ref={groupRef} position={position}>
      {children}
    </group>
  )
}

// ═══════════════════════════════════════════════════════════════════
// MUSEUM MATERIALS (Design Paradigm Literal)
// ═══════════════════════════════════════════════════════════════════

const MATERIALS = {
  darkWood: {
    color: '#2C1810',
    roughness: 0.8,
    metalness: 0.1,
  },
  brushedGold: {
    color: '#D4A853',
    roughness: 0.3,
    metalness: 0.9,
  },
  marble: {
    color: '#F5F5F0',
    roughness: 0.2,
    metalness: 0.05,
  },
  velvet: {
    color: '#1a1a2e',
    roughness: 1.0,
    metalness: 0.0,
  },
  glass: {
    color: '#FFFFFF',
    roughness: 0.05,
    metalness: 0.1,
    transmission: 0.9,
    transparent: true,
    opacity: 0.3,
  },
}

// ═══════════════════════════════════════════════════════════════════
// DUST PARTICLES (Atmospheric Element)
// ═══════════════════════════════════════════════════════════════════

function generateDustData(count: number) {
  const positions = new Float32Array(count * 3)
  
  for (let i = 0; i < count; i++) {
    const i3 = i * 3
    const seed = i * 0.1
    
    // Random distribution dalam ruangan
    positions[i3] = (Math.sin(seed * 127.1) * 0.5) * 20 - 10
    positions[i3 + 1] = (Math.sin(seed * 311.7) * 0.5 + 0.5) * 8
    positions[i3 + 2] = (Math.sin(seed * 543.3) * 0.5) * 20 - 10
  }
  
  return positions
}

const dustPositions = generateDustData(300)

function DustParticles() {
  const particlesRef = useRef<THREE.Points>(null)
  
  useFrame((state) => {
    if (particlesRef.current) {
      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array
      
      for (let i = 0; i < positions.length; i += 3) {
        // Slow floating motion
        positions[i + 1] += Math.sin(state.clock.elapsedTime * 0.2 + i) * 0.001
        
        // Reset if too high
        if (positions[i + 1] > 10) {
          positions[i + 1] = 0
        }
      }
      
      particlesRef.current.geometry.attributes.position.needsUpdate = true
    }
  })
  
  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[dustPositions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.02}
        color="#D4A853"
        transparent
        opacity={0.4}
        sizeAttenuation
      />
    </points>
  )
}

// ═══════════════════════════════════════════════════════════════════
// ENTRY PORTAL (Ornate Door)
// ═══════════════════════════════════════════════════════════════════

function EntryPortal({ 
  onEnter, 
  isVisible 
}: { 
  onEnter: () => void
  isVisible: boolean 
}) {
  const portalRef = useRef<THREE.Group>(null)
  const [hovered, setHovered] = useState(false)
  
  useFrame((state) => {
    if (portalRef.current) {
      // Subtle floating animation
      portalRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.05
    }
  })
  
  return (
    <FadeGroup isVisible={isVisible}>
      <group ref={portalRef} position={[0, 0, 0]}>
      {/* Door Frame - Dark Wood */}
      <mesh position={[0, 2.5, 0]}>
        <boxGeometry args={[3.5, 5.5, 0.3]} />
        <meshStandardMaterial {...MATERIALS.darkWood} />
      </mesh>
      
      {/* Gold Trim - Top */}
      <mesh position={[0, 5.3, 0.1]}>
        <boxGeometry args={[3.8, 0.15, 0.15]} />
        <meshStandardMaterial {...MATERIALS.brushedGold} />
      </mesh>
      
      {/* Gold Trim - Left */}
      <mesh position={[-1.85, 2.5, 0.1]}>
        <boxGeometry args={[0.15, 5.5, 0.15]} />
        <meshStandardMaterial {...MATERIALS.brushedGold} />
      </mesh>
      
      {/* Gold Trim - Right */}
      <mesh position={[1.85, 2.5, 0.1]}>
        <boxGeometry args={[0.15, 5.5, 0.15]} />
        <meshStandardMaterial {...MATERIALS.brushedGold} />
      </mesh>
      
      {/* Door Panel (Interactive) */}
      <mesh 
        position={[0, 2.5, 0.2]}
        onClick={onEnter}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[2.8, 4.8, 0.1]} />
        <meshStandardMaterial 
          color={hovered ? '#3a2418' : '#2C1810'}
          roughness={0.7}
          metalness={0.1}
        />
      </mesh>
      
      {/* Gold Door Handle */}
      <mesh position={[1, 2.5, 0.35]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial {...MATERIALS.brushedGold} />
      </mesh>
      
      {/* Ornate Gold Decoration - Top Center */}
      <mesh position={[0, 4.5, 0.25]}>
        <torusGeometry args={[0.3, 0.05, 8, 32]} />
        <meshStandardMaterial {...MATERIALS.brushedGold} />
      </mesh>
      
      {/* Light Source Above Portal */}
      <pointLight position={[0, 6, 2]} intensity={2} color="#FFF8E7" distance={15} />
      
      {/* "Enter Your Sphere" Text */}
      <Html position={[0, -0.5, 0.5]} center>
        <motion.div 
          className="text-center cursor-pointer select-none"
          whileHover={{ scale: 1.05 }}
          onClick={onEnter}
        >
          <p className="font-headline text-2xl text-[#D4A853] tracking-wider">
            Enter Your Sphere
          </p>
          <p className="text-sm text-gray-400 mt-1 font-ui">
            Click to begin your journey
          </p>
        </motion.div>
      </Html>
      
      {/* Spotlight Effect */}
      <spotLight
        position={[0, 8, 3]}
        angle={0.4}
        penumbra={0.5}
        intensity={3}
        color="#FFF8E7"
        castShadow
        target-position={[0, 2.5, 0]}
      />
      </group>
    </FadeGroup>
  )
}

// ═══════════════════════════════════════════════════════════════════
// MAIN HALL (Octagonal Gallery)
// ═══════════════════════════════════════════════════════════════════

function MainHall({ 
  rooms, 
  onSelectRoom,
  isVisible 
}: { 
  rooms: Room[]
  onSelectRoom: (roomId: string) => void
  isVisible: boolean 
}) {
  return (
    <FadeGroup isVisible={isVisible} position={[0, 0, -15]}>
      {/* Floor - White Marble */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <circleGeometry args={[12, 8]} />
        <MeshReflectorMaterial
          blur={[300, 100]}
          resolution={1024}
          mixBlur={1}
          mixStrength={40}
          roughness={0.3}
          depthScale={1.2}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color="#E8E4E0"
          metalness={0.1}
          mirror={0.5}
        />
      </mesh>
      
      {/* Walls - Dark Wood Paneling */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2
        const x = Math.cos(angle) * 11
        const z = Math.sin(angle) * 11
        
        return (
          <group key={i} position={[x, 4, z]} rotation={[0, -angle + Math.PI / 2, 0]}>
            {/* Wall Panel */}
            <mesh>
              <boxGeometry args={[8, 8, 0.3]} />
              <meshStandardMaterial {...MATERIALS.darkWood} />
            </mesh>
            
            {/* Gold Trim */}
            <mesh position={[0, 4.05, 0.1]}>
              <boxGeometry args={[8.2, 0.1, 0.1]} />
              <meshStandardMaterial {...MATERIALS.brushedGold} />
            </mesh>
          </group>
        )
      })}
      
      {/* Central Chandelier */}
      <group position={[0, 9, 0]}>
        <mesh>
          <cylinderGeometry args={[0.5, 0.3, 0.5, 16]} />
          <meshStandardMaterial {...MATERIALS.brushedGold} />
        </mesh>
        <pointLight position={[0, -1, 0]} intensity={3} color="#FFF8E7" distance={20} />
        
        {/* Crystal Elements */}
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (i / 8) * Math.PI * 2
          return (
            <mesh 
              key={i} 
              position={[Math.cos(angle) * 0.8, -0.5, Math.sin(angle) * 0.8]}
            >
              <coneGeometry args={[0.1, 0.3, 6]} />
              <meshStandardMaterial color="#FFFFFF" transparent opacity={0.7} />
            </mesh>
          )
        })}
      </group>
      
      {/* Display Cases for Rooms */}
      {rooms.map((room, i) => {
        const angle = (i / rooms.length) * Math.PI * 2
        const x = Math.cos(angle) * 6
        const z = Math.sin(angle) * 6
        
        return (
          <DisplayCase
            key={room.id}
            room={room}
            position={[x, 0, z]}
            rotation={[0, -angle, 0]}
            onSelect={() => onSelectRoom(room.id)}
          />
        )
      })}
      
      {/* Dust Particles */}
      <DustParticles />
      
      {/* Ambient Light */}
      <ambientLight intensity={0.2} color="#FFF8E7" />
    </FadeGroup>
  )
}

// ═══════════════════════════════════════════════════════════════════
// DISPLAY CASE (Room Portal)
// ═══════════════════════════════════════════════════════════════════

function DisplayCase({ 
  room, 
  position, 
  rotation, 
  onSelect 
}: { 
  room: Room
  position: [number, number, number]
  rotation: [number, number, number]
  onSelect: () => void 
}) {
  const [hovered, setHovered] = useState(false)
  
  const themeColors = {
    achievement: '#D4A853',
    reflection: '#6366F1',
    milestone: '#22D3EE',
    memory: '#A855F7',
  }
  
  return (
    <group position={position} rotation={rotation}>
      {/* Marble Pedestal */}
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.8, 1, 1, 8]} />
        <meshStandardMaterial {...MATERIALS.marble} />
      </mesh>
      
      {/* Gold Base Ring */}
      <mesh position={[0, 1.02, 0]}>
        <cylinderGeometry args={[0.85, 0.85, 0.05, 16]} />
        <meshStandardMaterial {...MATERIALS.brushedGold} />
      </mesh>
      
      {/* Glass Case */}
      <mesh 
        position={[0, 2, 0]}
        onClick={room.unlocked ? onSelect : undefined}
        onPointerOver={() => room.unlocked && setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <cylinderGeometry args={[0.6, 0.6, 1.8, 16, 1, true]} />
        <meshStandardMaterial 
          {...MATERIALS.glass}
          opacity={hovered ? 0.5 : 0.2}
        />
      </mesh>
      
      {/* Display Object Inside */}
      <Float speed={2} rotationIntensity={0.3} floatIntensity={0.3}>
        <mesh position={[0, 2, 0]}>
          <dodecahedronGeometry args={[0.3, 0]} />
          <meshStandardMaterial 
            color={themeColors[room.theme]}
            emissive={themeColors[room.theme]}
            emissiveIntensity={room.unlocked ? 0.5 : 0.1}
            roughness={0.3}
            metalness={0.8}
          />
        </mesh>
      </Float>
      
      {/* Room Label */}
      <Html position={[0, 0.2, 1]} center>
        <div className={`text-center ${room.unlocked ? 'opacity-100' : 'opacity-50'}`}>
          <p className="font-headline text-sm text-[#D4A853] tracking-wider">
            {room.name}
          </p>
          {!room.unlocked && (
            <p className="text-xs text-gray-500 mt-1">🔒 Locked</p>
          )}
        </div>
      </Html>
      
      {/* Spotlight */}
      <spotLight
        position={[0, 5, 0]}
        angle={0.3}
        penumbra={0.5}
        intensity={2}
        color="#FFF8E7"
        target-position={[0, 2, 0]}
      />
    </group>
  )
}

// ═══════════════════════════════════════════════════════════════════
// INDIVIDUAL ROOM
// ═══════════════════════════════════════════════════════════════════

function IndividualRoom({ 
  room, 
  objects,
  onBack,
  onInspect,
  isVisible 
}: { 
  room: Room | null
  objects: DisplayObject[]
  onBack: () => void
  onInspect: (objectId: string) => void
  isVisible: boolean 
}) {
  if (!room) return null
  
  return (
    <FadeGroup isVisible={isVisible} position={[0, 0, -30]}>
      {/* Floor - Marble */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[16, 16]} />
        <meshStandardMaterial {...MATERIALS.marble} />
      </mesh>
      
      {/* Walls - Dark Wood */}
      {/* Back Wall */}
      <mesh position={[0, 4, -8]}>
        <boxGeometry args={[16, 8, 0.3]} />
        <meshStandardMaterial {...MATERIALS.darkWood} />
      </mesh>
      
      {/* Left Wall */}
      <mesh position={[-8, 4, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[16, 8, 0.3]} />
        <meshStandardMaterial {...MATERIALS.darkWood} />
      </mesh>
      
      {/* Right Wall */}
      <mesh position={[8, 4, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[16, 8, 0.3]} />
        <meshStandardMaterial {...MATERIALS.darkWood} />
      </mesh>
      
      {/* Velvet Floor Runner */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3, 14]} />
        <meshStandardMaterial {...MATERIALS.velvet} />
      </mesh>
      
      {/* Objects on Pedestals */}
      {objects.map((obj, i) => (
        <ObjectPedestal
          key={obj.id}
          object={obj}
          position={[-4 + i * 4, 0, -4]}
          onInspect={() => onInspect(obj.id)}
        />
      ))}
      
      {/* Back Button */}
      <Html position={[0, 1, 7]} center>
        <motion.button
          className="px-6 py-3 bg-[#2C1810] border border-[#D4A853] text-[#D4A853] font-ui text-sm uppercase tracking-wider rounded hover:bg-[#D4A853] hover:text-[#2C1810] transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onBack}
        >
          ← Return to Hall
        </motion.button>
      </Html>
      
      {/* Room Title */}
      <Html position={[0, 7, -7]} center>
        <h2 className="font-headline text-3xl text-[#D4A853] tracking-wider">
          {room.name}
        </h2>
      </Html>
      
      {/* Lighting */}
      <ambientLight intensity={0.15} color="#FFF8E7" />
      <spotLight
        position={[0, 8, 0]}
        angle={0.5}
        penumbra={0.5}
        intensity={2}
        color="#FFF8E7"
        castShadow
      />
      
      {/* Dust Particles */}
      <DustParticles />
    </FadeGroup>
  )
}

// ═══════════════════════════════════════════════════════════════════
// OBJECT PEDESTAL
// ═══════════════════════════════════════════════════════════════════

function ObjectPedestal({ 
  object, 
  position, 
  onInspect 
}: { 
  object: DisplayObject
  position: [number, number, number]
  onInspect: () => void 
}) {
  const [hovered, setHovered] = useState(false)
  
  const objectMeshes = {
    photo: (
      <group>
        {/* Gold Frame */}
        <mesh>
          <boxGeometry args={[1.2, 1.5, 0.1]} />
          <meshStandardMaterial {...MATERIALS.brushedGold} />
        </mesh>
        {/* Photo Area */}
        <mesh position={[0, 0, 0.06]}>
          <planeGeometry args={[1, 1.3]} />
          <meshStandardMaterial color="#333333" />
        </mesh>
      </group>
    ),
    badge: (
      <mesh>
        <cylinderGeometry args={[0.4, 0.4, 0.1, 32]} />
        <meshStandardMaterial {...MATERIALS.brushedGold} />
      </mesh>
    ),
    journal: (
      <mesh>
        <boxGeometry args={[0.8, 1, 0.15]} />
        <meshStandardMaterial color="#8B4513" roughness={0.9} />
      </mesh>
    ),
    trophy: (
      <group>
        <mesh position={[0, 0.3, 0]}>
          <cylinderGeometry args={[0.2, 0.15, 0.6, 16]} />
          <meshStandardMaterial {...MATERIALS.brushedGold} />
        </mesh>
        <mesh position={[0, -0.1, 0]}>
          <cylinderGeometry args={[0.3, 0.25, 0.2, 16]} />
          <meshStandardMaterial {...MATERIALS.marble} />
        </mesh>
      </group>
    ),
  }
  
  return (
    <group position={position}>
      {/* Marble Pedestal */}
      <mesh position={[0, 0.75, 0]}>
        <boxGeometry args={[1, 1.5, 1]} />
        <meshStandardMaterial {...MATERIALS.marble} />
      </mesh>
      
      {/* Gold Top Plate */}
      <mesh position={[0, 1.52, 0]}>
        <boxGeometry args={[1.1, 0.05, 1.1]} />
        <meshStandardMaterial {...MATERIALS.brushedGold} />
      </mesh>
      
      {/* Object */}
      <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.1}>
        <group 
          position={[0, 2.2, 0]}
          onClick={onInspect}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
        >
          {objectMeshes[object.type]}
        </group>
      </Float>
      
      {/* Label */}
      <Html position={[0, 0.2, 0.6]} center>
        <div className="text-center">
          <p className="font-ui text-xs text-[#D4A853] tracking-wider uppercase">
            {object.label}
          </p>
        </div>
      </Html>
      
      {/* Spotlight */}
      <spotLight
        position={[0, 5, 1]}
        angle={0.3}
        penumbra={0.5}
        intensity={hovered ? 3 : 1.5}
        color="#FFF8E7"
        target-position={[0, 2, 0]}
      />
    </group>
  )
}

// ═══════════════════════════════════════════════════════════════════
// INSPECTION MODE (3D Rotation/Zoom per Design Paradigm)
// "Object centered, enlarged. Drag to rotate. Hotspots for additional info."
// ═══════════════════════════════════════════════════════════════════

function InspectionMode({ 
  object, 
  onClose,
  isVisible 
}: { 
  object: DisplayObject | null
  onClose: () => void
  isVisible: boolean 
}) {
  const meshRef = useRef<THREE.Group>(null)
  
  // Auto-rotate object
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.008
    }
  })
  
  if (!isVisible || !object) return null
  
  const objectMeshes: Record<string, React.ReactNode> = {
    photo: (
      <group>
        {/* Ornate Gold Frame */}
        <mesh>
          <boxGeometry args={[2.4, 3, 0.2]} />
          <meshStandardMaterial {...MATERIALS.brushedGold} />
        </mesh>
        {/* Photo Area */}
        <mesh position={[0, 0, 0.12]}>
          <planeGeometry args={[2, 2.6]} />
          <meshStandardMaterial color="#333333" />
        </mesh>
        {/* Inner Frame */}
        <mesh position={[0, 0, 0.11]}>
          <boxGeometry args={[2.1, 2.7, 0.02]} />
          <meshStandardMaterial color="#1a1a2e" />
        </mesh>
      </group>
    ),
    badge: (
      <group>
        <mesh>
          <cylinderGeometry args={[0.8, 0.8, 0.15, 64]} />
          <meshStandardMaterial {...MATERIALS.brushedGold} />
        </mesh>
        {/* Star embossing */}
        <mesh position={[0, 0.08, 0]}>
          <cylinderGeometry args={[0.5, 0.5, 0.02, 5]} />
          <meshStandardMaterial color="#FFF8E7" metalness={0.9} roughness={0.1} />
        </mesh>
      </group>
    ),
    journal: (
      <group>
        <mesh>
          <boxGeometry args={[1.6, 2, 0.3]} />
          <meshStandardMaterial color="#8B4513" roughness={0.9} />
        </mesh>
        {/* Spine */}
        <mesh position={[-0.85, 0, 0]}>
          <boxGeometry args={[0.1, 2, 0.35]} />
          <meshStandardMaterial color="#5D3A1A" roughness={0.95} />
        </mesh>
        {/* Gold clasp */}
        <mesh position={[0.8, 0, 0.16]}>
          <boxGeometry args={[0.1, 0.3, 0.05]} />
          <meshStandardMaterial {...MATERIALS.brushedGold} />
        </mesh>
      </group>
    ),
    trophy: (
      <group>
        {/* Cup */}
        <mesh position={[0, 0.6, 0]}>
          <cylinderGeometry args={[0.4, 0.3, 1.2, 32]} />
          <meshStandardMaterial {...MATERIALS.brushedGold} />
        </mesh>
        {/* Handles */}
        <mesh position={[0.5, 0.7, 0]} rotation={[0, 0, Math.PI / 4]}>
          <torusGeometry args={[0.2, 0.05, 8, 16, Math.PI]} />
          <meshStandardMaterial {...MATERIALS.brushedGold} />
        </mesh>
        <mesh position={[-0.5, 0.7, 0]} rotation={[0, Math.PI, Math.PI / 4]}>
          <torusGeometry args={[0.2, 0.05, 8, 16, Math.PI]} />
          <meshStandardMaterial {...MATERIALS.brushedGold} />
        </mesh>
        {/* Base */}
        <mesh position={[0, -0.2, 0]}>
          <cylinderGeometry args={[0.5, 0.4, 0.4, 32]} />
          <meshStandardMaterial {...MATERIALS.marble} />
        </mesh>
      </group>
    ),
  }
  
  return (
    <group position={[0, 2, -5]}>
      {/* Darkened Background */}
      <mesh position={[0, 0, -3]}>
        <planeGeometry args={[50, 40]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.9} />
      </mesh>
      
      {/* Centered Object with AUTO ROTATION */}
      <group 
        ref={meshRef}
        scale={2.5}
      >
        {objectMeshes[object.type] || objectMeshes.badge}
      </group>
      
      {/* Info Panel */}
      <Html position={[3, 0, 0]}>
        <motion.div 
          className="w-80 bg-[#1a1a2e]/90 border border-[#D4A853]/30 rounded-lg p-6"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h3 className="font-headline text-xl text-[#D4A853] mb-3">
            {object.label}
          </h3>
          <p className="text-gray-300 text-sm leading-relaxed">
            {object.content}
          </p>
          <button
            className="mt-4 px-4 py-2 bg-[#D4A853] text-[#1a1a2e] font-ui text-sm uppercase tracking-wider rounded hover:bg-[#E5C07B] transition-colors"
            onClick={onClose}
          >
            Close
          </button>
        </motion.div>
      </Html>
      
      {/* Dramatic Spotlight */}
      <spotLight
        position={[0, 5, 5]}
        angle={0.4}
        penumbra={0.5}
        intensity={5}
        color="#FFF8E7"
      />
    </group>
  )
}

// ═══════════════════════════════════════════════════════════════════
// CAMERA CONTROLLER
// ═══════════════════════════════════════════════════════════════════

function CameraController({ 
  state, 
  targetPosition 
}: { 
  state: MuseumState
  targetPosition: [number, number, number] 
}) {
  const { camera } = useThree()
  const targetRef = useRef(new THREE.Vector3(...targetPosition))
  
  const positions: Record<MuseumState, [number, number, number]> = {
    entry: [0, 3, 8],
    hall: [0, 5, 0],
    room: [0, 3, -22],
    inspect: [0, 2, 0],
  }
  
  useFrame(() => {
    const target = new THREE.Vector3(...positions[state])
    camera.position.lerp(target, 0.02)
    
    const lookAt = new THREE.Vector3(...targetPosition)
    targetRef.current.lerp(lookAt, 0.02)
    camera.lookAt(targetRef.current)
  })
  
  return null
}

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════

export function SphereMuseum3D({ 
  nodes, 
  reflections, 
}: SphereMuseumProps) {
  const [museumState, setMuseumState] = useState<MuseumState>('entry')
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [selectedObject, setSelectedObject] = useState<DisplayObject | null>(null)
  
  // Transform nodes to rooms
  const rooms: Room[] = useMemo(() => {
    const themes: Room['theme'][] = ['achievement', 'reflection', 'milestone', 'memory']
    return nodes.slice(0, 6).map((node, i) => ({
      id: String(node.id),
      name: `Room ${i + 1}`,
      position: [0, 0, 0] as [number, number, number],
      unlocked: new Date(node.unlockDate) <= new Date(),
      theme: themes[i % themes.length],
    }))
  }, [nodes])
  
  // Sample objects for selected room
  const roomObjects: DisplayObject[] = useMemo(() => {
    if (!selectedRoom) return []
    
    return [
      { id: '1', type: 'photo', position: [-4, 0, -4], label: 'Memory', content: 'A captured moment from your journey.', roomId: selectedRoom.id },
      { id: '2', type: 'badge', position: [0, 0, -4], label: 'Achievement', content: 'You earned this for completing a milestone.', roomId: selectedRoom.id },
      { id: '3', type: 'journal', position: [4, 0, -4], label: 'Reflection', content: reflections[0]?.content || 'Your personal reflection awaits.', roomId: selectedRoom.id },
    ]
  }, [selectedRoom, reflections])
  
  const handleEnterPortal = useCallback(() => {
    setMuseumState('hall')
  }, [])
  
  const handleSelectRoom = useCallback((roomId: string) => {
    const room = rooms.find(r => r.id === roomId)
    if (room && room.unlocked) {
      setSelectedRoom(room)
      setMuseumState('room')
    }
  }, [rooms])
  
  const handleBackToHall = useCallback(() => {
    setSelectedRoom(null)
    setMuseumState('hall')
  }, [])
  
  const handleInspectObject = useCallback((objectId: string) => {
    const obj = roomObjects.find(o => o.id === objectId)
    if (obj) {
      setSelectedObject(obj)
      setMuseumState('inspect')
    }
  }, [roomObjects])
  
  const handleCloseInspection = useCallback(() => {
    setSelectedObject(null)
    setMuseumState('room')
  }, [])
  
  const cameraTarget: [number, number, number] = useMemo(() => {
    switch (museumState) {
      case 'entry': return [0, 2.5, 0]
      case 'hall': return [0, 2, -15]
      case 'room': return [0, 2, -30]
      case 'inspect': return [0, 2, -5]
      default: return [0, 2, 0]
    }
  }, [museumState])
  
  return (
    <div className="w-full h-full bg-[#0A0A0F]">
      <Canvas shadows>
        <Suspense fallback={null}>
          {/* Camera */}
          <PerspectiveCamera makeDefault position={[0, 3, 8]} fov={60} />
          <CameraController state={museumState} targetPosition={cameraTarget} />
          
          {/* Environment */}
          <fog attach="fog" args={['#0A0A0F', 10, 50]} />
          <ambientLight intensity={0.1} color="#FFF8E7" />
          
          {/* Entry Portal */}
          <EntryPortal 
            onEnter={handleEnterPortal} 
            isVisible={museumState === 'entry'} 
          />
          
          {/* Main Hall */}
          <MainHall 
            rooms={rooms}
            onSelectRoom={handleSelectRoom}
            isVisible={museumState === 'hall'}
          />
          
          {/* Individual Room */}
          <IndividualRoom
            room={selectedRoom}
            objects={roomObjects}
            onBack={handleBackToHall}
            onInspect={handleInspectObject}
            isVisible={museumState === 'room'}
          />
          
          {/* Inspection Mode */}
          <InspectionMode
            object={selectedObject}
            onClose={handleCloseInspection}
            isVisible={museumState === 'inspect'}
          />
          
          {/* Stars Background */}
          <Stars radius={100} depth={50} count={1000} factor={2} fade speed={0.5} />
          
          {/* Sparkles for Atmosphere */}
          <Sparkles count={100} scale={20} size={2} speed={0.2} color="#D4A853" />
          
          {/* Post-processing */}
          <EffectComposer>
            <Bloom 
              intensity={0.5} 
              luminanceThreshold={0.8} 
              luminanceSmoothing={0.9} 
              kernelSize={KernelSize.MEDIUM}
            />
            <Vignette eskil={false} offset={0.1} darkness={0.8} />
            <Noise opacity={0.02} />
          </EffectComposer>
          
          {/* Controls - FREE EXPLORATION per Design Paradigm */}
          {/* "Full 3D explorable space. User feels 'inside' the experience" */}
          <OrbitControls 
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={2}
            maxDistance={30}
            minPolarAngle={0.1}
            maxPolarAngle={Math.PI - 0.1}
            dampingFactor={0.05}
            rotateSpeed={0.5}
            zoomSpeed={0.8}
            panSpeed={0.5}
            enabled={museumState !== 'inspect'}
          />
        </Suspense>
      </Canvas>
      
      {/* UI Overlay - State Indicator */}
      <div className="absolute top-4 left-4 bg-black/50 px-4 py-2 rounded-lg">
        <p className="text-[#D4A853] font-ui text-xs uppercase tracking-wider">
          {museumState === 'entry' && 'Welcome to Your Sphere'}
          {museumState === 'hall' && 'Main Hall - Select a Room'}
          {museumState === 'room' && selectedRoom?.name}
          {museumState === 'inspect' && 'Inspecting Object'}
        </p>
      </div>
    </div>
  )
}

export default SphereMuseum3D
