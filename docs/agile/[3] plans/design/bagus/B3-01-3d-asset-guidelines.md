# B3-01: 3D Asset Production Guidelines

## 📋 METADATA
- **Persona**: Bagus Setiawan - 3D Designer
- **Task ID**: B3-01
- **Date**: 2025-12-11
- **Sprint**: Sprint 3 - Implementation Planning
- **Status**: ✅ COMPLETED
- **Priority**: 🔴 HIGH

> [!IMPORTANT]
> **Data Classification for This Plan**
> 
> | Data Type | Status | Source |
> |-----------|--------|--------|
> | Polygon Budgets | ✅ **VERIFIED** | A-Frame VR Best Practices |
> | Texture Limits | ✅ **VERIFIED** | MDN WebGL Docs |
> | Compression Ratios | ✅ **VERIFIED** | Draco/Basis Documentation |
> | Guidelines | ⚠️ **RECOMMENDATION** | Industry best practices |

---

## 🎯 OBJECTIVE

Define production standards for 3D assets in WebGL experiential projects, balancing visual quality with performance requirements across device tiers.

---

## 📊 POLYGON BUDGET SPECIFICATIONS

### Budget by Device Tier

| Tier | Max Scene Triangles | Max Per Model | Max Draw Calls | Source |
|------|---------------------|---------------|----------------|--------|
| **Tier 1** | 500,000 | 100,000 | <300 | web.dev ✅ |
| **Tier 2** | 200,000 | 50,000 | <200 | web.dev ✅ |
| **Tier 3** | 100,000 | 25,000 | <100 | A-Frame ✅ |
| **Mobile VR** | 100,000 | 20,000 | <300 | A-Frame ✅ |

### Budget Distribution (Example Scene)

```
Total Budget: 200,000 triangles (Tier 2)

├── Hero Model (corn): 40,000 (20%)
├── Environment: 60,000 (30%)
│   ├── Ground: 10,000
│   ├── Sky/Background: 5,000
│   └── Props: 45,000
├── Particles: 20,000 (10%)
├── UI Elements: 5,000 (2.5%)
└── Reserve: 75,000 (37.5%)
```

### LOD (Level of Detail) Requirements

| LOD Level | Distance | Triangle Reduction | Use Case |
|-----------|----------|-------------------|----------|
| LOD0 | 0-5m | 100% | Close-up hero shots |
| LOD1 | 5-15m | 50% | Mid-distance |
| LOD2 | 15-30m | 25% | Background |
| LOD3 | 30m+ | 10% | Far distance |

```javascript
// Three.js LOD implementation
const lod = new THREE.LOD();

lod.addLevel(highDetailMesh, 0);    // Full detail
lod.addLevel(mediumDetailMesh, 10); // 50% at 10 units
lod.addLevel(lowDetailMesh, 25);    // 25% at 25 units
lod.addLevel(billboardMesh, 50);    // Billboard at 50 units

scene.add(lod);
```

---

## 🖼️ TEXTURE SPECIFICATIONS

### Texture Size Limits by Tier

| Tier | Max Size | Recommended | Format | Compression |
|------|----------|-------------|--------|-------------|
| **Tier 1** | 4096×4096 | 2048×2048 | KTX2/Basis | BC7/ASTC |
| **Tier 2** | 2048×2048 | 1024×1024 | KTX2/Basis | BC1/ETC2 |
| **Tier 3** | 1024×1024 | 512×512 | KTX2/Basis | BC1/ETC1 |
| **Mobile** | 2048×2048 | 1024×1024 | KTX2/Basis | ASTC/ETC2 |

### Texture Types & Sizes

| Texture Type | Tier 1 | Tier 2 | Tier 3 | Format |
|--------------|--------|--------|--------|--------|
| Albedo/Diffuse | 2048 | 1024 | 512 | RGB |
| Normal Map | 2048 | 1024 | 512 | RG (2-channel) |
| Roughness | 1024 | 512 | 256 | Grayscale |
| Metallic | 1024 | 512 | 256 | Grayscale |
| AO | 1024 | 512 | 256 | Grayscale |
| Emissive | 1024 | 512 | 256 | RGB |

