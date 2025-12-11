# B3-03: Asset Production Pipeline
## 3D Workflow from Creation to Delivery

---

## Document Information

| Field | Value |
|-------|-------|
| **Document ID** | B3-03 |
| **Sprint** | 3 - Implementation Planning |
| **Persona** | Bagus Setiawan (3D Designer) |
| **Priority** | 🔴 HIGH |
| **Status** | ✅ COMPLETED |
| **Created** | 2025-12-11 |
| **References** | B2-01, B2-03, K3-01, B3-01, B3-02 |

---

## 📋 Executive Summary

This document defines the end-to-end 3D asset production pipeline for WebGL projects. Based on Sprint 2 analysis identifying 1.89MB JS bundle with embedded 3D assets, this pipeline ensures efficient asset creation, optimization, and delivery for performant web experiences.

---

## 🔄 Pipeline Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        3D ASSET PRODUCTION PIPELINE                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐      │
│  │  MODEL   │──▶│  TEXTURE │──▶│ OPTIMIZE │──▶│  EXPORT  │──▶│ VALIDATE │      │
│  │ CREATION │   │ CREATION │   │   LOD    │   │   GLB    │   │   QA     │      │
│  └──────────┘   └──────────┘   └──────────┘   └──────────┘   └──────────┘      │
│       │              │              │              │              │             │
│       ▼              ▼              ▼              ▼              ▼             │
│    Blender        Substance      gltf-pipeline    Draco         Lighthouse     │
│    Maya           Photoshop      Simplygon        Basis          Three.js      │
│    Cinema4D       Designer                        Universal      Test Scene    │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📁 Stage 1: Model Creation

### Software Standards

| Software | Use Case | Export Format |
|----------|----------|---------------|
| Blender 3.x | Primary modeling | FBX, GLB |
| Maya | Complex rigs | FBX |
| Cinema 4D | Motion graphics | FBX, Alembic |
| ZBrush | High-poly sculpting | OBJ (retopo required) |

### Modeling Guidelines

| Criterion | Target | Rationale |
|-----------|--------|-----------|
| Poly Budget (Hero) | 50,000-100,000 | Detailed focal object |
| Poly Budget (Secondary) | 10,000-30,000 | Supporting elements |
| Poly Budget (Background) | 1,000-5,000 | Minimal detail |
| Quad Percentage | >95% | Clean topology for deformation |
| Ngon Percentage | <2% | Avoid rendering artifacts |

### Modeling Checklist

```markdown
## Pre-Export Model Checklist

- [ ] Correct scale (1 unit = 1 meter)
- [ ] Origin at logical point (center/base)
- [ ] Applied transforms (location, rotation, scale)
- [ ] No duplicate vertices
- [ ] No inverted normals
- [ ] Clean topology (no ngons in deformed areas)
- [ ] Named objects and materials
- [ ] Removed unused data blocks
```

### LOD Creation

```python
# ILLUSTRATIVE EXAMPLE - Blender LOD Script

import bpy
import bmesh

def create_lod(obj, target_ratio, suffix):
    """Create LOD version of mesh"""
    
    # Duplicate object
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.duplicate()
    
    lod_obj = bpy.context.active_object
    lod_obj.name = f"{obj.name}_{suffix}"
    
    # Apply decimate modifier
    decimate = lod_obj.modifiers.new(name='Decimate', type='DECIMATE')
    decimate.ratio = target_ratio
    bpy.ops.object.modifier_apply(modifier='Decimate')
    
    return lod_obj

# Create LOD chain
hero_model = bpy.data.objects['CornCob_Hero']

lod_configs = [
    (0.5, 'LOD1'),   # 50% of original
    (0.25, 'LOD2'),  # 25% of original
    (0.1, 'LOD3')    # 10% of original
]

for ratio, suffix in lod_configs:
    create_lod(hero_model, ratio, suffix)
```

---

## 🎨 Stage 2: Texture Creation

### Texture Specifications

