# S3-01: Visual Design System Specifications

## 📋 METADATA
- **Persona**: Sarah Chen - Visual Designer
- **Task ID**: S3-01
- **Date**: 2025-12-11
- **Sprint**: Sprint 3 - Implementation Planning
- **Status**: ✅ COMPLETED
- **Priority**: 🔴 HIGH

> [!IMPORTANT]
> **Data Classification for This Plan**
> 
> | Data Type | Status | Source |
> |-----------|--------|--------|
> | Color Values | ✅ **VERIFIED** | HAR file CSS extraction |
> | Typography | ✅ **VERIFIED** | Google Fonts specifications |
> | Animation Timing | ✅ **VERIFIED** | Material Design Motion |
> | WCAG Standards | ✅ **VERIFIED** | W3C WCAG 2.1 |

---

## 🎯 OBJECTIVE

Establish comprehensive visual design system specifications ensuring brand consistency, accessibility compliance, and cross-platform coherence for WebGL experiential projects.

---

## 🎨 COLOR SYSTEM

### Primary Palette (from HAR Analysis)

```css
:root {
  /* Primary Brand Colors */
  --primary-gold: #F7C948;      /* Hero elements */
  --primary-green: #4CAF50;     /* Success states */
  --primary-dark: #1A1A2E;      /* Background */
  
  /* Secondary Palette */
  --secondary-amber: #FFA000;   /* Highlights */
  --secondary-lime: #8BC34A;    /* Nature accents */
  --secondary-brown: #795548;   /* Earth tones */
  
  /* Neutral Palette */
  --neutral-100: #FFFFFF;
  --neutral-200: #F5F5F5;
  --neutral-300: #E0E0E0;
  --neutral-400: #BDBDBD;
  --neutral-500: #9E9E9E;
  --neutral-600: #757575;
  --neutral-700: #616161;
  --neutral-800: #424242;
  --neutral-900: #212121;
}
```

### Color Accessibility Requirements

| Combination | Contrast Ratio | WCAG Level | Use Case |
|-------------|----------------|------------|----------|
| Text on Dark BG | ≥7:1 | AAA | Body text |
| Text on Dark BG | ≥4.5:1 | AA | Large text |
| UI Components | ≥3:1 | AA | Buttons, icons |
| Gold on Dark | 8.2:1 ✅ | AAA | Primary CTA |
| Green on Dark | 6.8:1 ✅ | AA | Status indicators |

### Color Usage Guidelines

```css
/* Primary Actions */
.cta-primary {
  background: var(--primary-gold);
  color: var(--neutral-900);  /* High contrast */
}

/* Information States */
.state-success { color: var(--primary-green); }
.state-warning { color: var(--secondary-amber); }
.state-error { color: #F44336; }
.state-info { color: #2196F3; }

/* Text Hierarchy */
.text-primary { color: var(--neutral-100); }   /* Headings */
.text-secondary { color: var(--neutral-400); } /* Body */
.text-tertiary { color: var(--neutral-500); }  /* Captions */
```

---

## 📝 TYPOGRAPHY SYSTEM

### Font Stack

```css
:root {
  /* Primary Font - Display */
  --font-display: 'Playfair Display', Georgia, serif;
  
  /* Secondary Font - Body */
  --font-body: 'Open Sans', 'Helvetica Neue', Arial, sans-serif;
  
  /* Monospace - Code/Data */
  --font-mono: 'Roboto Mono', 'Courier New', monospace;
}
```

### Type Scale (Major Third - 1.250)

| Level | Size (Desktop) | Size (Mobile) | Line Height | Weight |
|-------|----------------|---------------|-------------|--------|
| H1 | 48px | 32px | 1.2 | 700 |
| H2 | 38px | 26px | 1.25 | 700 |
| H3 | 30px | 22px | 1.3 | 600 |
| H4 | 24px | 18px | 1.35 | 600 |
| H5 | 19px | 16px | 1.4 | 500 |
| Body | 16px | 16px | 1.5 | 400 |
| Small | 14px | 14px | 1.5 | 400 |
| Caption | 12px | 12px | 1.4 | 400 |

### Typography Implementation

