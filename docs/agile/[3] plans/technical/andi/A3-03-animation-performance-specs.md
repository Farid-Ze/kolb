# A3-03: Animation Performance Specifications
## GSAP & Three.js Integration Standards

---

## Document Information

| Field | Value |
|-------|-------|
| **Document ID** | A3-03 |
| **Sprint** | 3 - Implementation Planning |
| **Persona** | Andi Pratama (WebGL & Framework Engineer) |
| **Priority** | 🟡 MEDIUM |
| **Status** | ✅ COMPLETED |
| **Created** | 2025-12-11 |
| **References** | A2-03, K2-02, S3-02 |

---

## 📋 Executive Summary

This specification defines animation performance standards for integrating GSAP with Three.js in WebGL experiences. Based on Sprint 2 analysis showing the Corn Revolution site uses GSAP v2 (TweenLite) for scroll-based animations with Three.js r102, these standards ensure smooth 60fps performance across device tiers.

---

## 🎯 Animation Architecture

### Recommended Integration Pattern

```javascript
// ILLUSTRATIVE EXAMPLE - Animation Manager Pattern

class AnimationManager {
  constructor() {
    this.timeline = gsap.timeline({
      scrollTrigger: {
        trigger: '.scene-container',
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1 // Smooth 1s lag for natural feel
      }
    });
    
    this.rafId = null;
    this.clock = new THREE.Clock();
  }
  
  // Separate render loop from GSAP animations
  startRenderLoop(renderer, scene, camera) {
    const animate = () => {
      this.rafId = requestAnimationFrame(animate);
      
      const delta = this.clock.getDelta();
      
      // Only render when tab is visible
      if (document.visibilityState === 'visible') {
        renderer.render(scene, camera);
      }
    };
    
    animate();
  }
  
  // Clean up on destroy
  destroy() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
    this.timeline.kill();
  }
}
```

### GSAP Version Recommendation

| GSAP Version | Status | Recommendation |
|--------------|--------|----------------|
| GSAP v2 (TweenLite) | Current site | Legacy - upgrade recommended |
| GSAP v3 | Modern | **Recommended** for new projects |

**Migration Benefits (v2 → v3)**:
- 50% smaller file size (~33KB vs ~67KB)
- Better tree-shaking support
- Improved ScrollTrigger integration
- Modern syntax (`gsap.to()` vs `TweenLite.to()`)

---

## 📊 Performance Budgets

### Animation Frame Budget

Based on Google RAIL model (verified benchmark):

| Target | Budget | Notes |
|--------|--------|-------|
| Frame Time | 16.67ms (60fps) | Must maintain consistently |
| JS Execution | <10ms per frame | Leave 6ms for rendering |
| Scroll Response | <100ms | First visual update |
| Animation Start | <100ms | Response to user input |

### Per-Frame Breakdown

```
┌─────────────────────────────────────────────────┐
│           16.67ms Frame Budget                  │
├─────────────────────────────────────────────────┤
│ JavaScript Execution     │ ≤6ms    │ GSAP/Logic │
│ Style/Layout            │ ≤2ms    │ CSS Updates │
│ WebGL Render            │ ≤6ms    │ Three.js   │
│ Composite               │ ≤2ms    │ Browser    │
└─────────────────────────────────────────────────┘
```

---

## 🔧 Implementation Standards

### 1. Scroll Animation Configuration

```javascript
// ILLUSTRATIVE EXAMPLE - ScrollTrigger Best Practices

// ✅ Recommended: Use scrub for scroll-linked animations
gsap.to(model.rotation, {
  y: Math.PI * 2,
  scrollTrigger: {
    trigger: '.section',
    start: 'top center',
    end: 'bottom center',
    scrub: true,      // Links to scroll position
    invalidateOnRefresh: true // Recalculate on resize
  }
});

// ❌ Avoid: Heavy calculations in scroll callbacks
scrollTrigger.addEventListener('scroll', () => {
  // Don't do expensive operations here
  expensiveCalculation(); // BAD
});

// ✅ Better: Throttle or use GSAP's built-in optimization
ScrollTrigger.defaults({
  fastScrollEnd: true,     // Skip to end on fast scroll
  preventOverlaps: true    // Prevent animation conflicts
});
```

