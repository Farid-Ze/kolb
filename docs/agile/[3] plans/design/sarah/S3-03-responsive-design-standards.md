# S3-03: Responsive Design Standards
## Breakpoint & Layout System for WebGL Experiences

---

## Document Information

| Field | Value |
|-------|-------|
| **Document ID** | S3-03 |
| **Sprint** | 3 - Implementation Planning |
| **Persona** | Sarah Putri W. (UI/UX Designer) |
| **Priority** | 🟡 MEDIUM |
| **Status** | ✅ COMPLETED |
| **Created** | 2025-12-11 |
| **References** | S2-01, D2-02, F3-01 |

---

## 📋 Executive Summary

This document defines responsive design standards for WebGL experiential sites. Based on Sprint 2 analysis showing mobile performance challenges (Lighthouse mobile 13/100 vs desktop 41/100), these standards ensure consistent visual quality and performance across all screen sizes.

---

## 📊 Breakpoint System

### Standard Breakpoints

| Breakpoint | Range | Target Devices |
|------------|-------|----------------|
| **xs** | 0-575px | Small phones (portrait) |
| **sm** | 576-767px | Large phones, small tablets |
| **md** | 768-991px | Tablets (portrait) |
| **lg** | 992-1199px | Tablets (landscape), small laptops |
| **xl** | 1200-1399px | Standard laptops/desktops |
| **xxl** | 1400px+ | Large desktops, high-res displays |

### CSS Implementation

```css
/* ILLUSTRATIVE EXAMPLE - Mobile-First Breakpoints */

/* Base styles (mobile-first) */
.container {
  padding: 16px;
  width: 100%;
}

/* Small devices and up */
@media (min-width: 576px) {
  .container {
    padding: 24px;
    max-width: 540px;
    margin: 0 auto;
  }
}

/* Medium devices and up */
@media (min-width: 768px) {
  .container {
    max-width: 720px;
  }
}

/* Large devices and up */
@media (min-width: 992px) {
  .container {
    max-width: 960px;
    padding: 32px;
  }
}

/* Extra large devices and up */
@media (min-width: 1200px) {
  .container {
    max-width: 1140px;
  }
}

/* XXL devices */
@media (min-width: 1400px) {
  .container {
    max-width: 1320px;
  }
}
```

### JavaScript Breakpoint Detection

```javascript
// ILLUSTRATIVE EXAMPLE - JS Breakpoint Manager

class BreakpointManager {
  constructor() {
    this.breakpoints = {
      xs: 0,
      sm: 576,
      md: 768,
      lg: 992,
      xl: 1200,
      xxl: 1400
    };
    
    this.current = this.getCurrent();
    this.init();
  }
  
  init() {
    window.addEventListener('resize', 
      this.debounce(() => {
        const newBreakpoint = this.getCurrent();
        if (newBreakpoint !== this.current) {
          this.current = newBreakpoint;
          this.emit('breakpointChange', this.current);
        }
      }, 150)
    );
  }
  
  getCurrent() {
    const width = window.innerWidth;
    
    if (width >= 1400) return 'xxl';
    if (width >= 1200) return 'xl';
    if (width >= 992) return 'lg';
    if (width >= 768) return 'md';
    if (width >= 576) return 'sm';
    return 'xs';
  }
  
  isAtLeast(breakpoint) {
    const order = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'];
    return order.indexOf(this.current) >= order.indexOf(breakpoint);
  }
  
  debounce(fn, wait) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn(...args), wait);
    };
  }
  
  emit(event, data) {
    window.dispatchEvent(new CustomEvent(event, { detail: data }));
  }
}
```

---

## 🎨 Canvas & WebGL Sizing

### Responsive Canvas Strategy

