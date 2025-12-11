# F3-01: Device Tier Support Matrix

## 📋 METADATA
- **Persona**: Fajar Ramadhan - Compatibility Engineer
- **Task ID**: F3-01
- **Date**: 2025-12-11
- **Sprint**: Sprint 3 - Implementation Planning
- **Status**: ✅ COMPLETED
- **Priority**: 🔴 HIGH

> [!IMPORTANT]
> **Data Classification for This Plan**
> 
> | Data Type | Status | Source |
> |-----------|--------|--------|
> | Device Tier Criteria | ⚠️ **DEFINED** | F2-01 Analysis |
> | WebGL Requirements | ✅ **VERIFIED** | MDN WebGL Docs |
> | FPS Targets | ✅ **VERIFIED** | discoverthreejs.com |
> | Market Share | ⚠️ **INDUSTRY** | StatCounter 2024 |

---

## 🎯 OBJECTIVE

Define a standardized device tier classification system for Zenotika's WebGL projects, with clear quality settings and experience levels for each tier.

---

## 📊 DEVICE TIER CLASSIFICATION SYSTEM

### Tier Overview

| Tier | Experience Level | FPS Target | Quality | User Segment |
|------|------------------|------------|---------|--------------|
| **Tier 1** | ✨ Optimal | 60 FPS | Maximum | ~25-30% |
| **Tier 2** | ✅ Acceptable | 45-60 FPS | High | ~40-45% |
| **Tier 3** | ⚠️ Degraded | 30-45 FPS | Medium | ~15-20% |
| **Tier 4** | ❌ Fallback | <30 FPS | Minimal/Static | ~10-15% |

---

## 🟢 TIER 1: OPTIMAL EXPERIENCE

### Hardware Criteria

| Component | Minimum Requirement |
|-----------|---------------------|
| **GPU** | Dedicated graphics (NVIDIA GTX 1060+, AMD RX 580+, Apple M1+) |
| **VRAM** | 4GB+ dedicated |
| **RAM** | 8GB+ system memory |
| **CPU** | Modern quad-core (Intel i5 8th gen+, AMD Ryzen 5+) |
| **Display** | 1920×1080 or higher |

### WebGL Capabilities Required

```javascript
// Tier 1 capability detection
function isTier1Device() {
  const gl = canvas.getContext('webgl2');
  if (!gl) return false;
  
  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
  const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
  
  // Check for dedicated GPU indicators
  const dedicatedGPU = /nvidia|radeon|geforce|rtx|gtx|rx\s?\d{3,4}/i.test(renderer);
  
  // Check capabilities
  const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
  const maxTextureUnits = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
  
  return dedicatedGPU && maxTextureSize >= 8192 && maxTextureUnits >= 16;
}
```

### Quality Settings

```javascript
const tier1Settings = {
  // Rendering
  pixelRatio: Math.min(window.devicePixelRatio, 2),
  antialias: true,
  shadows: true,
  shadowMapSize: 2048,
  
  // Textures
  textureSize: 4096,
  anisotropy: 16,
  
  // Effects
  postProcessing: true,
  bloom: true,
  depthOfField: true,
  ambientOcclusion: true,
  
  // Particles
  maxParticles: 2000,
  particleSize: 'full',
  
  // Animation
  targetFPS: 60,
  lodBias: 0
};
```

### Example Devices

| Category | Examples |
|----------|----------|
| Desktop | Gaming PCs, Workstations, iMac (discrete GPU) |
| Laptop | Gaming laptops, MacBook Pro 16" (M1 Pro/Max) |
| Tablet | iPad Pro (M1/M2) |
| Mobile | iPhone 14 Pro, Samsung Galaxy S23 Ultra |

---

## 🟡 TIER 2: ACCEPTABLE EXPERIENCE

### Hardware Criteria

| Component | Minimum Requirement |
|-----------|---------------------|
| **GPU** | Integrated graphics (Intel UHD 620+, AMD Vega, Apple M1) |
| **VRAM** | Shared system memory |
| **RAM** | 4-8GB system memory |
| **CPU** | Modern dual-core or older quad-core |
| **Display** | 1366×768 to 1920×1080 |

### WebGL Capabilities Required

```javascript
function isTier2Device() {
  const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
  if (!gl) return false;
  
  const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
  const maxTextureUnits = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
  
  // Must support at least 4096 textures and 8 texture units
  return maxTextureSize >= 4096 && maxTextureUnits >= 8;
}
```

### Quality Settings

