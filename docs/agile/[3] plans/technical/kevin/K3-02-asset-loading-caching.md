# K3-02: Asset Loading & Caching Strategy

## 📋 METADATA
- **Persona**: Kevin Wijaya - Frontend Performance Specialist
- **Task ID**: K3-02
- **Date**: 2025-12-11
- **Sprint**: Sprint 3 - Implementation Planning
- **Status**: ✅ COMPLETED
- **Priority**: 🟡 MEDIUM

> [!IMPORTANT]
> **Data Classification for This Plan**
> 
> | Data Type | Status | Source |
> |-----------|--------|--------|
> | Request Count | ✅ **VERIFIED** | HAR file (129 requests) |
> | Transfer Size | ✅ **VERIFIED** | HAR file (3.5MB) |
> | Cache Headers | ✅ **VERIFIED** | HAR file |
> | Strategy | ⚠️ **RECOMMENDATION** | Based on best practices |

---

## 🎯 OBJECTIVE

Design comprehensive asset loading and caching strategy to minimize load time, reduce bandwidth consumption, and improve perceived performance across all device tiers.

---

## 📊 CURRENT STATE ANALYSIS

### HAR Verified Asset Distribution

| Asset Type | Count | Size | % of Total |
|------------|-------|------|------------|
| JavaScript | ~15 | 1.89MB | 54% |
| Images | ~30 | 800KB | 23% |
| 3D Models | ~5 | 400KB | 11% |
| Fonts | ~4 | 150KB | 4% |
| CSS | ~5 | 100KB | 3% |
| Other | ~70 | 160KB | 5% |
| **Total** | **129** | **3.5MB** | **100%** |

### Current Cache Strategy Issues

| Issue | Impact | Priority |
|-------|--------|----------|
| No service worker | Offline unavailable | HIGH |
| Short cache TTL | Repeat downloads | HIGH |
| No preloading | Slow LCP | MEDIUM |
| Large bundles | Blocking render | MEDIUM |

---

## 🚀 PRELOADING STRATEGY

### Critical Path Resources

```html
<head>
  <!-- DNS Prefetch for external resources -->
  <link rel="dns-prefetch" href="//fonts.googleapis.com">
  <link rel="dns-prefetch" href="//cdn.example.com">
  
  <!-- Preconnect for critical origins -->
  <link rel="preconnect" href="https://fonts.googleapis.com" crossorigin>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  
  <!-- Preload critical CSS -->
  <link rel="preload" href="/css/critical.css" as="style">
  
  <!-- Preload hero font -->
  <link rel="preload" href="/fonts/playfair-display.woff2" as="font" type="font/woff2" crossorigin>
  
  <!-- Preload hero image/texture -->
  <link rel="preload" href="/textures/hero-corn.ktx2" as="fetch" crossorigin>
  
  <!-- Preload critical JS -->
  <link rel="preload" href="/js/app.critical.js" as="script">
  
  <!-- Prefetch next-stage resources -->
  <link rel="prefetch" href="/models/corn-lod1.glb" as="fetch">
  <link rel="prefetch" href="/textures/environment.ktx2" as="fetch">
</head>
```

### Preloading Priority Matrix

| Resource | Priority | Preload Type | When |
|----------|----------|--------------|------|
| Critical CSS | Highest | preload | Immediate |
| Hero font | Highest | preload | Immediate |
| Core JS | High | preload | Immediate |
| Hero 3D model | High | preload | Immediate |
| Hero texture | High | preload | Immediate |
| Secondary models | Medium | prefetch | After LCP |
| Environment | Medium | prefetch | After LCP |
| Tertiary assets | Low | lazy | On scroll |

### JavaScript Preload Manager