### Channel Packing (Recommended)

```
ORM Texture (Single texture for PBR):
├── R: Ambient Occlusion
├── G: Roughness
└── B: Metallic

Reduces texture count from 3 to 1 for these properties.
```

### Texture Memory Budget

| Tier | Total VRAM Budget | Textures | Other |
|------|-------------------|----------|-------|
| **Tier 1** | 512 MB | 384 MB | 128 MB |
| **Tier 2** | 256 MB | 192 MB | 64 MB |
| **Tier 3** | 128 MB | 96 MB | 32 MB |

---

## 📦 FILE FORMAT SPECIFICATIONS

### 3D Model Formats

| Format | Use Case | Compression | Browser Support |
|--------|----------|-------------|-----------------|
| **glTF 2.0** (.gltf/.glb) | Primary format | Draco | ✅ Universal |
| **glTF + Draco** | Optimized delivery | 50-90% | ✅ Universal |
| **glTF + Meshopt** | Alternative | 50-70% | ✅ Universal |

### Texture Formats

| Format | Use Case | Compression | Browser Support |
|--------|----------|-------------|-----------------|
| **Basis Universal** (.basis) | Cross-platform | 50-70% | ✅ Via loader |
| **KTX2** | GPU-compressed | 70-80% | ✅ Via loader |
| **WebP** | Fallback | 25-35% | ✅ Native |
| **AVIF** | Modern fallback | 50-60% | ⚠️ Limited |

### Recommended Export Pipeline

```
Source Files (Production)
├── .blend / .max / .maya
├── Textures: .psd / .tiff (16-bit)
└── Resolution: 4K+ source

↓ Export Process

Intermediate Format
├── glTF 2.0 (.gltf + .bin)
├── Textures: .png (lossless)
└── Full detail

↓ Optimization Pipeline

Delivery Format (Tier 1)
├── glTF + Draco (.glb)
├── Textures: KTX2/Basis (4096)
└── LOD0-LOD3 included

Delivery Format (Tier 2)
├── glTF + Draco (.glb)
├── Textures: KTX2/Basis (2048)
└── LOD1-LOD3 only

Delivery Format (Tier 3)
├── glTF + Draco (.glb)
├── Textures: KTX2/Basis (1024)
└── LOD2-LOD3 only
```

---

## 🔧 GEOMETRY OPTIMIZATION RULES

### Do's ✅

1. **Use Draco Compression**
   ```bash
   # gltf-pipeline compression
   gltf-pipeline -i model.gltf -o model-draco.glb -d
   ```

2. **Merge Static Geometry**
   - Combine non-animated objects
   - Reduces draw calls significantly

3. **Use Instancing for Repeated Objects**
   ```javascript
   const instancedMesh = new THREE.InstancedMesh(geometry, material, count);
   ```

4. **Optimize UV Layouts**
   - Maximize texture space usage
   - Avoid UV overlaps

5. **Remove Hidden Faces**
   - Delete geometry that will never be visible
   - Interior faces, underground geometry, etc.

### Don'ts ❌

1. **Don't use N-gons** - Triangulate all geometry
2. **Don't exceed budget** - Strict polygon limits
3. **Don't duplicate materials** - Share materials where possible
4. **Don't use excessive subdivisions** - Only where needed
5. **Don't include unused data** - Strip metadata, animations if unused

---

## 🎨 MATERIAL SPECIFICATIONS

### PBR Material Standards

| Property | Range | Default | Notes |
|----------|-------|---------|-------|
| Base Color | RGB 0-1 | 0.5, 0.5, 0.5 | Albedo without lighting |
| Metallic | 0-1 | 0.0 | Binary preferred (0 or 1) |
| Roughness | 0-1 | 0.5 | Higher = less reflective |
| Normal | RGB | 0.5, 0.5, 1.0 | Tangent-space |
| Ambient Occlusion | 0-1 | 1.0 | Pre-baked shadows |
| Emissive | RGB | 0, 0, 0 | Self-illumination |