```javascript
const tier2Settings = {
  // Rendering
  pixelRatio: 1.5,
  antialias: true,
  shadows: true,
  shadowMapSize: 1024,
  
  // Textures
  textureSize: 2048,
  anisotropy: 8,
  
  // Effects
  postProcessing: true,
  bloom: true,
  depthOfField: false,
  ambientOcclusion: false,
  
  // Particles
  maxParticles: 500,
  particleSize: 'medium',
  
  // Animation
  targetFPS: 60,
  lodBias: 1
};
```

### Example Devices

| Category | Examples |
|----------|----------|
| Desktop | Office PCs with integrated graphics |
| Laptop | MacBook Air (M1), Ultrabooks (2018+) |
| Tablet | iPad (2020+), Samsung Galaxy Tab S7 |
| Mobile | iPhone 12, Samsung Galaxy S21, Pixel 6 |

---

## 🟠 TIER 3: DEGRADED EXPERIENCE

### Hardware Criteria

| Component | Minimum Requirement |
|-----------|---------------------|
| **GPU** | Older integrated (Intel HD 4000-6000) |
| **RAM** | 4GB minimum |
| **CPU** | Older dual-core processors |
| **Display** | Any resolution |

### WebGL Capabilities Required

```javascript
function isTier3Device() {
  const gl = canvas.getContext('webgl');
  if (!gl) return false;
  
  const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
  
  // Basic WebGL 1.0 support with 2048 textures
  return maxTextureSize >= 2048;
}
```

### Quality Settings

```javascript
const tier3Settings = {
  // Rendering
  pixelRatio: 1,
  antialias: false,
  shadows: false,
  shadowMapSize: 0,
  
  // Textures
  textureSize: 1024,
  anisotropy: 1,
  
  // Effects
  postProcessing: false,
  bloom: false,
  depthOfField: false,
  ambientOcclusion: false,
  
  // Particles
  maxParticles: 100,
  particleSize: 'small',
  
  // Animation
  targetFPS: 30,
  lodBias: 2
};
```

### Example Devices

| Category | Examples |
|----------|----------|
| Desktop | Budget PCs, older systems (2014-2018) |
| Laptop | Chromebooks, older MacBook Air (2014-2017) |
| Tablet | iPad (2017-2019), older Android tablets |
| Mobile | iPhone 8, mid-range Android (2020) |

---

## 🔴 TIER 4: FALLBACK EXPERIENCE

### Hardware Criteria

| Criteria | Description |
|----------|-------------|
| **WebGL** | Not supported or severely limited |
| **GPU** | Very old or software rendering |
| **RAM** | <4GB |

### Fallback Detection

```javascript
function isTier4Device() {
  // No WebGL support at all
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
  
  if (!gl) return true;
  
  // Check for software renderer
  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
  if (debugInfo) {
    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
    if (/swiftshader|llvmpipe|software/i.test(renderer)) return true;
  }
  
  // Very limited texture support
  const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
  if (maxTextureSize < 2048) return true;
  
  return false;
}
```

### Fallback Content Options

| Option | Description | Size |
|--------|-------------|------|
| **Video Walkthrough** | Pre-recorded experience | ~50-100MB |
| **Image Gallery** | Key frames with parallax | ~10-20MB |
| **Static Page** | Essential content only | ~2-5MB |

```html
<!-- Fallback implementation -->
<noscript>
  <div class="fallback-experience">
    <h1>Corn. Revolutionized.</h1>
    <img src="fallback-hero.jpg" alt="3D corn visualization">
    <p>For the full interactive experience, please use a modern browser with WebGL support.</p>
    <a href="/video-experience">Watch Video Version</a>
  </div>
</noscript>
```

---

## 🔍 AUTOMATIC TIER DETECTION

### Complete Detection Algorithm