```javascript
// Asset preloading manager
class PreloadManager {
  constructor() {
    this.loaded = new Set();
    this.loading = new Map();
    this.queue = [];
    this.maxConcurrent = 4;
  }
  
  // Priority-based preloading
  async preloadCritical() {
    const critical = [
      { url: '/textures/hero.ktx2', type: 'texture', priority: 1 },
      { url: '/models/hero.glb', type: 'model', priority: 1 },
      { url: '/textures/environment.ktx2', type: 'texture', priority: 2 }
    ];
    
    // Load priority 1 first
    const priority1 = critical.filter(a => a.priority === 1);
    await Promise.all(priority1.map(a => this.load(a)));
    
    // Then priority 2
    const priority2 = critical.filter(a => a.priority === 2);
    await Promise.all(priority2.map(a => this.load(a)));
  }
  
  async load(asset) {
    if (this.loaded.has(asset.url)) {
      return this.loaded.get(asset.url);
    }
    
    if (this.loading.has(asset.url)) {
      return this.loading.get(asset.url);
    }
    
    const promise = this.fetchAsset(asset);
    this.loading.set(asset.url, promise);
    
    try {
      const result = await promise;
      this.loaded.add(asset.url);
      return result;
    } finally {
      this.loading.delete(asset.url);
    }
  }
  
  async fetchAsset(asset) {
    const response = await fetch(asset.url);
    
    switch (asset.type) {
      case 'texture':
        return this.loadTexture(response);
      case 'model':
        return this.loadModel(response);
      case 'json':
        return response.json();
      default:
        return response.blob();
    }
  }
  
  async loadTexture(response) {
    const buffer = await response.arrayBuffer();
    // Return for Three.js loader
    return buffer;
  }
  
  async loadModel(response) {
    const buffer = await response.arrayBuffer();
    // Return for GLTFLoader
    return buffer;
  }
}

// Usage
const preloader = new PreloadManager();

// Start preloading on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  preloader.preloadCritical();
});
```

---

## 📦 LAZY LOADING IMPLEMENTATION

### Intersection Observer Lazy Loading

```javascript
// Lazy load manager using IntersectionObserver
class LazyLoadManager {
  constructor(options = {}) {
    this.rootMargin = options.rootMargin || '200px';
    this.threshold = options.threshold || 0.01;
    this.loadedElements = new Set();
    
    this.observer = new IntersectionObserver(
      this.handleIntersection.bind(this),
      {
        rootMargin: this.rootMargin,
        threshold: this.threshold
      }
    );
  }
  
  observe(element) {
    if (element.dataset.lazy) {
      this.observer.observe(element);
    }
  }
  
  handleIntersection(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        this.loadElement(entry.target);
        this.observer.unobserve(entry.target);
      }
    });
  }
  
  async loadElement(element) {
    const type = element.dataset.lazyType || 'image';
    
    switch (type) {
      case 'image':
        await this.loadImage(element);
        break;
      case 'model':
        await this.loadModel(element);
        break;
      case 'texture':
        await this.loadTexture(element);
        break;
    }
    
    element.classList.add('loaded');
    this.loadedElements.add(element);
  }
  
  async loadImage(element) {
    const src = element.dataset.lazySrc;
    
    // Create promise for load event
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        element.src = src;
        resolve();
      };
      img.onerror = reject;
      img.src = src;
    });
  }
  
  async loadModel(element) {
    const src = element.dataset.lazySrc;
    const loader = new GLTFLoader();
    
    return new Promise((resolve, reject) => {
      loader.load(src, resolve, undefined, reject);
    });
  }
}

// Usage
const lazyLoader = new LazyLoadManager({ rootMargin: '300px' });

// Observe all lazy elements
document.querySelectorAll('[data-lazy]').forEach(el => {
  lazyLoader.observe(el);
});
```

### Scroll-Based 3D Asset Loading