```javascript
// ILLUSTRATIVE EXAMPLE - Responsive WebGL Canvas

class ResponsiveCanvas {
  constructor(renderer, camera) {
    this.renderer = renderer;
    this.camera = camera;
    this.pixelRatio = Math.min(window.devicePixelRatio, 2);
    
    this.init();
  }
  
  init() {
    this.resize();
    window.addEventListener('resize', 
      this.debounce(() => this.resize(), 100)
    );
  }
  
  resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Adjust pixel ratio based on screen size for performance
    if (width < 768) {
      this.pixelRatio = Math.min(window.devicePixelRatio, 1.5);
    } else {
      this.pixelRatio = Math.min(window.devicePixelRatio, 2);
    }
    
    // Update renderer
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(this.pixelRatio);
    
    // Update camera
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    
    // Dispatch event for other components
    window.dispatchEvent(new CustomEvent('canvasResize', {
      detail: { width, height, pixelRatio: this.pixelRatio }
    }));
  }
  
  debounce(fn, wait) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn(...args), wait);
    };
  }
}
```

### Canvas Pixel Ratio by Device

| Device Type | Pixel Ratio | Rationale |
|-------------|-------------|-----------|
| Mobile (low-end) | 1.0 | Performance priority |
| Mobile (high-end) | 1.5 | Balance quality/perf |
| Tablet | 1.5-2.0 | Good balance |
| Desktop | 2.0 | Quality priority |
| 4K Display | 2.0 (capped) | Prevent excessive GPU load |

---

## 📐 Layout Patterns

### Full-Screen Hero (WebGL Canvas)

```css
/* ILLUSTRATIVE EXAMPLE - Full-Screen WebGL Hero */

.webgl-hero {
  position: relative;
  width: 100%;
  height: 100vh;
  height: 100dvh; /* Dynamic viewport height for mobile */
}

/* Prevent iOS bounce */
.webgl-hero canvas {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  touch-action: pan-y; /* Allow vertical scroll only */
}

/* Content overlay */
.hero-content {
  position: absolute;
  z-index: 10;
  padding: 20px;
  
  /* Mobile: centered */
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  width: 90%;
}

@media (min-width: 768px) {
  .hero-content {
    /* Tablet+: left-aligned */
    top: 50%;
    left: 10%;
    transform: translateY(-50%);
    text-align: left;
    width: 40%;
  }
}
```

### Split Canvas/Content Layout

```css
/* ILLUSTRATIVE EXAMPLE - Split Layout */

.split-section {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.split-canvas {
  flex: 1;
  min-height: 50vh;
}

.split-content {
  padding: 32px 16px;
}

@media (min-width: 992px) {
  .split-section {
    flex-direction: row;
  }
  
  .split-canvas {
    flex: 0 0 60%;
    min-height: 100vh;
  }
  
  .split-content {
    flex: 0 0 40%;
    padding: 64px;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
}
```

### Grid-Based Product Display

```css
/* ILLUSTRATIVE EXAMPLE - Responsive Product Grid */

.product-grid {
  display: grid;
  gap: 16px;
  padding: 16px;
  
  /* Mobile: 1 column */
  grid-template-columns: 1fr;
}

@media (min-width: 576px) {
  .product-grid {
    /* Small: 2 columns */
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 992px) {
  .product-grid {
    /* Large: 3 columns */
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
    padding: 24px;
  }
}

@media (min-width: 1400px) {
  .product-grid {
    /* XXL: 4 columns */
    grid-template-columns: repeat(4, 1fr);
  }
}
```

---

## 📱 Mobile-Specific Considerations

### Touch Target Sizing

Based on Material Design guidelines (verified benchmark):

| Element | Minimum Size | Recommended |
|---------|-------------|-------------|
| Touch Target | 44×44px | 48×48px |
| Icon Button | 24×24px icon | 48×48px target |
| Inline Link | Text + padding | 44px height |
| Form Input | 44px height | 48px height |

```css
/* ILLUSTRATIVE EXAMPLE - Touch Targets */

.mobile-button {
  /* Minimum touch target */
  min-width: 44px;
  min-height: 44px;
  
  /* Recommended */
  padding: 12px 24px;
}

/* Inline links need vertical padding */
.content-link {
  display: inline-block;
  padding: 8px 0; /* Increases touch area */
  margin: -8px 0; /* Compensates for padding */
}
```

### Mobile Viewport Handling

```javascript
// ILLUSTRATIVE EXAMPLE - Mobile Viewport Fix

// Handle iOS Safari address bar
function setMobileVH() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}

setMobileVH();
window.addEventListener('resize', setMobileVH);

// Usage in CSS:
// height: calc(var(--vh, 1vh) * 100);
```

