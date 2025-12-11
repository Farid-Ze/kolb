# S4-03: Animation Standards Reference

## 📋 METADATA
- **Task ID**: S4-03
- **Persona**: Sarah Putri W. (UI/UX Designer)
- **Sprint**: 4 - Validation & Handoff
- **Status**: ✅ COMPLETED
- **Created**: 2025-12-11
- **Dependencies**: S3-02, A3-03, AM4-01

---

## 🎯 OBJECTIVE

Provide a quick reference guide for animation standards in Zenotika WebGL projects aligned with Material Design principles and accessibility requirements.

---

## ⚡ ANIMATION STANDARDS QUICK REFERENCE

### 1. Timing Guidelines

#### Duration Standards

| Animation Type | Duration | Usage |
|----------------|----------|-------|
| Micro-interaction | 100-150ms | Buttons, toggles, inputs |
| State change | 200-300ms | Hover, focus, selection |
| Enter/Exit | 200-400ms | Modals, dropdowns, cards |
| Complex | 400-700ms | Page transitions, scene changes |
| Elaborate | 700-1000ms | Hero animations, reveals |

#### When to Use Each Duration

```
100-150ms: Instant feedback
├── Button press
├── Toggle switch
├── Checkbox
└── Icon change

200-300ms: Quick transitions
├── Hover states
├── Focus rings
├── Dropdown open
└── Tooltip appear

400-700ms: Noticeable animations
├── Modal open/close
├── Card expand
├── Navigation slide
└── Content reveal

700-1000ms: Dramatic effect
├── Page transitions
├── Hero animations
├── Scene changes
└── Loading completion
```

### 2. Easing Functions

#### Standard Easings

| Name | Curve | Usage | GSAP |
|------|-------|-------|------|
| **Ease Out** | Decelerate | Elements entering | `power2.out` |
| **Ease In** | Accelerate | Elements exiting | `power2.in` |
| **Ease In-Out** | Both | State changes | `power2.inOut` |
| **Linear** | Constant | Progress bars | `none` |

#### Custom Easings

```javascript
// Recommended GSAP easings
const EASINGS = {
  // Standard
  enter: 'power2.out',
  exit: 'power2.in',
  move: 'power2.inOut',
  
  // Playful
  bounce: 'back.out(1.7)',
  elastic: 'elastic.out(1, 0.3)',
  
  // Smooth
  smooth: 'power3.out',
  gentle: 'sine.inOut',
  
  // Dramatic
  dramatic: 'expo.out',
  swift: 'power4.out'
};
```

### 3. Animation Patterns

#### Enter Animations

| Pattern | Properties | Duration | Easing |
|---------|------------|----------|--------|
| Fade In | opacity: 0 → 1 | 300ms | ease-out |
| Slide Up | y: 20 → 0, opacity: 0 → 1 | 400ms | power2.out |
| Scale In | scale: 0.9 → 1, opacity: 0 → 1 | 300ms | back.out |
| Reveal | clipPath animation | 500ms | power3.out |

#### Exit Animations

| Pattern | Properties | Duration | Easing |
|---------|------------|----------|--------|
| Fade Out | opacity: 1 → 0 | 200ms | ease-in |
| Slide Down | y: 0 → 20, opacity: 1 → 0 | 300ms | power2.in |
| Scale Out | scale: 1 → 0.9, opacity: 1 → 0 | 200ms | power2.in |

#### Scroll Animations

| Pattern | Trigger | Animation |
|---------|---------|-----------|
| Fade on scroll | 25% in viewport | Fade in |
| Parallax | Continuous | Y offset at different rates |
| Pin | Element reaches top | Fix position |
| Scrub | Scroll position | Animation progress linked |

### 4. 3D Animation Standards

#### Camera Movements

