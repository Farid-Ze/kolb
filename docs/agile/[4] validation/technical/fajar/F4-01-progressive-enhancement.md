# F4-01: Progressive Enhancement Playbook

## 📋 METADATA
- **Task ID**: F4-01
- **Persona**: Fajar Ramadhan (Frontend Specialist)
- **Sprint**: 4 - Validation & Handoff
- **Status**: ✅ COMPLETED
- **Created**: 2025-12-11
- **Dependencies**: F1-01/02/03, F2-01/02/03, F3-01/02/03

---

## 🎯 OBJECTIVE

Provide a comprehensive progressive enhancement playbook for Zenotika WebGL projects ensuring experiences work across all device capabilities.

---

## 📖 PROGRESSIVE ENHANCEMENT PLAYBOOK

### Core Philosophy

> **"Everyone gets an experience; capable devices get the best experience."**

Progressive enhancement for WebGL means:
1. Base experience works for everyone
2. Enhanced features added based on capability
3. Graceful degradation when features unavailable
4. No broken experiences, only different ones

---

### 1. Device Capability Detection

#### Detection Strategy
```typescript
// ILLUSTRATIVE EXAMPLE - Capability Detection
interface DeviceCapabilities {
  tier: 1 | 2 | 3 | 4;
  webgl: 1 | 2 | false;
  gpu: 'high' | 'medium' | 'low' | 'unknown';
  memory: number; // GB
  cores: number;
  connection: 'fast' | 'medium' | 'slow';
  touchDevice: boolean;
  reducedMotion: boolean;
}

function detectCapabilities(): DeviceCapabilities {
  return {
    tier: detectDeviceTier(),
    webgl: detectWebGLVersion(),
    gpu: detectGPUTier(),
    memory: navigator.deviceMemory || 4,
    cores: navigator.hardwareConcurrency || 4,
    connection: detectConnectionSpeed(),
    touchDevice: 'ontouchstart' in window,
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches
  };
}

function detectDeviceTier(): 1 | 2 | 3 | 4 {
  const gl = getWebGLContext();
  if (!gl) return 4;
  
  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
  const renderer = debugInfo 
    ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
    : '';
  
  // High-end detection
  if (/RTX|RX 6|RX 7|M1|M2|M3/i.test(renderer)) return 1;
  
  // Mid-range detection  
  if (/GTX|RX 5|Intel Iris|Apple GPU/i.test(renderer)) return 2;
  
  // Low-end detection
  if (/Intel HD|Adreno 5|Mali-G/i.test(renderer)) return 3;
  
  // Fallback
  return 4;
}
```

### 2. Experience Tiers

#### Tier Definitions

| Tier | Name | Target Devices | Experience Level |
|------|------|----------------|------------------|
| **1** | Premium | High-end desktop/laptop, Gaming PCs | Full quality, all effects |
| **2** | Standard | Mid-range devices, Modern phones | High quality, most effects |
| **3** | Basic | Low-end devices, Older phones | Reduced quality, essential effects |
| **4** | Fallback | Very old devices, No WebGL | Static/2D experience |

#### Tier Feature Matrix

| Feature | Tier 1 | Tier 2 | Tier 3 | Tier 4 |
|---------|--------|--------|--------|--------|
| 3D Models | Full LOD | Medium LOD | Low LOD | Images |
| Textures | 2K | 1K | 512px | Optimized images |
| Post-processing | Full | Limited | None | N/A |
| Shadows | Real-time | Baked | None | N/A |
| Particles | 1000+ | 500 | 100 | None |
| Animation | 60 FPS | 45 FPS | 30 FPS | CSS only |
| Reflections | Real-time | Cubemap | None | N/A |

### 3. Implementation Patterns

#### Quality Preset System
```typescript
// ILLUSTRATIVE EXAMPLE - Quality Presets
interface QualityPreset {
  name: string;
  resolution: number; // Render scale
  shadows: boolean;
  shadowMapSize: number;
  antialias: boolean;
  postProcessing: boolean;
  particleCount: number;
  lodBias: number;
  textureQuality: 'high' | 'medium' | 'low';
}

const QUALITY_PRESETS: Record<number, QualityPreset> = {
  1: {
    name: 'Ultra',
    resolution: 1,
    shadows: true,
    shadowMapSize: 2048,
    antialias: true,
    postProcessing: true,
    particleCount: 1000,
    lodBias: 0,
    textureQuality: 'high'
  },
  2: {
    name: 'High',
    resolution: 1,
    shadows: true,
    shadowMapSize: 1024,
    antialias: true,
    postProcessing: true,
    particleCount: 500,
    lodBias: 1,
    textureQuality: 'medium'
  },
  3: {
    name: 'Medium',
    resolution: 0.75,
    shadows: false,
    shadowMapSize: 0,
    antialias: false,
    postProcessing: false,
    particleCount: 100,
    lodBias: 2,
    textureQuality: 'low'
  },
  4: {
    name: 'Fallback',
    resolution: 0,
    shadows: false,
    shadowMapSize: 0,
    antialias: false,
    postProcessing: false,
    particleCount: 0,
    lodBias: 0,
    textureQuality: 'low'
  }
};
```

