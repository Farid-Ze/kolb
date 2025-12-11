# 🚀 ZENOTIKA WEBGL IMPLEMENTATION GUIDE

## Complete Guidelines for Experiential WebGL Projects

**Based on**: Corn Revolution (cornrevolution.resn.global) Analysis  
**Version**: 1.0  
**Date**: 2025-12-11  
**Status**: ✅ FINAL

---

## 📋 EXECUTIVE SUMMARY

This guide consolidates learnings from the comprehensive analysis of Corn Revolution—an award-winning WebGL experience (Awwwards SOTY 2020, 8.18/10)—into actionable implementation guidelines for Zenotika's experiential web projects.

### Key Takeaways

| Area | Core Insight | Priority |
|------|--------------|----------|
| **Performance** | Sub-2.5s load time is critical for engagement | 🔴 HIGH |
| **Progressive Enhancement** | Tiered experience based on device capability | 🔴 HIGH |
| **Accessibility** | WCAG 2.1 AA compliance is non-negotiable | 🔴 HIGH |
| **Engagement** | Scroll-driven narrative maximizes completion | 🟡 MEDIUM |
| **Conversion** | Clear CTAs at decision points (3%+ target) | 🔴 HIGH |

---

## 🏗️ ARCHITECTURE OVERVIEW

### Recommended Tech Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **3D Engine** | Three.js r160+ | Industry standard, active development |
| **Animation** | GSAP 3.x | Performance, ScrollTrigger integration |
| **Build** | Vite | Fast builds, ESM support |
| **State** | Zustand/Jotai | Lightweight, React-compatible |
| **Types** | TypeScript | Type safety, better DX |

### Architecture Pattern

```
┌─────────────────────────────────────────────────────────────┐
│                     APPLICATION LAYER                        │
├─────────────────────────────────────────────────────────────┤
│  Scene Manager → Animation Controller → State Manager        │
├─────────────────────────────────────────────────────────────┤
│                      ENGINE LAYER                            │
├─────────────────────────────────────────────────────────────┤
│  Three.js → WebGL Abstraction → Asset Pipeline              │
├─────────────────────────────────────────────────────────────┤
│                     PLATFORM LAYER                           │
├─────────────────────────────────────────────────────────────┤
│  Device Detection → Capability Tiers → Progressive Loading   │
└─────────────────────────────────────────────────────────────┘
```

---

## ⚡ PERFORMANCE STANDARDS

### Core Web Vitals Targets

| Metric | Target | Critical Threshold |
|--------|--------|-------------------|
| **LCP** | <2.5s | <4.0s |
| **FID** | <100ms | <300ms |
| **CLS** | <0.1 | <0.25 |
| **FPS** | 60fps | 30fps minimum |

### Bundle Size Budgets

| Asset Type | Budget | Compression |
|------------|--------|-------------|
| JavaScript | <500KB | Brotli |
| 3D Models | <2MB total | Draco |
| Textures | <1MB per scene | Basis Universal |
| Total Initial | <1MB | Progressive |

### Performance Checklist

#### Loading
- [ ] Implement progressive loading (critical → secondary → optional)
- [ ] Show meaningful loading state with progress indicator
- [ ] Preload next scene assets during current scene
- [ ] Use WebP/AVIF for 2D assets, Basis for 3D textures

#### Rendering
- [ ] Implement LOD (Level of Detail) system
- [ ] Frustum culling enabled
- [ ] Object pooling for repeated elements
- [ ] Instance meshes where possible

#### Memory
- [ ] Dispose unused geometries and materials
- [ ] Implement scene cleanup on transitions
- [ ] Monitor and cap texture memory
- [ ] Use compressed geometry formats

---

## 🎨 DESIGN SYSTEM

### Visual Standards

#### Color System

```css
/* Primary Palette */
--color-primary: #[brand-color];
--color-primary-light: #[variant];
--color-primary-dark: #[variant];

/* Semantic Colors */
--color-success: #22C55E;
--color-warning: #F59E0B;
--color-error: #EF4444;

/* Neutrals */
--color-text: #1F2937;
--color-text-secondary: #6B7280;
--color-background: #FFFFFF;
```

#### Typography

| Element | Size | Weight | Line Height |
|---------|------|--------|-------------|
| H1 | 48-72px | 700 | 1.1 |
| H2 | 36-48px | 600 | 1.2 |
| H3 | 24-32px | 600 | 1.3 |
| Body | 16-18px | 400 | 1.5 |
| Caption | 14px | 400 | 1.4 |