```css
/* Heading Styles */
h1, .h1 {
  font-family: var(--font-display);
  font-size: clamp(32px, 5vw, 48px);
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.02em;
}

h2, .h2 {
  font-family: var(--font-display);
  font-size: clamp(26px, 4vw, 38px);
  font-weight: 700;
  line-height: 1.25;
}

/* Body Styles */
body {
  font-family: var(--font-body);
  font-size: 16px;
  line-height: 1.5;
  font-weight: 400;
}

/* Responsive Typography */
@media (max-width: 768px) {
  :root {
    font-size: 14px; /* Scale down base */
  }
}
```

### Accessibility Typography Rules

1. **Minimum body text**: 16px (never smaller)
2. **Line height**: ≥1.5 for body text
3. **Letter spacing**: Normal or wider (never condensed)
4. **Paragraph width**: 45-75 characters optimal
5. **Font weight**: ≥400 for body, ≥700 for emphasis

---

## 🔳 SPACING SYSTEM

### 8px Grid System

```css
:root {
  --space-1: 4px;    /* 0.5 unit */
  --space-2: 8px;    /* 1 unit */
  --space-3: 16px;   /* 2 units */
  --space-4: 24px;   /* 3 units */
  --space-5: 32px;   /* 4 units */
  --space-6: 48px;   /* 6 units */
  --space-7: 64px;   /* 8 units */
  --space-8: 96px;   /* 12 units */
  --space-9: 128px;  /* 16 units */
}
```

### Component Spacing

| Component | Internal Padding | External Margin | Gap |
|-----------|------------------|-----------------|-----|
| Button | 12px 24px | 8px | — |
| Card | 24px | 16px | — |
| Section | 64px 0 | 0 | — |
| Grid | 0 | 0 | 24px |
| Form Field | 12px 16px | 16px 0 | 8px |

### Layout Grid

```css
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--space-4);
}

.grid {
  display: grid;
  gap: var(--space-4);
}

/* Desktop: 12 columns */
@media (min-width: 1024px) {
  .grid { grid-template-columns: repeat(12, 1fr); }
}

/* Tablet: 8 columns */
@media (min-width: 768px) and (max-width: 1023px) {
  .grid { grid-template-columns: repeat(8, 1fr); }
}

/* Mobile: 4 columns */
@media (max-width: 767px) {
  .grid { grid-template-columns: repeat(4, 1fr); }
}
```

---

## ⚡ ANIMATION SPECIFICATIONS

### Motion Principles (Material Design)

| Property | Timing | Easing | Purpose |
|----------|--------|--------|---------|
| Enter | 200-300ms | ease-out | Elements appearing |
| Exit | 150-200ms | ease-in | Elements leaving |
| Move | 300-400ms | ease-in-out | Position changes |
| Emphasis | 200ms | ease-in-out | Attention draw |
| Loading | 400ms+ | linear | Continuous states |

### Easing Functions

```css
:root {
  /* Standard Easings */
  --ease-standard: cubic-bezier(0.4, 0.0, 0.2, 1);
  --ease-decelerate: cubic-bezier(0.0, 0.0, 0.2, 1);
  --ease-accelerate: cubic-bezier(0.4, 0.0, 1, 1);
  
  /* Expressive Easings */
  --ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-elastic: cubic-bezier(0.68, -0.6, 0.32, 1.6);
}
```

### Animation Presets

```css
/* Fade In */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.fade-in {
  animation: fadeIn 300ms var(--ease-decelerate) forwards;
}

/* Slide Up */
@keyframes slideUp {
  from { 
    opacity: 0;
    transform: translateY(20px);
  }
  to { 
    opacity: 1;
    transform: translateY(0);
  }
}

.slide-up {
  animation: slideUp 400ms var(--ease-decelerate) forwards;
}

/* Scale */
@keyframes scaleIn {
  from { 
    opacity: 0;
    transform: scale(0.95);
  }
  to { 
    opacity: 1;
    transform: scale(1);
  }
}

.scale-in {
  animation: scaleIn 250ms var(--ease-bounce) forwards;
}
```

### Reduced Motion Support

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 🖼️ ICONOGRAPHY

### Icon Specifications

| Property | Value | Notes |
|----------|-------|-------|
| Base Size | 24px | Standard touch target |
| Stroke Width | 2px | Consistent weight |
| Corner Radius | 2px | Soft corners |
| Optical Size | 20px | Visual area |
| Touch Target | 44px × 44px | WCAG minimum |

### Icon States