```javascript
class DeviceTierDetector {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.gl = null;
    this.tier = null;
  }
  
  detect() {
    // Try WebGL 2 first, then WebGL 1
    this.gl = this.canvas.getContext('webgl2') || this.canvas.getContext('webgl');
    
    if (!this.gl) {
      this.tier = 4;
      return this.tier;
    }
    
    const capabilities = this.getCapabilities();
    
    // Tier 1: High-end
    if (this.meetsT1Criteria(capabilities)) {
      this.tier = 1;
    }
    // Tier 2: Acceptable
    else if (this.meetsT2Criteria(capabilities)) {
      this.tier = 2;
    }
    // Tier 3: Degraded
    else if (this.meetsT3Criteria(capabilities)) {
      this.tier = 3;
    }
    // Tier 4: Fallback
    else {
      this.tier = 4;
    }
    
    return this.tier;
  }
  
  getCapabilities() {
    const gl = this.gl;
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    
    return {
      webgl2: !!this.canvas.getContext('webgl2'),
      maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
      maxTextureUnits: gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS),
      maxVertexAttribs: gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
      renderer: debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'unknown',
      vendor: debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'unknown',
      deviceMemory: navigator.deviceMemory || 4,
      hardwareConcurrency: navigator.hardwareConcurrency || 2,
      devicePixelRatio: window.devicePixelRatio || 1
    };
  }
  
  meetsT1Criteria(caps) {
    const hasDedicatedGPU = /nvidia|radeon|geforce|rtx|gtx|rx\s?\d{3,4}|apple m[1-3]/i.test(caps.renderer);
    return caps.webgl2 && 
           hasDedicatedGPU && 
           caps.maxTextureSize >= 8192 && 
           caps.deviceMemory >= 8;
  }
  
  meetsT2Criteria(caps) {
    return caps.webgl2 && 
           caps.maxTextureSize >= 4096 && 
           caps.maxTextureUnits >= 8 &&
           caps.deviceMemory >= 4;
  }
  
  meetsT3Criteria(caps) {
    return caps.maxTextureSize >= 2048 && 
           caps.maxTextureUnits >= 4;
  }
  
  getSettings() {
    const settingsMap = {
      1: tier1Settings,
      2: tier2Settings,
      3: tier3Settings,
      4: { fallback: true }
    };
    return settingsMap[this.tier];
  }
}

// Usage
const detector = new DeviceTierDetector();
const tier = detector.detect();
const settings = detector.getSettings();

console.log(`Device Tier: ${tier}`);
applyQualitySettings(settings);
```

---

## 📊 QUALITY SETTINGS COMPARISON

| Setting | Tier 1 | Tier 2 | Tier 3 | Tier 4 |
|---------|--------|--------|--------|--------|
| Pixel Ratio | 2.0 | 1.5 | 1.0 | N/A |
| Antialias | ✅ | ✅ | ❌ | N/A |
| Shadows | ✅ 2048 | ✅ 1024 | ❌ | N/A |
| Texture Size | 4096 | 2048 | 1024 | N/A |
| Post-Processing | Full | Partial | None | N/A |
| Particles | 2000 | 500 | 100 | N/A |
| Target FPS | 60 | 60 | 30 | N/A |
| LOD Bias | 0 | 1 | 2 | N/A |

---

## 📈 MARKET COVERAGE ANALYSIS

### Estimated User Distribution

```
Tier Distribution (Estimated 2024)

Tier 1 ███████████░░░░░░░░░░░░░░░░░░░ 25-30%
Tier 2 ██████████████████░░░░░░░░░░░░ 40-45%
Tier 3 ██████░░░░░░░░░░░░░░░░░░░░░░░░ 15-20%
Tier 4 ████░░░░░░░░░░░░░░░░░░░░░░░░░░ 10-15%

Total Good Experience (T1+T2): 65-75%
```

### B2B Agricultural Audience Adjustment

For Corn Revolution's target audience (agricultural professionals):

| Tier | General Market | B2B Agricultural (Est.) |
|------|----------------|-------------------------|
| Tier 1 | 25-30% | 20-25% |
| Tier 2 | 40-45% | 50-55% |
| Tier 3 | 15-20% | 15-20% |
| Tier 4 | 10-15% | 5-10% |

**Rationale**: B2B professionals typically have newer devices but may not have gaming-grade hardware.

---

## ✅ IMPLEMENTATION CHECKLIST

- [ ] Implement `DeviceTierDetector` class
- [ ] Create quality settings objects for each tier
- [ ] Implement automatic tier detection on page load
- [ ] Create fallback content for Tier 4
- [ ] Add manual quality override option
- [ ] Test on representative devices from each tier
- [ ] Monitor tier distribution in analytics

---

## 🔗 CROSS-REFERENCES

- **F2-01**: Device tier analysis (input)
- **F3-02**: Progressive enhancement plan (companion)
- **K3-01**: Performance optimization roadmap (alignment)
- **B3-03**: Asset pipeline (quality levels)

---

## 📚 VERIFIED SOURCES

| Source | Type | Used For |
|--------|------|----------|
| MDN WebGL | Mozilla Docs | Capability parameters |
| discoverthreejs.com | Three.js Learning | FPS targets |
| StatCounter | Industry Stats | Market share estimates |
| F2-01 Analysis | Internal | Tier criteria |

---
