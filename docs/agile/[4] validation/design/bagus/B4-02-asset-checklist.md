# B4-02: Asset Quality Checklist

## 📋 METADATA
- **Task ID**: B4-02
- **Persona**: Bagus Setiawan (3D Designer)
- **Sprint**: 4 - Validation & Handoff
- **Status**: ✅ COMPLETED
- **Created**: 2025-12-11
- **Dependencies**: B3-02, B4-01

---

## 🎯 OBJECTIVE

Provide a comprehensive quality assurance checklist for 3D assets in Zenotika WebGL projects.

---

## ✅ ASSET QUALITY CHECKLIST

### 1. Geometry Quality

#### Polygon Count
- [ ] Total polygons within tier budget
- [ ] No unnecessarily dense areas
- [ ] Efficient topology (clean edge flow)
- [ ] LODs created and validated

| Check | Tier 1 | Tier 2 | Tier 3 |
|-------|--------|--------|--------|
| Hero model | ≤100K | ≤50K | ≤25K |
| Secondary | ≤50K | ≤25K | ≤10K |
| Props | ≤25K | ≤12K | ≤5K |
| Scene total | ≤500K | ≤250K | ≤100K |

#### Mesh Integrity
- [ ] No non-manifold geometry
- [ ] No zero-area faces
- [ ] No isolated vertices
- [ ] No flipped normals
- [ ] All holes are intentional
- [ ] No overlapping faces

#### Topology
- [ ] Quads converted to triangles cleanly
- [ ] No n-gons (5+ sided faces)
- [ ] Edge loops support deformation (if animated)
- [ ] Subdivision-ready (if needed)

### 2. UV Mapping

#### UV Layout
- [ ] All UVs within 0-1 space
- [ ] No overlapping UVs (except mirrored)
- [ ] Efficient UV space usage (>70%)
- [ ] Consistent texel density
- [ ] Seams placed strategically (hidden areas)

#### UV Quality
- [ ] No stretched UVs
- [ ] No inverted UVs
- [ ] Proper padding between UV islands
- [ ] UV islands oriented efficiently

### 3. Materials

#### PBR Validation
- [ ] Base color in correct color space (sRGB)
- [ ] Metallic values are 0 or 1 (avoid in-between)
- [ ] Roughness maps have proper range
- [ ] Normal maps in correct format (OpenGL +Y)
- [ ] No black pixels in AO maps where not intended

#### Material Slots
- [ ] Slot count within limit
- [ ] No unused material slots
- [ ] Materials named descriptively
- [ ] No duplicate materials

| Check | Tier 1 | Tier 2 | Tier 3 |
|-------|--------|--------|--------|
| Max materials/model | 4 | 3 | 2 |
| Max materials/scene | 16 | 10 | 6 |

### 4. Textures

#### Resolution
- [ ] Appropriate resolution for use case
- [ ] Power-of-two dimensions
- [ ] All tiers have appropriate resolution variants

| Texture | Tier 1 | Tier 2 | Tier 3 |
|---------|--------|--------|--------|
| Diffuse | 2K | 1K | 512 |
| Normal | 2K | 1K | 512 |
| PBR maps | 1K | 512 | 256 |

#### Format & Compression
- [ ] Basis Universal compression applied
- [ ] Quality visually acceptable after compression
- [ ] File sizes within budget
- [ ] Mipmaps generated

#### Quality
- [ ] No visible seams
- [ ] No texture stretching
- [ ] No banding in gradients
- [ ] Consistent style across assets

### 5. Animation

#### Technical Quality
- [ ] Frame rate appropriate (24-30 FPS)
- [ ] No keyframes at same time
- [ ] Smooth interpolation
- [ ] Loop points clean (if looping)

#### Performance
- [ ] Keyframe count optimized
- [ ] No redundant keyframes
- [ ] Bone count within limits
- [ ] Animation duration appropriate

| Check | Tier 1 | Tier 2 | Tier 3 |
|-------|--------|--------|--------|
| Max bones | 100 | 50 | 25 |
| Max animations | 10 | 6 | 3 |

### 6. Export Validation

#### glTF Compliance
- [ ] Valid glTF 2.0 format
- [ ] Passes glTF Validator (no errors)
- [ ] Draco compression applied
- [ ] Binary format (.glb) used

#### File Size
- [ ] Within budget after compression
- [ ] Significantly smaller than source

| Asset Type | Target Size |
|------------|-------------|
| Hero model | <500 KB |
| Secondary model | <250 KB |
| Props | <100 KB |
| Total scene | <2 MB |

### 7. Visual Quality

#### Appearance
- [ ] Matches reference/concept art
- [ ] Consistent style with other assets
- [ ] No visual artifacts
- [ ] Proper scale relative to other objects

#### Lighting Response
- [ ] Materials respond correctly to lighting
- [ ] No unexpected dark spots
- [ ] Reflections look natural
- [ ] Shadows cast correctly

### 8. Performance Validation

#### Render Test
- [ ] Maintains target frame rate
- [ ] No excessive draw calls
- [ ] Memory usage acceptable
- [ ] No GPU spikes

#### Cross-Device Test
- [ ] Works on Tier 1 devices at full quality
- [ ] Works on Tier 2 devices at reduced quality
- [ ] Works on Tier 3 devices at minimum quality
- [ ] Fallback works for Tier 4

---

## 📋 QUICK REFERENCE CARD

### Pre-Export Checks
```
□ Polygon count OK
□ Normals correct
□ UVs in 0-1 range
□ Materials assigned
□ Scale applied
□ Origin correct
□ Names clean
```

### Post-Export Checks
```
□ File opens without error
□ Visuals match source
□ Animations play correctly
□ File size acceptable
□ Compression applied
□ Passes validator
```

### Deployment Checks
```
□ Loads in application
□ Frame rate acceptable
□ Memory within budget
□ All tiers working
```

---

## 🚨 COMMON ISSUES & FIXES

| Issue | Cause | Fix |
|-------|-------|-----|
| Missing textures | Path not embedded | Embed textures in glb |
| Dark areas | Flipped normals | Recalculate normals |
| Distorted texture | Bad UVs | Re-unwrap affected areas |
| File too large | No compression | Apply Draco + Basis |
| Black seams | UV padding | Increase UV padding |
| Incorrect scale | Units mismatch | Apply scale, re-export |

---

## 📚 CROSS-REFERENCES

| Document | Content |
|----------|---------|
| B4-01 | 3D production standards |
| B4-03 | Rendering pipeline |
| K4-01 | Performance requirements |

---

## 📊 DATA CLASSIFICATION

| Data Type | Classification | Source |
|-----------|----------------|--------|
| Quality standards | ✅ VERIFIED | Industry best practices |
| File budgets | ✅ VERIFIED | Performance testing |
| glTF specs | ✅ VERIFIED | Khronos specification |

---

**Document Status**: ✅ COMPLETED  
**Last Updated**: 2025-12-11  
**Owner**: Bagus Setiawan (3D Designer)