### 2. Three.js Object Animation

```javascript
// ILLUSTRATIVE EXAMPLE - Animating Three.js Objects

// ✅ Recommended: Animate transform properties directly
gsap.to(mesh.position, {
  x: 10,
  duration: 1,
  ease: 'power2.out'
});

gsap.to(mesh.rotation, {
  y: Math.PI,
  duration: 1,
  ease: 'power2.inOut'
});

// ✅ Recommended: Use quaternions for complex rotations
gsap.to(mesh.quaternion, {
  x: targetQuaternion.x,
  y: targetQuaternion.y,
  z: targetQuaternion.z,
  w: targetQuaternion.w,
  duration: 1
});

// ❌ Avoid: Euler angle gimbal lock issues
mesh.rotation.x = value; // Can cause gimbal lock
mesh.rotation.y = value; // if animated sequentially
mesh.rotation.z = value;
```

### 3. Material Animation

```javascript
// ILLUSTRATIVE EXAMPLE - Material Property Animation

// ✅ Recommended: Animate uniforms for custom shaders
gsap.to(customMaterial.uniforms.uProgress, {
  value: 1,
  duration: 2,
  ease: 'power1.inOut'
});

// ✅ Recommended: Opacity with proper settings
mesh.material.transparent = true;
gsap.to(mesh.material, {
  opacity: 0,
  duration: 0.5,
  onComplete: () => {
    mesh.visible = false; // Hide after fade
  }
});

// ❌ Avoid: Animating expensive material properties
gsap.to(mesh.material, {
  roughness: 0.5, // May require shader recompile
  metalness: 0.5  // Use uniforms instead
});
```

---

## 📱 Device Tier Configurations

### Animation Complexity by Tier

| Setting | High Tier | Medium Tier | Low Tier |
|---------|-----------|-------------|----------|
| Particle Count | 10,000 | 5,000 | 1,000 |
| Animation Duration | 1x | 1x | 1.2x (slower) |
| Scrub Smoothing | 1s | 0.5s | instant |
| Concurrent Tweens | Unlimited | 10 max | 5 max |
| Post-processing | Yes | Reduced | None |

### Tier Detection

```javascript
// ILLUSTRATIVE EXAMPLE - Device Tier Detection

function detectAnimationTier() {
  const gl = document.createElement('canvas')
    .getContext('webgl2');
  
  if (!gl) return 'low';
  
  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
  const renderer = debugInfo 
    ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
    : '';
  
  // GPU tier detection
  const highEndGPUs = ['RTX', 'GTX 10', 'GTX 16', 'Radeon RX'];
  const lowEndGPUs = ['Intel HD', 'Intel UHD', 'Mali', 'Adreno 5'];
  
  if (highEndGPUs.some(gpu => renderer.includes(gpu))) {
    return 'high';
  }
  
  if (lowEndGPUs.some(gpu => renderer.includes(gpu))) {
    return 'low';
  }
  
  return 'medium';
}

// Apply tier-specific settings
const tier = detectAnimationTier();
const animationConfig = {
  high: { scrub: 1, ease: 'power2.out' },
  medium: { scrub: 0.5, ease: 'power1.out' },
  low: { scrub: 0, ease: 'linear' }
};
```

---

## ⚡ Performance Optimization Techniques

### 1. Will-Change Optimization

```javascript
// ILLUSTRATIVE EXAMPLE - CSS Will-Change for Compositing

// Apply will-change before animation starts
gsap.set('.animated-element', {
  willChange: 'transform, opacity'
});

gsap.to('.animated-element', {
  x: 100,
  opacity: 0.5,
  onComplete: () => {
    // Remove will-change after animation
    gsap.set('.animated-element', {
      willChange: 'auto'
    });
  }
});
```

### 2. RAF Synchronization

```javascript
// ILLUSTRATIVE EXAMPLE - Sync GSAP with Three.js RAF

class SyncedAnimationLoop {
  constructor(renderer, scene, camera) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    
    // Tell GSAP to use our RAF
    gsap.ticker.lagSmoothing(0);
  }
  
  start() {
    gsap.ticker.add(this.tick.bind(this));
  }
  
  tick() {
    // Both GSAP and Three.js render on same frame
    this.renderer.render(this.scene, this.camera);
  }
  
  stop() {
    gsap.ticker.remove(this.tick.bind(this));
  }
}
```

