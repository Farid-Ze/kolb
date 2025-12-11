# B1-02: Rendering Techniques & Shader Pipeline

**Persona:** Bagus Setiawan (3D Art Direction)  
**Date:** 2025-12-10  
**Focus:** Advanced rendering and visual fidelity techniques

> [!IMPORTANT]
> **Data Classification for This Report**
> 
> | Data Type | Status | Source |
> |-----------|--------|--------|
> | THREE.REVISION: 102 | ✅ **VERIFIED** | Live JS test 2025-12-10 |
> | WebGL 2.0 support | ✅ **VERIFIED** | Live JS test |
> | Max Texture Size: 16384 | ✅ **VERIFIED** | gl.MAX_TEXTURE_SIZE |
> | Post-processing directory | ✅ **VERIFIED** | `/webpack/gl/post-processing/` |
> | Three.js r102 patterns | ✅ **VERIFIED** | Source code |
> | All JavaScript/GLSL code | 🔴 **EXAMPLE PATTERNS** | Standard Three.js techniques |
> | Shadow map sizes | ⚠️ **ASSUMED** | Industry best practice |
> | Particle counts | ⚠️ **PROJECTED** | Visual density analysis |
> 
> **Code examples demonstrate standard techniques—not extracted site code.**

---

## PBR Material Workflow

### Physically Based Rendering Pipeline (Illustrative)

**Material Channels:**

> [!NOTE]
> The following code is an **example reconstruction** of the PBR workflow.

```javascript
const pbrMaterial = {
  baseColor: 'rgb.jpg',        // Albedo/diffuse
  metallic: 'metallic.jpg',    // 0 = dielectric, 1 = metal
  roughness: 'roughness.jpg',  // 0 = mirror, 1 = matte
  normal: 'normal.png',        // Surface detail
  ao: 'ao.jpg',                // Ambient occlusion
  emissive: 'emissive.jpg'     // Self-illumination
};
```

**Implementation:**
```javascript
const material = new THREE.MeshStandardMaterial({
  map: textureLoader.load(pbrMaterial.baseColor),
  metalnessMap: textureLoader.load(pbrMaterial.metallic),
  roughnessMap: textureLoader.load(pbrMaterial.roughness),
  normalMap: textureLoader.load(pbrMaterial.normal),
  aoMap: textureLoader.load(pbrMaterial.ao),
  envMapIntensity: 1.0
});
```

---

## Post-Processing Effects Stack

### EffectComposer Chain (Illustrative)

**From `/webpack/gl/post-processing/` (Reconstructed Logic):**
```javascript
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { FXAAPass } from 'three/examples/jsm/postprocessing/FXAAPass';

const composer = new EffectComposer(renderer);

// Pass 1: Scene render
composer.addPass(new RenderPass(scene, camera));

// Pass 2: Bloom (subtle glow on corn kernels)
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.5,  // strength
  0.4,  // radius
  0.85  // threshold
);
composer.addPass(bloomPass);

// Pass 3: Anti-aliasing
composer.addPass(new FXAAPass());

// Final render
composer.render();
```

---

## Custom Shader Features

### 1. Wind Animation Shader (Illustrative)

**Vertex Displacement (Reconstructed):**
```glsl
// RECONSTRUCTED EXAMPLE: wind-animation.vert
uniform float uTime;
uniform float uWindStrength;
attribute float aWindInfluence; // Per-vertex wind sensitivity

void main() {
  vec3 pos = position;
  
  // Sine wave wind motion
  float windX = sin(uTime * 0.5 + position.x * 0.2) * uWindStrength;
  float windZ = cos(uTime * 0.3 + position.z * 0.3) * uWindStrength;
  
  // Apply only to top portions (stalks/leaves)
  pos.x += windX * aWindInfluence;
  pos.z += windZ * aWindInfluence;
  
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
```

### 2. Subsurface Scattering (Corn Leaves)

**Fragment Shader:**
```glsl
// subsurface.frag
uniform vec3 uLightPos;
uniform vec3 uSubsurfaceColor;
uniform float uThickness;

void main() {
  vec3 normal = normalize(vNormal);
  vec3 lightDir = normalize(uLightPos - vPosition);
  
  // Front lighting
  float NdotL = max(dot(normal, lightDir), 0.0);
  
  // Back lighting (subsurface)
  float backLight = max(dot(-normal, lightDir), 0.0);
  vec3 subsurface = uSubsurfaceColor * backLight * uThickness;
  
  vec3 finalColor = vColor * NdotL + subsurface;
  gl_FragColor = vec4(finalColor, 1.0);
}
```

