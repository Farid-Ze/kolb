# B3-02: Lighting & Rendering Standards

## 📋 METADATA
- **Persona**: Bagus Setiawan - 3D Designer
- **Task ID**: B3-02
- **Date**: 2025-12-11
- **Sprint**: Sprint 3 - Implementation Planning
- **Status**: ✅ COMPLETED
- **Priority**: 🟡 MEDIUM

> [!IMPORTANT]
> **Data Classification for This Plan**
> 
> | Data Type | Status | Source |
> |-----------|--------|--------|
> | Three.js Capabilities | ✅ **VERIFIED** | HAR file (r102) |
> | PBR Standards | ✅ **VERIFIED** | Khronos/glTF |
> | Rendering Settings | ⚠️ **RECOMMENDATION** | Based on best practices |

---

## 🎯 OBJECTIVE

Define lighting and rendering standards for WebGL scenes ensuring visual consistency, performance optimization, and cross-device compatibility.

---

## 💡 LIGHTING SYSTEM

### Light Type Guidelines

| Light Type | Use Case | Performance | Max Count |
|------------|----------|-------------|-----------|
| Ambient | Base illumination | Low | 1 |
| Directional | Sun/key light | Medium | 1-2 |
| Point | Local highlights | High | 2-4 |
| Spot | Focused effects | High | 1-2 |
| Hemisphere | Sky/ground fill | Low | 1 |
| RectArea | Soft area lighting | Very High | 0-1 |

### Standard Lighting Setup (Three.js)

```javascript
// Standard three-point lighting setup
class LightingRig {
  constructor(scene) {
    this.scene = scene;
    this.lights = {};
  }
  
  setupStandard() {
    // Ambient light (base illumination)
    this.lights.ambient = new THREE.AmbientLight(0x404040, 0.4);
    this.scene.add(this.lights.ambient);
    
    // Key light (main directional)
    this.lights.key = new THREE.DirectionalLight(0xffffff, 1.0);
    this.lights.key.position.set(5, 10, 5);
    this.lights.key.castShadow = true;
    this.configureShadow(this.lights.key);
    this.scene.add(this.lights.key);
    
    // Fill light (softer, opposite side)
    this.lights.fill = new THREE.DirectionalLight(0x9090ff, 0.3);
    this.lights.fill.position.set(-5, 5, -5);
    this.scene.add(this.lights.fill);
    
    // Rim light (back lighting for depth)
    this.lights.rim = new THREE.DirectionalLight(0xffff80, 0.5);
    this.lights.rim.position.set(0, 5, -10);
    this.scene.add(this.lights.rim);
    
    // Hemisphere light (sky/ground)
    this.lights.hemisphere = new THREE.HemisphereLight(0x87ceeb, 0x362d14, 0.3);
    this.scene.add(this.lights.hemisphere);
  }
  
  configureShadow(light) {
    light.shadow.mapSize.width = 1024;
    light.shadow.mapSize.height = 1024;
    light.shadow.camera.near = 0.5;
    light.shadow.camera.far = 50;
    light.shadow.camera.left = -10;
    light.shadow.camera.right = 10;
    light.shadow.camera.top = 10;
    light.shadow.camera.bottom = -10;
    light.shadow.bias = -0.0005;
  }
  
  // Adjust for device tier
  setTier(tier) {
    switch (tier) {
      case 1: // High-end
        this.lights.key.shadow.mapSize.set(2048, 2048);
        break;
      case 2: // Mid-range
        this.lights.key.shadow.mapSize.set(1024, 1024);
        break;
      case 3: // Low-end
        this.lights.key.castShadow = false;
        break;
    }
  }
}
```

### Lighting Color Standards

| Light Type | Default Color | Warm Variant | Cool Variant |
|------------|--------------|--------------|--------------|
| Key Light | #FFFFFF | #FFF4E0 | #E0F4FF |
| Fill Light | #9090FF | #B0A090 | #7090C0 |
| Rim Light | #FFFF80 | #FFD080 | #80FFFF |
| Ambient | #404040 | #504030 | #304050 |

### Lighting Presets by Scene Type

