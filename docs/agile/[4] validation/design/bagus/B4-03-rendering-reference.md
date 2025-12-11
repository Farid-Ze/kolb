# B4-03: Rendering Pipeline Reference

## 📋 METADATA
- **Task ID**: B4-03
- **Persona**: Bagus Setiawan (3D Designer)
- **Sprint**: 4 - Validation & Handoff
- **Status**: ✅ COMPLETED
- **Created**: 2025-12-11
- **Dependencies**: B3-02, B3-03, A4-01

---

## 🎯 OBJECTIVE

Provide a quick reference guide for the WebGL rendering pipeline used in Zenotika projects.

---

## 🖼️ RENDERING PIPELINE REFERENCE

### 1. Pipeline Overview

```
INPUT → PROCESSING → OUTPUT

┌─────────────────────────────────────────────────────────────┐
│                    RENDERING PIPELINE                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐              │
│  │  Scene   │ → │  Render  │ → │   Post   │ → Display     │
│  │  Setup   │    │   Pass   │    │ Process  │              │
│  └──────────┘    └──────────┘    └──────────┘              │
│                                                             │
│  • Load assets   • Frustum cull  • Bloom                   │
│  • Setup lights  • Draw calls    • Color grade             │
│  • Configure     • Shadow maps   • Anti-alias              │
│    camera        • PBR shading   • Output                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2. Render Passes

#### Standard Pass Order

| Pass | Purpose | Tier 1 | Tier 2 | Tier 3 |
|------|---------|--------|--------|--------|
| 1. Shadow | Shadow maps | ✅ | ✅ | ❌ |
| 2. Depth | Depth buffer | ✅ | ✅ | ✅ |
| 3. Color | Main render | ✅ | ✅ | ✅ |
| 4. Bloom | Glow effect | ✅ | Optional | ❌ |
| 5. FXAA | Anti-aliasing | ✅ | ✅ | ❌ |
| 6. Output | Final composite | ✅ | ✅ | ✅ |

#### Pass Configuration

```typescript
// ILLUSTRATIVE EXAMPLE - Render Pipeline Setup
interface RenderPassConfig {
  shadows: {
    enabled: boolean;
    mapSize: number;
    type: 'basic' | 'pcf' | 'pcfsoft';
  };
  postProcessing: {
    bloom: boolean;
    bloomStrength: number;
    fxaa: boolean;
    colorCorrection: boolean;
  };
  output: {
    toneMapping: boolean;
    toneMappingExposure: number;
    colorSpace: 'srgb' | 'linear';
  };
}

const TIER_CONFIGS: Record<number, RenderPassConfig> = {
  1: {
    shadows: { enabled: true, mapSize: 2048, type: 'pcfsoft' },
    postProcessing: { bloom: true, bloomStrength: 0.5, fxaa: true, colorCorrection: true },
    output: { toneMapping: true, toneMappingExposure: 1.0, colorSpace: 'srgb' }
  },
  2: {
    shadows: { enabled: true, mapSize: 1024, type: 'pcf' },
    postProcessing: { bloom: false, bloomStrength: 0, fxaa: true, colorCorrection: true },
    output: { toneMapping: true, toneMappingExposure: 1.0, colorSpace: 'srgb' }
  },
  3: {
    shadows: { enabled: false, mapSize: 0, type: 'basic' },
    postProcessing: { bloom: false, bloomStrength: 0, fxaa: false, colorCorrection: false },
    output: { toneMapping: false, toneMappingExposure: 1.0, colorSpace: 'srgb' }
  }
};
```

### 3. Material Pipeline

#### PBR Workflow

```
PHYSICALLY BASED RENDERING
├── Inputs
│   ├── Base Color (RGB, sRGB)
│   ├── Metallic (Grayscale, Linear)
│   ├── Roughness (Grayscale, Linear)
│   ├── Normal (RGB, Linear)
│   ├── AO (Grayscale, Linear)
│   └── Emissive (RGB, sRGB)
│
├── Lighting
│   ├── Direct (Sun, Point, Spot)
│   ├── Indirect (Environment Map)
│   └── Shadows (Shadow Maps)
│
└── Output
    └── Final Color (tonemapped, sRGB)
