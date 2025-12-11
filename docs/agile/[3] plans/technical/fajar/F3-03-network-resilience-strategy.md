# F3-03: Network Resilience Strategy
## Adaptive Loading for Variable Connections

---

## Document Information

| Field | Value |
|-------|-------|
| **Document ID** | F3-03 |
| **Sprint** | 3 - Implementation Planning |
| **Persona** | Fajar Ramadhan (Compatibility Engineer) |
| **Priority** | 🟡 MEDIUM |
| **Status** | ✅ COMPLETED |
| **Created** | 2025-12-11 |
| **References** | F2-02, K3-02, F3-02 |

---

## 📋 Executive Summary

This strategy defines network-aware loading implementations for WebGL experiences. Based on Sprint 2 analysis showing 3.5MB total transfer with 129 requests, this document provides adaptive loading strategies that maintain user engagement across varying network conditions.

---

## 📊 Network Tier Classification

### Connection Speed Tiers

| Tier | Speed | RTT | Strategy |
|------|-------|-----|----------|
| **Fast** | >10 Mbps | <50ms | Full experience |
| **Medium** | 1-10 Mbps | 50-150ms | Optimized loading |
| **Slow** | 100KB-1Mbps | 150-400ms | Progressive enhancement |
| **Offline** | 0 | N/A | Cached/fallback content |

### Detection Implementation

```javascript
// ILLUSTRATIVE EXAMPLE - Network Tier Detection

class NetworkDetector {
  constructor() {
    this.tier = 'medium';
    this.connection = navigator.connection || 
                      navigator.mozConnection || 
                      navigator.webkitConnection;
    
    this.init();
  }
  
  init() {
    if (this.connection) {
      this.tier = this.getTierFromAPI();
      
      // Listen for connection changes
      this.connection.addEventListener('change', () => {
        this.tier = this.getTierFromAPI();
        this.onTierChange(this.tier);
      });
    } else {
      // Fallback to timing-based detection
      this.measureConnectionSpeed();
    }
  }
  
  getTierFromAPI() {
    const { effectiveType, downlink, rtt } = this.connection;
    
    // Use effective connection type
    const tierMap = {
      '4g': 'fast',
      '3g': 'medium',
      '2g': 'slow',
      'slow-2g': 'offline'
    };
    
    // Override based on actual metrics if available
    if (downlink > 10) return 'fast';
    if (downlink < 0.5) return 'slow';
    if (rtt > 400) return 'slow';
    
    return tierMap[effectiveType] || 'medium';
  }
  
  async measureConnectionSpeed() {
    const testUrl = '/api/speed-test'; // Small test file
    const start = performance.now();
    
    try {
      const response = await fetch(testUrl);
      const blob = await response.blob();
      const duration = (performance.now() - start) / 1000;
      const bitsLoaded = blob.size * 8;
      const speedMbps = (bitsLoaded / duration) / 1000000;
      
      if (speedMbps > 10) this.tier = 'fast';
      else if (speedMbps > 1) this.tier = 'medium';
      else this.tier = 'slow';
    } catch (error) {
      this.tier = 'slow'; // Assume slow on error
    }
    
    return this.tier;
  }
  
  onTierChange(newTier) {
    // Dispatch event for app to respond
    window.dispatchEvent(new CustomEvent('networktierchange', {
      detail: { tier: newTier }
    }));
  }
}
```

---

## 🔧 Loading Strategy by Tier

### Fast Network (>10 Mbps)

| Asset Type | Strategy | Details |
|------------|----------|---------|
| 3D Models | Full quality | GLB with original textures |
| Textures | 2K-4K | ETC2/ASTC compression |
| Preloading | Aggressive | Next 2 sections |
| Video | Full HD | If applicable |

```javascript
// ILLUSTRATIVE EXAMPLE - Fast Network Loading

const fastNetworkConfig = {
  textureResolution: 2048,
  modelDetail: 'high',
  preloadSections: 2,
  cacheStrategy: 'cache-first',
  compression: 'etc2', // WebGL 2.0 native
  lazyLoadThreshold: 2000 // px before viewport
};
```

### Medium Network (1-10 Mbps)

