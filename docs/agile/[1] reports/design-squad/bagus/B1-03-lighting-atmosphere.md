# B1-03: Lighting, Atmosphere & Environment Design

**Persona:** Bagus Setiawan (3D Art Direction)  
**Date:** 2025-12-10  
**Focus:** Creating photorealistic agricultural environment

> [!WARNING]
> **Data Classification for This Report**
> 
> | Data Type | Status | Source |
> |-----------|--------|--------|
> | Three-point lighting setup code | ⚠️ **EXAMPLE PATTERN** | Standard Three.js approach |
> | HDRI loader code | ⚠️ **EXAMPLE PATTERN** | Three.js documentation |
> | Fog/particle settings | ⚠️ **EXAMPLE PATTERN** | Not extracted from site |
> | Color grading/tone mapping | ⚠️ **EXAMPLE PATTERN** | Industry best practice |
> | Time of day controller | ⚠️ **EDUCATIONAL** | Custom implementation guide |
> | Performance targets | ⚠️ **PROJECTED** | Not benchmarked |

## Lighting Philosophy

### Natural Daylight Simulation

**Golden Hour Aesthetic:**
```yaml
Time of Day: Late afternoon (4-5 PM)
Sun Angle: 15-25 degrees above horizon
Color Temperature: 3500K (warm golden)
Mood: Hopeful, natural, productive
```

---

## Three-Point Lighting Setup

### 1. Key Light (Sun) (Illustrative)

```javascript
// RECONSTRUCTED EXAMPLE: Key Directional Light
const sunLight = new THREE.DirectionalLight(0xFFF4E6, 1.5);
sunLight.position.set(150, 200, 100);
sunLight.castShadow = true;

// Shadow optimization
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
sunLight.shadow.camera.left = -100;
sunLight.shadow.camera.right = 100;
sunLight.shadow.camera.top = 100;
sunLight.shadow.camera.bottom = -100;
```

### 2. Fill Light (Sky)

```javascript
const skyLight = new THREE.HemisphereLight(
  0x87CEEB,  // Sky color (light blue)
  0x6B4423,  // Ground color (brown earth)
  0.6        // Intensity
);
```

### 3. Rim Light (Backlight)

```javascript
const rimLight = new THREE.DirectionalLight(0xFFE4B5, 0.4);
rimLight.position.set(-100, 50, -50);
// No shadows for rim light (performance)
```

---

## HDRI Environment Map

### Image-Based Lighting (Illustrative)

**Setup (Standard Three.js Pattern):**
```javascript
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';

const rgbeLoader = new RGBELoader();
rgbeLoader.load('environment/cornfield_4k.hdr', (texture) => {
  texture.mapping = THREE.EquirectangularReflectionMapping;
  
  scene.environment = texture;
  scene.background = texture; // Optional: visible background
  
  // Or use PMREMGenerator for better performance
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();
  const envMap = pmremGenerator.fromEquirectangular(texture).texture;
  
  scene.environment = envMap;
  pmremGenerator.dispose();
});
```

**HDRI Spec:**
- Resolution: 4K (recommended) or 2K (mobile)
- Format: .hdr (high dynamic range)
- Content: Agricultural field, sky dome
- Time: Matching sun position (late afternoon)

---

## Atmospheric Effects

### 1. Volumetric Fog

**Depth-Based Atmosphere (Illustrative):**
```javascript
// RECONSTRUCTED EXAMPLE: Exponential fog for natural falloff
scene.fog = new THREE.FogExp2(
  0xD4E6F1,  // Light blue-gray
  0.0012     // Density (subtle)
);

// Alternative: Linear fog for more control
scene.fog = new THREE.Fog(
  0xD4E6F1,  // Color
  100,       // Near (starts)
  400        // Far (fully fogged)
);
```

### 2. God Rays / Light Shafts

**Custom Post-Process:**
```javascript
import { GodRaysEffect } from 'postprocessing';

const godRaysEffect = new GodRaysEffect(camera, sunMesh, {
  height: 720,
  kernelSize: KernelSize.SMALL,
  density: 0.96,
  decay: 0.95,
  weight: 0.6,
  exposure: 0.6,
  samples: 60,
  clampMax: 1.0
});

composer.addPass(new EffectPass(camera, godRaysEffect));
```

### 3. Dust Particles in Light