| Movement | Duration | Easing | Use Case |
|----------|----------|--------|----------|
| Orbit | 2-4s | smooth | Scene exploration |
| Dolly | 1-2s | power2.out | Zoom to detail |
| Pan | 1-3s | power2.inOut | Scene transition |
| Crane | 2-3s | power3.out | Reveal |

#### Object Animations

| Animation | Duration | Easing | Notes |
|-----------|----------|--------|-------|
| Rotation (idle) | 8-12s | none (linear) | Subtle showcase |
| Scale | 300-500ms | back.out | Emphasis |
| Position | 500-800ms | power2.out | State change |
| Material | 300ms | power2.inOut | Highlighting |

### 5. Stagger Patterns

#### List Items

```javascript
// GSAP stagger pattern
gsap.from('.list-item', {
  y: 20,
  opacity: 0,
  duration: 0.4,
  stagger: 0.1,  // 100ms between items
  ease: 'power2.out'
});
```

#### Recommended Stagger Values

| Content Type | Stagger Delay | Max Items |
|--------------|---------------|-----------|
| Menu items | 50-80ms | 6-8 |
| Cards | 100-150ms | 4-6 |
| List items | 50-100ms | 8-10 |
| Characters | 20-30ms | Unlimited |

### 6. Reduced Motion

#### Implementation

```javascript
// Check user preference
const prefersReducedMotion = 
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Apply reduced motion
if (prefersReducedMotion) {
  gsap.globalTimeline.timeScale(10); // Near-instant
  
  // Or disable specific animations
  gsap.defaults({ duration: 0.01 });
}
```

#### Alternative Behaviors

| Full Animation | Reduced Alternative |
|----------------|---------------------|
| Slide + fade | Fade only |
| Bounce | No bounce |
| Parallax | Static |
| Continuous rotation | Static with hover |
| Auto-play video | Poster image |

### 7. Performance Guidelines

#### Frame Budget

| Target FPS | Frame Time | Animation Complexity |
|------------|------------|---------------------|
| 60 FPS | 16.67ms | Full complexity |
| 45 FPS | 22.22ms | Moderate complexity |
| 30 FPS | 33.33ms | Low complexity |

#### Performance Tips

- Use `transform` and `opacity` only (composited)
- Avoid animating `width`, `height`, `top`, `left`
- Use `will-change` sparingly
- Batch DOM reads/writes
- Use `requestAnimationFrame` for JS animations

### 8. Common Mistakes

| ❌ Avoid | ✅ Instead |
|----------|-----------|
| Animating layout properties | Use transform |
| Very long durations (>2s) | Keep under 1s for UI |
| Same easing for enter/exit | Enter: ease-out, Exit: ease-in |
| No reduced motion support | Always provide alternative |
| Animations blocking interaction | Keep UI responsive |

---

## 📋 ANIMATION CHECKLIST

### Before Implementation
- [ ] Define purpose of animation
- [ ] Choose appropriate duration
- [ ] Select correct easing
- [ ] Plan reduced motion alternative

### During Implementation
- [ ] Use transform/opacity only
- [ ] Test at 60 FPS
- [ ] Test reduced motion preference
- [ ] Verify on mobile devices

### Quality Check
- [ ] Animation enhances (not distracts)
- [ ] Timing feels natural
- [ ] Performance acceptable
- [ ] Accessibility maintained

---

## 📚 CROSS-REFERENCES

| Document | Content |
|----------|---------|
| S4-01 | UI design system |
| S4-02 | UX pattern library |
| A3-03 | Animation implementation |
| AM4-01 | Accessibility requirements |

---

## 📊 DATA CLASSIFICATION

| Data Type | Classification | Source |
|-----------|----------------|--------|
| Duration guidelines | ✅ VERIFIED | Material Design |
| Easing functions | ✅ VERIFIED | GSAP documentation |
| Performance targets | ✅ VERIFIED | Google RAIL Model |

---

**Document Status**: ✅ COMPLETED  
**Last Updated**: 2025-12-11  
**Owner**: Sarah Putri W. (UI/UX Designer)