```javascript
// Scene-specific lighting presets
const lightingPresets = {
  daylight: {
    key: { color: 0xFFFFFF, intensity: 1.2 },
    fill: { color: 0x87CEEB, intensity: 0.4 },
    ambient: { color: 0x404040, intensity: 0.3 },
    hemisphere: { sky: 0x87CEEB, ground: 0x4A4A2A, intensity: 0.5 }
  },
  
  sunset: {
    key: { color: 0xFF8040, intensity: 1.0 },
    fill: { color: 0x4040FF, intensity: 0.3 },
    ambient: { color: 0x302020, intensity: 0.4 },
    hemisphere: { sky: 0xFF6030, ground: 0x1A1A2E, intensity: 0.4 }
  },
  
  night: {
    key: { color: 0x8080FF, intensity: 0.5 },
    fill: { color: 0x2020FF, intensity: 0.2 },
    ambient: { color: 0x101020, intensity: 0.3 },
    hemisphere: { sky: 0x0A0A20, ground: 0x0A0510, intensity: 0.2 }
  },
  
  studio: {
    key: { color: 0xFFFFFF, intensity: 1.0 },
    fill: { color: 0xFFFFFF, intensity: 0.5 },
    ambient: { color: 0x808080, intensity: 0.5 },
    hemisphere: null
  }
};

// Apply preset
function applyLightingPreset(rig, presetName) {
  const preset = lightingPresets[presetName];
  
  if (preset.key) {
    rig.lights.key.color.set(preset.key.color);
    rig.lights.key.intensity = preset.key.intensity;
  }
  
  if (preset.fill) {
    rig.lights.fill.color.set(preset.fill.color);
    rig.lights.fill.intensity = preset.fill.intensity;
  }
  
  if (preset.ambient) {
    rig.lights.ambient.color.set(preset.ambient.color);
    rig.lights.ambient.intensity = preset.ambient.intensity;
  }
  
  if (preset.hemisphere) {
    rig.lights.hemisphere.color.set(preset.hemisphere.sky);
    rig.lights.hemisphere.groundColor.set(preset.hemisphere.ground);
    rig.lights.hemisphere.intensity = preset.hemisphere.intensity;
  }
}
```

---

## 🎨 RENDERING SETTINGS

### Renderer Configuration by Tier

```javascript
// Tiered renderer settings
const rendererConfigs = {
  tier1: {
    antialias: true,
    powerPreference: 'high-performance',
    precision: 'highp',
    pixelRatio: Math.min(window.devicePixelRatio, 2),
    toneMapping: THREE.ACESFilmicToneMapping,
    toneMappingExposure: 1.0,
    outputColorSpace: THREE.SRGBColorSpace,
    shadowMap: {
      enabled: true,
      type: THREE.PCFSoftShadowMap
    }
  },
  
  tier2: {
    antialias: true,
    powerPreference: 'default',
    precision: 'mediump',
    pixelRatio: Math.min(window.devicePixelRatio, 1.5),
    toneMapping: THREE.LinearToneMapping,
    toneMappingExposure: 1.0,
    outputColorSpace: THREE.SRGBColorSpace,
    shadowMap: {
      enabled: true,
      type: THREE.BasicShadowMap
    }
  },
  
  tier3: {
    antialias: false,
    powerPreference: 'low-power',
    precision: 'lowp',
    pixelRatio: 1,
    toneMapping: THREE.NoToneMapping,
    outputColorSpace: THREE.SRGBColorSpace,
    shadowMap: {
      enabled: false
    }
  }
};

// Apply renderer config
function configureRenderer(renderer, tier) {
  const config = rendererConfigs[`tier${tier}`];
  
  renderer.setPixelRatio(config.pixelRatio);
  renderer.toneMapping = config.toneMapping;
  renderer.toneMappingExposure = config.toneMappingExposure;
  renderer.outputColorSpace = config.outputColorSpace;
  renderer.shadowMap.enabled = config.shadowMap.enabled;
  
  if (config.shadowMap.enabled) {
    renderer.shadowMap.type = config.shadowMap.type;
  }
}
```

### Environment Map Setup

```javascript
// Environment map loader
async function loadEnvironmentMap(path, renderer) {
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();
  
  return new Promise((resolve, reject) => {
    new THREE.RGBELoader()
      .setDataType(THREE.HalfFloatType)
      .load(path, (hdrTexture) => {
        const envMap = pmremGenerator.fromEquirectangular(hdrTexture).texture;
        hdrTexture.dispose();
        pmremGenerator.dispose();
        resolve(envMap);
      }, undefined, reject);
  });
}

// Environment presets
const environmentPresets = {
  outdoor: '/environments/outdoor.hdr',
  studio: '/environments/studio.hdr',
  sunset: '/environments/sunset.hdr',
  night: '/environments/night.hdr'
};

// Apply environment
async function applyEnvironment(scene, renderer, presetName) {
  const envMap = await loadEnvironmentMap(environmentPresets[presetName], renderer);
  scene.environment = envMap;
  scene.background = envMap;
}
```

