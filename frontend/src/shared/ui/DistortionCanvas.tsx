/**
 * DISTORTION CANVAS
 * 
 * WebGL layer with UV displacement shader for scroll-velocity based distortion.
 * Implements the "horizontal pixel stretch" effect seen in Citrix Red Bull Racing.
 * 
 * Technical Implementation:
 * - Post-processing shader that samples neighboring pixels horizontally
 * - Stretch intensity scales with scroll velocity
 * - Creates "warp speed" illusion during fast scrolls
 * 
 * Performance Strategy:
 * - Lazy loaded (not in initial bundle)
 * - Single WebGL context
 * - Minimal draw calls
 * - Disposed on unmount
 */

import { useRef, useEffect, useMemo, Suspense } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useScrollOrchestrator } from '../lib/ScrollOrchestrator'

// ═══════════════════════════════════════════════════════════════════
// SHADER CODE
// ═══════════════════════════════════════════════════════════════════

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  uniform sampler2D uTexture;
  uniform float uVelocity;
  uniform float uTime;
  uniform vec2 uResolution;
  
  varying vec2 vUv;
  
  void main() {
    vec2 uv = vUv;
    
    // Horizontal displacement based on velocity
    // More aggressive stretch at screen edges, less in center
    float distanceFromCenter = abs(uv.x - 0.5) * 2.0;
    float stretchFactor = uVelocity * distanceFromCenter * 0.15;
    
    // Apply directional stretch
    // When scrolling down (positive velocity), stretch pixels outward
    // When scrolling up (negative velocity), compress pixels inward
    float direction = sign(uVelocity);
    uv.x += stretchFactor * direction * (uv.x - 0.5);
    
    // Chromatic aberration effect during fast scroll
    float aberration = abs(uVelocity) * 0.005;
    
    vec4 colorR = texture2D(uTexture, vec2(uv.x + aberration, uv.y));
    vec4 colorG = texture2D(uTexture, uv);
    vec4 colorB = texture2D(uTexture, vec2(uv.x - aberration, uv.y));
    
    // Combine with slight RGB shift
    vec4 finalColor = vec4(colorR.r, colorG.g, colorB.b, colorG.a);
    
    // Add subtle vignette that intensifies with velocity
    float vignette = 1.0 - length(vUv - 0.5) * (0.3 + abs(uVelocity) * 0.3);
    finalColor.rgb *= vignette;
    
    // Scanline effect for tech feel (very subtle)
    float scanline = sin(uv.y * uResolution.y * 0.5 + uTime * 2.0) * 0.02 + 1.0;
    finalColor.rgb *= mix(1.0, scanline, abs(uVelocity) * 0.5);
    
    gl_FragColor = finalColor;
  }
`

// ═══════════════════════════════════════════════════════════════════
// DISTORTION PLANE COMPONENT (Three.js)
// ═══════════════════════════════════════════════════════════════════

interface DistortionPlaneProps {
  texture?: THREE.Texture
  videoElement?: HTMLVideoElement
}

function DistortionPlane({ texture, videoElement }: DistortionPlaneProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const { viewport } = useThree()
  const { velocity } = useScrollOrchestrator()
  
  // Create video texture if video element provided
  const videoTexture = useMemo(() => {
    if (videoElement) {
      const vt = new THREE.VideoTexture(videoElement)
      vt.minFilter = THREE.LinearFilter
      vt.magFilter = THREE.LinearFilter
      vt.format = THREE.RGBAFormat
      return vt
    }
    return null
  }, [videoElement])
  
  // Use provided texture or video texture or create placeholder
  const activeTexture = useMemo(() => {
    if (texture) return texture
    if (videoTexture) return videoTexture
    
    // Create placeholder gradient texture
    const canvas = document.createElement('canvas')
    canvas.width = 1920
    canvas.height = 1080
    const ctx = canvas.getContext('2d')!
    
    // Deep space gradient
    const gradient = ctx.createRadialGradient(
      canvas.width * 0.7, canvas.height * 0.5, 0,
      canvas.width * 0.5, canvas.height * 0.5, canvas.width * 0.8
    )
    gradient.addColorStop(0, '#1a1a2e')
    gradient.addColorStop(0.5, '#0a0a15')
    gradient.addColorStop(1, '#000000')
    
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // Add subtle orbs
    const addOrb = (x: number, y: number, radius: number, color: string) => {
      const orbGradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
      orbGradient.addColorStop(0, color)
      orbGradient.addColorStop(1, 'transparent')
      ctx.fillStyle = orbGradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }
    
    addOrb(canvas.width * 0.7, canvas.height * 0.4, 400, 'rgba(59, 130, 246, 0.3)')
    addOrb(canvas.width * 0.3, canvas.height * 0.6, 300, 'rgba(139, 92, 246, 0.2)')
    addOrb(canvas.width * 0.8, canvas.height * 0.7, 200, 'rgba(34, 211, 238, 0.15)')
    
    const placeholderTexture = new THREE.CanvasTexture(canvas)
    return placeholderTexture
  }, [texture, videoTexture])
  
  // Shader uniforms
  const uniforms = useMemo(() => ({
    uTexture: { value: activeTexture },
    uVelocity: { value: 0 },
    uTime: { value: 0 },
    uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
  }), [activeTexture])
  
  // Update uniforms on resize
  useEffect(() => {
    const handleResize = () => {
      if (materialRef.current) {
        materialRef.current.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  // Animation frame
  useFrame((state) => {
    if (materialRef.current) {
      // Smooth velocity interpolation for shader
      const currentVelocity = materialRef.current.uniforms.uVelocity.value
      const targetVelocity = velocity * 3 // Amplify for visual effect
      materialRef.current.uniforms.uVelocity.value = THREE.MathUtils.lerp(currentVelocity, targetVelocity, 0.1)
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime
      
      // Update video texture if using video
      if (videoTexture) {
        videoTexture.needsUpdate = true
      }
    }
  })
  
  return (
    <mesh ref={meshRef} scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1, 1, 1]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
      />
    </mesh>
  )
}

// ═══════════════════════════════════════════════════════════════════
// GENERATIVE ORBS (Alternative to video)
// ═══════════════════════════════════════════════════════════════════

const orbVertexShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vPosition;
  
  uniform float uTime;
  uniform float uVelocity;
  
  void main() {
    vUv = uv;
    vPosition = position;
    
    // Subtle vertex displacement based on velocity
    vec3 pos = position;
    float wave = sin(pos.x * 3.0 + uTime) * cos(pos.y * 3.0 + uTime) * 0.02;
    pos.z += wave * (1.0 + abs(uVelocity));
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`

const orbFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uVelocity;
  uniform float uProgress;
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform vec3 uColor3;
  
  varying vec2 vUv;
  varying vec3 vPosition;
  
  // Simplex noise function
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
  
  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    
    i = mod289(i);
    vec4 p = permute(permute(permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;
    
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }
  
  void main() {
    vec2 uv = vUv;
    
    // Create flowing noise pattern
    float noise1 = snoise(vec3(uv * 2.0, uTime * 0.2));
    float noise2 = snoise(vec3(uv * 4.0 + 100.0, uTime * 0.3));
    float noise3 = snoise(vec3(uv * 1.5 - 50.0, uTime * 0.15 + uProgress));
    
    // Combine noises
    float combinedNoise = noise1 * 0.5 + noise2 * 0.3 + noise3 * 0.2;
    
    // Color mixing based on noise and progress
    vec3 color = mix(uColor1, uColor2, smoothstep(-0.5, 0.5, noise1));
    color = mix(color, uColor3, smoothstep(-0.3, 0.7, noise2) * 0.5);
    
    // Add glow effect
    float glow = pow(combinedNoise * 0.5 + 0.5, 2.0);
    color += glow * 0.3;
    
    // Velocity-based intensity
    float intensity = 0.6 + abs(uVelocity) * 0.3;
    color *= intensity;
    
    // Edge fade
    float edgeFade = smoothstep(0.0, 0.3, uv.x) * smoothstep(1.0, 0.7, uv.x) *
                     smoothstep(0.0, 0.3, uv.y) * smoothstep(1.0, 0.7, uv.y);
    
    gl_FragColor = vec4(color, edgeFade * 0.8);
  }
`

function GenerativeOrbs() {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const { viewport } = useThree()
  const { velocity, progress } = useScrollOrchestrator()
  
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uVelocity: { value: 0 },
    uProgress: { value: 0 },
    uColor1: { value: new THREE.Color('#1e40af') }, // Blue
    uColor2: { value: new THREE.Color('#7c3aed') }, // Purple
    uColor3: { value: new THREE.Color('#06b6d4') }, // Cyan
  }), [])
  
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime
      materialRef.current.uniforms.uVelocity.value = THREE.MathUtils.lerp(
        materialRef.current.uniforms.uVelocity.value,
        velocity * 2,
        0.1
      )
      materialRef.current.uniforms.uProgress.value = progress
    }
  })
  
  return (
    <mesh ref={meshRef} scale={[viewport.width * 1.2, viewport.height * 1.2, 1]}>
      <planeGeometry args={[1, 1, 32, 32]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={orbVertexShader}
        fragmentShader={orbFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </mesh>
  )
}

// ═══════════════════════════════════════════════════════════════════
// MAIN DISTORTION CANVAS COMPONENT
// ═══════════════════════════════════════════════════════════════════

interface DistortionCanvasProps {
  /** Video element for scrubbing (optional) */
  videoElement?: HTMLVideoElement
  /** Static texture (optional) */
  texture?: THREE.Texture
  /** Use generative visuals instead of texture/video */
  generative?: boolean
  /** Additional className */
  className?: string
  /** Opacity */
  opacity?: number
}

export function DistortionCanvas({
  videoElement,
  texture,
  generative = true,
  className = '',
  opacity = 1,
}: DistortionCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  return (
    <div 
      className={`absolute inset-0 ${className}`}
      style={{ opacity }}
    >
      <Canvas
        ref={canvasRef}
        gl={{
          antialias: false, // Performance: disable AA
          alpha: true,
          powerPreference: 'high-performance',
          stencil: false,
          depth: false,
        }}
        dpr={[1, 1.5]} // Limit DPR for performance
        camera={{ position: [0, 0, 1], fov: 75 }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          {generative ? (
            <GenerativeOrbs />
          ) : (
            <DistortionPlane texture={texture} videoElement={videoElement} />
          )}
        </Suspense>
      </Canvas>
    </div>
  )
}

export default DistortionCanvas
