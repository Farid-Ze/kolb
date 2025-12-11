# F3-02: Fallback Content Implementation Plan

## 📋 METADATA
- **Persona**: Fajar Nugroho - Cross-Browser Specialist
- **Task ID**: F3-02
- **Date**: 2025-12-11
- **Sprint**: Sprint 3 - Implementation Planning
- **Status**: ✅ COMPLETED
- **Priority**: 🟡 MEDIUM

> [!IMPORTANT]
> **Data Classification for This Plan**
> 
> | Data Type | Status | Source |
> |-----------|--------|--------|
> | WebGL Support | ✅ **VERIFIED** | Can I Use (98.5%) |
> | Browser Stats | ✅ **VERIFIED** | StatCounter 2024 |
> | Device Data | ✅ **VERIFIED** | F2-01 Analysis |
> | Strategy | ⚠️ **RECOMMENDATION** | Based on best practices |

---

## 🎯 OBJECTIVE

Design and implement graceful fallback content strategy for users whose devices cannot support the full WebGL experience, ensuring no user is excluded from core content.

---

## 📊 FALLBACK SCENARIOS

### WebGL Support Matrix

| Scenario | % of Users | Fallback Needed |
|----------|------------|-----------------|
| WebGL 2.0 support | 94.5% | No |
| WebGL 1.0 only | 2.5% | Partial |
| No WebGL | 1.5% | Full |
| Low-end GPU | 5% | Performance |
| Disabled graphics | <1% | Full |

**Source**: Can I Use, StatCounter 2024 ✅

### Fallback Trigger Conditions

| Condition | Detection | Fallback Level |
|-----------|-----------|----------------|
| No WebGL | Context creation fails | Full |
| WebGL 1.0 only | Version check | Partial |
| Low GPU memory | Extension check | Performance |
| Software renderer | Renderer string | Performance |
| Mobile low-end | Device detection | Performance |
| Slow network | Connection API | Progressive |

---

## 🔍 CAPABILITY DETECTION

### Comprehensive Detection System

```javascript
// Device capability detection
class CapabilityDetector {
  constructor() {
    this.capabilities = {};
    this.tier = null;
    this.fallbackLevel = 'none';
  }
  
  async detect() {
    this.capabilities = {
      webgl2: this.checkWebGL2(),
      webgl1: this.checkWebGL1(),
      gpu: await this.getGPUInfo(),
      memory: this.getMemoryInfo(),
      connection: this.getConnectionInfo(),
      touch: this.isTouchDevice(),
      mobile: this.isMobile()
    };
    
    this.tier = this.calculateTier();
    this.fallbackLevel = this.determineFallback();
    
    return {
      capabilities: this.capabilities,
      tier: this.tier,
      fallbackLevel: this.fallbackLevel
    };
  }
  
  checkWebGL2() {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2');
      return !!gl;
    } catch {
      return false;
    }
  }
  
  checkWebGL1() {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      return !!gl;
    } catch {
      return false;
    }
  }
  
  async getGPUInfo() {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    
    if (!gl) return { supported: false };
    
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = debugInfo 
      ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) 
      : 'Unknown';
    
    const isSoftware = renderer.toLowerCase().includes('swiftshader') ||
                       renderer.toLowerCase().includes('software') ||
                       renderer.toLowerCase().includes('llvmpipe');
    
    // Check for low-end indicators
    const isLowEnd = this.isLowEndGPU(renderer);
    
    return {
      supported: true,
      renderer,
      isSoftware,
      isLowEnd,
      maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
      maxViewportDims: gl.getParameter(gl.MAX_VIEWPORT_DIMS),
      extensions: gl.getSupportedExtensions()
    };
  }
  
  isLowEndGPU(renderer) {
    const lowEndPatterns = [
      /intel.*hd\s*(graphics|[234]000)/i,
      /intel.*uhd\s*(graphics|[56]00)/i,
      /mali.*4[0-9]{2}/i,
      /adreno.*[234][0-9]{2}/i,
      /powervr.*sgx/i
    ];
    
    return lowEndPatterns.some(pattern => pattern.test(renderer));
  }
  
  getMemoryInfo() {
    if (navigator.deviceMemory) {
      return {
        deviceMemory: navigator.deviceMemory,
        isLowMemory: navigator.deviceMemory < 4
      };
    }
    return { deviceMemory: null, isLowMemory: false };
  }
  
  getConnectionInfo() {
    if (navigator.connection) {
      return {
        effectiveType: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink,
        saveData: navigator.connection.saveData,
        isSlow: ['slow-2g', '2g', '3g'].includes(navigator.connection.effectiveType)
      };
    }
    return { effectiveType: null, isSlow: false };
  }
  
  isTouchDevice() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }
  
  isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }
  
  calculateTier() {
    const { webgl2, gpu, memory, connection, mobile } = this.capabilities;
    
    // Tier 1: High-end
    if (webgl2 && !gpu.isLowEnd && !memory.isLowMemory && !connection.isSlow) {
      return 1;
    }
    
    // Tier 2: Mid-range
    if (webgl2 && !gpu.isSoftware) {
      return 2;
    }
    
    // Tier 3: Low-end
    if (webgl2 || this.capabilities.webgl1) {
      return 3;
    }
    
    // No WebGL support
    return 0;
  }
  
  determineFallback() {
    const { webgl2, webgl1, gpu } = this.capabilities;
    
    if (!webgl2 && !webgl1) return 'full';
    if (gpu.isSoftware) return 'full';
    if (!webgl2 && webgl1) return 'partial';
    if (gpu.isLowEnd) return 'performance';
    
    return 'none';
  }
}

// Usage
const detector = new CapabilityDetector();
const { capabilities, tier, fallbackLevel } = await detector.detect();

console.log('Device Tier:', tier);
console.log('Fallback Level:', fallbackLevel);
```

