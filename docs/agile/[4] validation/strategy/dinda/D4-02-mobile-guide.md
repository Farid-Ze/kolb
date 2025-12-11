# D4-02: Mobile Optimization Guide

## 📋 METADATA
- **Task ID**: D4-02
- **Persona**: Dinda Pratiwi (Social Media & Mobile Specialist)
- **Sprint**: 4 - Validation & Handoff
- **Status**: ✅ COMPLETED
- **Created**: 2025-12-11
- **Dependencies**: D2-02, D3-02, F4-02

---

## 🎯 OBJECTIVE

Provide comprehensive mobile optimization guidelines for Zenotika WebGL experiential projects.

---

## 📱 MOBILE OPTIMIZATION GUIDE

### 1. Mobile-First Design Principles

#### Core Principles

| Principle | Description | Implementation |
|-----------|-------------|----------------|
| Touch-First | Design for fingers | 48px min touch targets |
| Content Priority | Essential content first | Progressive disclosure |
| Performance | Speed is critical | Optimized assets |
| Context Aware | Consider mobile use cases | Simplified interactions |
| Thumb Zone | Reach optimization | Key actions in comfort zone |

#### Thumb Zone Reference

```
MOBILE THUMB ZONE MAP
┌─────────────────────────┐
│  HARD TO   │  NATURAL  │
│  REACH     │           │
├────────────┼───────────┤
│            │           │
│  NATURAL   │  EASY     │
│            │           │
├────────────┼───────────┤
│            │           │
│  EASY      │  NATURAL  │
│            │ (Primary) │
└─────────────────────────┘

Place CTAs in Easy/Natural zones
```

### 2. Touch Interaction Guidelines

#### Touch Target Specifications

| Element | Minimum Size | Recommended | Spacing |
|---------|--------------|-------------|---------|
| Buttons | 44x44px | 48x48px | 8px |
| Links | 44x44px | 48x48px | 8px |
| Icons | 24x24px | 32x32px | 16px |
| Form fields | 44px height | 48px | 16px |

#### Gesture Support

| Gesture | Use Case | Implementation |
|---------|----------|----------------|
| Tap | Primary selection | onclick |
| Swipe | Navigation | Touch events |
| Pinch | Zoom (if needed) | Touch scale |
| Long press | Context menu | Touch hold |
| Scroll | Content navigation | Native scroll |

### 3. Mobile Performance Optimization

#### Performance Budgets

| Metric | Target (Mobile) | Critical |
|--------|-----------------|----------|
| Page Size | <2MB | <3MB |
| LCP | <2.5s | <4s |
| FID | <100ms | <300ms |
| CLS | <0.1 | <0.25 |
| Time to Interactive | <3.5s | <5s |

#### Mobile-Specific Optimizations

| Optimization | Technique | Impact |
|--------------|-----------|--------|
| Image optimization | WebP, responsive | 30-50% savings |
| Lazy loading | Images, scenes | Faster initial load |
| Code splitting | Dynamic imports | Smaller bundles |
| 3D simplification | LOD system | 50%+ GPU savings |
| Caching | Service worker | Instant repeat loads |

### 4. Responsive Design Guidelines

#### Breakpoint System

| Breakpoint | Width | Target Devices |
|------------|-------|----------------|
| XS | 0-575px | Small phones |
| SM | 576-767px | Large phones |
| MD | 768-991px | Tablets portrait |
| LG | 992-1199px | Tablets landscape |
| XL | 1200-1399px | Small desktop |
| XXL | 1400px+ | Large desktop |

#### Mobile-Specific CSS

```css
/* Mobile-First Base Styles */
.container {
  padding: 16px;
  width: 100%;
}

/* Touch-friendly buttons */
.btn {
  min-height: 48px;
  min-width: 48px;
  padding: 12px 24px;
  font-size: 16px; /* Prevents iOS zoom */
}

/* Prevent text zoom on input focus */
input, select, textarea {
  font-size: 16px;
}

/* Hide complex animations on mobile */
@media (max-width: 768px) {
  .complex-animation {
    animation: none;
  }
}

/* Respect motion preferences */
@media (prefers-reduced-motion: reduce) {
  * {
    animation: none !important;
    transition: none !important;
  }
}
```

### 5. Mobile WebGL Optimization

#### 3D Performance Tiers

| Tier | Device | Max Triangles | Max Textures | Effects |
|------|--------|---------------|--------------|---------|
| High | Flagship 2023+ | 500K | 2048px | Full |
| Medium | Mid-range | 200K | 1024px | Reduced |
| Low | Budget/Old | 100K | 512px | Minimal |
| Fallback | Very old | N/A | N/A | Static |

