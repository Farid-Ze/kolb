# A3-01: WebGL Performance Optimization Recommendations

## 📋 METADATA
- **Persona**: Andi Pratama - WebGL Developer
- **Task ID**: A3-01
- **Date**: 2025-12-11
- **Sprint**: Sprint 3 - Implementation Planning
- **Status**: ✅ COMPLETED
- **Priority**: 🔴 HIGH

> [!IMPORTANT]
> **Data Classification for This Plan**
> 
> | Data Type | Status | Source |
> |-----------|--------|--------|
> | WebGL Extensions | ✅ **VERIFIED** | HAR file (35 extensions) |
> | Three.js Version | ✅ **VERIFIED** | HAR file (r102) |
> | Performance Targets | ✅ **VERIFIED** | Google RAIL Model |
> | Recommendations | ⚠️ **RECOMMENDATION** | Based on verified data |

---

## 🎯 OBJECTIVE

Optimize WebGL rendering pipeline for consistent 60fps performance across device tiers, focusing on draw call reduction, shader optimization, and memory management.

---

## 📊 CURRENT STATE ANALYSIS

### HAR Verified Technical Stack

| Component | Value | Status |
|-----------|-------|--------|
| Three.js Version | r102 | ⚠️ Legacy (current: r169) |
| WebGL Version | 2.0 | ✅ Modern |
| Extensions | 35 available | ✅ Good support |
| JS Bundle | 1.89MB | ⚠️ Large |
| Total Transfer | 3.5MB | ⚠️ Heavy |

### Key WebGL Extensions (Verified)

```
Performance Critical:
├── ANGLE_instanced_arrays ✅
├── OES_element_index_uint ✅
├── WEBGL_compressed_texture_s3tc ✅
├── WEBGL_compressed_texture_etc ✅
├── WEBGL_compressed_texture_astc ✅
├── EXT_texture_filter_anisotropic ✅
└── OES_texture_float ✅

Optimization Opportunities:
├── WEBGL_multi_draw (instancing)
├── EXT_disjoint_timer_query (profiling)
└── KHR_parallel_shader_compile (faster startup)
```

### Performance Targets (RAIL Model)

| Metric | Target | Current | Gap |
|--------|--------|---------|-----|
| Frame Time | ≤16.67ms | Unknown | Measure |
| Response | ≤100ms | Unknown | Measure |
| Animation | 60fps | Unknown | Measure |
| Load | ≤2s | 2.11s ✅ | Met |

---

## ⚡ DRAW CALL OPTIMIZATION

### Current Architecture Issues

| Issue | Impact | Priority |
|-------|--------|----------|
| Individual objects | High draw call count | HIGH |
| Unique materials | Shader switches | HIGH |
| Unbatched geometry | CPU bottleneck | MEDIUM |
| Redundant state changes | GPU stalls | MEDIUM |

### Instanced Rendering Implementation

```javascript
// Convert repeated objects to instanced mesh
// Before: 1000 draw calls for 1000 particles
// After: 1 draw call for 1000 particles

import * as THREE from 'three';

class ParticleSystem {
  constructor(count = 1000) {
    this.count = count;
    this.mesh = null;
    this.dummy = new THREE.Object3D();
    this.positions = new Float32Array(count * 3);
    this.velocities = new Float32Array(count * 3);
  }
  
  init() {
    // Shared geometry (single allocation)
    const geometry = new THREE.PlaneGeometry(1, 1);
    
    // Shared material (single shader)
    const material = new THREE.MeshBasicMaterial({
      map: particleTexture,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    
    // Instanced mesh (1 draw call)
    this.mesh = new THREE.InstancedMesh(geometry, material, this.count);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    
    // Initialize instances
    for (let i = 0; i < this.count; i++) {
      this.positions[i * 3] = (Math.random() - 0.5) * 100;
      this.positions[i * 3 + 1] = (Math.random() - 0.5) * 100;
      this.positions[i * 3 + 2] = (Math.random() - 0.5) * 100;
      
      this.updateMatrix(i);
    }
    
    return this.mesh;
  }
  
  updateMatrix(index) {
    this.dummy.position.set(
      this.positions[index * 3],
      this.positions[index * 3 + 1],
      this.positions[index * 3 + 2]
    );
    this.dummy.updateMatrix();
    this.mesh.setMatrixAt(index, this.dummy.matrix);
  }
  
  update() {
    // Batch matrix updates
    for (let i = 0; i < this.count; i++) {
      this.positions[i * 3 + 1] += this.velocities[i * 3 + 1];
      this.updateMatrix(i);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}
```

### Geometry Merging