---

## 🖼️ FALLBACK CONTENT TYPES

### Full Fallback (No WebGL)

```html
<!-- Full fallback: Video/Image sequence -->
<div id="fallback-full" class="fallback-container" hidden>
  <div class="fallback-header">
    <h1>Corn Revolution</h1>
    <p>Experience the future of agriculture</p>
  </div>
  
  <!-- Video fallback -->
  <video class="fallback-video" 
         autoplay 
         muted 
         playsinline 
         loop
         poster="/fallback/hero-poster.jpg">
    <source src="/fallback/experience.webm" type="video/webm">
    <source src="/fallback/experience.mp4" type="video/mp4">
    
    <!-- Image fallback if video fails -->
    <img src="/fallback/hero-static.jpg" 
         alt="Corn Revolution - An immersive agricultural experience" 
         class="fallback-image">
  </video>
  
  <!-- Key content sections as static images -->
  <section class="fallback-section">
    <img src="/fallback/section-1.jpg" 
         alt="The journey begins in the cornfield"
         loading="lazy">
    <div class="fallback-content">
      <h2>The Journey Begins</h2>
      <p>Discover how modern technology transforms agriculture...</p>
    </div>
  </section>
  
  <section class="fallback-section">
    <img src="/fallback/section-2.jpg" 
         alt="Innovation in action"
         loading="lazy">
    <div class="fallback-content">
      <h2>Innovation in Action</h2>
      <p>See the technology that drives the revolution...</p>
    </div>
  </section>
  
  <!-- Call to action -->
  <section class="fallback-cta">
    <h2>Ready to Learn More?</h2>
    <a href="#contact" class="cta-button">Get in Touch</a>
  </section>
</div>
```

### Partial Fallback (WebGL 1.0)

```javascript
// WebGL 1.0 compatible scene
class WebGL1FallbackScene {
  constructor(container) {
    this.container = container;
    this.renderer = new THREE.WebGLRenderer({
      canvas: container.querySelector('canvas'),
      antialias: false, // Disable for performance
      powerPreference: 'low-power'
    });
    
    // Use WebGL 1.0 compatible features only
    this.setupScene();
  }
  
  setupScene() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, this.getAspect(), 0.1, 1000);
    
    // Simple geometry (no advanced features)
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshPhongMaterial({ 
      color: 0xF7C948,
      // No PBR, just Phong
    });
    
    this.mesh = new THREE.Mesh(geometry, material);
    this.scene.add(this.mesh);
    
    // Simple lighting
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(1, 1, 1);
    this.scene.add(light);
    
    const ambient = new THREE.AmbientLight(0x404040);
    this.scene.add(ambient);
  }
  
  // Simplified textures (JPEG/PNG only, no compressed formats)
  loadTextures() {
    const loader = new THREE.TextureLoader();
    
    return Promise.all([
      new Promise(resolve => loader.load('/fallback/albedo.jpg', resolve)),
      new Promise(resolve => loader.load('/fallback/normal.jpg', resolve))
    ]);
  }
}
```

### Performance Fallback (Low-End GPU)

