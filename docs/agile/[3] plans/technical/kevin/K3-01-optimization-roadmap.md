# K3-01: Performance Optimization Roadmap

## 📋 METADATA
- **Persona**: Kevin Wijaya - Performance Engineer
- **Task ID**: K3-01
- **Date**: 2025-12-11
- **Sprint**: Sprint 3 - Implementation Planning
- **Status**: ✅ COMPLETED
- **Priority**: 🔴 HIGH

> [!IMPORTANT]
> **Data Classification for This Plan**
> 
> | Data Type | Status | Source |
> |-----------|--------|--------|
> | Current Performance Metrics | ✅ **VERIFIED** | K1-02 HAR Analysis |
> | Optimization Estimates | ⚠️ **PROJECTED** | Industry benchmarks |
> | Implementation Steps | ⚠️ **RECOMMENDATION** | Best practices |
> | Code Examples | 🔴 **ILLUSTRATIVE** | Standard patterns |

---

## 🎯 OBJECTIVE

Create a prioritized, actionable performance optimization roadmap for Zenotika's WebGL experiential projects, based on K2-03 analysis and verified HAR data.

---

## 📊 CURRENT STATE (Verified Baseline)

### Performance Metrics (✅ HAR Verified)

| Metric | Current Value | Target | Gap |
|--------|---------------|--------|-----|
| JS Bundle Size | **1.89 MB** | <1.0 MB | -47% needed |
| Total Transfer | **~3.5 MB** | <2.0 MB | -43% needed |
| Full Page Load | **2.11s** (broadband) | <3.0s | ✅ Met |
| Total Requests | **129** | <80 | -38% needed |
| Lighthouse Mobile | **13/100** | 30+ | +17 points |
| Lighthouse Desktop | **41/100** | 60+ | +19 points |

### Bundle Breakdown (✅ HAR Verified)

| Bundle | Size | Optimization Potential |
|--------|------|------------------------|
| `loader.js` | 410 KB | LOW (critical path) |
| `vendors~main.js` | 629.3 KB | MEDIUM (tree-shaking) |
| `main.js` | 850 KB | MEDIUM (code splitting) |
| Third-Party Analytics | ~850 KB | HIGH (lazy load) |

---

## 🚀 OPTIMIZATION ROADMAP

### Phase 1: Quick Wins (Week 1-2)

#### 1.1 Resource Preloading
**Effort**: LOW | **Impact**: MEDIUM | **Risk**: LOW

```html
<!-- Preload critical resources -->
<link rel="preload" href="/static/js/loader.js" as="script">
<link rel="preload" href="/static/js/vendors~main.js" as="script">
<link rel="modulepreload" href="/static/js/main.js">

<!-- Preconnect to CDN -->
<link rel="preconnect" href="https://d1hl9u9k5hiqxp.cloudfront.net">
<link rel="dns-prefetch" href="https://d1hl9u9k5hiqxp.cloudfront.net">
```

**Expected Improvement**: 10-15% faster critical resource loading

---

#### 1.2 Third-Party Script Optimization
**Effort**: LOW | **Impact**: HIGH | **Risk**: LOW

**Current Third-Party Load (✅ HAR Verified)**:
| Script | Size | Priority |
|--------|------|----------|
| Google Analytics (gtag) | 378.3 KB | Defer |
| Facebook Pixel | 343.1 KB | Lazy load |
| Snapchat scevent | 57.2 KB | Lazy load |
| Oracle Eloqua | 5.8 KB | Keep (lead capture) |

**Implementation**:
```html
<!-- Defer non-critical analytics -->
<script async defer src="https://www.googletagmanager.com/gtag/js"></script>

<!-- Lazy load social pixels after user interaction -->
<script>
  document.addEventListener('scroll', function loadPixels() {
    // Load FB Pixel and Snapchat after first scroll
    loadFacebookPixel();
    loadSnapchatPixel();
    document.removeEventListener('scroll', loadPixels);
  }, { once: true });
</script>
```

**Expected Improvement**: 300-500ms faster Time to Interactive

---

#### 1.3 Font Loading Strategy
**Effort**: LOW | **Impact**: MEDIUM | **Risk**: LOW

```css
@font-face {
  font-family: 'CustomFont';
  src: url('/fonts/custom.woff2') format('woff2');
  font-display: swap; /* Immediate text render with fallback */
}
```

**Expected Improvement**: Eliminates Flash of Invisible Text (FOIT)

---

### Phase 2: Asset Optimization (Week 3-4)

#### 2.1 JavaScript Bundle Optimization
**Effort**: MEDIUM | **Impact**: HIGH | **Risk**: MEDIUM

**Strategy 1: Code Splitting**
```javascript
// Split Three.js from main bundle
const ThreeModule = () => import(/* webpackChunkName: "three" */ 'three');

// Lazy load non-critical features
const ParticleSystem = () => import(/* webpackChunkName: "particles" */ './particles');
```

**Strategy 2: Tree Shaking Three.js**
```javascript
// AVOID: Importing entire Three.js
import * as THREE from 'three'; // ❌ 600KB+

// PREFER: Selective imports
import { 
  Scene, 
  PerspectiveCamera, 
  WebGLRenderer,
  MeshStandardMaterial 
} from 'three'; // ✅ ~200KB
```

**Expected Improvement**: 30-50% bundle size reduction

---

