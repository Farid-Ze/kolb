# 🔧 ZENOTIKA TECHNICAL STANDARDS REFERENCE

## Consolidated Technical Specifications for WebGL Projects

**Based on**: Corn Revolution Analysis & Industry Best Practices  
**Version**: 1.0  
**Date**: 2025-12-11  
**Status**: ✅ FINAL

---

## 📋 QUICK REFERENCE

### Core Metrics at a Glance

| Category | Metric | Target | Critical |
|----------|--------|--------|----------|
| **Performance** | LCP | <2.5s | <4.0s |
| **Performance** | FID | <100ms | <300ms |
| **Performance** | CLS | <0.1 | <0.25 |
| **Performance** | FPS | 60fps | 30fps |
| **Bundle** | Initial JS | <500KB | <1MB |
| **Bundle** | Total Transfer | <3MB | <5MB |
| **3D** | Triangles (mobile) | <200K | <500K |
| **3D** | Texture Memory | <256MB | <512MB |

---

## 🏗️ TECHNOLOGY STACK

### Recommended Stack

```yaml
Core:
  3D Engine: Three.js r160+
  Animation: GSAP 3.x with ScrollTrigger
  Build Tool: Vite 5.x
  Language: TypeScript 5.x

State Management:
  Primary: Zustand
  Alternative: Jotai

Tooling:
  Linting: ESLint + Prettier
  Testing: Vitest + Playwright
  Types: TypeScript strict mode

Compression:
  3D Models: Draco
  Textures: Basis Universal / KTX2
  General: Brotli
```

### Version Requirements

| Technology | Minimum | Recommended | Notes |
|------------|---------|-------------|-------|
| Three.js | r150 | r160+ | WebGPU support in latest |
| GSAP | 3.0 | 3.12+ | ScrollTrigger improvements |
| Node.js | 18.x | 20.x LTS | Build environment |
| TypeScript | 5.0 | 5.3+ | Decorators support |

---

## ⚡ PERFORMANCE SPECIFICATIONS

### Loading Performance

#### Critical Rendering Path

```
LOADING SEQUENCE
├── [0-500ms] Critical CSS + Loader UI
├── [500-1500ms] Core JavaScript bundle
├── [1500-2500ms] First scene assets
├── [2500ms+] Progressive secondary assets
└── [Background] Preload next scenes
```

#### Asset Loading Priority

| Priority | Assets | Strategy |
|----------|--------|----------|
| P0 (Critical) | Loader UI, core JS | Inline/preload |
| P1 (High) | First scene, fonts | Eager load |
| P2 (Medium) | Next scene | Preload |
| P3 (Low) | Remaining scenes | Lazy load |
| P4 (Optional) | Enhancements | Load on idle |

### Runtime Performance

#### Frame Budget (60fps)

```
16.67ms FRAME BUDGET
├── JavaScript: <8ms
├── Style/Layout: <2ms
├── Paint: <2ms
├── Composite: <1ms
└── Buffer: ~3ms
```

#### Memory Budgets

| Resource | Budget | Monitoring |
|----------|--------|------------|
| JS Heap | <100MB | performance.memory |
| Texture Memory | <256MB | renderer.info |
| Geometry Memory | <50MB | renderer.info |
| Total GPU | <512MB | WebGL extensions |

### Optimization Techniques

#### JavaScript

```javascript
// Object pooling
class ObjectPool {
  constructor(factory, initialSize = 10) {
    this.factory = factory;
    this.pool = Array.from({ length: initialSize }, () => factory());
  }
  
  acquire() {
    return this.pool.pop() || this.factory();
  }
  
  release(obj) {
    obj.reset?.();
    this.pool.push(obj);
  }
}

// Throttled updates
const throttledUpdate = throttle((progress) => {
  updateScene(progress);
}, 16); // ~60fps
```

#### Three.js

```javascript
// Instanced meshes for repeated objects
const instancedMesh = new THREE.InstancedMesh(
  geometry,
  material,
  instanceCount
);

// LOD implementation
const lod = new THREE.LOD();
lod.addLevel(highDetailMesh, 0);
lod.addLevel(mediumDetailMesh, 50);
lod.addLevel(lowDetailMesh, 100);

// Efficient disposal
function disposeObject(obj) {
  obj.traverse((child) => {
    if (child.geometry) child.geometry.dispose();
    if (child.material) {
      if (Array.isArray(child.material)) {
        child.material.forEach(m => disposeMaterial(m));
      } else {
        disposeMaterial(child.material);
      }
    }
  });
}

function disposeMaterial(material) {
  material.dispose();
  for (const key of Object.keys(material)) {
    if (material[key]?.isTexture) {
      material[key].dispose();
    }
  }
}
```