| Asset Type | Strategy | Details |
|------------|----------|---------|
| 3D Models | LOD system | Load low, upgrade on idle |
| Textures | 1K initial | Progressive upgrade |
| Preloading | Conservative | Current + next section |
| Video | 720p | Or image fallback |

```javascript
// ILLUSTRATIVE EXAMPLE - Medium Network Loading

const mediumNetworkConfig = {
  textureResolution: 1024,
  modelDetail: 'medium',
  preloadSections: 1,
  cacheStrategy: 'stale-while-revalidate',
  compression: 'basis', // Cross-platform
  lazyLoadThreshold: 1000,
  
  // Progressive upgrade settings
  upgradeOnIdle: true,
  upgradeDelay: 3000 // ms after load
};
```

### Slow Network (100KB-1Mbps)

| Asset Type | Strategy | Details |
|------------|----------|---------|
| 3D Models | Minimal | Critical geometry only |
| Textures | 512px max | Heavy compression |
| Preloading | None | On-demand only |
| Video | Disabled | Static image replacement |

```javascript
// ILLUSTRATIVE EXAMPLE - Slow Network Loading

const slowNetworkConfig = {
  textureResolution: 512,
  modelDetail: 'low',
  preloadSections: 0,
  cacheStrategy: 'cache-only',
  compression: 'basis-lowest',
  
  // Aggressive optimization
  disablePostProcessing: true,
  disableParticles: true,
  disableShadows: true,
  
  // UI feedback
  showLoadingProgress: true,
  showDataSaverMode: true
};
```

### Offline Mode

```javascript
// ILLUSTRATIVE EXAMPLE - Offline Experience

const offlineConfig = {
  strategy: 'cached-fallback',
  
  // Pre-cached assets for offline
  cachedAssets: [
    'models/hero-low.glb',
    'textures/critical-512.ktx2',
    'fallback/static-experience.html'
  ],
  
  // UI messaging
  offlineMessage: 'You are offline. Viewing cached content.',
  
  // Feature disabling
  disableWebGL: false, // Show cached 3D if available
  disableForms: true,
  showOfflineBanner: true
};
```

---

## 📡 Data Saver Mode

### Implementation

```javascript
// ILLUSTRATIVE EXAMPLE - Data Saver Detection

class DataSaverDetector {
  constructor() {
    this.isDataSaverEnabled = this.detect();
  }
  
  detect() {
    // Check for Save-Data header (requires server support)
    // Client-side: check connection API
    const connection = navigator.connection;
    
    if (connection) {
      return connection.saveData === true;
    }
    
    return false;
  }
  
  getConfig() {
    if (this.isDataSaverEnabled) {
      return {
        loadWebGL: false, // Skip heavy 3D
        loadImages: 'lazy',
        imageQuality: 'low',
        showDataSaverNotice: true,
        offerFullExperience: true
      };
    }
    
    return {
      loadWebGL: true,
      loadImages: 'eager',
      imageQuality: 'auto'
    };
  }
}
```

### User Choice Interface

```html
<!-- ILLUSTRATIVE EXAMPLE - Data Saver UI -->
<div class="data-saver-notice" role="alert">
  <h2>Data Saver Mode Detected</h2>
  <p>We've loaded a lighter version to save your data.</p>
  <p>Data used: ~500KB (vs 3.5MB full experience)</p>
  
  <div class="choices">
    <button id="keep-light">Keep Light Version</button>
    <button id="load-full">Load Full Experience</button>
  </div>
</div>

<script>
// Respect user choice
document.getElementById('load-full').addEventListener('click', () => {
  localStorage.setItem('dataPreference', 'full');
  location.reload();
});
</script>
```

---

## 📊 Bandwidth-Based Asset Selection

### Texture Resolution Matrix

| Network Tier | Texture Size | Format | Est. Size |
|--------------|--------------|--------|-----------|
| Fast | 2048×2048 | ETC2 | ~1.3MB |
| Medium | 1024×1024 | Basis | ~300KB |
| Slow | 512×512 | Basis-low | ~75KB |
| Offline | 256×256 | Cached | ~20KB |

### Implementation