#### Mobile 3D Best Practices

```javascript
// Device capability detection
function getMobileGraphicsTier() {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
  
  if (!gl) return 'fallback';
  
  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
  const renderer = debugInfo ? 
    gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : '';
  
  // Check for high-end mobile GPUs
  if (/adreno [6-7]\d{2}|mali-g[7-9]\d|apple gpu/i.test(renderer)) {
    return 'high';
  }
  
  // Check for mid-range
  if (/adreno [4-5]\d{2}|mali-g[5-6]\d/i.test(renderer)) {
    return 'medium';
  }
  
  return 'low';
}
```

### 6. Mobile Form Optimization

#### Input Type Best Practices

| Input Type | Use Case | Mobile Keyboard |
|------------|----------|-----------------|
| email | Email addresses | @ and . visible |
| tel | Phone numbers | Numeric pad |
| number | Quantities | Numeric pad |
| url | Web addresses | .com shortcut |
| search | Search fields | Search button |
| date | Date selection | Date picker |

#### Form UX Guidelines

| Guideline | Implementation |
|-----------|----------------|
| Auto-complete | `autocomplete="name"` |
| Input masks | Phone number formatting |
| Inline validation | Real-time feedback |
| Clear labels | Above input, not placeholder |
| Error recovery | Clear error messages |

### 7. Mobile Testing Checklist

#### Device Testing Matrix

| Category | Devices to Test |
|----------|-----------------|
| iOS High-end | iPhone 14/15 Pro |
| iOS Mid-range | iPhone 12/13 |
| iOS Budget | iPhone SE |
| Android High-end | Samsung S23/Pixel 7 |
| Android Mid-range | Samsung A54/Pixel 6a |
| Android Budget | Xiaomi Redmi |
| Tablet | iPad Pro, Galaxy Tab |

#### Testing Scenarios

| Scenario | Test For |
|----------|----------|
| Portrait | Layout adaptation |
| Landscape | Wide layout handling |
| Keyboard open | Form usability |
| One-handed | Thumb zone access |
| Slow network | Loading behavior |
| Low battery | Performance mode |
| Interruptions | Resume behavior |

### 8. Mobile UX Patterns

#### Navigation Patterns

| Pattern | Best For | Example |
|---------|----------|---------|
| Bottom Nav | Primary actions | Main sections |
| Hamburger | Secondary items | Full menu |
| Tab Bar | Section switching | Content types |
| Sticky Header | Always-available | Logo, search |
| FAB | Primary action | Contact, share |

#### Content Patterns

| Pattern | Implementation | Use Case |
|---------|----------------|----------|
| Pull to refresh | Touch gesture | Update content |
| Infinite scroll | Lazy load | Long lists |
| Cards | Contained content | Item lists |
| Full-screen | Immersive | Hero experiences |
| Sheets | Bottom drawers | Actions, filters |

---

## ✅ MOBILE OPTIMIZATION CHECKLIST

### Performance
- [ ] Page size <2MB
- [ ] LCP <2.5s on mobile
- [ ] Images optimized (WebP, responsive)
- [ ] Lazy loading implemented
- [ ] 3D assets scaled for mobile

### Touch & Interaction
- [ ] Touch targets 48x48px minimum
- [ ] 8px spacing between targets
- [ ] Thumb zone consideration
- [ ] No hover-dependent features
- [ ] Gesture support where needed

### Forms & Input
- [ ] Correct input types
- [ ] 16px font size (prevents zoom)
- [ ] Auto-complete enabled
- [ ] Inline validation
- [ ] Clear error messages

### Testing
- [ ] Tested on iOS devices
- [ ] Tested on Android devices
- [ ] Tested portrait and landscape
- [ ] Tested on slow networks
- [ ] Tested with screen readers

---

## 📚 CROSS-REFERENCES

| Document | Content |
|----------|---------|
| D4-01 | Social media playbook |
| D4-03 | Viral content guide |
| F4-02 | Device testing matrix |
| K4-01 | Performance checklist |

---

## 📊 DATA CLASSIFICATION

| Data Type | Classification | Source |
|-----------|----------------|--------|
| Touch target sizes | ✅ VERIFIED | WCAG, Material Design |
| Performance budgets | ✅ VERIFIED | Google Web Vitals |
| Breakpoints | ✅ VERIFIED | Bootstrap/Industry standard |

---

**Document Status**: ✅ COMPLETED  
**Last Updated**: 2025-12-11  
**Owner**: Dinda Pratiwi (Social Media & Mobile Specialist)