#### Adaptive Loading
```typescript
// ILLUSTRATIVE EXAMPLE - Adaptive Asset Loading
class AdaptiveLoader {
  private tier: number;
  
  constructor(tier: number) {
    this.tier = tier;
  }
  
  getModelPath(baseName: string): string {
    const suffix = {
      1: '-high.glb',
      2: '-medium.glb',
      3: '-low.glb',
      4: '' // No 3D for tier 4
    }[this.tier];
    
    return suffix ? `/models/${baseName}${suffix}` : '';
  }
  
  getTexturePath(baseName: string): string {
    const suffix = {
      1: '-2k.basis',
      2: '-1k.basis',
      3: '-512.basis',
      4: '.webp'
    }[this.tier];
    
    return `/textures/${baseName}${suffix}`;
  }
  
  shouldLoadFeature(feature: string): boolean {
    const featureTiers: Record<string, number> = {
      'postProcessing': 2,
      'shadows': 2,
      'reflections': 1,
      'particles': 3,
      'animation': 3
    };
    
    return this.tier <= (featureTiers[feature] ?? 4);
  }
}
```

### 4. Fallback Strategies

#### WebGL Fallback (Tier 4)
```typescript
// ILLUSTRATIVE EXAMPLE - Fallback Detection
function initializeExperience(): void {
  const capabilities = detectCapabilities();
  
  if (capabilities.tier === 4 || !capabilities.webgl) {
    initializeFallbackExperience();
  } else {
    initializeWebGLExperience(capabilities);
  }
}

function initializeFallbackExperience(): void {
  // Replace canvas with optimized images
  const container = document.getElementById('webgl-container');
  container.innerHTML = `
    <div class="fallback-experience">
      <picture>
        <source srcset="/fallback/hero.avif" type="image/avif">
        <source srcset="/fallback/hero.webp" type="image/webp">
        <img src="/fallback/hero.jpg" alt="Experience preview">
      </picture>
      <div class="fallback-content">
        <!-- Essential content accessible to all -->
      </div>
    </div>
  `;
}
```

#### Graceful Feature Degradation
```typescript
// ILLUSTRATIVE EXAMPLE - Feature Degradation
class RenderPipeline {
  private capabilities: DeviceCapabilities;
  
  setupPostProcessing(): void {
    if (!this.capabilities.webgl || this.capabilities.tier >= 3) {
      return; // Skip post-processing
    }
    
    try {
      if (this.capabilities.tier === 1) {
        this.setupFullPostProcessing();
      } else {
        this.setupLimitedPostProcessing();
      }
    } catch (error) {
      console.warn('Post-processing unavailable:', error);
      // Continue without post-processing
    }
  }
}
```

### 5. Network Adaptation

#### Connection-Based Quality
```typescript
// ILLUSTRATIVE EXAMPLE - Network Adaptation
function getNetworkAdjustedTier(baseTier: number): number {
  const connection = (navigator as any).connection;
  
  if (!connection) return baseTier;
  
  const effectiveType = connection.effectiveType;
  
  switch (effectiveType) {
    case '4g':
      return baseTier; // Use detected tier
    case '3g':
      return Math.min(baseTier + 1, 4); // Reduce by one tier
    case '2g':
    case 'slow-2g':
      return 4; // Force fallback
    default:
      return baseTier;
  }
}
```

### 6. Accessibility Integration

#### Reduced Motion
```typescript
// ILLUSTRATIVE EXAMPLE - Reduced Motion Support
class AnimationController {
  private reducedMotion: boolean;
  
  constructor() {
    this.reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    
    // Listen for changes
    window.matchMedia('(prefers-reduced-motion: reduce)')
      .addEventListener('change', (e) => {
        this.reducedMotion = e.matches;
        this.updateAnimations();
      });
  }
  
  animate(target: object, props: gsap.TweenVars): gsap.core.Tween {
    if (this.reducedMotion) {
      // Instant state change, no animation
      return gsap.set(target, props);
    }
    return gsap.to(target, props);
  }
}
```

---

## ✅ IMPLEMENTATION CHECKLIST

### Detection Setup
- [ ] WebGL version detection
- [ ] GPU capability detection
- [ ] Device memory detection
- [ ] Network speed detection
- [ ] Touch device detection
- [ ] Reduced motion detection

### Experience Tiers
- [ ] Tier 1 (Premium) assets prepared
- [ ] Tier 2 (Standard) assets prepared
- [ ] Tier 3 (Basic) assets prepared
- [ ] Tier 4 (Fallback) experience ready

### Quality Adaptation
- [ ] Quality preset system implemented
- [ ] Adaptive asset loading working
- [ ] Feature degradation tested
- [ ] Network adaptation active

### Testing
- [ ] All tiers tested on representative devices
- [ ] Fallback experience verified
- [ ] Performance targets met per tier
- [ ] Accessibility features working

---

## 📚 CROSS-REFERENCES

| Document | Content |
|----------|---------|
| F3-01 | Device tier matrix |
| F3-02 | Progressive enhancement specs |
| F4-02 | Device compatibility matrix |
| AM4-03 | Inclusive design standards |

---

## 📊 DATA CLASSIFICATION

| Data Type | Classification | Source |
|-----------|----------------|--------|
| Device tiers | ✅ VERIFIED | Industry standards |
| Detection APIs | ✅ VERIFIED | MDN documentation |
| Feature support | ✅ VERIFIED | Can I Use |

---

**Document Status**: ✅ COMPLETED  
**Last Updated**: 2025-12-11  
**Owner**: Fajar Ramadhan (Frontend Specialist)