```css
/* Mobile viewport units */
.full-height {
  /* Fallback */
  height: 100vh;
  
  /* Modern */
  height: 100dvh;
  
  /* Custom property */
  height: calc(var(--vh, 1vh) * 100);
}
```

### Orientation Handling

```css
/* ILLUSTRATIVE EXAMPLE - Orientation Styles */

/* Portrait mode */
@media (orientation: portrait) {
  .webgl-scene {
    /* Optimize for vertical viewing */
  }
  
  .hero-text {
    font-size: 2rem;
  }
}

/* Landscape mode */
@media (orientation: landscape) {
  .webgl-scene {
    /* Optimize for horizontal viewing */
  }
  
  .hero-text {
    font-size: 3rem;
  }
}

/* Landscape mobile - often needs special handling */
@media (orientation: landscape) and (max-height: 500px) {
  .hero-content {
    padding: 16px;
    max-height: 100%;
    overflow-y: auto;
  }
}
```

---

## 📊 Typography Scaling

### Fluid Typography System

```css
/* ILLUSTRATIVE EXAMPLE - Fluid Typography */

:root {
  /* Base sizes */
  --font-size-xs: 0.75rem;   /* 12px */
  --font-size-sm: 0.875rem;  /* 14px */
  --font-size-base: 1rem;    /* 16px */
  --font-size-lg: 1.125rem;  /* 18px */
  --font-size-xl: 1.25rem;   /* 20px */
  
  /* Fluid headings */
  --font-size-h1: clamp(2rem, 5vw + 1rem, 4rem);
  --font-size-h2: clamp(1.5rem, 3vw + 0.75rem, 2.5rem);
  --font-size-h3: clamp(1.25rem, 2vw + 0.5rem, 1.75rem);
}

/* Apply sizes */
h1 { font-size: var(--font-size-h1); }
h2 { font-size: var(--font-size-h2); }
h3 { font-size: var(--font-size-h3); }

body {
  font-size: var(--font-size-base);
  line-height: 1.5;
}

/* Adjust for readability */
@media (min-width: 768px) {
  body {
    line-height: 1.6;
  }
}
```

### Text Container Width

```css
/* ILLUSTRATIVE EXAMPLE - Optimal Reading Width */

.prose {
  /* Optimal reading width: 45-75 characters */
  max-width: 65ch;
  margin: 0 auto;
  padding: 0 16px;
}

@media (min-width: 768px) {
  .prose {
    padding: 0 24px;
  }
}
```

---

## 🖼️ Image Responsive Strategies

### Art Direction with Picture Element

```html
<!-- ILLUSTRATIVE EXAMPLE - Responsive Images -->

<picture>
  <!-- Mobile: cropped/different composition -->
  <source 
    media="(max-width: 767px)" 
    srcset="hero-mobile.webp"
    type="image/webp">
  <source 
    media="(max-width: 767px)" 
    srcset="hero-mobile.jpg"
    type="image/jpeg">
  
  <!-- Tablet -->
  <source 
    media="(max-width: 1199px)" 
    srcset="hero-tablet.webp"
    type="image/webp">
  <source 
    media="(max-width: 1199px)" 
    srcset="hero-tablet.jpg"
    type="image/jpeg">
  
  <!-- Desktop (default) -->
  <source 
    srcset="hero-desktop.webp"
    type="image/webp">
  <img 
    src="hero-desktop.jpg" 
    alt="Corn Revolution hero image"
    loading="eager">
</picture>
```

### Resolution Switching with srcset

```html
<!-- ILLUSTRATIVE EXAMPLE - Resolution Switching -->

<img 
  src="product-800.jpg"
  srcset="
    product-400.jpg 400w,
    product-800.jpg 800w,
    product-1200.jpg 1200w,
    product-1600.jpg 1600w"
  sizes="
    (max-width: 575px) 100vw,
    (max-width: 991px) 50vw,
    33vw"
  alt="Premium corn product"
  loading="lazy">
```

---

## 🔄 3D Scene Adaptation

### Camera Adjustments by Breakpoint

