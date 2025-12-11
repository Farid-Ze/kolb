# S3-02: Animation Timing & Easing System

## 📋 METADATA
- **Persona**: Sarah Chen - Visual Designer
- **Task ID**: S3-02
- **Date**: 2025-12-11
- **Sprint**: Sprint 3 - Implementation Planning
- **Status**: ✅ COMPLETED
- **Priority**: 🟡 MEDIUM

> [!IMPORTANT]
> **Data Classification for This Plan**
> 
> | Data Type | Status | Source |
> |-----------|--------|--------|
> | Motion Guidelines | ✅ **VERIFIED** | Material Design Motion |
> | GSAP Usage | ✅ **VERIFIED** | HAR file (TweenLite v2) |
> | Timing Standards | ✅ **VERIFIED** | Google RAIL Model |
> | System Design | ⚠️ **RECOMMENDATION** | Based on best practices |

---

## 🎯 OBJECTIVE

Define comprehensive animation timing and easing system ensuring consistent, performant, and accessible motion design across the WebGL experience.

---

## 📊 ANIMATION DURATION STANDARDS

### Material Design Duration Guidelines

| Animation Type | Duration | Use Case |
|----------------|----------|----------|
| Simple | 100ms | Icon changes, micro-interactions |
| Standard | 200ms | Most UI transitions |
| Complex | 300ms | Page transitions, modals |
| Extended | 400-500ms | Hero animations |
| Very Complex | 500ms+ | Multi-step animations |

### Duration by Element Size

| Element Size | Duration | Reasoning |
|--------------|----------|-----------|
| Small (<100px) | 100-150ms | Fast, subtle |
| Medium (100-500px) | 200-300ms | Balanced |
| Large (>500px) | 300-400ms | Smooth, visible |
| Full screen | 400-500ms | Deliberate, impactful |

### GSAP-Specific Durations

```javascript
// Duration presets for GSAP
const durations = {
  instant: 0.1,      // 100ms - micro-interactions
  fast: 0.2,         // 200ms - standard UI
  normal: 0.3,       // 300ms - comfortable
  slow: 0.5,         // 500ms - emphasis
  slower: 0.8,       // 800ms - dramatic
  hero: 1.2          // 1200ms - hero sequences
};
```

---

## 🎢 EASING SYSTEM

### Standard Easing Functions

| Name | Cubic Bezier | Use Case |
|------|--------------|----------|
| **ease-out** | (0, 0, 0.2, 1) | Elements entering |
| **ease-in** | (0.4, 0, 1, 1) | Elements exiting |
| **ease-in-out** | (0.4, 0, 0.2, 1) | Elements transforming |
| **linear** | (0, 0, 1, 1) | Progress indicators |

### Expressive Easing Functions

| Name | Cubic Bezier | Feel |
|------|--------------|------|
| **bounce** | (0.34, 1.56, 0.64, 1) | Playful, energetic |
| **anticipate** | (0.68, -0.6, 0.32, 1.6) | Dramatic |
| **overshoot** | (0.175, 0.885, 0.32, 1.275) | Dynamic |

### GSAP Easing Presets

```javascript
// GSAP easing configuration
const easings = {
  // Standard
  enter: 'power2.out',      // Decelerate into view
  exit: 'power2.in',        // Accelerate out of view
  transform: 'power2.inOut', // Smooth transformation
  
  // Expressive
  bounce: 'back.out(1.7)',   // Overshoot and settle
  elastic: 'elastic.out(1, 0.3)', // Springy
  
  // Scroll-linked
  scrub: 'none',             // Linear for scroll
  
  // Custom
  smooth: CustomEase.create('smooth', 'M0,0 C0.25,0.1 0.25,1 1,1'),
  dramatic: CustomEase.create('dramatic', 'M0,0 C0.5,0 0.5,1 1,1')
};

// Usage
gsap.to(element, {
  x: 100,
  duration: durations.normal,
  ease: easings.enter
});
```