```javascript
// Reduced quality settings for low-end devices
const performanceFallbackSettings = {
  renderer: {
    antialias: false,
    powerPreference: 'low-power',
    precision: 'mediump',
    pixelRatio: 1 // Never use device pixel ratio
  },
  
  scene: {
    maxObjects: 50,
    maxLights: 2,
    shadows: false,
    fog: false
  },
  
  textures: {
    maxSize: 512,
    format: 'jpeg',
    mipmaps: false,
    anisotropy: 1
  },
  
  models: {
    useLOD: true,
    maxTriangles: 50000,
    skipAnimations: true
  },
  
  particles: {
    maxCount: 100,
    skipIfLow: true
  },
  
  postProcessing: {
    enabled: false
  }
};

// Apply performance fallback
function applyPerformanceFallback(renderer, scene) {
  const settings = performanceFallbackSettings;
  
  // Renderer
  renderer.setPixelRatio(settings.renderer.pixelRatio);
  renderer.shadowMap.enabled = settings.scene.shadows;
  
  // Reduce scene complexity
  scene.traverse(obj => {
    if (obj.isMesh) {
      // Simplify materials
      if (obj.material.map) {
        obj.material.map.minFilter = THREE.LinearFilter;
        obj.material.map.generateMipmaps = false;
      }
      
      // Remove unnecessary maps
      obj.material.normalMap = null;
      obj.material.roughnessMap = null;
      obj.material.metalnessMap = null;
    }
  });
  
  // Reduce particle counts
  scene.children.forEach(child => {
    if (child.isPoints && child.geometry.attributes.position) {
      const positions = child.geometry.attributes.position;
      if (positions.count > settings.particles.maxCount) {
        // Reduce particle count
        const newGeometry = new THREE.BufferGeometry();
        const newPositions = new Float32Array(settings.particles.maxCount * 3);
        for (let i = 0; i < settings.particles.maxCount * 3; i++) {
          newPositions[i] = positions.array[i];
        }
        newGeometry.setAttribute('position', new THREE.BufferAttribute(newPositions, 3));
        child.geometry = newGeometry;
      }
    }
  });
}
```

---

## 🎨 FALLBACK STYLING

```css
/* Fallback Container */
.fallback-container {
  width: 100%;
  min-height: 100vh;
  background: linear-gradient(180deg, #1A1A2E 0%, #0F0F1A 100%);
  color: #FFFFFF;
}

/* Fallback Header */
.fallback-header {
  text-align: center;
  padding: 80px 20px;
}

.fallback-header h1 {
  font-size: clamp(32px, 6vw, 64px);
  margin-bottom: 16px;
}

/* Fallback Video */
.fallback-video {
  width: 100%;
  max-height: 60vh;
  object-fit: cover;
}

/* Fallback Sections */
.fallback-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  padding: 60px 40px;
  align-items: center;
}

.fallback-section:nth-child(even) {
  direction: rtl;
}

.fallback-section:nth-child(even) > * {
  direction: ltr;
}

.fallback-section img {
  width: 100%;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.fallback-content h2 {
  font-size: 32px;
  margin-bottom: 16px;
  color: #F7C948;
}

.fallback-content p {
  font-size: 18px;
  line-height: 1.6;
  color: #BDBDBD;
}

/* Fallback CTA */
.fallback-cta {
  text-align: center;
  padding: 80px 20px;
  background: linear-gradient(180deg, transparent 0%, rgba(247, 201, 72, 0.1) 100%);
}

.cta-button {
  display: inline-block;
  padding: 16px 48px;
  background: #F7C948;
  color: #1A1A2E;
  font-size: 18px;
  font-weight: 700;
  border-radius: 8px;
  text-decoration: none;
  transition: transform 200ms, box-shadow 200ms;
}

.cta-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 30px rgba(247, 201, 72, 0.4);
}

/* Mobile Fallback */
@media (max-width: 768px) {
  .fallback-section {
    grid-template-columns: 1fr;
    gap: 20px;
    padding: 40px 20px;
  }
  
  .fallback-section:nth-child(even) {
    direction: ltr;
  }
}

/* No WebGL Message */
.no-webgl-message {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  z-index: 1000;
}

.no-webgl-message a {
  color: #F7C948;
  text-decoration: underline;
}
```

---

## 🔄 FALLBACK ORCHESTRATION