```javascript
// ILLUSTRATIVE EXAMPLE - Responsive 3D Camera

class ResponsiveCamera {
  constructor(camera) {
    this.camera = camera;
    this.breakpointManager = new BreakpointManager();
    
    this.configs = {
      xs: { fov: 75, position: [0, 0, 5], lookAt: [0, 0, 0] },
      sm: { fov: 70, position: [0, 0, 5], lookAt: [0, 0, 0] },
      md: { fov: 65, position: [0, 0, 6], lookAt: [0, 0, 0] },
      lg: { fov: 60, position: [0, 0, 7], lookAt: [0, 0, 0] },
      xl: { fov: 55, position: [0, 0, 8], lookAt: [0, 0, 0] },
      xxl: { fov: 50, position: [0, 0, 9], lookAt: [0, 0, 0] }
    };
    
    this.init();
  }
  
  init() {
    this.applyConfig(this.breakpointManager.current);
    
    window.addEventListener('breakpointChange', (e) => {
      this.applyConfig(e.detail);
    });
  }
  
  applyConfig(breakpoint) {
    const config = this.configs[breakpoint];
    
    gsap.to(this.camera, {
      fov: config.fov,
      duration: 0.5,
      onUpdate: () => this.camera.updateProjectionMatrix()
    });
    
    gsap.to(this.camera.position, {
      x: config.position[0],
      y: config.position[1],
      z: config.position[2],
      duration: 0.5
    });
  }
}
```

### Object Visibility by Breakpoint

```javascript
// ILLUSTRATIVE EXAMPLE - Responsive 3D Objects

class ResponsiveScene {
  constructor(scene) {
    this.scene = scene;
    this.breakpointManager = new BreakpointManager();
    
    // Objects to show/hide by breakpoint
    this.responsiveObjects = {
      'detail-particles': { minBreakpoint: 'lg' },
      'background-elements': { minBreakpoint: 'md' },
      'secondary-models': { minBreakpoint: 'sm' }
    };
    
    this.init();
  }
  
  init() {
    this.updateVisibility(this.breakpointManager.current);
    
    window.addEventListener('breakpointChange', (e) => {
      this.updateVisibility(e.detail);
    });
  }
  
  updateVisibility(currentBreakpoint) {
    Object.entries(this.responsiveObjects).forEach(([name, config]) => {
      const object = this.scene.getObjectByName(name);
      if (object) {
        object.visible = this.breakpointManager.isAtLeast(config.minBreakpoint);
      }
    });
  }
}
```

---

## ✅ Testing Checklist

### Manual Testing Matrix

| Device | Breakpoint | Orientation | Test |
|--------|------------|-------------|------|
| iPhone SE | xs | Portrait | ✓ |
| iPhone 14 | sm | Portrait | ✓ |
| iPhone 14 | sm | Landscape | ✓ |
| iPad Mini | md | Portrait | ✓ |
| iPad | md | Portrait | ✓ |
| iPad | lg | Landscape | ✓ |
| Laptop 13" | lg | - | ✓ |
| Desktop 24" | xl | - | ✓ |
| 4K Monitor | xxl | - | ✓ |

### Verification Criteria

- [ ] Content readable at all breakpoints
- [ ] Touch targets meet minimum size on mobile
- [ ] WebGL canvas renders correctly
- [ ] Performance acceptable on mobile
- [ ] No horizontal scrolling
- [ ] Forms usable on all devices

---

## 🔗 Cross-References

| Document | Relationship |
|----------|--------------|
| S2-01 (Visual Consistency) | Analysis foundation |
| D2-02 (Mobile Experience) | Mobile insights |
| F3-01 (Device Support) | Performance tiers |
| S3-01 (Visual System) | Design system integration |

---

## 📊 Data Classification

| Category | Classification |
|----------|----------------|
| **Primary Data** | Lighthouse mobile/desktop scores |
| **Industry Standards** | Material Design, WCAG 2.1 |
| **Code Examples** | Illustrative (not from live site) |
| **Breakpoints** | Industry-standard responsive design |

---

*Document Status: ✅ COMPLETED*
*Last Updated: 2025-12-11*