### CSS Easing Variables

```css
:root {
  /* Standard */
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-linear: linear;
  
  /* Expressive */
  --ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-anticipate: cubic-bezier(0.68, -0.6, 0.32, 1.6);
  
  /* Durations */
  --duration-instant: 100ms;
  --duration-fast: 200ms;
  --duration-normal: 300ms;
  --duration-slow: 500ms;
}
```

---

## 🎬 ANIMATION PRESETS

### UI Animation Presets

```javascript
// Fade presets
const fadePresets = {
  fadeIn: {
    from: { opacity: 0 },
    to: { opacity: 1, duration: durations.normal, ease: easings.enter }
  },
  fadeOut: {
    to: { opacity: 0, duration: durations.fast, ease: easings.exit }
  }
};

// Slide presets
const slidePresets = {
  slideUp: {
    from: { y: 30, opacity: 0 },
    to: { y: 0, opacity: 1, duration: durations.normal, ease: easings.enter }
  },
  slideDown: {
    from: { y: -30, opacity: 0 },
    to: { y: 0, opacity: 1, duration: durations.normal, ease: easings.enter }
  },
  slideLeft: {
    from: { x: 30, opacity: 0 },
    to: { x: 0, opacity: 1, duration: durations.normal, ease: easings.enter }
  },
  slideRight: {
    from: { x: -30, opacity: 0 },
    to: { x: 0, opacity: 1, duration: durations.normal, ease: easings.enter }
  }
};

// Scale presets
const scalePresets = {
  scaleIn: {
    from: { scale: 0.95, opacity: 0 },
    to: { scale: 1, opacity: 1, duration: durations.normal, ease: easings.bounce }
  },
  scaleOut: {
    to: { scale: 0.95, opacity: 0, duration: durations.fast, ease: easings.exit }
  }
};
```

### 3D Animation Presets

```javascript
// Camera movement presets
const cameraPresets = {
  dollyIn: {
    duration: durations.slow,
    ease: easings.transform,
    z: '-=5'
  },
  dollyOut: {
    duration: durations.slow,
    ease: easings.transform,
    z: '+=5'
  },
  orbit: {
    duration: durations.hero,
    ease: easings.transform,
    rotation: { y: '+=360' }
  },
  panRight: {
    duration: durations.normal,
    ease: easings.enter,
    x: '+=3'
  }
};

// Object animation presets
const objectPresets = {
  float: {
    y: '+=0.3',
    duration: 2,
    ease: 'sine.inOut',
    repeat: -1,
    yoyo: true
  },
  rotate: {
    rotation: { y: '+=360' },
    duration: 10,
    ease: 'none',
    repeat: -1
  },
  pulse: {
    scale: 1.05,
    duration: 1,
    ease: 'sine.inOut',
    repeat: -1,
    yoyo: true
  }
};
```

### Scroll-Triggered Animation Presets

```javascript
// ScrollTrigger presets
const scrollPresets = {
  // Standard reveal
  reveal: (trigger, elements) => ({
    scrollTrigger: {
      trigger,
      start: 'top 80%',
      end: 'bottom 20%',
      toggleActions: 'play none none reverse'
    },
    targets: elements,
    from: { y: 50, opacity: 0 },
    to: { y: 0, opacity: 1, stagger: 0.1, duration: durations.normal }
  }),
  
  // Parallax
  parallax: (trigger, speed = 0.5) => ({
    scrollTrigger: {
      trigger,
      start: 'top bottom',
      end: 'bottom top',
      scrub: true
    },
    y: (i, el) => -el.offsetHeight * speed
  }),
  
  // Pin and animate
  pinAndAnimate: (trigger, animation) => ({
    scrollTrigger: {
      trigger,
      start: 'top top',
      end: '+=100%',
      pin: true,
      scrub: 1
    },
    ...animation
  })
};
```

---

## ♿ ACCESSIBILITY CONSIDERATIONS

### Reduced Motion Support