```javascript
// ILLUSTRATIVE EXAMPLE - Adaptive Texture Loading

class AdaptiveTextureLoader {
  constructor(networkTier) {
    this.tier = networkTier;
    this.loader = new THREE.KTX2Loader();
  }
  
  getTextureURL(baseName) {
    const resolutions = {
      fast: '2k',
      medium: '1k',
      slow: '512',
      offline: '256'
    };
    
    const res = resolutions[this.tier];
    return `textures/${baseName}-${res}.ktx2`;
  }
  
  async load(baseName) {
    const url = this.getTextureURL(baseName);
    
    try {
      const texture = await this.loader.loadAsync(url);
      return texture;
    } catch (error) {
      // Fallback to lower resolution
      console.warn(`Failed to load ${url}, trying fallback`);
      return this.loadFallback(baseName);
    }
  }
  
  async loadFallback(baseName) {
    const url = `textures/${baseName}-256.ktx2`;
    return this.loader.loadAsync(url);
  }
}
```

---

## 🔄 Progressive Loading Pattern

### Section-Based Loading

```javascript
// ILLUSTRATIVE EXAMPLE - Section Progressive Loading

class ProgressiveSectionLoader {
  constructor(networkDetector) {
    this.network = networkDetector;
    this.sections = [];
    this.loadedSections = new Set();
  }
  
  registerSection(id, assets) {
    this.sections.push({
      id,
      assets,
      priority: this.calculatePriority(id)
    });
  }
  
  async loadSection(sectionId) {
    const section = this.sections.find(s => s.id === sectionId);
    if (!section || this.loadedSections.has(sectionId)) return;
    
    const tier = this.network.tier;
    const assetsToLoad = this.filterAssetsByTier(section.assets, tier);
    
    // Load critical assets first
    const critical = assetsToLoad.filter(a => a.critical);
    await Promise.all(critical.map(a => this.loadAsset(a)));
    
    // Load remaining assets based on network
    if (tier !== 'slow' && tier !== 'offline') {
      const remaining = assetsToLoad.filter(a => !a.critical);
      
      // Stagger loading to avoid bandwidth saturation
      for (const asset of remaining) {
        await this.loadAsset(asset);
        await this.delay(100); // Breathing room
      }
    }
    
    this.loadedSections.add(sectionId);
  }
  
  filterAssetsByTier(assets, tier) {
    return assets.map(asset => ({
      ...asset,
      url: asset.urls[tier] || asset.urls.low
    }));
  }
  
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### Upgrade-on-Idle Pattern

```javascript
// ILLUSTRATIVE EXAMPLE - Quality Upgrade When Idle

class QualityUpgrader {
  constructor(scene, networkDetector) {
    this.scene = scene;
    this.network = networkDetector;
    this.upgradePending = [];
    this.isIdle = false;
    
    this.setupIdleDetection();
  }
  
  setupIdleDetection() {
    // Use requestIdleCallback if available
    if ('requestIdleCallback' in window) {
      this.scheduleUpgrade = (callback) => {
        requestIdleCallback(callback, { timeout: 5000 });
      };
    } else {
      // Fallback: use setTimeout after user inactivity
      this.scheduleUpgrade = (callback) => {
        setTimeout(callback, 3000);
      };
    }
    
    // Track user activity
    let idleTimer;
    const resetIdle = () => {
      this.isIdle = false;
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        this.isIdle = true;
        this.processUpgrades();
      }, 2000);
    };
    
    ['scroll', 'mousemove', 'touchstart'].forEach(event => {
      window.addEventListener(event, resetIdle, { passive: true });
    });
  }
  
  queueUpgrade(mesh, highQualityTextureUrl) {
    this.upgradePending.push({ mesh, url: highQualityTextureUrl });
    
    if (this.isIdle && this.network.tier !== 'slow') {
      this.processUpgrades();
    }
  }
  
  processUpgrades() {
    if (this.upgradePending.length === 0) return;
    if (this.network.tier === 'slow') return;
    
    const upgrade = this.upgradePending.shift();
    
    this.scheduleUpgrade(async () => {
      const texture = await this.loadHighQuality(upgrade.url);
      upgrade.mesh.material.map = texture;
      upgrade.mesh.material.needsUpdate = true;
      
      // Continue with next upgrade
      this.processUpgrades();
    });
  }
}
```

---

## 📦 Service Worker Network Strategies

### Strategy by Asset Type

| Asset Type | Strategy | Rationale |
|------------|----------|-----------|
| HTML | Network-first | Always fresh content |
| JS/CSS | Stale-while-revalidate | Quick load, update in background |
| 3D Models | Cache-first | Large, rarely updated |
| Textures | Cache-first | Large, rarely updated |
| API Calls | Network-only | Dynamic data |

### Implementation

```javascript
// ILLUSTRATIVE EXAMPLE - Service Worker Strategies