---

## 🎮 WEBGL SPECIFICATIONS

### Context Configuration

```javascript
const contextAttributes = {
  alpha: false,           // Opaque background
  antialias: true,        // Enable AA (tier 1-2 only)
  depth: true,            // Enable depth buffer
  stencil: false,         // Disable if unused
  powerPreference: 'high-performance',
  preserveDrawingBuffer: false,
  failIfMajorPerformanceCaveat: false
};

const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById('canvas'),
  ...contextAttributes
});

// Pixel ratio management
const maxPixelRatio = 2;
renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxPixelRatio));
```

### Shader Standards

```glsl
// Vertex shader template
precision highp float;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform float uTime;

attribute vec3 position;
attribute vec2 uv;

varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}

// Fragment shader template
precision highp float;

uniform sampler2D uTexture;
uniform float uProgress;

varying vec2 vUv;

void main() {
  vec4 color = texture2D(uTexture, vUv);
  gl_FragColor = color;
}
```

### Texture Specifications

| Tier | Max Size | Format | Compression |
|------|----------|--------|-------------|
| Tier 1 | 2048x2048 | KTX2/Basis | UASTC |
| Tier 2 | 1024x1024 | KTX2/Basis | ETC1S |
| Tier 3 | 512x512 | WebP/PNG | Standard |

### Model Specifications

| Tier | Max Triangles | Max Draw Calls | Max Bones |
|------|---------------|----------------|-----------|
| Tier 1 | 500K | 100 | 64 |
| Tier 2 | 200K | 50 | 32 |
| Tier 3 | 100K | 25 | 16 |

---

## 📁 CODE STANDARDS

### File Structure

```
src/
├── assets/
│   ├── models/          # 3D models (.glb, .gltf)
│   ├── textures/        # Textures (.ktx2, .webp)
│   └── audio/           # Sound files (.mp3, .ogg)
├── components/
│   ├── ui/              # UI components
│   └── three/           # Three.js components
├── scenes/
│   ├── Scene1/
│   │   ├── index.ts
│   │   ├── Scene1.ts
│   │   └── assets.ts
│   └── Scene2/
├── core/
│   ├── Engine.ts        # Three.js setup
│   ├── SceneManager.ts  # Scene orchestration
│   ├── AssetLoader.ts   # Asset pipeline
│   └── CapabilityDetector.ts
├── utils/
│   ├── math.ts
│   ├── animation.ts
│   └── performance.ts
├── types/
│   └── index.ts
└── main.ts
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Files (components) | PascalCase | `SceneManager.ts` |
| Files (utilities) | camelCase | `mathUtils.ts` |
| Classes | PascalCase | `class AssetLoader` |
| Functions | camelCase | `function loadAssets()` |
| Constants | SCREAMING_SNAKE | `const MAX_TRIANGLES` |
| Interfaces | IPascalCase | `interface ISceneConfig` |
| Types | TPascalCase | `type TDeviceTier` |

### TypeScript Configuration

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "useDefineForClassFields": true,
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "preserve",
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

### ESLint Configuration

```javascript
module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'prettier'
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/no-explicit-any': 'error',
    'no-console': ['warn', { allow: ['warn', 'error'] }]
  }
};
```

---

## 🧪 TESTING STANDARDS

### Test Coverage Requirements

| Type | Coverage | Focus |
|------|----------|-------|
| Unit Tests | >80% | Utilities, state logic |
| Integration | Key flows | Scene transitions, loading |
| E2E | Critical paths | Full user journeys |
| Visual | Key components | UI consistency |
| Performance | All tiers | Load time, FPS |

### Testing Tools

```javascript
// Vitest for unit tests
import { describe, it, expect, vi } from 'vitest';

describe('CapabilityDetector', () => {
  it('should detect WebGL 2 support', () => {
    const mockCanvas = {
      getContext: vi.fn().mockReturnValue({})
    };
    vi.spyOn(document, 'createElement').mockReturnValue(mockCanvas);
    
    const tier = detectCapabilityTier();
    expect(tier).toBeDefined();
  });
});