### Animation Standards

#### Timing Functions

| Type | Duration | Easing |
|------|----------|--------|
| Micro-interactions | 150-200ms | ease-out |
| UI transitions | 200-300ms | ease-in-out |
| Scene transitions | 500-800ms | custom bezier |
| Camera movements | 1000-2000ms | power2.inOut |

#### GSAP Configuration

```javascript
// Standard scene transition
gsap.to(camera.position, {
  duration: 1.5,
  x: targetX,
  y: targetY,
  z: targetZ,
  ease: "power2.inOut",
  onUpdate: () => camera.lookAt(target)
});

// ScrollTrigger setup
ScrollTrigger.create({
  trigger: ".scene-container",
  start: "top top",
  end: "bottom bottom",
  scrub: 1,
  onUpdate: (self) => updateScene(self.progress)
});
```

---

## 📱 PROGRESSIVE ENHANCEMENT

### Device Tier System

| Tier | Criteria | Experience Level |
|------|----------|------------------|
| **Tier 1** | WebGL 2.0, 8GB+ RAM, modern GPU | Full 3D, all effects |
| **Tier 2** | WebGL 1.0, 4GB+ RAM | Reduced 3D, core effects |
| **Tier 3** | Basic WebGL | Simplified 3D, minimal effects |
| **Fallback** | No WebGL | Video/image sequence |

### Capability Detection

```javascript
function detectCapabilityTier() {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
  
  if (!gl) return 'fallback';
  
  const hasWebGL2 = !!canvas.getContext('webgl2');
  const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
  const deviceMemory = navigator.deviceMemory || 4;
  
  if (hasWebGL2 && maxTextureSize >= 8192 && deviceMemory >= 8) {
    return 'tier1';
  } else if (maxTextureSize >= 4096 && deviceMemory >= 4) {
    return 'tier2';
  } else if (gl) {
    return 'tier3';
  }
  
  return 'fallback';
}
```

### Asset Loading by Tier

```javascript
const assetConfig = {
  tier1: {
    modelQuality: 'high',
    textureSize: 2048,
    shadowsEnabled: true,
    postProcessing: true
  },
  tier2: {
    modelQuality: 'medium',
    textureSize: 1024,
    shadowsEnabled: true,
    postProcessing: false
  },
  tier3: {
    modelQuality: 'low',
    textureSize: 512,
    shadowsEnabled: false,
    postProcessing: false
  }
};
```

---

## ♿ ACCESSIBILITY REQUIREMENTS

### WCAG 2.1 AA Compliance

#### Mandatory Features

| Requirement | Implementation |
|-------------|----------------|
| Keyboard Navigation | Full scene traversal via Tab/Enter/Arrows |
| Screen Reader | ARIA landmarks, live regions for updates |
| Reduced Motion | `prefers-reduced-motion` media query |
| Color Contrast | 4.5:1 minimum for text |
| Focus Indicators | Visible focus states on all interactive elements |

#### Implementation Example

```javascript
// Respect motion preferences
const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;

if (prefersReducedMotion) {
  // Disable or simplify animations
  gsap.globalTimeline.timeScale(0);
  // Show static alternatives
  showStaticVersion();
}

// Keyboard navigation
document.addEventListener('keydown', (e) => {
  switch(e.key) {
    case 'ArrowDown':
    case 'PageDown':
      navigateToNextScene();
      break;
    case 'ArrowUp':
    case 'PageUp':
      navigateToPreviousScene();
      break;
    case 'Escape':
      exitFullscreen();
      break;
  }
});
```

---

## 📊 ANALYTICS & MEASUREMENT

### Required Tracking Events

| Event | Trigger | Parameters |
|-------|---------|------------|
| `page_view` | Page load | page_title, device_tier |
| `scene_view` | Scene enters viewport | scene_name, scene_number |
| `scroll_depth` | 25/50/75/90% | percent_scrolled |
| `cta_click` | CTA interaction | cta_name, position |
| `form_submit` | Form completion | form_name, success |
| `performance` | Load complete | lcp, fid, cls, fps |

### GA4 Implementation