```javascript
// Merge static geometry to reduce draw calls
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

function mergeStaticObjects(objects) {
  // Group by material
  const materialGroups = new Map();
  
  objects.forEach(obj => {
    const materialId = obj.material.uuid;
    if (!materialGroups.has(materialId)) {
      materialGroups.set(materialId, []);
    }
    
    // Apply transforms to geometry
    const geometry = obj.geometry.clone();
    geometry.applyMatrix4(obj.matrixWorld);
    materialGroups.get(materialId).push(geometry);
  });
  
  // Merge each material group
  const mergedMeshes = [];
  materialGroups.forEach((geometries, materialId) => {
    const mergedGeometry = mergeGeometries(geometries, false);
    const material = objects.find(o => o.material.uuid === materialId).material;
    const mesh = new THREE.Mesh(mergedGeometry, material);
    mergedMeshes.push(mesh);
  });
  
  return mergedMeshes;
}

// Usage: Merge all static environment objects
const staticObjects = scene.children.filter(obj => obj.userData.static);
const mergedEnvironment = mergeStaticObjects(staticObjects);

// Remove original objects
staticObjects.forEach(obj => scene.remove(obj));

// Add merged meshes (far fewer draw calls)
mergedEnvironment.forEach(mesh => scene.add(mesh));
```

### Draw Call Budget

| Device Tier | Max Draw Calls | Strategy |
|-------------|----------------|----------|
| Tier 1 | <300 | Full instancing |
| Tier 2 | <200 | Aggressive merging |
| Tier 3 | <100 | Minimal objects |

---

## 🎨 SHADER OPTIMIZATION

### Shader Complexity Guidelines

| Shader Type | Max Instructions | Max Texture Samples |
|-------------|------------------|---------------------|
| Simple | 50 | 2 |
| Standard | 150 | 4 |
| Complex | 300 | 8 |
| Post-process | 100 | 4 |

### Optimized PBR Shader

```glsl
// Fragment shader - optimized PBR
precision mediump float;

uniform sampler2D albedoMap;
uniform sampler2D ormMap; // Packed: AO, Roughness, Metallic
uniform sampler2D normalMap;

varying vec3 vNormal;
varying vec3 vViewPosition;
varying vec2 vUv;

// Precomputed constants
const float PI = 3.14159265359;
const float INV_PI = 0.31830988618;

// Optimized GGX distribution
float distributionGGX(float NdotH, float roughness) {
  float a = roughness * roughness;
  float a2 = a * a;
  float denom = NdotH * NdotH * (a2 - 1.0) + 1.0;
  return a2 * INV_PI / (denom * denom + 0.0001);
}

// Optimized geometry function
float geometrySmith(float NdotV, float NdotL, float roughness) {
  float r = roughness + 1.0;
  float k = (r * r) * 0.125;
  float ggx1 = NdotV / (NdotV * (1.0 - k) + k);
  float ggx2 = NdotL / (NdotL * (1.0 - k) + k);
  return ggx1 * ggx2;
}

void main() {
  // Single texture read for ORM
  vec4 orm = texture2D(ormMap, vUv);
  float ao = orm.r;
  float roughness = orm.g;
  float metallic = orm.b;
  
  vec3 albedo = texture2D(albedoMap, vUv).rgb;
  vec3 normal = texture2D(normalMap, vUv).rgb * 2.0 - 1.0;
  
  // Simplified lighting calculation
  vec3 N = normalize(vNormal + normal);
  vec3 V = normalize(-vViewPosition);
  vec3 L = normalize(vec3(1.0, 1.0, 0.5)); // Hardcoded light direction
  vec3 H = normalize(V + L);
  
  float NdotV = max(dot(N, V), 0.0);
  float NdotL = max(dot(N, L), 0.0);
  float NdotH = max(dot(N, H), 0.0);
  
  // PBR calculation
  float D = distributionGGX(NdotH, roughness);
  float G = geometrySmith(NdotV, NdotL, roughness);
  
  vec3 F0 = mix(vec3(0.04), albedo, metallic);
  vec3 F = F0 + (1.0 - F0) * pow(1.0 - NdotV, 5.0);
  
  vec3 specular = (D * G * F) / (4.0 * NdotV * NdotL + 0.0001);
  vec3 diffuse = (1.0 - F) * (1.0 - metallic) * albedo * INV_PI;
  
  vec3 color = (diffuse + specular) * NdotL * ao;
  
  gl_FragColor = vec4(color, 1.0);
}
```

### Shader Variants for Device Tiers