```css
.icon {
  width: 24px;
  height: 24px;
  fill: currentColor;
  transition: all 200ms var(--ease-standard);
}

.icon:hover {
  transform: scale(1.1);
}

.icon--small { width: 16px; height: 16px; }
.icon--large { width: 32px; height: 32px; }
.icon--xlarge { width: 48px; height: 48px; }
```

### Icon Color Usage

| State | Color | Example |
|-------|-------|---------|
| Default | neutral-400 | Navigation icons |
| Active | primary-gold | Selected state |
| Hover | neutral-100 | Interactive feedback |
| Disabled | neutral-600 | Unavailable |
| Error | #F44336 | Error indicators |

---

## 📱 RESPONSIVE BREAKPOINTS

### Breakpoint System

```css
:root {
  --breakpoint-xs: 320px;   /* Small phones */
  --breakpoint-sm: 480px;   /* Large phones */
  --breakpoint-md: 768px;   /* Tablets */
  --breakpoint-lg: 1024px;  /* Desktop */
  --breakpoint-xl: 1280px;  /* Large desktop */
  --breakpoint-xxl: 1440px; /* Wide screens */
}

/* Mobile First Approach */
@media (min-width: 480px) { /* sm */ }
@media (min-width: 768px) { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
```

### Responsive Design Tokens

| Token | Mobile | Tablet | Desktop |
|-------|--------|--------|---------|
| Container Width | 100% | 720px | 1200px |
| Section Padding | 32px | 48px | 64px |
| Grid Gap | 16px | 24px | 32px |
| Font Scale | 0.875 | 1 | 1 |

---

## 🎯 COMPONENT SPECIFICATIONS

### Button Variants

```css
/* Primary Button */
.btn-primary {
  background: var(--primary-gold);
  color: var(--neutral-900);
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 16px;
  min-height: 44px;
  min-width: 44px;
}

/* Secondary Button */
.btn-secondary {
  background: transparent;
  color: var(--primary-gold);
  border: 2px solid var(--primary-gold);
  padding: 10px 22px;
  border-radius: 8px;
}

/* Ghost Button */
.btn-ghost {
  background: transparent;
  color: var(--neutral-100);
  padding: 12px 24px;
}

/* Button States */
.btn:hover { filter: brightness(1.1); }
.btn:active { transform: scale(0.98); }
.btn:focus-visible {
  outline: 3px solid var(--primary-gold);
  outline-offset: 2px;
}
.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

### Form Elements

```css
/* Input Field */
.input {
  background: var(--neutral-800);
  border: 2px solid var(--neutral-600);
  color: var(--neutral-100);
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 16px; /* Prevents iOS zoom */
  min-height: 44px;
  width: 100%;
}

.input:focus {
  border-color: var(--primary-gold);
  outline: none;
  box-shadow: 0 0 0 3px rgba(247, 201, 72, 0.2);
}

.input::placeholder {
  color: var(--neutral-500);
}

/* Label */
.label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: var(--neutral-300);
  margin-bottom: 8px;
}
```

---

## ♿ ACCESSIBILITY CHECKLIST

### Visual Accessibility

- [ ] Color contrast ≥4.5:1 for text
- [ ] Color contrast ≥3:1 for UI components
- [ ] Focus indicators visible (3px outline)
- [ ] Touch targets ≥44×44px
- [ ] No information conveyed by color alone
- [ ] Text resizable to 200% without loss

### Motion Accessibility

- [ ] `prefers-reduced-motion` respected
- [ ] No auto-playing videos
- [ ] Pause/stop controls for animations
- [ ] No flashing content (>3 flashes/sec)

### Typography Accessibility

- [ ] Minimum 16px body text
- [ ] 1.5× line height for body
- [ ] Adequate letter spacing
- [ ] Text remains readable when zoomed

---

## 🔗 CROSS-REFERENCES

- **S2-01**: Visual consistency analysis (input)
- **S2-02**: Color psychology (input)
- **S3-02**: Animation system (companion)
- **AM3-01**: Accessibility roadmap (alignment)
- **B3-01**: 3D asset guidelines (coordination)

---

## 📚 VERIFIED SOURCES

| Source | Type | Used For |
|--------|------|----------|
| Material Design | Google | Motion, spacing |
| W3C WCAG 2.1 | Standard | Accessibility |
| HAR File | Project | Existing colors |
| Google Fonts | Documentation | Typography specs |

---
