# A4-03: Technology Stack Recommendations

## 📋 METADATA
- **Task ID**: A4-03
- **Persona**: Andi Pratama (Senior Developer)
- **Sprint**: 4 - Validation & Handoff
- **Status**: ✅ COMPLETED
- **Created**: 2025-12-11
- **Dependencies**: A2-01, A3-03, K4-02

---

## 🎯 OBJECTIVE

Define the recommended technology stack for Zenotika WebGL projects based on Corn Revolution analysis and current industry best practices.

---

## 🛠️ RECOMMENDED TECHNOLOGY STACK

### Core Libraries

#### 3D Rendering
| Library | Version | Purpose | Notes |
|---------|---------|---------|-------|
| **Three.js** | r160+ | 3D rendering | Upgrade from Corn Rev r102 |
| @types/three | Latest | TypeScript types | Required |

**Rationale**: Three.js remains the industry standard. Corn Revolution used r102; upgrading to r160+ provides:
- WebGPU support preparation
- Improved performance
- Better TypeScript support
- Modern color management

#### Animation
| Library | Version | Purpose | Notes |
|---------|---------|---------|-------|
| **GSAP** | 3.12+ | Animation | Upgrade from Corn Rev v2.1.2 |
| ScrollTrigger | 3.12+ | Scroll animation | GSAP plugin |

**Rationale**: GSAP 3 provides:
- 50% smaller bundle
- Better performance
- Improved timeline API
- Native ScrollTrigger (replaces ScrollMagic)

#### Build & Bundling
| Tool | Version | Purpose | Notes |
|------|---------|---------|-------|
| **Vite** | 5.0+ | Build tool | Fast HMR, native ESM |
| **TypeScript** | 5.0+ | Type safety | Strict mode required |
| vite-plugin-glsl | Latest | Shader imports | Development convenience |

### Supporting Libraries

#### Asset Processing
| Library | Purpose | When to Use |
|---------|---------|-------------|
| **draco3d** | Geometry compression | All 3D models |
| **basis_universal** | Texture compression | All textures |
| **gltf-pipeline** | glTF optimization | Build process |

#### Development Tools
| Tool | Purpose | Environment |
|------|---------|-------------|
| **Leva** | Debug GUI | Development only |
| **Stats.js** | FPS monitor | Development only |
| **spector.js** | WebGL debugging | Development only |

#### Utilities
| Library | Purpose | Notes |
|---------|---------|-------|
| **tweakpane** | Alternative debug GUI | Optional |
| **camera-controls** | Camera handling | Optional |
| **postprocessing** | Effects (alternative) | pmndrs ecosystem |

### Framework Integration (Optional)

#### React Projects
| Library | Version | Purpose |
|---------|---------|---------|
| @react-three/fiber | 8.0+ | React renderer |
| @react-three/drei | 9.0+ | Helpers/abstractions |
| zustand | 4.0+ | State management |

#### Vue Projects
| Library | Version | Purpose |
|---------|---------|---------|
| TresJS | 3.0+ | Vue renderer |
| @tresjs/cientos | Latest | Helpers |
| Pinia | 2.0+ | State management |

### Analytics & Monitoring

| Tool | Purpose | Required |
|------|---------|----------|
| **Google Analytics 4** | User analytics | Yes |
| **web-vitals** | Performance metrics | Yes |
| **Sentry** | Error tracking | Recommended |

---

## 📦 PACKAGE.JSON TEMPLATE

```json
{
  "name": "zenotika-webgl-project",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint src --ext .ts,.tsx",
    "test": "vitest",
    "test:coverage": "vitest --coverage"
  },
  "dependencies": {
    "three": "^0.160.0",
    "gsap": "^3.12.0"
  },
  "devDependencies": {
    "@types/three": "^0.160.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "vite-plugin-glsl": "^1.2.0",
    "eslint": "^8.56.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "vitest": "^1.0.0",
    "@vitest/coverage-v8": "^1.0.0",
    "leva": "^0.9.0",
    "stats.js": "^0.17.0"
  }
}
```

---

## 🔄 MIGRATION FROM CORN REVOLUTION STACK

### Version Upgrades Required

| Component | Corn Rev | Target | Breaking Changes |
|-----------|----------|--------|------------------|
| Three.js | r102 | r160+ | Color management, deprecations |
| GSAP | 2.1.2 | 3.12+ | API changes, plugins |
| WebGL | 1.0/2.0 | 2.0 | Shader syntax |

### Three.js Migration Notes
```typescript
// OLD (r102)
texture.encoding = THREE.sRGBEncoding;
renderer.outputEncoding = THREE.sRGBEncoding;

// NEW (r160+)
texture.colorSpace = THREE.SRGBColorSpace;
renderer.outputColorSpace = THREE.SRGBColorSpace;
```

### GSAP Migration Notes
```typescript
// OLD (v2 - TweenLite)
TweenLite.to(object, 1, { x: 100, ease: Power2.easeOut });

// NEW (v3)
gsap.to(object, { x: 100, duration: 1, ease: 'power2.out' });
```

---

## ⚠️ LIBRARIES TO AVOID

| Library | Reason | Alternative |
|---------|--------|-------------|
| jQuery | Unnecessary, performance | Vanilla JS |
| Babylon.js | Different ecosystem | Three.js |
| ScrollMagic | Deprecated, heavy | GSAP ScrollTrigger |
| Animate.css | CSS-only limitations | GSAP |
| Moment.js | Bundle size | date-fns, dayjs |

---

## 🔒 SECURITY CONSIDERATIONS

### Package Security
- [ ] Enable npm audit in CI/CD
- [ ] Use exact versions in production
- [ ] Review dependencies quarterly
- [ ] Check for known vulnerabilities

### CSP Compatibility
| Library | CSP Notes |
|---------|-----------|
| Three.js | Requires `unsafe-eval` for shaders |
| GSAP | CSP compatible |
| Vite | Development server needs configuration |

---

## 📊 BUNDLE SIZE TARGETS

| Category | Budget | Measurement |
|----------|--------|-------------|
| Core (Three.js + GSAP) | <200 KB | Minified + gzip |
| Application code | <100 KB | Minified + gzip |
| Total JS | <500 KB | Minified + gzip |
| 3D Assets | <1 MB | Draco compressed |
| Textures | <500 KB | Basis Universal |

---

## ✅ TECHNOLOGY SELECTION CHECKLIST

### Mandatory Requirements
- [ ] Three.js r160+ for 3D
- [ ] GSAP 3.12+ for animation
- [ ] TypeScript 5.0+ strict mode
- [ ] Vite 5.0+ for building
- [ ] ESLint for code quality

### Recommended Additions
- [ ] Draco for model compression
- [ ] Basis Universal for textures
- [ ] web-vitals for monitoring
- [ ] Sentry for error tracking

### Optional Enhancements
- [ ] React Three Fiber (React projects)
- [ ] TresJS (Vue projects)
- [ ] Leva/tweakpane (debugging)

---

## 📚 CROSS-REFERENCES

| Document | Content |
|----------|---------|
| A2-01 | Original architecture analysis |
| A4-01 | WebGL architecture guidelines |
| K4-02 | Technical standards |

---

## 📊 DATA CLASSIFICATION

| Data Type | Classification | Source |
|-----------|----------------|--------|
| Library versions | ✅ VERIFIED | Official releases |
| Corn Rev stack | ✅ VERIFIED | HAR/source analysis |
| Bundle targets | ✅ VERIFIED | Industry standards |

---

**Document Status**: ✅ COMPLETED  
**Last Updated**: 2025-12-11  
**Owner**: Andi Pratama (Senior Developer)