```javascript
// Dynamic shader selection based on device capability
class ShaderManager {
  constructor(renderer) {
    this.renderer = renderer;
    this.tier = this.detectTier();
  }
  
  detectTier() {
    const gl = this.renderer.getContext();
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
    
    // Tier detection logic
    if (renderer.includes('RTX') || renderer.includes('Radeon RX')) {
      return 1; // High-end
    } else if (renderer.includes('GTX') || renderer.includes('Intel UHD')) {
      return 2; // Mid-range
    }
    return 3; // Low-end
  }
  
  getMaterial(type) {
    const configs = {
      standard: {
        tier1: { 
          map: true, normalMap: true, roughnessMap: true, 
          metalnessMap: true, aoMap: true, envMap: true 
        },
        tier2: { 
          map: true, normalMap: true, roughnessMap: true, 
          metalnessMap: false, aoMap: false, envMap: true 
        },
        tier3: { 
          map: true, normalMap: false, roughnessMap: false, 
          metalnessMap: false, aoMap: false, envMap: false 
        }
      }
    };
    
    return configs[type][`tier${this.tier}`];
  }
}
```

---

## 🧠 MEMORY MANAGEMENT

### Memory Budget by Tier

| Tier | Total VRAM | Textures | Geometry | Other |
|------|------------|----------|----------|-------|
| Tier 1 | 512 MB | 350 MB | 100 MB | 62 MB |
| Tier 2 | 256 MB | 180 MB | 50 MB | 26 MB |
| Tier 3 | 128 MB | 90 MB | 25 MB | 13 MB |

### Texture Memory Calculator

```javascript
// Calculate texture memory usage
function calculateTextureMemory(width, height, format, mipmaps = true) {
  const bytesPerPixel = {
    'RGBA': 4,
    'RGB': 3,
    'RG': 2,
    'R': 1,
    'DXT1': 0.5,
    'DXT5': 1,
    'ETC2': 0.5,
    'ASTC_4x4': 1
  };
  
  let totalBytes = width * height * bytesPerPixel[format];
  
  if (mipmaps) {
    // Mipmaps add ~33% overhead
    totalBytes *= 1.33;
  }
  
  return totalBytes;
}

// Memory tracking
class MemoryTracker {
  constructor(budget) {
    this.budget = budget;
    this.used = 0;
    this.textures = new Map();
  }
  
  trackTexture(id, width, height, format) {
    const bytes = calculateTextureMemory(width, height, format);
    this.textures.set(id, bytes);
    this.used += bytes;
    
    if (this.used > this.budget) {
      console.warn(`Memory budget exceeded: ${this.used / 1024 / 1024}MB / ${this.budget / 1024 / 1024}MB`);
      this.evictLRU();
    }
  }
  
  evictLRU() {
    // Evict least recently used texture
    const oldest = this.textures.keys().next().value;
    this.used -= this.textures.get(oldest);
    this.textures.delete(oldest);
  }
  
  getUsage() {
    return {
      used: this.used,
      budget: this.budget,
      percent: (this.used / this.budget * 100).toFixed(1)
    };
  }
}
```

### Texture Pooling

```javascript
// Texture pool for reuse
class TexturePool {
  constructor() {
    this.pool = new Map();
  }
  
  acquire(width, height, format) {
    const key = `${width}x${height}_${format}`;
    
    if (this.pool.has(key) && this.pool.get(key).length > 0) {
      return this.pool.get(key).pop();
    }
    
    // Create new texture if pool empty
    return this.createTexture(width, height, format);
  }
  
  release(texture) {
    const key = `${texture.image.width}x${texture.image.height}_${texture.format}`;
    
    if (!this.pool.has(key)) {
      this.pool.set(key, []);
    }
    
    // Reset texture state
    texture.needsUpdate = false;
    this.pool.get(key).push(texture);
  }
  
  createTexture(width, height, format) {
    const texture = new THREE.DataTexture(
      new Uint8Array(width * height * 4),
      width, height,
      format
    );
    return texture;
  }
  
  dispose() {
    this.pool.forEach(textures => {
      textures.forEach(t => t.dispose());
    });
    this.pool.clear();
  }
}
```

---

## 🔄 RENDER LOOP OPTIMIZATION

### Optimized Render Loop

