# B4-01: 3D Production Standards

## 📋 METADATA
- **Task ID**: B4-01
- **Persona**: Bagus Setiawan (3D Designer)
- **Sprint**: 4 - Validation & Handoff
- **Status**: ✅ COMPLETED
- **Created**: 2025-12-11
- **Dependencies**: B1-01/02/03, B2-01/02/03, B3-01/02/03

---

## 🎯 OBJECTIVE

Consolidate 3D production standards for Zenotika WebGL projects ensuring optimal balance between visual quality and performance.

---

## 🎨 3D PRODUCTION STANDARDS

### 1. Polygon Budgets

#### Per-Device Tier

| Tier | Total Scene Budget | Hero Model | Secondary Models | Background |
|------|-------------------|------------|------------------|------------|
| **Tier 1** | 500K polygons | 100K | 50K each | 100K |
| **Tier 2** | 250K polygons | 50K | 25K each | 50K |
| **Tier 3** | 100K polygons | 25K | 10K each | 25K |
| **Tier 4** | N/A (images) | N/A | N/A | N/A |

#### Model Categories

| Category | Tier 1 | Tier 2 | Tier 3 |
|----------|--------|--------|--------|
| Hero/Product | 100K | 50K | 25K |
| Character | 75K | 35K | 15K |
| Props | 25K | 12K | 5K |
| Environment | 100K | 50K | 25K |
| Particle | 100 tris each | 50 tris | 25 tris |

### 2. Texture Standards

#### Size Guidelines

| Texture Type | Tier 1 | Tier 2 | Tier 3 |
|--------------|--------|--------|--------|
| Diffuse/Albedo | 2048×2048 | 1024×1024 | 512×512 |
| Normal Map | 2048×2048 | 1024×1024 | 512×512 |
| Roughness/Metal | 1024×1024 | 512×512 | 256×256 |
| Emissive | 1024×1024 | 512×512 | 256×256 |
| Environment | 1024×1024 | 512×512 | 256×256 |

#### Format Requirements

| Format | Use Case | Compression |
|--------|----------|-------------|
| **Basis Universal** | All textures (production) | UASTC or ETC1S |
| **PNG** | Development/source | None |
| **JPEG** | Fallback | 80% quality |
| **WebP** | 2D fallback | 80% quality |

#### Texture Best Practices

- Always power-of-two dimensions (256, 512, 1024, 2048)
- Generate mipmaps for all textures
- Use texture atlasing for small textures
- Prefer RGB over RGBA when alpha not needed
- Compress normal maps carefully (quality priority)

### 3. Model Specifications

#### glTF Requirements

```
REQUIRED glTF FEATURES
├── Format: glTF 2.0 Binary (.glb)
├── Compression: Draco (geometry)
├── Materials: PBR (metallic-roughness)
├── Animations: Embedded (if needed)
└── Extras: None (minimize file size)
```

#### Mesh Guidelines

| Requirement | Standard |
|-------------|----------|
| Topology | Clean quads, converted to tris |
| UV Layout | Non-overlapping, 0-1 space |
| Normals | Explicit, not auto-calculated |
| Origin | Centered or logical pivot |
| Scale | Real-world or consistent units |
| Naming | `[category]_[name]_[lod]` |

#### LOD System

| LOD Level | Distance | Polygon % | Use |
|-----------|----------|-----------|-----|
| LOD0 | 0-5m | 100% | Close-up |
| LOD1 | 5-15m | 50% | Medium |
| LOD2 | 15-30m | 25% | Far |
| LOD3 | 30m+ | 10% | Very far/fallback |

### 4. Material Standards

#### PBR Workflow

```
MATERIAL PROPERTIES
├── Base Color (RGB)
│   └── sRGB color space
├── Metallic (Grayscale)
│   ├── 0.0 = Dielectric (non-metal)
│   └── 1.0 = Metal
├── Roughness (Grayscale)
│   ├── 0.0 = Mirror-like
│   └── 1.0 = Fully rough
├── Normal (RGB)
│   └── OpenGL format (+Y up)
├── Occlusion (Grayscale)
│   └── Baked ambient occlusion
└── Emissive (RGB)
    └── Self-illumination (HDR capable)
```