```javascript
// Progressive 3D asset loading based on scroll position
class ProgressiveLoader {
  constructor(scene) {
    this.scene = scene;
    this.scrollTriggers = new Map();
    
    this.setupScrollTriggers();
  }
  
  setupScrollTriggers() {
    // Define scroll-triggered assets
    const triggers = [
      { scrollPercent: 0, assets: ['hero-model', 'hero-texture'] },
      { scrollPercent: 25, assets: ['section2-model', 'section2-texture'] },
      { scrollPercent: 50, assets: ['section3-model', 'section3-texture'] },
      { scrollPercent: 75, assets: ['finale-model', 'finale-texture'] }
    ];
    
    triggers.forEach(trigger => {
      ScrollTrigger.create({
        trigger: document.body,
        start: `${trigger.scrollPercent}% top`,
        onEnter: () => this.loadAssets(trigger.assets),
        once: true
      });
    });
  }
  
  async loadAssets(assetIds) {
    const promises = assetIds.map(id => this.loadAsset(id));
    await Promise.all(promises);
  }
  
  async loadAsset(id) {
    const assetConfig = this.getAssetConfig(id);
    
    console.log(`Loading asset: ${id}`);
    
    // Fetch and decode
    const response = await fetch(assetConfig.url);
    const data = await this.processResponse(response, assetConfig.type);
    
    // Add to scene
    this.addToScene(data, assetConfig);
    
    console.log(`Asset loaded: ${id}`);
  }
}
```

---

## 💾 CACHING STRATEGY

### Cache-Control Headers

```
# Server configuration (nginx)
location ~* \.(js)$ {
    expires 1y;
    add_header Cache-Control "public, max-age=31536000, immutable";
}

location ~* \.(css)$ {
    expires 1y;
    add_header Cache-Control "public, max-age=31536000, immutable";
}

location ~* \.(woff2|woff|ttf)$ {
    expires 1y;
    add_header Cache-Control "public, max-age=31536000, immutable";
}

location ~* \.(glb|gltf|ktx2|basis)$ {
    expires 1y;
    add_header Cache-Control "public, max-age=31536000, immutable";
}

location ~* \.(jpg|jpeg|png|webp|avif)$ {
    expires 1y;
    add_header Cache-Control "public, max-age=31536000, immutable";
}

# HTML - no cache for versioning
location ~* \.html$ {
    add_header Cache-Control "no-cache, must-revalidate";
}
```

### Service Worker Caching

```javascript
// service-worker.js
const CACHE_NAME = 'corn-revolution-v1';
const STATIC_CACHE = 'static-v1';
const DYNAMIC_CACHE = 'dynamic-v1';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/critical.css',
  '/js/app.js',
  '/fonts/playfair-display.woff2',
  '/fonts/open-sans.woff2'
];

// 3D assets to cache on first use
const CACHEABLE_PATTERNS = [
  /\.glb$/,
  /\.gltf$/,
  /\.ktx2$/,
  /\.basis$/,
  /\.webp$/
];

// Install event - cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
          .map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fall back to network
self.addEventListener('fetch', event => {
  const request = event.request;
  
  // Skip non-GET requests
  if (request.method !== 'GET') return;
  
  // Cache-first for static assets
  if (STATIC_ASSETS.includes(new URL(request.url).pathname)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }
  
  // Cache-first for 3D assets
  if (isCacheable(request.url)) {
    event.respondWith(cacheFirst(request, DYNAMIC_CACHE));
    return;
  }
  
  // Network-first for everything else
  event.respondWith(networkFirst(request));
});

// Cache-first strategy
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  if (cached) {
    return cached;
  }
  
  const response = await fetch(request);
  
  if (response.ok) {
    cache.put(request, response.clone());
  }
  
  return response;
}

// Network-first strategy
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    throw error;
  }
}

// Check if URL matches cacheable patterns
function isCacheable(url) {
  return CACHEABLE_PATTERNS.some(pattern => pattern.test(url));
}
```

### IndexedDB for Large Assets