### 3. Fresnel Rim Lighting

**Edge Glow Effect:**
```glsl
// fresnel.frag
varying vec3 vNormal;
varying vec3 vViewDir;

void main() {
  float fresnel = 1.0 - max(dot(vNormal, vViewDir), 0.0);
  fresnel = pow(fresnel, 3.0); // Adjust falloff
  
  vec3 rimColor = vec3(1.0, 0.95, 0.7) * fresnel * 0.5;
  gl_FragColor = vec4(baseColor + rimColor, 1.0);
}
```

---

## Lighting Techniques

### Dynamic vs Baked Lighting

**Strategy:**
```yaml
Static Elements (soil, background):
  - Baked lightmaps (512x512)
  - Pre-computed AO
  - No real-time shadows

Dynamic Elements (corn, interactive objects):
  - Real-time directional light
  - Shadow mapping (2048x2048)
  - Dynamic reflections
```

**Shadow Configuration:**
```javascript
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
sunLight.shadow.camera.near = 0.5;
sunLight.shadow.camera.far = 500;
sunLight.shadow.bias = -0.0001;

// Soft shadows
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
```

---

## Fog & Atmosphere

### Depth-Based Fog

**Atmospheric Perspective:**
```javascript
// Exponential fog for depth
scene.fog = new THREE.FogExp2(0x87CEEB, 0.0015);

// Or linear fog for more control
scene.fog = new THREE.Fog(
  0x87CEEB,  // Sky blue
  50,        // Near distance
  300        // Far distance
);
```

**Custom Fog Shader:**
```glsl
uniform vec3 uFogColor;
uniform float uFogNear;
uniform float uFogFar;

void main() {
  float depth = gl_FragCoord.z / gl_FragCoord.w;
  float fogFactor = smoothstep(uFogNear, uFogFar, depth);
  
  vec3 finalColor = mix(color, uFogColor, fogFactor);
  gl_FragColor = vec4(finalColor, 1.0);
}
```

---

## Particle Rendering Optimization

### GPU Instancing for Particles (Illustrative)

```javascript
// RECONSTRUCTED EXAMPLE: Efficient particle system using InstancedMesh
const particleGeo = new THREE.SphereGeometry(0.05, 6, 6);
const particleMat = new THREE.MeshBasicMaterial({
  color: 0xFFFFCC,
  transparent: true,
  opacity: 0.7,
  blending: THREE.AdditiveBlending
});

const particles = new THREE.InstancedMesh(
  particleGeo,
  particleMat,
  5000  // Max particles
);

// Update per-instance transforms
const matrix = new THREE.Matrix4();
for (let i = 0; i < 5000; i++) {
  matrix.setPosition(
    positions.x[i],
    positions.y[i],
    positions.z[i]
  );
  particles.setMatrixAt(i, matrix);
}
particles.instanceMatrix.needsUpdate = true;
```

---

## Performance vs Quality Trade-offs

### Quality Presets

**High Quality (Desktop):**
```javascript
{
  shadowMapSize: 2048,
  postProcessing: true,
  particleCount: 5000,
  antialiasing: 'FXAA',
  bloom: true,
  reflections: true
}
```

**Medium Quality (Laptop):**
```javascript
{
  shadowMapSize: 1024,
  postProcessing: true,
  particleCount: 2000,
  antialiasing: 'basic',
  bloom: false,
  reflections: false
}
```

**Low Quality (Mobile):**
```javascript
{
  shadowMapSize: 512,
  postProcessing: false,
  particleCount: 500,
  antialiasing: 'none',
  bloom: false,
  reflections: false
}
```

---

## Recommendations for Zenotika x UNIKOM

### Rendering Pipeline Setup

1. **Start with MeshStandardMaterial**
   - PBR workflow out of the box
   - Good performance
   - WebGL 2.0 required

2. **Add Post-Processing Gradually**
   - Begin with RenderPass only
   - Add bloom for accents
   - FXAA for anti-aliasing
   - Monitor frame rate

3. **Custom Shaders for Hero Moments**
   - Wind animation on key elements
   - Fresnel rim on focal points
   - Keep fragment shaders simple

4. **LOD System**
   ```javascript
   const lod = new THREE.LOD();
   lod.addLevel(highPolyModel, 0);
   lod.addLevel(midPolyModel, 50);
   lod.addLevel(lowPolyModel, 150);
   ```

---

**Status:** ✅ Technical rendering pipeline documented  
**Complexity:** Medium-High (requires GLSL knowledge)
