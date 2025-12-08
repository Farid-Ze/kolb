---
name: webgl-shaders
description: |
  GLSL shader development for Zenotika immersive experience. 
  Covers vertex/fragment shaders, noise functions, post-processing. 
  Use when writing or modifying shader code.
---

# WebGL Shader Development

## Shader File Locations

```
src/lib/three/shaders/
├── logo.vert.glsl       # Logo vertex shader
├── logo.frag.glsl       # Logo fragment shader
├── particle.vert.glsl   # Particle vertex
├── particle.frag.glsl   # Particle fragment
├── grid.vert.glsl       # Kolb grid vertex
├── grid.frag.glsl       # Kolb grid fragment
└── postprocess/
    ├── frost.glsl       # Frost overlay effect
    ├── chromatic.glsl   # Chromatic aberration
    └── dataMask.glsl    # Data reveal transition
```

## Common Uniforms

```glsl
// Time & Animation
uniform float uTime;
uniform float uDelta;

// Scroll State
uniform float uScrollProgress;    // 0-1
uniform float uScrollVelocity;    // pixels/second

// Colors (from design system)
uniform vec3 uColorDeep;          // #1A2332
uniform vec3 uColorSurface;       // #A8CADF
uniform vec3 uColorNeon;          // #00D4FF

// Textures
uniform sampler2D uNoiseTexture;
uniform sampler2D uNormalMap;
```

## Noise Functions

### Simplex Noise 3D

```glsl
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  // Full implementation in logo.vert.glsl
}
```

### Fractal Brownian Motion

```glsl
float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;
  
  for (int i = 0; i < 5; i++) {
    value += amplitude * snoise(vec3(p * frequency, 0.0));
    amplitude *= 0.5;
    frequency *= 2.0;
  }
  
  return value;
}
```

## Velocity-Responsive Patterns

```glsl
// Normalize velocity (0-1 range)
float velocityNorm = smoothstep(0.0, 800.0, uScrollVelocity);

// igloo.inc (calm) vs Citrix (velocity) blend
float iglooInfluence = 1.0 - velocityNorm;
float citrixInfluence = velocityNorm;

// Apply to effects
float displacement = baseDisplacement * (1.0 + velocityNorm * 0.5);
float neonIntensity = velocityNorm * 0.8;
float frostAmount = 0.15 * iglooInfluence;
```

## Fresnel Effect

```glsl
float fresnel(vec3 viewDir, vec3 normal, float power) {
  return pow(1.0 - max(dot(viewDir, normal), 0.0), power);
}

// Usage for rim lighting
vec3 viewDir = normalize(cameraPosition - vWorldPosition);
float rim = fresnel(viewDir, vNormal, 3.0);
color += rimColor * rim;
```

## Post-Processing Pass Template

```glsl
// Vertex (fullscreen quad)
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}

// Fragment
uniform sampler2D tDiffuse;
uniform float uIntensity;
varying vec2 vUv;

void main() {
  vec4 color = texture2D(tDiffuse, vUv);
  
  // Apply effect
  // ... 
  
  gl_FragColor = color;
}
```

## Debugging Shaders

```glsl
// Visualize normals
gl_FragColor = vec4(vNormal * 0.5 + 0.5, 1.0);

// Visualize UVs
gl_FragColor = vec4(vUv, 0.0, 1.0);

// Visualize depth
float depth = gl_FragCoord.z;
gl_FragColor = vec4(vec3(depth), 1.0);

// Visualize specific uniform
gl_FragColor = vec4(vec3(uScrollVelocity / 1000.0), 1.0);
```