```javascript
// IndexedDB manager for large 3D assets
class AssetDB {
  constructor(dbName = 'CornRevolutionAssets', version = 1) {
    this.dbName = dbName;
    this.version = version;
    this.db = null;
  }
  
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create object stores
        if (!db.objectStoreNames.contains('models')) {
          db.createObjectStore('models', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('textures')) {
          db.createObjectStore('textures', { keyPath: 'id' });
        }
      };
    });
  }
  
  async store(storeName, id, data, metadata = {}) {
    const tx = this.db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    
    const record = {
      id,
      data,
      timestamp: Date.now(),
      ...metadata
    };
    
    return new Promise((resolve, reject) => {
      const request = store.put(record);
      request.onsuccess = () => resolve(record);
      request.onerror = () => reject(request.error);
    });
  }
  
  async get(storeName, id) {
    const tx = this.db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  
  async has(storeName, id) {
    const record = await this.get(storeName, id);
    return !!record;
  }
  
  async clear(storeName) {
    const tx = this.db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    return store.clear();
  }
}

// Usage
const assetDB = new AssetDB();
await assetDB.init();

// Store a model
await assetDB.store('models', 'hero-corn', modelArrayBuffer, {
  version: '1.0',
  size: modelArrayBuffer.byteLength
});

// Retrieve a model
const cachedModel = await assetDB.get('models', 'hero-corn');
```

---

## 📊 LOADING STATES

### Progressive Loading UI

```javascript
// Loading state manager
class LoadingStateManager {
  constructor() {
    this.state = 'idle';
    this.progress = 0;
    this.stages = [];
    this.listeners = [];
  }
  
  setState(state, progress = 0) {
    this.state = state;
    this.progress = progress;
    this.notify();
  }
  
  addStage(name, weight) {
    this.stages.push({ name, weight, progress: 0 });
  }
  
  updateStage(name, progress) {
    const stage = this.stages.find(s => s.name === name);
    if (stage) {
      stage.progress = progress;
      this.calculateTotalProgress();
    }
  }
  
  calculateTotalProgress() {
    const totalWeight = this.stages.reduce((sum, s) => sum + s.weight, 0);
    const weightedProgress = this.stages.reduce(
      (sum, s) => sum + (s.progress * s.weight / 100),
      0
    );
    this.progress = (weightedProgress / totalWeight) * 100;
    this.notify();
  }
  
  onUpdate(callback) {
    this.listeners.push(callback);
  }
  
  notify() {
    this.listeners.forEach(callback => {
      callback({ state: this.state, progress: this.progress });
    });
  }
}

// Usage
const loadingManager = new LoadingStateManager();

loadingManager.addStage('scripts', 30);
loadingManager.addStage('models', 40);
loadingManager.addStage('textures', 30);

loadingManager.onUpdate(({ state, progress }) => {
  document.querySelector('.loading-bar').style.width = `${progress}%`;
  document.querySelector('.loading-text').textContent = `Loading... ${Math.round(progress)}%`;
});

// Update as assets load
loadingManager.updateStage('scripts', 100);
loadingManager.updateStage('models', 50);
loadingManager.updateStage('textures', 25);
```

---

## 🚀 IMPLEMENTATION ROADMAP

### Phase 1: Preloading (Week 1)
- [ ] Add preload hints to HTML
- [ ] Implement PreloadManager class
- [ ] Test critical path loading

### Phase 2: Lazy Loading (Week 2)
- [ ] Implement IntersectionObserver
- [ ] Add scroll-triggered loading
- [ ] Test progressive loading

### Phase 3: Caching (Week 3)
- [ ] Configure server cache headers
- [ ] Implement service worker
- [ ] Add IndexedDB for large assets

### Phase 4: Optimization (Week 4)
- [ ] Test across network conditions
- [ ] Optimize loading sequence
- [ ] Document performance gains

---

## 🔗 CROSS-REFERENCES

- **K3-01**: Performance optimization (companion)
- **K3-03**: Monitoring implementation (companion)
- **F3-01**: Device tier strategy (alignment)
- **A3-01**: WebGL optimization (coordination)

---

## 📚 VERIFIED SOURCES

| Source | Type | Used For |
|--------|------|----------|
| HAR File | Project | Asset inventory |
| web.dev | Google Docs | Preload best practices |
| MDN | Mozilla | Service Worker API |
| Chrome DevTools | Official | Performance analysis |

---