---

## 🖼️ POST-PROCESSING

### Post-Processing Stack (Tier 1 Only)

```javascript
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';

// Setup post-processing
function setupPostProcessing(renderer, scene, camera, tier) {
  if (tier !== 1) return null; // Only tier 1
  
  const composer = new EffectComposer(renderer);
  
  // Base render pass
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);
  
  // Bloom for highlights
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.5,  // strength
    0.4,  // radius
    0.85  // threshold
  );
  composer.addPass(bloomPass);
  
  // SMAA anti-aliasing
  const smaaPass = new SMAAPass(
    window.innerWidth * renderer.getPixelRatio(),
    window.innerHeight * renderer.getPixelRatio()
  );
  composer.addPass(smaaPass);
  
  return composer;
}
```

### Selective Bloom Implementation

```javascript
// Selective bloom for emissive objects
const BLOOM_SCENE = 1;
const bloomLayer = new THREE.Layers();
bloomLayer.set(BLOOM_SCENE);

// Mark objects for bloom
function enableBloom(object) {
  object.layers.enable(BLOOM_SCENE);
}

// Render with selective bloom
function renderWithSelectiveBloom(composer, scene, camera, bloomComposer) {
  // Store original materials
  const materials = {};
  scene.traverse((obj) => {
    if (obj.isMesh) {
      materials[obj.uuid] = obj.material;
      if (!bloomLayer.test(obj.layers)) {
        obj.material = darkMaterial;
      }
    }
  });
  
  // Render bloom
  bloomComposer.render();
  
  // Restore materials
  scene.traverse((obj) => {
    if (obj.isMesh && materials[obj.uuid]) {
      obj.material = materials[obj.uuid];
    }
  });
  
  // Final composite
  composer.render();
}
```

---

## 🎯 MATERIAL STANDARDS

### PBR Material Guidelines

| Property | Standard Range | Notes |
|----------|---------------|-------|
| baseColor | RGB 0-1 | Non-metallic surfaces |
| metallic | 0 or 1 | Binary for real materials |
| roughness | 0.1-0.9 | Avoid extremes |
| emissive | RGB 0-1 | For glowing elements |
| envMapIntensity | 0.5-1.5 | Environment reflection |

### Material Presets

```javascript
// Material presets
const materialPresets = {
  corn: {
    color: 0xF7C948,
    metalness: 0,
    roughness: 0.7,
    envMapIntensity: 0.5
  },
  
  metal: {
    color: 0xFFFFFF,
    metalness: 1.0,
    roughness: 0.2,
    envMapIntensity: 1.0
  },
  
  plastic: {
    color: 0xFFFFFF,
    metalness: 0,
    roughness: 0.3,
    envMapIntensity: 0.8
  },
  
  ground: {
    color: 0x4A4A2A,
    metalness: 0,
    roughness: 0.9,
    envMapIntensity: 0.3
  }
};

// Create material from preset
function createMaterial(presetName, textures = {}) {
  const preset = materialPresets[presetName];
  
  return new THREE.MeshStandardMaterial({
    color: preset.color,
    metalness: preset.metalness,
    roughness: preset.roughness,
    envMapIntensity: preset.envMapIntensity,
    map: textures.albedo || null,
    normalMap: textures.normal || null,
    roughnessMap: textures.roughness || null,
    metalnessMap: textures.metalness || null,
    aoMap: textures.ao || null,
    emissiveMap: textures.emissive || null
  });
}
```

---

## 🔗 CROSS-REFERENCES

- **B2-02**: Lighting narrative analysis (input)
- **B3-01**: Asset guidelines (companion)
- **A3-01**: WebGL optimization (coordination)
- **F3-01**: Device tier settings (alignment)

---

## 📚 VERIFIED SOURCES

| Source | Type | Used For |
|--------|------|----------|
| Three.js r102 | HAR Verified | API reference |
| Khronos glTF | Standard | PBR specification |
| web.dev | Google | Performance guidelines |

---