#### Material Slots

| Maximum Slots | Tier 1 | Tier 2 | Tier 3 |
|---------------|--------|--------|--------|
| Per model | 4 | 3 | 2 |
| Per scene | 16 | 10 | 6 |

### 5. Lighting Standards

#### Light Types & Limits

| Light Type | Tier 1 Max | Tier 2 Max | Tier 3 Max |
|------------|------------|------------|------------|
| Directional | 2 | 1 | 1 |
| Point | 8 | 4 | 2 |
| Spot | 4 | 2 | 1 |
| Area | 2 | 0 | 0 |

#### Shadow Guidelines

| Setting | Tier 1 | Tier 2 | Tier 3 |
|---------|--------|--------|--------|
| Shadow Map Size | 2048 | 1024 | None |
| Shadow Type | PCF Soft | Basic | None |
| Cascade Count | 3 | 2 | 0 |

### 6. Animation Standards

#### Keyframe Guidelines

| Animation Type | Max FPS | Interpolation |
|----------------|---------|---------------|
| Character | 30 | Linear/Bezier |
| Object | 24 | Linear |
| Camera | 30 | Bezier (smooth) |
| UI elements | 60 | Step/Linear |

#### Animation Optimization

- Remove redundant keyframes
- Use animation compression
- Prefer morph targets over bones for simple deforms
- Limit bone count (Tier 1: 100, Tier 2: 50, Tier 3: 25)

### 7. File Organization

#### Naming Convention

```
ASSET NAMING PATTERN
[project]_[category]_[name]_[variant]_[lod].[ext]

Examples:
zenotika_prop_corn_yellow_lod0.glb
zenotika_char_farmer_idle_lod1.glb
zenotika_env_field_summer_lod0.glb
zenotika_tex_corn_diffuse_1k.basis
```

#### Folder Structure

```
assets/
├── models/
│   ├── characters/
│   ├── props/
│   ├── environment/
│   └── effects/
├── textures/
│   ├── diffuse/
│   ├── normal/
│   ├── pbr/
│   └── environment/
├── animations/
│   ├── characters/
│   └── objects/
└── source/
    └── [Original files - not deployed]
```

### 8. Quality Checklist

#### Pre-Export Checklist

- [ ] Polygon count within budget
- [ ] All UVs in 0-1 space
- [ ] No overlapping faces
- [ ] Normals facing correctly
- [ ] Scale applied (1 unit = 1 meter or consistent)
- [ ] Origin positioned correctly
- [ ] Clean material naming
- [ ] No unused materials

#### Post-Export Checklist

- [ ] File size acceptable
- [ ] Draco compression applied
- [ ] Textures compressed (Basis)
- [ ] Loads without errors
- [ ] Visual quality acceptable
- [ ] Animation plays correctly
- [ ] LODs switch properly

---

## ✅ 3D PRODUCTION CHECKLIST

### Asset Creation
- [ ] Reference polygon budgets
- [ ] Follow UV guidelines
- [ ] Apply PBR materials
- [ ] Optimize before export

### Export Process
- [ ] Export as glTF 2.0 binary
- [ ] Apply Draco compression
- [ ] Convert textures to Basis
- [ ] Generate LODs

### Quality Assurance
- [ ] Test in viewer
- [ ] Verify all tiers
- [ ] Check file sizes
- [ ] Validate performance

---

## 📚 CROSS-REFERENCES

| Document | Content |
|----------|---------|
| B3-01 | Asset production guidelines |
| B4-02 | Asset quality checklist |
| B4-03 | Rendering pipeline reference |
| K4-01 | Performance requirements |

---

## 📊 DATA CLASSIFICATION

| Data Type | Classification | Source |
|-----------|----------------|--------|
| Polygon budgets | ✅ VERIFIED | Industry standards |
| Texture formats | ✅ VERIFIED | Khronos glTF spec |
| PBR workflow | ✅ VERIFIED | Three.js documentation |

---

**Document Status**: ✅ COMPLETED  
**Last Updated**: 2025-12-11  
**Owner**: Bagus Setiawan (3D Designer)