**Atmospheric Particles:**
```javascript
const dustParticles = {
  count: 1000,
  geometry: new THREE.BufferGeometry(),
  material: new THREE.PointsMaterial({
    size: 2.0,
    color: 0xFFFFFF,
    transparent: true,
    opacity: 0.3,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending
  })
};

// Random positions in light path
const dustPositions = new Float32Array(dustParticles.count * 3);
for (let i = 0; i < dustParticles.count * 3; i += 3) {
  dustPositions[i] = (Math.random() - 0.5) * 200;     // x
  dustPositions[i + 1] = Math.random() * 100;         // y
  dustPositions[i + 2] = (Math.random() - 0.5) * 200; // z
}
```

---

## Sky & Background

### Procedural Sky Shader

**Dynamic Sky Dome:**
```glsl
// sky.frag
varying vec3 vWorldPosition;

void main() {
  vec3 direction = normalize(vWorldPosition - cameraPosition);
  
  // Horizon gradient
  float elevation = direction.y;
  vec3 skyColor = mix(
    vec3(0.5, 0.7, 0.9),   // Horizon (lighter)
    vec3(0.2, 0.4, 0.8),   // Zenith (darker blue)
    pow(max(0.0, elevation), 0.4)
  );
  
  // Sun glow
  vec3 sunDir = normalize(sunPosition);
  float sunDot = max(0.0, dot(direction, sunDir));
  vec3 sunGlow = vec3(1.0, 0.9, 0.7) * pow(sunDot, 128.0) * 2.0;
  
  gl_FragColor = vec4(skyColor + sunGlow, 1.0);
}
```

---

## Ground & Environment

### Terrain Shader

**Realistic Soil Material:**
```javascript
const groundMaterial = new THREE.MeshStandardMaterial({
  map: soilColorMap,           // Brown earth texture
  normalMap: soilNormalMap,
  roughnessMap: soilRoughnessMap,
  aoMap: soilAOMap,
  displacementMap: soilHeightMap,
  displacementScale: 0.5,
  
  // Terrain-specific
  roughness: 0.9,   // Very matte
  metalness: 0.0,   // No metal
  envMapIntensity: 0.2
});

// Large ground plane
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(500, 500, 256, 256),
  groundMaterial
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
```

---

## Color Grading & Tone Mapping

### Post-Process Color Adjustment

```javascript
// Warm, cinematic look
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;

// Color grading via LUT
import { LUT3dlLoader } from 'three/examples/jsm/loaders/LUT3dlLoader';

const lutLoader = new LUT3dlLoader();
lutLoader.load('luts/warm-cinematic.3dl', (lut) => {
  const lutPass = new ShaderPass(LUTShader);
  lutPass.uniforms.lut.value = lut.texture3D;
  composer.addPass(lutPass);
});
```

---

## Time of Day System

### Dynamic Lighting Control

```javascript
class TimeOfDayController {
  constructor(scene, sun, sky) {
    this.scene = scene;
    this.sun = sun;
    this.sky = sky;
    this.time = 16.0; // 4 PM
  }
  
  update(time) {
    this.time = time;
    
    // Sun position calculation
    const sunAngle = ((time - 6) / 12) * Math.PI; // 6 AM to 6 PM
    this.sun.position.x = Math.cos(sunAngle) * 200;
    this.sun.position.y = Math.sin(sunAngle) * 200;
    
    // Sun color shift
    const t = Math.max(0, Math.min(1, (time - 15) / 3)); // 3-6 PM
    this.sun.color.setRGB(
      1.0,
      1.0 - t * 0.3,  // Less green at sunset
      1.0 - t * 0.5   // Less blue at sunset
    );
    
    // Sky color
    this.sky.uniforms.sunPosition.value.copy(this.sun.position);
  }
}

const tod = new TimeOfDayController(scene, sunLight, skyShader);
// Animate: tod.update(currentTime);
```

---

## Recommendations for Zenotika x UNIKOM

### Lighting Checklist

1. **Start with Three-Point Setup:**
   - Directional (sun) + Hemisphere (sky) + Ambient
   - Enable shadows on key light only
   - Test on mid-range hardware

2. **HDRI for Reflections:**
   - Use PMREMGenerator for efficiency
   - 2K resolution for web (4K for hero shots)
   - Match HDRI time-of-day to scene

3. **Atmospheric Effects:**
   - Fog: Start subtle (density: 0.001)
   - Particles: \u003c1000 for good performance
   - God rays: Optional (high-end only)

4. **Performance Targets:**
   ```yaml
   Desktop: All effects enabled
   Laptop: Disable god rays, reduce shadows
   Mobile: Fog only, no particles, 512px shadows
   ```

5. **Color Grading:**
   - Use tone mapping (ACESFilmic)
   - Warm color temperature (3500K)
   - Subtle saturation boost (+10%)

---

**Status:** ✅ Complete lighting and atmosphere guide  
**Artistic Goal:** Natural, warm, hopeful agricultural aesthetic
