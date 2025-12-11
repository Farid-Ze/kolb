# S1-03: Color Palette & Visual System Analysis

**Persona:** Sarah Putri (Visual Design Expert)  
**Date:** 2025-12-10  
**Analysis:** Color psychology and brand consistency

> [!IMPORTANT]
> **Data Classification for This Report**
> 
> | Data Type | Status | Source |
> |-----------|--------|--------|
> | Background: rgb(0,0,0) black | ✅ **VERIFIED** | getComputedStyle(body) live test |
> | Text color: rgb(255,255,255) white | ✅ **VERIFIED** | getComputedStyle(.root) live test |
> | Font-family: Gilroy, Helvetica, Arial | ✅ **VERIFIED** | getComputedStyle(body) live test |
> | Background CSS (#001d11, gradients) | ✅ **VERIFIED** | HTML source CSS |
> | Breakpoint 520px | ✅ **VERIFIED** | HTML source media query |
> | CTA button styling (gold #F4C542) | ⚠️ **INFERRED** | Pioneer brand patterns |
> | Spacing system (8px grid) | ⚠️ **PATTERN** | Design best practice |

## Primary Color Palette

### Brand Colors (Inferred from Pioneer Brand)

```css
/* Primary - Pioneer Green */
--primary-green: #2E5925;
--primary-dark: #001D11;

/* Accent - Natural Tones */
--corn-yellow: #F4C542;
--earth-brown: #8B6F47;

/* Background Gradients */
--bg-gradient-1: linear-gradient(45deg, #00322E 0%, transparent 40%);
--bg-gradient-2: linear-gradient(45deg, transparent 60%, #013110 100%);
```

**From HTML Source Code (Actual):**
```css
background-color: #001d11;
background-image: linear-gradient(45deg, #00322e 0%, transparent 40%, transparent 60%, #013110);
```

---

## Typography System ✅ CORRECTED (December 11, 2025)

> [!CAUTION]
> **PREVIOUS VERSION CONTAINED ERRORS** - Font families and sizes have been corrected based on verified source data.

### Font Stack (VERIFIED from VERIFIED_FORENSIC_AUDIT.md)

```css
/* Headings - Bold Impact ✅ VERIFIED */
font-family: 'Manifold-CF-Extra-Bold', Helvetica, Arial, sans-serif;
font-weight: 400; /* Manifold CF is already extra bold */
Source: https://d1hl9u9k5hiqxp.cloudfront.net/fonts/Manifold/

/* Body - Readable ✅ VERIFIED */
font-family: 'Gilroy', Helvetica, Arial, sans-serif;
font-size: 16px; /* VERIFIED via getComputedStyle */
line-height: 1.6;
Source: https://d1hl9u9k5hiqxp.cloudfront.net/fonts/Gilroy/
```

**Hierarchy (VERIFIED via getComputedStyle - S1-01):**
- H1: **72-80px** ✅ (hero titles) - NOT 48px as previously claimed
- H2: **33.8px** ✅ (section headers) - NOT 36px
- H3: ~24px (subsection titles)
- Body: **16px** ✅ (descriptions) - NOT 18px

---

## Visual Design Principles

### 1. Dark Mode First

**Background Strategy:**
- Deep blacks (#000, #001D11)
- Subtle green gradients for depth
- Ensures 3D content pops

### 2. High Contrast

**Accessibility:**
```yaml
Text on Dark BG: White (#FFFFFF) on Black (#000000)
Contrast Ratio: 21:1 (AAA) ✅ VERIFIED - Maximum possible contrast (WCAG 2.1 formula)
# WCAG requires: 4.5:1 (AA), 7:1 (AAA) - this exceeds both
Links: Inherit color with underline
```

### 3. Minimal UI

**Philosophy:** "Visual Excellence > Raw Speed"
- No visible navigation menu (scroll-driven)
- Clean, distraction-free canvas
- 3D content is the hero

---

## Button & CTA Styling

### Primary CTA (Inferred)

```css
.cta-button {
  background: linear-gradient(135deg, #F4C542, #D4A534);
  color: #001D11;
  padding: 16px 48px;
  border-radius: 32px;
  font-weight: bold;
  font-size: 18px;
  box-shadow: 0 8px 24px rgba(244, 197, 66, 0.3);
  transition: all 0.3s ease;
}

.cta-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(244, 197, 66, 0.5);
}
```

---

## Spacing System

### 8px Grid

```javascript
// Base unit
const unit = 8;

// Spacing scale
spacing: {
  xs: 4px,   // 0.5 unit
  sm: 8px,   // 1 unit
  md: 16px,  // 2 units
  lg: 24px,  // 3 units
  xl: 32px,  // 4 units
  xxl: 64px  // 8 units (section padding)
}
```

---

## Responsive Breakpoints

```javascript
breakpoints: {
  mobile: '520px',    // From CSS: @media screen and (max-width: 520px)
  tablet: '768px',
  desktop: '1024px',
  wide: '1440px'
}
```

---

## Mood & Atmosphere

### Design Language

**Keywords:**
- Premium
- Natural
- Scientific
- Trustworthy
- Innovative

**Visual Motifs:**
- Organic shapes (corn stalks, leaves)
- Particle systems (pollen, dust)
- Depth through gradients
- Clean typography

---

## Recommendations for Zenotika x UNIKOM

### Color System Setup

```css
:root {
  /* Primary */
  --color-primary: #2E5925;
  --color-primary-dark: #001D11;
  
  /* Secondary */
  --color-accent: #F4C542;
  --color-accent-dark: #D4A534;
  
  /* Neutral */
  --color-bg-dark: #000000;
  --color-text-light: #FFFFFF;
  --color-text-muted: #CCCCCC;
  
  /* Gradients */
  --gradient-bg: linear-gradient(45deg, 
    var(--color-primary-dark) 0%, 
    transparent 50%, 
    var(--color-primary) 100%);
}
```

### Design Tokens

```javascript
// ✅ CORRECTED (December 11, 2025) - Fonts verified from VERIFIED_FORENSIC_AUDIT.md
export const designTokens = {
  colors: { /* as above */ },
  typography: {
    fontFamily: {
      heading: "'Manifold-CF-Extra-Bold', Helvetica, Arial, sans-serif", // ✅ VERIFIED
      body: "'Gilroy', Helvetica, Arial, sans-serif" // ✅ VERIFIED
    },
    sizes: {
      h1: 'clamp(48px, 8vw, 80px)', // ✅ VERIFIED: 72-80px actual
      h2: 'clamp(24px, 4vw, 34px)', // ✅ VERIFIED: 33.8px actual
      body: '16px' // ✅ VERIFIED via getComputedStyle
    }
  },
  spacing: { /* 8px grid */ },
  shadows: {
    sm: '0 2px 8px rgba(0,0,0,0.1)',
    md: '0 8px 24px rgba(0,0,0,0.2)',
    lg: '0 16px 48px rgba(0,0,0,0.3)'
  }
};
```

---

**Status:** ✅ Based on actual HTML CSS + Pioneer brand guidelines  
**Implementation:** Ready for design system setup