```javascript
// Scene tracking
function trackSceneView(sceneName, sceneNumber) {
  gtag('event', 'scene_view', {
    scene_name: sceneName,
    scene_number: sceneNumber,
    device_tier: currentTier,
    time_on_previous: timeSinceLastScene
  });
}

// Performance tracking
function trackPerformance() {
  gtag('event', 'performance_metric', {
    lcp: performanceMetrics.lcp,
    fid: performanceMetrics.fid,
    cls: performanceMetrics.cls,
    avg_fps: performanceMetrics.avgFps,
    device_tier: currentTier
  });
}
```

### Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Bounce Rate | <40% | GA4 |
| Scroll Depth | >75% | Custom tracking |
| Time on Site | >90s | GA4 |
| Conversion Rate | >3% | GA4 Goals |
| Form Completion | >50% | GA4 Funnel |

---

## 🔄 IMPLEMENTATION ROADMAP

### Phase 1: Foundation (Weeks 1-2)

| Task | Owner | Deliverable |
|------|-------|-------------|
| Tech stack setup | Dev Lead | Configured build pipeline |
| Design system | UI Lead | Token definitions, components |
| Capability detection | Frontend | Tier detection system |
| Analytics setup | Marketing | GA4 + GTM configuration |

### Phase 2: Core Experience (Weeks 3-6)

| Task | Owner | Deliverable |
|------|-------|-------------|
| 3D scene development | 3D Team | All scenes implemented |
| Animation system | Frontend | ScrollTrigger integration |
| Progressive loading | Frontend | Asset pipeline |
| Accessibility layer | QA | WCAG compliance |

### Phase 3: Optimization (Weeks 7-8)

| Task | Owner | Deliverable |
|------|-------|-------------|
| Performance tuning | Dev Lead | Meet all Core Web Vitals |
| Cross-device testing | QA | Compatibility verified |
| A/B test setup | Marketing | Test variants ready |
| Content finalization | Content | All copy approved |

### Phase 4: Launch (Weeks 9-10)

| Task | Owner | Deliverable |
|------|-------|-------------|
| Staging deployment | DevOps | Full environment test |
| UAT | All | Sign-off from stakeholders |
| Production deployment | DevOps | Live site |
| Monitoring setup | Dev Lead | Alerts configured |

---

## ✅ LAUNCH CHECKLIST

### Pre-Launch

- [ ] All Core Web Vitals passing
- [ ] WCAG 2.1 AA audit passed
- [ ] Cross-browser testing complete (Chrome, Safari, Firefox, Edge)
- [ ] Mobile device testing complete (iOS, Android)
- [ ] Analytics tracking verified
- [ ] Forms tested end-to-end
- [ ] Load testing passed
- [ ] Security audit complete
- [ ] Legal review (privacy, cookies) complete

### Launch Day

- [ ] Monitoring dashboards ready
- [ ] Rollback plan documented
- [ ] Support team briefed
- [ ] Social assets prepared
- [ ] PR coordination confirmed

### Post-Launch

- [ ] Daily metric review (Week 1)
- [ ] Performance monitoring active
- [ ] Bug triage process active
- [ ] A/B tests launched
- [ ] Weekly stakeholder reports

---

## 📚 DOCUMENT REFERENCES

### Technical Documents
- `validation/technical/kevin/K4-01-performance-checklist.md`
- `validation/technical/andi/A4-01-webgl-guidelines.md`
- `validation/technical/fajar/F4-01-progressive-enhancement.md`
- `validation/technical/amanda/AM4-01-accessibility-checklist.md`

### Design Documents
- `validation/design/sarah/S4-01-design-system.md`
- `validation/design/bagus/B4-01-3d-standards.md`

### Strategy Documents
- `validation/strategy/nabila/N4-01-ux-playbook.md`
- `validation/strategy/citra/C4-03-measurement-standards.md`
- `validation/strategy/rizky/R4-01-business-metrics.md`

---

## 📊 DATA CLASSIFICATION

| Data Type | Classification | Source |
|-----------|----------------|--------|
| Performance targets | ✅ VERIFIED | Google Web Vitals |
| Tech stack recommendations | ✅ VERIFIED | Industry standards |
| Accessibility standards | ✅ VERIFIED | WCAG 2.1 |
| Analytics implementation | ✅ VERIFIED | GA4 documentation |
| Timeline estimates | ⚠️ ESTIMATED | Project experience |

---

**Document Version**: 1.0  
**Last Updated**: 2025-12-11  
**Approved By**: Project Team