// service-worker.js
const CACHE_NAME = 'corn-revolution-v1';

// Strategy functions
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
    return response;
  } catch (error) {
    return caches.match(request);
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  
  try {
    const response = await fetch(request);
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
    return response;
  } catch (error) {
    return new Response('Asset unavailable offline', { status: 503 });
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  
  const fetchPromise = fetch(request).then(response => {
    cache.put(request, response.clone());
    return response;
  });
  
  return cached || fetchPromise;
}

// Route matching
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  if (url.pathname.endsWith('.html')) {
    event.respondWith(networkFirst(event.request));
  } else if (url.pathname.match(/\.(glb|ktx2)$/)) {
    event.respondWith(cacheFirst(event.request));
  } else if (url.pathname.match(/\.(js|css)$/)) {
    event.respondWith(staleWhileRevalidate(event.request));
  }
});
```

---

## 📊 Loading Progress Communication

### Progress UI

```javascript
// ILLUSTRATIVE EXAMPLE - Loading Progress

class LoadingProgressUI {
  constructor() {
    this.container = document.getElementById('loading-progress');
    this.items = new Map();
  }
  
  addItem(id, label, size) {
    this.items.set(id, {
      label,
      size,
      loaded: 0,
      complete: false
    });
    
    this.render();
  }
  
  updateItem(id, loaded) {
    const item = this.items.get(id);
    if (item) {
      item.loaded = loaded;
      item.complete = loaded >= item.size;
      this.render();
    }
  }
  
  render() {
    const totalSize = Array.from(this.items.values())
      .reduce((sum, item) => sum + item.size, 0);
    const totalLoaded = Array.from(this.items.values())
      .reduce((sum, item) => sum + item.loaded, 0);
    
    const percent = Math.round((totalLoaded / totalSize) * 100);
    
    this.container.innerHTML = `
      <div class="progress-bar" role="progressbar" 
           aria-valuenow="${percent}" aria-valuemin="0" aria-valuemax="100">
        <div class="progress-fill" style="width: ${percent}%"></div>
      </div>
      <p class="progress-text">${percent}% loaded</p>
      <p class="progress-size">
        ${this.formatBytes(totalLoaded)} / ${this.formatBytes(totalSize)}
      </p>
    `;
  }
  
  formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
}
```

---

## ✅ Implementation Checklist

### Pre-Launch

- [ ] Network Detection API implemented
- [ ] Tier-based asset variants created
- [ ] Service Worker registered
- [ ] Offline fallback page created
- [ ] Data Saver detection added
- [ ] Loading progress UI implemented

### Testing

- [ ] Test on throttled connections
- [ ] Test offline mode
- [ ] Verify progressive loading
- [ ] Measure time-to-interactive by tier
- [ ] Test tier transitions (e.g., WiFi → 3G)

---

## 🔗 Cross-References

| Document | Relationship |
|----------|--------------|
| F2-02 (Network Impact) | Analysis foundation |
| K3-02 (Asset Loading) | Caching integration |
| F3-02 (Fallback Content) | Offline experience |
| F3-01 (Device Support) | Combined device+network tiers |

---

## 📊 Data Classification

| Category | Classification |
|----------|----------------|
| **Primary Data** | HAR file (3.5MB transfer, 129 requests) |
| **Industry Standards** | Network Information API, Service Worker API |
| **Code Examples** | Illustrative (not from live site) |
| **Recommendations** | Based on web.dev best practices |

---

*Document Status: ✅ COMPLETED*
*Last Updated: 2025-12-11*