```javascript
// Check for reduced motion preference
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Apply reduced motion settings
function applyMotionPreference() {
  if (prefersReducedMotion) {
    // Disable or simplify animations
    gsap.globalTimeline.timeScale(10); // Speed up animations significantly
    
    // Or disable entirely
    gsap.config({
      nullTargetWarn: false
    });
    
    // Replace animations with instant changes
    Object.keys(durations).forEach(key => {
      durations[key] = 0.01;
    });
  }
}

// Listen for changes
window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
  applyMotionPreference();
});
```

### CSS Reduced Motion

```css
/* Respect user preference */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

/* Alternative: simplify rather than remove */
@media (prefers-reduced-motion: reduce) {
  .animated-element {
    transition: opacity 0.01ms; /* Keep fade, remove movement */
    transform: none !important;
  }
}
```

---

## 🎭 ANIMATION COMPOSITION

### Stagger Patterns

```javascript
// Stagger configurations
const staggerConfigs = {
  // Linear stagger
  linear: {
    each: 0.08,
    from: 'start'
  },
  
  // Center outward
  center: {
    each: 0.1,
    from: 'center'
  },
  
  // Random
  random: {
    each: 0.1,
    from: 'random'
  },
  
  // Grid pattern
  grid: {
    each: 0.05,
    grid: 'auto',
    from: 'center'
  }
};

// Usage
gsap.from('.cards', {
  y: 30,
  opacity: 0,
  duration: durations.normal,
  ease: easings.enter,
  stagger: staggerConfigs.center
});
```

### Timeline Composition

```javascript
// Timeline factory
function createSectionTimeline(section) {
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: 'top 80%',
      end: 'bottom 20%',
      toggleActions: 'play none none reverse'
    }
  });
  
  // Add animations
  tl.from(section.querySelector('.title'), {
    y: 30,
    opacity: 0,
    duration: durations.normal,
    ease: easings.enter
  })
  .from(section.querySelectorAll('.item'), {
    y: 20,
    opacity: 0,
    duration: durations.fast,
    ease: easings.enter,
    stagger: staggerConfigs.linear
  }, '-=0.2')
  .from(section.querySelector('.cta'), {
    scale: 0.95,
    opacity: 0,
    duration: durations.normal,
    ease: easings.bounce
  }, '-=0.1');
  
  return tl;
}
```

---

## 📊 PERFORMANCE GUIDELINES

### Animation Performance Rules

| Do ✅ | Don't ❌ |
|-------|---------|
| Use `transform` and `opacity` | Animate `width`, `height`, `top`, `left` |
| Use `will-change` sparingly | Apply `will-change` to many elements |
| Batch DOM reads/writes | Mix reads and writes |
| Use `requestAnimationFrame` | Use `setInterval` for animations |
| Throttle scroll handlers | Fire on every scroll event |

### GSAP Performance Tips

```javascript
// Performance optimizations
gsap.config({
  force3D: true,           // Use GPU acceleration
  nullTargetWarn: false    // Suppress warnings
});

// Use GSAP quickSetter for frequent updates
const xSetter = gsap.quickSetter(element, 'x', 'px');
const ySetter = gsap.quickSetter(element, 'y', 'px');

// In animation loop
function onMouseMove(e) {
  xSetter(e.clientX);
  ySetter(e.clientY);
}

// Batch animations
gsap.set(elements, { clearProps: 'all' }); // Clear inline styles after animation
```

---

## 🔗 CROSS-REFERENCES

- **S2-03**: Animation choreography review (input)
- **S3-01**: Visual system specs (companion)
- **N3-01**: Engagement strategy (alignment)
- **A3-01**: WebGL optimization (coordination)

---

## 📚 VERIFIED SOURCES

| Source | Type | Used For |
|--------|------|----------|
| Material Design Motion | Google | Duration, easing |
| HAR File | Project | GSAP version |
| GSAP Documentation | Official | Implementation |
| W3C WCAG | Standard | Reduced motion |

---