#### 2.2 Image & Texture Optimization
**Effort**: MEDIUM | **Impact**: HIGH | **Risk**: LOW

**Format Migration**:
| Current | Optimized | Size Reduction |
|---------|-----------|----------------|
| PNG/JPG | WebP | 25-35% |
| PNG/JPG | AVIF | 50-60% |
| Uncompressed textures | Basis Universal | 50-70% |

**Implementation**:
```html
<picture>
  <source srcset="image.avif" type="image/avif">
  <source srcset="image.webp" type="image/webp">
  <img src="image.jpg" alt="Fallback">
</picture>
```

---

#### 2.3 3D Asset Compression
**Effort**: MEDIUM | **Impact**: HIGH | **Risk**: LOW

**Draco Compression for Geometry**:
```javascript
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('/draco/');

const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);
```

**Expected Compression Ratios**:
| Asset Type | Uncompressed | Draco Compressed | Reduction |
|------------|--------------|------------------|-----------|
| Geometry | 1.0 MB | 0.3 MB | 70% |
| With textures | 3.0 MB | 1.2 MB | 60% |

---

### Phase 3: Advanced Optimization (Week 5-6)

#### 3.1 Progressive Loading Strategy
**Effort**: HIGH | **Impact**: HIGH | **Risk**: MEDIUM

```javascript
// Quality tiers based on device capability
const qualityTiers = {
  high: { textureSize: 4096, particles: 2000, shadows: true },
  medium: { textureSize: 2048, particles: 500, shadows: true },
  low: { textureSize: 1024, particles: 100, shadows: false }
};

// Detect and apply appropriate tier
const tier = detectDeviceTier();
applyQualitySettings(qualityTiers[tier]);
```

---

#### 3.2 Service Worker Caching
**Effort**: MEDIUM | **Impact**: MEDIUM | **Risk**: LOW

```javascript
// sw.js - Cache 3D assets for repeat visits
const CACHE_NAME = 'webgl-assets-v1';
const ASSETS_TO_CACHE = [
  '/static/js/loader.js',
  '/static/js/vendors~main.js',
  '/static/models/corn.glb',
  '/static/textures/environment.ktx2'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS_TO_CACHE))
  );
});
```

**Expected Improvement**: 80-90% faster repeat visits

---

## 📊 IMPLEMENTATION PRIORITY MATRIX

| Optimization | Effort | Impact | Priority | Timeline |
|--------------|--------|--------|----------|----------|
| Resource Preloading | LOW | MEDIUM | 🔴 P1 | Week 1 |
| Third-Party Defer | LOW | HIGH | 🔴 P1 | Week 1 |
| Font Display Swap | LOW | MEDIUM | 🔴 P1 | Week 1 |
| Code Splitting | MEDIUM | HIGH | 🔴 P1 | Week 2 |
| Image Format Migration | MEDIUM | HIGH | 🟡 P2 | Week 3 |
| Draco Compression | MEDIUM | HIGH | 🟡 P2 | Week 3 |
| Progressive Loading | HIGH | HIGH | 🟡 P2 | Week 4 |
| Service Worker | MEDIUM | MEDIUM | 🟢 P3 | Week 5 |

---

## 📈 EXPECTED OUTCOMES

### Performance Improvement Projections

| Metric | Current | After Phase 1 | After Phase 2 | After Phase 3 |
|--------|---------|---------------|---------------|---------------|
| JS Bundle | 1.89 MB | 1.5 MB | 0.9 MB | 0.8 MB |
| Total Transfer | 3.5 MB | 3.0 MB | 2.0 MB | 1.5 MB |
| Lighthouse Mobile | 13 | 20 | 30 | 40+ |
| Lighthouse Desktop | 41 | 50 | 60 | 70+ |

### ROI Analysis

| Phase | Effort (Days) | Expected Improvement | ROI |
|-------|---------------|----------------------|-----|
| Phase 1 | 3-5 | 15-20% faster load | HIGH |
| Phase 2 | 10-15 | 30-40% smaller assets | HIGH |
| Phase 3 | 15-20 | 50%+ faster repeat | MEDIUM |

---

## ⚠️ IMPLEMENTATION RISKS

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Visual quality degradation | MEDIUM | HIGH | A/B test before deploy |
| Browser compatibility | LOW | MEDIUM | Feature detection |
| Draco decoder overhead | LOW | LOW | Async loading |
| Service worker bugs | MEDIUM | MEDIUM | Staged rollout |

---

## ✅ SUCCESS CRITERIA

- [ ] Lighthouse Mobile score ≥30
- [ ] Lighthouse Desktop score ≥60
- [ ] Total transfer size <2.0 MB
- [ ] Time to Interactive <5s on 4G
- [ ] No visual quality regression
- [ ] Awwwards Design score maintained (8.9/10)

---

## 🔗 CROSS-REFERENCES

- **K2-03**: Optimization opportunities analysis (input)
- **K3-02**: Compression implementation guide (companion)
- **K3-03**: Monitoring strategy (follow-up)
- **B3-03**: Asset pipeline (coordination)
- **F3-02**: Progressive enhancement (alignment)

---

## 📚 VERIFIED SOURCES

| Source | Type | Used For |
|--------|------|----------|
| K1-02 HAR Analysis | Internal | Current metrics |
| web.dev Performance | Google Docs | Best practices |
| Three.js Optimization | Official Docs | Code patterns |
| Draco Documentation | Google | Compression specs |

---