| Map Type | Resolution (Hero) | Resolution (LOD2) | Format |
|----------|-------------------|-------------------|--------|
| Diffuse/Albedo | 2048×2048 | 512×512 | PNG/JPEG |
| Normal | 2048×2048 | 1024×1024 | PNG |
| Roughness | 1024×1024 | 512×512 | PNG |
| Metallic | 1024×1024 | 512×512 | PNG |
| AO | 1024×1024 | 512×512 | PNG |
| Emissive | 1024×1024 | 512×512 | PNG |

### PBR Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                    PBR TEXTURE WORKFLOW                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Substance Painter / Designer                                    │
│  ─────────────────────────────                                   │
│  1. Import high-poly mesh for baking                             │
│  2. Bake normal, AO, curvature from high to low poly             │
│  3. Create material layers                                       │
│  4. Export texture sets                                          │
│                                                                  │
│  Export Presets:                                                 │
│  ├── Hero Assets: 2K textures, full PBR set                     │
│  ├── Secondary: 1K textures, base color + normal                │
│  └── Background: 512 textures, base color only                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Texture Atlasing

```javascript
// ILLUSTRATIVE EXAMPLE - Texture Atlas Configuration

const atlasConfig = {
  // Group related textures into atlases
  atlases: [
    {
      name: 'environment_atlas',
      size: 4096,
      padding: 2,
      contents: [
        'ground_diffuse',
        'sky_gradient',
        'grass_diffuse',
        'rock_diffuse'
      ]
    },
    {
      name: 'ui_atlas',
      size: 2048,
      padding: 2,
      contents: [
        'button_normal',
        'button_hover',
        'icon_play',
        'icon_pause'
      ]
    }
  ],
  
  // UV adjustment script needed after atlas creation
  adjustUVs: true
};
```

### Channel Packing

```
┌─────────────────────────────────────────────────────────────────┐
│                   CHANNEL PACKING STRATEGY                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Instead of 4 separate textures:                                 │
│  - Metallic.png (1 channel used)                                │
│  - Roughness.png (1 channel used)                               │
│  - AO.png (1 channel used)                                      │
│  - Height.png (1 channel used)                                  │
│                                                                  │
│  Pack into 1 texture (ORM/ARM):                                  │
│  ┌───────────────────────────────────────────────────────┐      │
│  │  R Channel = Ambient Occlusion                        │      │
│  │  G Channel = Roughness                                │      │
│  │  B Channel = Metallic                                 │      │
│  │  A Channel = Height (optional)                        │      │
│  └───────────────────────────────────────────────────────┘      │
│                                                                  │
│  Result: 4 textures → 1 texture (75% reduction in requests)     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## ⚙️ Stage 3: Optimization

### Mesh Optimization Pipeline

```bash
# ILLUSTRATIVE EXAMPLE - gltf-pipeline optimization

# Install gltf-pipeline
npm install -g gltf-pipeline

# Basic optimization
gltf-pipeline -i model.gltf -o model_optimized.glb

# With Draco compression
gltf-pipeline -i model.gltf -o model_draco.glb -d

# Draco with custom settings
gltf-pipeline -i model.gltf -o model_draco.glb \
  --draco.compressionLevel 10 \
  --draco.quantizePositionBits 14 \
  --draco.quantizeNormalBits 10 \
  --draco.quantizeTexcoordBits 12
```

### Draco Compression Settings

| Setting | Range | Recommended | Impact |
|---------|-------|-------------|--------|
| Compression Level | 0-10 | 7-10 | Higher = smaller, slower decode |
| Position Bits | 8-16 | 12-14 | Lower = smaller, less precise |
| Normal Bits | 8-16 | 8-10 | Lower = smaller, less precise |
| Texcoord Bits | 8-16 | 10-12 | Lower = smaller, less precise |

### Basis Universal Texture Compression

```bash
# ILLUSTRATIVE EXAMPLE - Basis Universal compression

# Install basisu encoder
# Download from: https://github.com/BinomialLLC/basis_universal

# Compress to UASTC (higher quality)
basisu -uastc -uastc_level 2 texture.png -output_file texture.ktx2

# Compress to ETC1S (smaller size)
basisu texture.png -output_file texture_etc1s.ktx2