### 3. Memory Management

```javascript
// ILLUSTRATIVE EXAMPLE - Animation Cleanup

class AnimationController {
  constructor() {
    this.tweens = [];
    this.timelines = [];
  }
  
  createTween(target, vars) {
    const tween = gsap.to(target, vars);
    this.tweens.push(tween);
    return tween;
  }
  
  createTimeline(vars) {
    const timeline = gsap.timeline(vars);
    this.timelines.push(timeline);
    return timeline;
  }
  
  // Call on section exit or component unmount
  destroy() {
    // Kill all tweens
    this.tweens.forEach(tween => tween.kill());
    this.tweens = [];
    
    // Kill all timelines
    this.timelines.forEach(timeline => timeline.kill());
    this.timelines = [];
    
    // Clear ScrollTrigger instances
    ScrollTrigger.getAll().forEach(st => st.kill());
  }
}
```

---

## 🎨 Easing Standards

Based on Material Design Motion guidelines (verified benchmark):

### Recommended Easing Curves

| Animation Type | Easing | GSAP Value | Duration |
|---------------|--------|------------|----------|
| Enter (Fade In) | Decelerate | `power2.out` | 300ms |
| Exit (Fade Out) | Accelerate | `power2.in` | 250ms |
| Standard Move | Standard | `power2.inOut` | 300ms |
| Emphasis | Overshoot | `back.out(1.7)` | 400ms |
| Scroll-linked | Linear | `none` | scrub |

### Custom Easing for WebGL

```javascript
// ILLUSTRATIVE EXAMPLE - Custom WebGL Easing

// Camera movement - cinematic feel
gsap.to(camera.position, {
  z: 10,
  duration: 2,
  ease: 'slow(0.7, 0.7, false)'
});

// Object entrance - bouncy feel
gsap.from(mesh.scale, {
  x: 0, y: 0, z: 0,
  duration: 1,
  ease: 'elastic.out(1, 0.5)'
});

// Scene transition - smooth blend
gsap.to(scene.fog.density, {
  value: 0.1,
  duration: 1.5,
  ease: 'power3.inOut'
});
```

---

## 📋 Animation Testing Checklist

### Performance Tests

| Test | Target | Tool |
|------|--------|------|
| Frame Rate | ≥55 fps average | Chrome DevTools |
| Frame Budget | <16.67ms | Performance tab |
| Memory Leaks | No growth over time | Memory tab |
| CPU Usage | <40% idle animation | Task Manager |
| GPU Memory | Stable, no spikes | GPU monitoring |

### Cross-Browser Tests

| Browser | Animation Support | Notes |
|---------|------------------|-------|
| Chrome 90+ | Full GSAP 3 | Primary target |
| Firefox 90+ | Full GSAP 3 | Test ScrollTrigger |
| Safari 14+ | Full GSAP 3 | Test will-change |
| Edge 90+ | Full GSAP 3 | Chromium-based |
| iOS Safari | Full GSAP 3 | Test touch events |

---

## 🔗 Cross-References

| Document | Relationship |
|----------|--------------|
| A2-03 (Animation Performance) | Analysis foundation |
| S3-02 (Animation Timing) | Design timing standards |
| K3-01 (Optimization Roadmap) | Performance integration |
| F3-01 (Device Support) | Tier configurations |
| N3-01 (Engagement Strategy) | User experience context |

---

## 📊 Data Classification

| Category | Classification |
|----------|----------------|
| **Primary Data** | HAR file analysis (GSAP v2, TweenLite), Three.js r102 |
| **Industry Benchmarks** | Google RAIL (16.67ms frame budget), Material Design easing |
| **Code Examples** | Illustrative (not from live site) |
| **Recommendations** | Based on industry best practices |

---

## ✅ Implementation Verification

| Criterion | Method |
|-----------|--------|
| 60fps maintained | Chrome DevTools Performance |
| No jank on scroll | Visual inspection + Lighthouse |
| Memory stable | Chrome Memory profiling |
| GSAP cleanup working | No orphan timelines |
| Tier adaptation functional | Test on multiple devices |

---

*Document Status: ✅ COMPLETED*
*Last Updated: 2025-12-11*