```javascript
// Main fallback orchestrator
class FallbackOrchestrator {
  constructor() {
    this.detector = new CapabilityDetector();
    this.currentMode = 'loading';
  }
  
  async initialize() {
    const { capabilities, tier, fallbackLevel } = await this.detector.detect();
    
    console.log(`Device capabilities detected:`, capabilities);
    console.log(`Device tier: ${tier}, Fallback level: ${fallbackLevel}`);
    
    // Track for analytics
    this.trackCapabilities(capabilities, tier, fallbackLevel);
    
    // Initialize appropriate experience
    switch (fallbackLevel) {
      case 'full':
        await this.initFullFallback();
        break;
      case 'partial':
        await this.initPartialFallback();
        break;
      case 'performance':
        await this.initPerformanceFallback();
        break;
      default:
        await this.initFullExperience();
    }
  }
  
  async initFullFallback() {
    this.currentMode = 'full-fallback';
    
    // Hide WebGL container
    document.getElementById('webgl-container').hidden = true;
    
    // Show fallback content
    document.getElementById('fallback-full').hidden = false;
    
    // Show notification
    this.showFallbackNotification('video');
  }
  
  async initPartialFallback() {
    this.currentMode = 'partial-fallback';
    
    // Initialize WebGL 1.0 compatible scene
    const scene = new WebGL1FallbackScene(
      document.getElementById('webgl-container')
    );
    
    this.showFallbackNotification('webgl1');
  }
  
  async initPerformanceFallback() {
    this.currentMode = 'performance-fallback';
    
    // Initialize full experience with reduced settings
    const { renderer, scene } = await this.initFullExperience();
    applyPerformanceFallback(renderer, scene);
    
    this.showFallbackNotification('performance');
  }
  
  async initFullExperience() {
    this.currentMode = 'full';
    
    // Initialize full WebGL experience
    const app = new WebGLApp(document.getElementById('webgl-container'));
    await app.init();
    
    return app;
  }
  
  showFallbackNotification(type) {
    const messages = {
      video: 'Viewing optimized video experience. <a href="/requirements">Learn more</a>',
      webgl1: 'Running in compatibility mode for best performance.',
      performance: 'Running optimized for your device. <a href="/requirements">Upgrade tips</a>'
    };
    
    const notification = document.createElement('div');
    notification.className = 'no-webgl-message';
    notification.innerHTML = messages[type];
    document.body.appendChild(notification);
    
    // Auto-hide after 10 seconds
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => notification.remove(), 300);
    }, 10000);
  }
  
  trackCapabilities(capabilities, tier, fallbackLevel) {
    if (window.gtag) {
      gtag('event', 'device_capabilities', {
        event_category: 'system',
        webgl2: capabilities.webgl2,
        tier: tier,
        fallback: fallbackLevel,
        gpu: capabilities.gpu.renderer,
        mobile: capabilities.mobile
      });
    }
  }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', async () => {
  const orchestrator = new FallbackOrchestrator();
  await orchestrator.initialize();
});
```

---

## 📱 FALLBACK ASSET PREPARATION

### Asset Checklist

| Asset Type | Full Fallback | Partial | Performance |
|------------|---------------|---------|-------------|
| Hero video | Required | Optional | N/A |
| Hero image | Required | Required | Required |
| Section images | Required | N/A | N/A |
| Low-poly models | N/A | Required | N/A |
| Reduced textures | N/A | Required | Required |

### Video Encoding

```bash
# Hero video - WebM (VP9)
ffmpeg -i source.mp4 \
  -c:v libvpx-vp9 \
  -crf 30 \
  -b:v 1M \
  -an \
  -vf "scale=1280:-1" \
  fallback/experience.webm

# Hero video - MP4 (H.264)
ffmpeg -i source.mp4 \
  -c:v libx264 \
  -crf 23 \
  -preset medium \
  -an \
  -vf "scale=1280:-1" \
  fallback/experience.mp4

# Poster image
ffmpeg -i source.mp4 \
  -vframes 1 \
  -q:v 2 \
  -vf "scale=1280:-1" \
  fallback/hero-poster.jpg
```

---

## 🚀 IMPLEMENTATION ROADMAP

### Phase 1: Detection (Week 1)
- [ ] Implement capability detector
- [ ] Test across device types
- [ ] Set up tracking

### Phase 2: Full Fallback (Week 2)
- [ ] Create video content
- [ ] Design static sections
- [ ] Implement CSS fallback

### Phase 3: Partial Fallback (Week 3)
- [ ] Create WebGL 1.0 scene
- [ ] Prepare reduced textures
- [ ] Test on legacy browsers

### Phase 4: Integration (Week 4)
- [ ] Implement orchestrator
- [ ] A/B test fallbacks
- [ ] Monitor analytics

---

## 🔗 CROSS-REFERENCES

- **F2-01**: Device tier analysis (input)
- **F2-02**: Network impact study (input)
- **F3-01**: Device support matrix (companion)
- **AM3-01**: Accessibility fallbacks (coordination)

---

## 📚 VERIFIED SOURCES

| Source | Type | Used For |
|--------|------|----------|
| Can I Use | Database | WebGL support stats |
| StatCounter | Database | Browser market share |
| F2-01 Analysis | Project | Device tier data |
| Three.js Docs | Official | WebGL compatibility |

---
