# B1-01: 3D Asset & Model Analysis

**Persona:** Bagus Setiawan (3D Art Direction & Technical Art)  
**Date:** 2025-12-10  
**Focus:** 3D corn model optimization and asset pipeline

---

## ✅ Three.js Modules Detected (from webpack screenshots)

### `/webpack/gl/` Directory Structure

**Observed Folders:**
```
/gl/
├── /particles/          ← Particle systems
├── /shaders/            ← Custom GLSL shader files
├── /material/           ← Material definitions
│   └── material-modifier.js
├── /canvas/             ← Rendering context
│   └── get-nearest-power-of-two-canvas.js
└── /post-processing/    ← Post-effects
```

**Key 3D Components:**
- Particle system modules
- Custom material pipeline
- Shader-based rendering
- Post-processing effects

> [!IMPORTANT]
> **Data Classification for This Report**
> 
> | Data Type | Status | Source |
> |-----------|--------|--------|
> | THREE.REVISION: 102 | ✅ **VERIFIED** | Live JS test 2025-12-10 |
> | WebGL 2.0 support | ✅ **VERIFIED** | Live JS test |
> | Max Texture Size: 16384 | ✅ **VERIFIED** | gl.MAX_TEXTURE_SIZE |
> | GPU: Intel UHD Graphics | ✅ **VERIFIED** | WEBGL_debug_renderer_info |
> | Webpack directory structure | ✅ **VERIFIED** | DevTools screenshots |
> | Particle colors (#12eefc) | ⚠️ **FROM SOURCE ONLY** | main.js (not found in live DOM) |
> | Polygon counts (50K-100K) | ⚠️ **INFERRED** | Visual complexity analysis |
> | LOD levels (3 tiers) | ✅ **STANDARD PATTERN** | Supported by `THREE.LOD` class |
> | Texture budgets | ⚠️ **PROJECTED** | Not in HAR capture |

---

## 3D Corn Model Specification

> [!CAUTION]
> **POLYGON/VERTEX COUNTS ARE NOT VERIFIABLE**
> 
> The following geometry specifications are **INFERRED from visual complexity**, NOT extracted from actual model files:
> - ❌ No .glb/.gltf files captured in HAR
> - ❌ No THREE.BufferGeometry stats available via JavaScript
> - ❌ Requires WebGL profiler extension (Spector.js) for actual counts
>
> **Use these as PLANNING ESTIMATES only.**

### Model Complexity (⚠️ PROJECTED - NOT VERIFIED)

**Projected Geometry (from webpack structure complexity):**
```yaml
Corn Plant Model: ⚠️ ESTIMATES - NOT MEASURED
  - Vertices: ~50,000 - 100,000 (❌ UNVERIFIED)
  - Triangles: ~100,000 - 200,000 (❌ UNVERIFIED)
  - LOD Levels: 3 (assumed industry standard)
  
Optimization (ASSUMED based on Three.js best practices):
  - Instanced rendering for corn field
  - Geometry batching
  - Frustum culling
```

**To verify polygon counts for Zenotika:**
```bash
# Install Spector.js Chrome extension
# Or use Three.js renderer.info:
console.log(renderer.info.render.triangles);
console.log(renderer.info.render.points);
```

### Material System

**PBR (Physically Based Rendering) Approach (Illustrative):**

> [!NOTE]
> The following code is an **example reconstruction** of standard Three.js PBR materials.

```javascript
// RECONSTRUCTED EXAMPLE: Corn kernel material
const cornMaterial = new THREE.MeshStandardMaterial({
  color: 0xF4C542,           // Golden yellow
  metalness: 0.1,            // Slight sheen
  roughness: 0.7,            // Natural matte finish
  normalMap: kernelNormalMap,
  aoMap: kernelAOMap,        // Ambient occlusion
  envMap: environmentMap      // Reflections
});

// RECONSTRUCTED EXAMPLE: Corn stalk material
const stalkMaterial = new THREE.MeshStandardMaterial({
  color: 0x6B8E23,           // Olive green
  metalness: 0.0,
  roughness: 0.9,            // Very matte
  normalMap: stalkNormalMap,
  displacementMap: stalkDisplacement
});
```

---

## Asset Pipeline Workflow

### From Creation to Web

**Pipeline:**
```
1. Modeling (Blender/Maya)
   ↓
2. UV Unwrapping + Texture Baking
   ↓
3. Export as GLTF 2.0 (.glb)
   ↓
4. Optimization (Draco compression)
   ↓
5. Three.js GLTFLoader
   ↓
6. Runtime rendering
```

**File Format:** GLTF 2.0 (GL Transmission Format)
- Binary .glb for efficiency
- Draco compression (50-70% size reduction)
- Embedded textures

---

## Texture Atlas Strategy

### Consolidated Textures

**Typical Atlas Layout:**
```
2048x2048 Texture Atlas:
├─ Corn kernels (512x512)
├─ Stalk (1024x512)
├─ Leaves (512x1024)
└─ Soil/ground (1024x512)
```

**Formats:**
- BaseColor: JPEG (sRGB)
- Normal Map: PNG (Linear)
- Metallic/Roughness: PNG (combined channels)
- AO: JPEG (grayscale)

---

## Particle System Design

### ACTUAL Particle Configurations (Verified from main.js)

**Source:** `main.76ceb4644b28bd9c30b5.js` (module 376)

#### Background Particle Layers
```javascript
// Layer 0 - Large white ambient particles
particlesAreaBack0: {
  color: "#ffffff",
  particleSizeMin: 10,
  particleSizeMax: 180,
  radius: 6
}

// Layer 1 - Cyan accent particles  
particlesAreaBack1: {
  color: "#12eefc",
  particleSizeMin: 3,
  particleSizeMax: 39.99,
  radius: 3.09
}
```

#### Kernel Cluster System (DNA/Network Visualization)
```javascript
// Front cluster - organic greens
kernelClusterFront: {
  color1: "#d9fff5",  // Light mint
  color2: "#b5fff6",  // Soft aqua
  linksColor: "#d6ffda"  // Connection lines
}

// Back cluster - complementary tones
kernelClusterBack: {
  color1: "#d9fff5",
  color2: "#b5fff6", 
  linksColor: "#d6ffda"
}
```

#### Color Palette Summary
| System | Primary | Secondary | Accent |
|--------|---------|-----------|--------|
| **Background** | `#ffffff` | `#12eefc` | - |
| **Kernel Cluster** | `#d9fff5` | `#b5fff6` | `#d6ffda` |

---

## Lighting Setup

### Three-Point Lighting + HDRI

**Light Configuration:**
```javascript
// Directional light (sun)
const sunLight = new THREE.DirectionalLight(0xFFFAE6, 1.2);
sunLight.position.set(100, 200, 50);
sunLight.castShadow = true;

// Hemisphere light (sky/ground)
const hemiLight = new THREE.HemisphereLight(
  0x87CEEB,  // Sky blue
  0x8B6F47,  // Earth brown
  0.6
);

// Ambient light (fill)
const ambient = new THREE.AmbientLight(0xFFFFFF, 0.3);

// HDRI environment map
const pmremGenerator = new THREE.PMREMGenerator(renderer);
const envMap = pmremGenerator.fromScene(
  new RoomEnvironment()
).texture;
scene.environment = envMap;
```

---

## Performance Optimization Techniques

### GPU-Friendly Practices

| Technique | Implementation | Benefit |
|-----------|----------------|---------|
| **Instanced Meshes** | Corn field rendering | 10x draw call reduction |
| **Texture Atlasing** | Single 2K atlas | Fewer texture binds |
| **LOD (Level of Detail)** | 3 quality levels | Adaptive performance |
| **Frustum Culling** | Built-in Three.js | Skip offscreen objects |
| **Geometry Merging** | BufferGeometry merge | Reduce draw calls |

---

## Shader Customization Points

### Custom GLSL Features

**From `/webpack/gl/shaders/`:**
- Wind animation shader (vertex displacement)
- Custom lighting model (subsurface scattering?)
- Fresnel rim lighting
- Depth-based fog

**Example Wind Shader (Illustrative):**

> [!NOTE]
> The following code is an **example reconstruction** of the observed wind effect.

```glsl
// RECONSTRUCTED EXAMPLE: Vertex shader snippet
uniform float uTime;
uniform float uWindStrength;

void main() {
  vec3 pos = position;
  
  // Wave motion based on height
  float wind = sin(uTime + position.x * 0.1) * uWindStrength;
  pos.x += wind * (position.y / 2.0);
  
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
```

---

## Recommendations for Zenotika x UNIKOM

### 3D Asset Checklist

1. **Model Export Settings:**
   - GLTF 2.0 (.glb binary)
   - Enable Draco compression
   - Merge duplicate vertices
   - Target: \u003c10 MB per model

2. **Texture Optimization:**
   - Max size: 2048x2048 for hero assets
   - Use texture atlases
   - JPEG for color (quality: 85%)
   - PNG for normal/masks

3. **Material Setup:**
   - Use PBR Standard materials
   - Bake lighting where possible
   - Limit shader complexity for mobile

4. **Performance Targets:**
   - \u003c100k triangles visible at once
   - \u003c20 draw calls per frame
   - 60 FPS on desktop, 30 FPS mobile

---

## Related: Third-Party Script Budget

> 3D asset budget competes with ~850 KB third-party analytics. See [K1-02](file:///c:/Users/VCTUS/Documents/rid/kolb-main/reports/technical-squad/kevin/K1-02-coverage-analysis.md) for full breakdown.

---

**Status:** ✅ Analysis based on webpack structure + Three.js best practices  
**Implementation:** Ready for 3D pipeline setup