```

#### Shader Complexity by Tier

| Feature | Tier 1 | Tier 2 | Tier 3 |
|---------|--------|--------|--------|
| PBR | Full | Full | Basic |
| Normal maps | Yes | Yes | No |
| AO maps | Yes | Optional | No |
| Emissive | Yes | Yes | Simple |
| Environment | HDR | LDR | None |
| Reflections | Real-time | Baked | None |

### 4. Lighting Setup

#### Recommended Light Configuration

```
SCENE LIGHTING TEMPLATE
├── Key Light (Directional)
│   ├── Intensity: 1.0
│   ├── Color: #FFFAF0 (warm white)
│   ├── Shadow: Yes (Tier 1-2)
│   └── Position: 45° elevation, 30° azimuth
│
├── Fill Light (Ambient/Hemisphere)
│   ├── Intensity: 0.3
│   ├── Sky: #87CEEB
│   └── Ground: #8B4513
│
├── Rim Light (Point/Spot) - Optional
│   ├── Intensity: 0.5
│   ├── Color: #E0FFFF
│   └── Position: Behind subject
│
└── Environment Map
    ├── Type: HDR (Tier 1) / LDR (Tier 2)
    ├── Intensity: 0.5
    └── Blur: 0.0 (sharp reflections)
```

### 5. Post-Processing Effects

#### Effect Parameters

| Effect | Parameter | Tier 1 | Tier 2 |
|--------|-----------|--------|--------|
| **Bloom** | Strength | 0.3-0.7 | N/A |
| | Threshold | 0.8 | N/A |
| | Radius | 0.4 | N/A |
| **FXAA** | Quality | High | Medium |
| **Tone Map** | Type | ACES | Reinhard |
| | Exposure | 1.0 | 1.0 |
| **Vignette** | Intensity | 0.2 | 0.1 |

#### Effect Chain

```typescript
// ILLUSTRATIVE EXAMPLE - Post-processing chain
const effectChain = [
  // 1. Render scene to texture
  new RenderPass(scene, camera),
  
  // 2. Extract bright areas (Tier 1 only)
  tier === 1 ? new UnrealBloomPass(resolution, 0.5, 0.4, 0.85) : null,
  
  // 3. Apply FXAA (Tier 1-2)
  tier <= 2 ? new ShaderPass(FXAAShader) : null,
  
  // 4. Tone mapping & color correction
  new ShaderPass(ColorCorrectionShader),
  
  // 5. Output to screen
  new OutputPass()
].filter(Boolean);
```

### 6. Performance Optimization

#### Draw Call Optimization

| Technique | Description | Impact |
|-----------|-------------|--------|
| Batching | Combine similar meshes | -50% draw calls |
| Instancing | Same mesh, different transforms | -80% for repeated objects |
| Frustum Culling | Skip off-screen objects | -20-40% typically |
| LOD | Distance-based detail | -30% at distance |

#### Memory Management

| Resource | Load Strategy | Disposal |
|----------|---------------|----------|
| Textures | Progressive | On scene exit |
| Geometries | Cached | On scene exit |
| Materials | Shared | On application exit |
| Render Targets | Reused | Per frame |

### 7. Quick Reference Card

#### Renderer Settings

```javascript
// Recommended Three.js renderer settings
const renderer = new THREE.WebGLRenderer({
  antialias: devicePixelRatio === 1, // Only for 1x displays
  powerPreference: 'high-performance',
  stencil: false,  // Disable if not needed
  depth: true
});

renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
```

#### Common Material Settings

```javascript
// Standard PBR material
const material = new THREE.MeshStandardMaterial({
  map: diffuseTexture,
  normalMap: normalTexture,
  roughnessMap: roughnessTexture,
  metalnessMap: metalnessTexture,
  aoMap: aoTexture,
  envMap: environmentMap,
  envMapIntensity: 0.5
});
```

---

## 📊 PIPELINE DECISION TREE

```
START
  │
  ├─ Check Device Tier
  │   │
  │   ├─ Tier 1 → Full Pipeline
  │   │   └─ Shadows + Bloom + FXAA + PBR
  │   │
  │   ├─ Tier 2 → Standard Pipeline
  │   │   └─ Shadows + FXAA + PBR
  │   │
  │   ├─ Tier 3 → Basic Pipeline
  │   │   └─ Basic shading only
  │   │
  │   └─ Tier 4 → No WebGL
  │       └─ Static images
  │
  └─ END
```

---

## 📚 CROSS-REFERENCES

| Document | Content |
|----------|---------|
| B4-01 | 3D production standards |
| B4-02 | Asset quality checklist |
| A4-01 | WebGL architecture |
| K4-01 | Performance requirements |

---

## 📊 DATA CLASSIFICATION

| Data Type | Classification | Source |
|-----------|----------------|--------|
| Pipeline architecture | ✅ VERIFIED | Three.js documentation |
| PBR workflow | ✅ VERIFIED | Khronos glTF spec |
| Performance settings | ✅ VERIFIED | Industry benchmarks |

---

**Document Status**: ✅ COMPLETED  
**Last Updated**: 2025-12-11  
**Owner**: Bagus Setiawan (3D Designer)