# Batch compression script
for file in textures/*.png; do
  basisu -uastc -uastc_level 2 "$file" -output_file "${file%.png}.ktx2"
done
```

### Compression Comparison

| Format | Typical Size | Quality | GPU Support |
|--------|--------------|---------|-------------|
| PNG | 100% (baseline) | Lossless | Universal |
| JPEG | 30-50% | Lossy | Universal |
| KTX2 (UASTC) | 15-25% | Near-lossless | GPU native |
| KTX2 (ETC1S) | 5-15% | Lossy | GPU native |
| Basis | 10-20% | Lossy | Transcodes to GPU format |

---

## 📦 Stage 4: Export

### GLB Export Settings

```python
# ILLUSTRATIVE EXAMPLE - Blender GLB Export Settings

import bpy

export_settings = {
    'filepath': '/output/model.glb',
    'export_format': 'GLB',
    
    # Include settings
    'use_selection': False,
    'export_cameras': False,
    'export_lights': False,
    
    # Transform
    'export_yup': True,  # Three.js convention
    
    # Geometry
    'export_apply': True,  # Apply modifiers
    'export_tangents': True,  # For normal maps
    
    # Animation
    'export_animations': True,
    'export_frame_range': True,
    'export_nla_strips': False,
    
    # Compression
    'export_draco_mesh_compression_enable': True,
    'export_draco_mesh_compression_level': 6,
    
    # Materials
    'export_materials': 'EXPORT',
    'export_image_format': 'AUTO',  # Keep original format
}

bpy.ops.export_scene.gltf(**export_settings)
```

### Asset Naming Convention

```
[Project]_[Category]_[Name]_[LOD]_[Version].[ext]

Examples:
- corn_prop_cob_lod0_v1.glb
- corn_prop_cob_lod1_v1.glb
- corn_env_field_lod0_v2.glb
- corn_char_farmer_lod0_v1.glb

Categories:
- prop: Interactive objects
- env: Environment/background
- char: Characters/creatures
- fx: Effects/particles
- ui: User interface elements
```

### Folder Structure

```
assets/
├── 3d/
│   ├── models/
│   │   ├── hero/           # Main focal models
│   │   │   ├── lod0/       # Full detail
│   │   │   ├── lod1/       # Medium detail
│   │   │   └── lod2/       # Low detail
│   │   ├── props/          # Secondary objects
│   │   └── environment/    # Background elements
│   │
│   ├── textures/
│   │   ├── source/         # Original PSD/PNG files
│   │   ├── compressed/     # KTX2 files for production
│   │   └── atlases/        # Packed texture atlases
│   │
│   └── animations/         # Animation clips
│
├── source/                 # Original working files
│   ├── blender/
│   ├── substance/
│   └── photoshop/
│
└── documentation/
    ├── asset-manifest.json
    └── readme.md
```

---

## ✅ Stage 5: Validation & QA

### Automated Validation Script

```javascript
// ILLUSTRATIVE EXAMPLE - Asset Validation Script

const { GLTFLoader } = require('three/examples/jsm/loaders/GLTFLoader');
const fs = require('fs');

async function validateGLB(filePath) {
  const stats = fs.statSync(filePath);
  const results = {
    file: filePath,
    fileSize: stats.size,
    issues: [],
    warnings: [],
    passed: true
  };
  
  // Size checks
  const sizeMB = stats.size / (1024 * 1024);
  if (sizeMB > 5) {
    results.issues.push(`File size ${sizeMB.toFixed(2)}MB exceeds 5MB limit`);
    results.passed = false;
  } else if (sizeMB > 2) {
    results.warnings.push(`File size ${sizeMB.toFixed(2)}MB - consider optimization`);
  }
  
  // Load and analyze
  const loader = new GLTFLoader();
  const gltf = await loader.loadAsync(filePath);
  
  // Polygon count
  let totalPolygons = 0;
  gltf.scene.traverse((node) => {
    if (node.isMesh) {
      const geometry = node.geometry;
      if (geometry.index) {
        totalPolygons += geometry.index.count / 3;
      } else {
        totalPolygons += geometry.attributes.position.count / 3;
      }
    }
  });
  
  if (totalPolygons > 100000) {
    results.issues.push(`Polygon count ${totalPolygons} exceeds hero limit`);
    results.passed = false;
  }
  
  // Texture checks
  gltf.scene.traverse((node) => {
    if (node.material) {
      const checkTexture = (map, name) => {
        if (map && map.image) {
          const size = Math.max(map.image.width, map.image.height);
          if (size > 2048) {
            results.warnings.push(`${name} texture ${size}px exceeds recommended 2048px`);
          }
        }
      };
      
      checkTexture(node.material.map, 'Diffuse');
      checkTexture(node.material.normalMap, 'Normal');
      checkTexture(node.material.roughnessMap, 'Roughness');
    }
  });
  
  return results;
}

// Batch validation
async function validateAllAssets(directory) {
  const files = fs.readdirSync(directory)
    .filter(f => f.endsWith('.glb'));
  
  const results = [];
  for (const file of files) {
    results.push(await validateGLB(`${directory}/${file}`));
  }
  
  console.log('Validation Results:');
  results.forEach(r => {
    console.log(`${r.passed ? '✓' : '✗'} ${r.file}`);
    r.issues.forEach(i => console.log(`  ERROR: ${i}`));
    r.warnings.forEach(w => console.log(`  WARN: ${w}`));
  });
}
```

### Visual QA Checklist

```markdown
## Visual Quality Assurance Checklist

### Geometry
- [ ] No visible polygon edges in silhouette
- [ ] Smooth shading where appropriate
- [ ] No z-fighting between overlapping surfaces
- [ ] LOD transitions not noticeable

### Textures
- [ ] No visible seams at UV boundaries
- [ ] Consistent texel density
- [ ] No blurry textures at intended view distance
- [ ] Normal maps display correctly

### Materials
- [ ] PBR values realistic (metal=0 or 1, roughness 0.04-1)
- [ ] No unnaturally glossy surfaces
- [ ] Proper metallic workflow (no specular in metal)
- [ ] Subsurface scattering where needed (optional)

### Animation
- [ ] Smooth keyframe interpolation
- [ ] No joint popping or snapping
- [ ] Proper weight painting (no vertex tearing)
- [ ] Animation loops seamlessly (if looping)

### Performance
- [ ] Renders at 60fps in test scene
- [ ] No visible pop-in during LOD transitions
- [ ] Memory usage within budget
- [ ] Load time acceptable
```

---

## 📊 Asset Manifest Template

```json
{
  "version": "1.0",
  "project": "Corn Revolution",
  "generated": "2025-12-11",
  "assets": [
    {
      "id": "corn_hero_cob",
      "name": "Hero Corn Cob",
      "category": "hero",
      "files": {
        "lod0": {
          "path": "models/hero/corn_cob_lod0_v2.glb",
          "size": 1245632,
          "polygons": 45000,
          "compressed": true
        },
        "lod1": {
          "path": "models/hero/corn_cob_lod1_v2.glb",
          "size": 456789,
          "polygons": 15000,
          "compressed": true
        }
      },
      "textures": {
        "diffuse": "textures/compressed/corn_cob_diffuse.ktx2",
        "normal": "textures/compressed/corn_cob_normal.ktx2",
        "orm": "textures/compressed/corn_cob_orm.ktx2"
      },
      "lodDistances": [0, 10, 25],
      "animations": ["idle", "grow", "harvest"],
      "tags": ["interactive", "product"]
    }
  ]
}
```

---

## 🔗 Cross-References

| Document | Relationship |
|----------|--------------|
| B2-01 (3D Optimization) | Analysis foundation |
| B2-03 (Asset Efficiency) | Efficiency metrics |
| K3-01 (Optimization Roadmap) | Compression targets |
| B3-01 (Asset Guidelines) | Quality standards |
| B3-02 (Lighting Standards) | Material requirements |

---

## 📊 Data Classification

| Category | Classification |
|----------|----------------|
| **Primary Data** | HAR file (1.89MB JS bundle) |
| **Industry Standards** | glTF 2.0, Draco, Basis Universal |
| **Code Examples** | Illustrative (not from live site) |
| **Tools** | Open-source industry standard |

---

*Document Status: ✅ COMPLETED*
*Last Updated: 2025-12-11*