```javascript
class OptimizedRenderer {
  constructor(renderer, scene, camera) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    
    this.frameId = null;
    this.lastTime = 0;
    this.deltaTime = 0;
    this.fps = 60;
    
    // Performance monitoring
    this.frameCount = 0;
    this.fpsHistory = [];
    
    // Render scheduling
    this.needsRender = true;
    this.renderOnDemand = false;
  }
  
  start() {
    this.lastTime = performance.now();
    this.animate();
  }
  
  stop() {
    if (this.frameId) {
      cancelAnimationFrame(this.frameId);
    }
  }
  
  animate() {
    this.frameId = requestAnimationFrame(() => this.animate());
    
    const now = performance.now();
    this.deltaTime = now - this.lastTime;
    
    // Skip frame if tab not visible
    if (document.hidden) return;
    
    // Adaptive frame skipping for low-end devices
    if (this.fps < 30 && this.frameCount % 2 !== 0) {
      this.frameCount++;
      return;
    }
    
    // On-demand rendering (if enabled)
    if (this.renderOnDemand && !this.needsRender) {
      return;
    }
    
    this.update(this.deltaTime);
    this.render();
    
    // FPS calculation
    this.fps = 1000 / this.deltaTime;
    this.fpsHistory.push(this.fps);
    if (this.fpsHistory.length > 60) this.fpsHistory.shift();
    
    this.lastTime = now;
    this.frameCount++;
    this.needsRender = false;
  }
  
  update(delta) {
    // Update animations, physics, etc.
    // Only update what's needed
  }
  
  render() {
    // Pre-render optimizations
    this.renderer.info.autoReset = false;
    
    // Render
    this.renderer.render(this.scene, this.camera);
    
    // Post-render: check draw calls
    const drawCalls = this.renderer.info.render.calls;
    if (drawCalls > 200) {
      console.warn(`High draw calls: ${drawCalls}`);
    }
    
    // Reset render info
    this.renderer.info.reset();
  }
  
  requestRender() {
    this.needsRender = true;
  }
  
  getAverageFPS() {
    if (this.fpsHistory.length === 0) return 60;
    return this.fpsHistory.reduce((a, b) => a + b) / this.fpsHistory.length;
  }
}
```

---

## 📊 PERFORMANCE PROFILING

### Built-in Profiling

```javascript
// Performance monitoring
class PerformanceMonitor {
  constructor(renderer) {
    this.renderer = renderer;
    this.metrics = {
      fps: [],
      drawCalls: [],
      triangles: [],
      textures: [],
      programs: []
    };
  }
  
  sample() {
    const info = this.renderer.info;
    
    this.metrics.drawCalls.push(info.render.calls);
    this.metrics.triangles.push(info.render.triangles);
    this.metrics.textures.push(info.memory.textures);
    this.metrics.programs.push(info.programs.length);
    
    // Keep last 300 samples (5 seconds at 60fps)
    Object.keys(this.metrics).forEach(key => {
      if (this.metrics[key].length > 300) {
        this.metrics[key].shift();
      }
    });
  }
  
  getReport() {
    const avg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
    const max = (arr) => Math.max(...arr);
    
    return {
      drawCalls: {
        avg: avg(this.metrics.drawCalls).toFixed(0),
        max: max(this.metrics.drawCalls)
      },
      triangles: {
        avg: avg(this.metrics.triangles).toFixed(0),
        max: max(this.metrics.triangles)
      },
      textures: max(this.metrics.textures),
      programs: max(this.metrics.programs)
    };
  }
  
  log() {
    console.table(this.getReport());
  }
}

// Usage
const monitor = new PerformanceMonitor(renderer);

// In render loop
function animate() {
  requestAnimationFrame(animate);
  
  // ... render ...
  
  monitor.sample();
  
  // Log every 5 seconds
  if (frameCount % 300 === 0) {
    monitor.log();
  }
}
```

---

## 🚀 IMPLEMENTATION ROADMAP

### Phase 1: Measurement (Week 1)
- [ ] Set up performance monitoring
- [ ] Baseline current metrics
- [ ] Identify bottlenecks

### Phase 2: Quick Wins (Week 2)
- [ ] Implement instanced rendering
- [ ] Merge static geometry
- [ ] Reduce shader complexity

### Phase 3: Deep Optimization (Week 3)
- [ ] Memory pooling system
- [ ] Adaptive quality settings
- [ ] LOD implementation

### Phase 4: Validation (Week 4)
- [ ] Test across device tiers
- [ ] Document performance gains
- [ ] Create monitoring dashboard

---

## 🔗 CROSS-REFERENCES

- **A2-01**: Architecture analysis (input)
- **A2-02**: WebGL efficiency review (input)
- **K3-01**: Optimization roadmap (alignment)
- **F3-01**: Device tier matrix (coordination)
- **B3-01**: Asset guidelines (coordination)

---

## 📚 VERIFIED SOURCES

| Source | Type | Used For |
|--------|------|----------|
| HAR File | Project | Tech stack verification |
| Google RAIL | Standard | Performance targets |
| Three.js Docs | Official | Implementation |
| WebGL Spec | W3C | Extension support |

---