### Material Count Limits

| Tier | Max Materials per Scene | Max per Model |
|------|-------------------------|---------------|
| **Tier 1** | 50 | 10 |
| **Tier 2** | 30 | 5 |
| **Tier 3** | 15 | 3 |

### Material Optimization

```javascript
// Share materials across objects
const sharedMaterial = new THREE.MeshStandardMaterial({
  map: albedoTexture,
  normalMap: normalTexture,
  roughnessMap: roughnessTexture,
  metalnessMap: metalnessTexture
});

// Apply to multiple meshes
mesh1.material = sharedMaterial;
mesh2.material = sharedMaterial;
mesh3.material = sharedMaterial;
```

---

## ⚡ ANIMATION GUIDELINES

### Bone/Joint Limits

| Tier | Max Bones | Max Influences | Notes |
|------|-----------|----------------|-------|
| **Tier 1** | 128 | 4 | Full skeletal animation |
| **Tier 2** | 64 | 4 | Standard characters |
| **Tier 3** | 32 | 2 | Simple rigs only |

### Animation Optimization

1. **Bake animations** - Convert IK to FK
2. **Reduce keyframes** - Use interpolation
3. **Compress animation data** - glTF animation compression
4. **Use morph targets sparingly** - Max 8 active targets

```javascript
// Morph target limits
const MAX_MORPH_TARGETS = 8;
geometry.morphTargetsRelative = true;
```

---

## 📋 ASSET CHECKLIST

### Pre-Export Checklist

- [ ] Polygon count within budget
- [ ] All faces triangulated
- [ ] UV layouts optimized (no overlaps)
- [ ] Materials consolidated
- [ ] Unused vertices removed
- [ ] Normals facing correct direction
- [ ] Scale applied (1 unit = 1 meter)
- [ ] Transforms frozen/applied
- [ ] Hidden geometry deleted

### Post-Export Checklist

- [ ] glTF validation passed
- [ ] Draco compression applied
- [ ] Textures converted to KTX2/Basis
- [ ] LOD levels generated
- [ ] File size within budget
- [ ] Loads correctly in Three.js
- [ ] No console errors

### Quality Assurance

- [ ] Visual quality matches design intent
- [ ] Performance within FPS targets
- [ ] Memory usage within budget
- [ ] Cross-browser testing passed

---

## 📊 FILE SIZE BUDGETS

### Per-Asset Budgets

| Asset Type | Tier 1 | Tier 2 | Tier 3 |
|------------|--------|--------|--------|
| Hero Model | 2 MB | 1 MB | 500 KB |
| Environment | 5 MB | 2.5 MB | 1 MB |
| Prop (small) | 100 KB | 50 KB | 25 KB |
| Texture Set | 8 MB | 4 MB | 2 MB |

### Total Project Budgets

| Category | Tier 1 | Tier 2 | Tier 3 |
|----------|--------|--------|--------|
| 3D Models | 10 MB | 5 MB | 2 MB |
| Textures | 20 MB | 10 MB | 5 MB |
| Animations | 2 MB | 1 MB | 500 KB |
| **Total 3D** | **32 MB** | **16 MB** | **7.5 MB** |

---

## 🔗 CROSS-REFERENCES

- **B2-01**: 3D optimization analysis (input)
- **B3-02**: Lighting standards (companion)
- **B3-03**: Asset pipeline (implementation)
- **F3-01**: Device tier matrix (alignment)
- **K3-02**: Compression guide (coordination)

---

## 📚 VERIFIED SOURCES

| Source | Type | Used For |
|--------|------|----------|
| A-Frame Best Practices | Official Docs | Polygon budgets |
| web.dev WebGL | Google Docs | Draw call limits |
| MDN WebGL | Mozilla Docs | Texture limits |
| glTF Specification | Khronos | Format standards |
| Three.js Documentation | Official | Implementation |

---