// Playwright for E2E
import { test, expect } from '@playwright/test';

test('complete scroll journey', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('.loader-complete');
  
  // Scroll through experience
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
  });
  
  await expect(page.locator('.final-cta')).toBeVisible();
});
```

---

## 🔒 SECURITY STANDARDS

### Content Security Policy

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'unsafe-eval' https://www.googletagmanager.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob: https:;
  font-src 'self';
  connect-src 'self' https://www.google-analytics.com;
  worker-src 'self' blob:;
```

### Security Checklist

- [ ] HTTPS enforced
- [ ] CSP headers configured
- [ ] XSS protection enabled
- [ ] CORS properly configured
- [ ] No sensitive data in client code
- [ ] Dependencies audited (npm audit)
- [ ] Form inputs sanitized
- [ ] Rate limiting on API endpoints

---

## 🌐 BROWSER SUPPORT

### Target Browsers

| Browser | Version | Support Level |
|---------|---------|---------------|
| Chrome | 90+ | Full |
| Safari | 14+ | Full |
| Firefox | 90+ | Full |
| Edge | 90+ | Full |
| Chrome Mobile | 90+ | Full |
| Safari iOS | 14+ | Full |
| Samsung Internet | 15+ | Basic |

### Feature Detection

```javascript
const browserSupport = {
  webgl2: !!document.createElement('canvas').getContext('webgl2'),
  webgl: !!document.createElement('canvas').getContext('webgl'),
  webp: document.createElement('canvas').toDataURL('image/webp').includes('webp'),
  avif: false, // Async check required
  intersectionObserver: 'IntersectionObserver' in window,
  resizeObserver: 'ResizeObserver' in window,
  webShare: 'share' in navigator
};
```

---

## 📦 BUILD & DEPLOYMENT

### Vite Configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    target: 'es2022',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          gsap: ['gsap'],
          vendor: ['zustand']
        }
      }
    },
    reportCompressedSize: true,
    chunkSizeWarningLimit: 500
  },
  optimizeDeps: {
    include: ['three', 'gsap']
  }
});
```

### Deployment Checklist

- [ ] Production build successful
- [ ] Bundle sizes within budget
- [ ] Assets compressed (Brotli/Gzip)
- [ ] CDN configured
- [ ] Cache headers set
- [ ] Error tracking enabled
- [ ] Performance monitoring active
- [ ] Rollback procedure documented

---

## 📊 MONITORING & ALERTS

### Key Metrics to Monitor

| Metric | Threshold | Alert Level |
|--------|-----------|-------------|
| LCP p75 | >3.0s | 🟡 Warning |
| LCP p75 | >4.0s | 🔴 Critical |
| Error rate | >1% | 🟡 Warning |
| Error rate | >5% | 🔴 Critical |
| Avg FPS | <45 | 🟡 Warning |
| Avg FPS | <30 | 🔴 Critical |

### Monitoring Tools

| Tool | Purpose |
|------|---------|
| Google Analytics 4 | User behavior, conversions |
| Google Search Console | SEO, Core Web Vitals |
| Sentry | Error tracking |
| Custom | WebGL performance |

---

## 📚 DOCUMENT REFERENCES

| Topic | Document |
|-------|----------|
| Performance Details | `validation/technical/kevin/K4-01-performance-checklist.md` |
| WebGL Architecture | `validation/technical/andi/A4-01-webgl-guidelines.md` |
| Code Standards | `validation/technical/andi/A4-02-code-standards.md` |
| Device Matrix | `validation/technical/fajar/F4-02-device-matrix.md` |
| QA Protocol | `validation/technical/amanda/AM4-02-qa-protocol.md` |

---

## 📊 DATA CLASSIFICATION

| Data Type | Classification | Source |
|-----------|----------------|--------|
| Performance targets | ✅ VERIFIED | Google Web Vitals |
| Browser support | ✅ VERIFIED | CanIUse, MDN |
| Three.js specs | ✅ VERIFIED | Three.js documentation |
| Security standards | ✅ VERIFIED | OWASP guidelines |

---

**Document Version**: 1.0  
**Last Updated**: 2025-12-11  
**Approved By**: Technical Team
