# AM3-03: Accessibility Remediation Checklist
## WCAG 2.1 AA Implementation Guide

---

## Document Information

| Field | Value |
|-------|-------|
| **Document ID** | AM3-03 |
| **Sprint** | 3 - Implementation Planning |
| **Persona** | Amanda Sari (Accessibility Specialist) |
| **Priority** | 🟢 LOW |
| **Status** | ✅ COMPLETED |
| **Created** | 2025-12-11 |
| **References** | AM2-01, AM2-02, AM2-03, AM3-01 |

---

## 📋 Executive Summary

This checklist provides step-by-step remediation guidance for accessibility issues identified in Sprint 2. Based on the Lighthouse accessibility score of 83/100, this document prioritizes fixes by impact and effort to achieve WCAG 2.1 AA compliance.

---

## 📊 Remediation Priority Matrix

### Priority Levels

| Priority | Impact | Effort | Target |
|----------|--------|--------|--------|
| 🔴 P1 | High | Low-Medium | Week 1 |
| 🟠 P2 | Medium | Medium | Week 2 |
| 🟡 P3 | Low | Low | Week 3 |
| 🟢 P4 | Low | High | Backlog |

---

## 🔴 PRIORITY 1: Critical Fixes (Week 1)

### 1.1 Skip Navigation Link

**Issue**: No skip link to bypass navigation
**WCAG**: 2.4.1 Bypass Blocks (A)
**Impact**: Keyboard users must tab through all navigation

**Remediation**:
```html
<!-- ILLUSTRATIVE EXAMPLE - Skip Link Implementation -->

<!-- Add immediately after opening <body> tag -->
<a href="#main-content" class="skip-link">
  Skip to main content
</a>

<!-- Target element -->
<main id="main-content" tabindex="-1">
  <!-- Page content -->
</main>

<style>
.skip-link {
  position: absolute;
  top: -100px;
  left: 0;
  background: #000;
  color: #fff;
  padding: 8px 16px;
  z-index: 10000;
  transition: top 0.3s;
}

.skip-link:focus {
  top: 0;
}
</style>
```

**Verification**:
- [ ] Tab from start of page
- [ ] Skip link appears on focus
- [ ] Activating moves focus to main content
- [ ] Works in all browsers

---

### 1.2 Form Labels

**Issue**: Form inputs missing associated labels
**WCAG**: 1.3.1 Info and Relationships (A)
**Impact**: Screen readers cannot announce field purpose

**Remediation**:
```html
<!-- ILLUSTRATIVE EXAMPLE - Proper Form Labels -->

<!-- Method 1: Explicit association -->
<label for="email-input">Email Address</label>
<input type="email" id="email-input" name="email" required>

<!-- Method 2: Wrapping (for simple forms) -->
<label>
  <span>Phone Number</span>
  <input type="tel" name="phone" required>
</label>

<!-- Method 3: aria-label (for icon-only buttons) -->
<button type="submit" aria-label="Submit form">
  <svg aria-hidden="true"><!-- icon --></svg>
</button>

<!-- Never do this -->
<input type="text" placeholder="Enter your name"> <!-- ❌ No label -->
```

**Verification**:
- [ ] All inputs have labels
- [ ] Labels are programmatically associated
- [ ] Screen reader announces labels
- [ ] Labels visible (not placeholder-only)

---

### 1.3 Focus Indicators

**Issue**: Custom styles removed focus outlines
**WCAG**: 2.4.7 Focus Visible (AA)
**Impact**: Keyboard users cannot see current focus

**Remediation**:
```css
/* ILLUSTRATIVE EXAMPLE - Focus Styles */

/* Never use this */
*:focus {
  outline: none; /* ❌ Removes all focus indicators */
}

/* Use this instead */
:focus-visible {
  outline: 2px solid #005fcc;
  outline-offset: 2px;
}

/* For WebGL canvas overlay buttons */
.canvas-button:focus-visible {
  outline: 3px solid #fff;
  box-shadow: 0 0 0 6px rgba(0, 95, 204, 0.5);
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  :focus-visible {
    outline: 3px solid currentColor;
  }
}
```

**Verification**:
- [ ] Tab through all interactive elements
- [ ] Focus is visible on each element
- [ ] Focus style has 3:1 contrast ratio
- [ ] Works in high contrast mode

---

### 1.4 Color Contrast

**Issue**: Text over 3D canvas may lack contrast
**WCAG**: 1.4.3 Contrast (Minimum) (AA)
**Impact**: Text unreadable for low vision users

**Remediation**:
```css
/* ILLUSTRATIVE EXAMPLE - Contrast Enhancement */

/* Add background to text overlays */
.text-overlay {
  /* Semi-transparent background */
  background: rgba(0, 0, 0, 0.7);
  padding: 16px;
  border-radius: 4px;
}

/* Or use text shadow for 3D effect */
.canvas-text {
  color: #ffffff;
  text-shadow: 
    0 0 4px rgba(0, 0, 0, 0.8),
    0 0 8px rgba(0, 0, 0, 0.6);
}

/* Ensure minimum 4.5:1 ratio for normal text */
/* Ensure minimum 3:1 ratio for large text (18pt+) */
```

**Testing Tool**: WebAIM Contrast Checker
**Target Ratios**:
| Text Type | Required Ratio |
|-----------|----------------|
| Normal (<18pt) | 4.5:1 |
| Large (≥18pt) | 3:1 |
| UI Components | 3:1 |

---

### 1.5 Image Alt Text

**Issue**: Decorative vs informative images not distinguished
**WCAG**: 1.1.1 Non-text Content (A)
**Impact**: Screen readers announce meaningless content

**Remediation**:
```html
<!-- ILLUSTRATIVE EXAMPLE - Image Alt Text -->

<!-- Informative image -->
<img src="corn-product.jpg" 
     alt="Yellow sweet corn cobs arranged in a wooden crate">

<!-- Decorative image -->
<img src="decorative-pattern.png" alt="" role="presentation">

<!-- Image with adjacent text (avoid redundancy) -->
<figure>
  <img src="farm-field.jpg" alt="">
  <figcaption>Sustainable corn farming in midwest America</figcaption>
</figure>

<!-- Complex image (use longer description) -->
<img src="growth-chart.png" 
     alt="Chart showing 40% growth from 2020 to 2024"
     aria-describedby="chart-description">
<div id="chart-description" class="sr-only">
  Detailed chart data: 2020: 100 units, 2021: 115 units...
</div>
```

**Verification**:
- [ ] All images have alt attribute
- [ ] Decorative images have empty alt=""
- [ ] Alt text is meaningful and concise
- [ ] No redundant text with captions

---

## 🟠 PRIORITY 2: Important Fixes (Week 2)

### 2.1 Keyboard Navigation

**Issue**: Custom interactive elements not keyboard accessible
**WCAG**: 2.1.1 Keyboard (A)

**Remediation**:
```javascript
// ILLUSTRATIVE EXAMPLE - Keyboard Accessible Custom Element

class KeyboardAccessibleButton {
  constructor(element) {
    this.element = element;
    this.init();
  }
  
  init() {
    // Make focusable if not already
    if (!this.element.hasAttribute('tabindex')) {
      this.element.setAttribute('tabindex', '0');
    }
    
    // Add role if not semantic button
    if (this.element.tagName !== 'BUTTON') {
      this.element.setAttribute('role', 'button');
    }
    
    // Handle keyboard activation
    this.element.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.element.click();
      }
    });
  }
}

// For WebGL hotspots
class AccessibleHotspot {
  constructor(position, label, action) {
    this.createAccessibleElement(position, label, action);
  }
  
  createAccessibleElement(position, label, action) {
    const button = document.createElement('button');
    button.textContent = label;
    button.className = 'webgl-hotspot';
    button.style.cssText = `
      position: absolute;
      left: ${position.x}px;
      top: ${position.y}px;
    `;
    
    button.addEventListener('click', action);
    button.addEventListener('focus', () => this.highlight());
    button.addEventListener('blur', () => this.unhighlight());
    
    document.body.appendChild(button);
  }
}
```

**Verification**:
- [ ] All functions available via keyboard
- [ ] Tab order is logical
- [ ] No keyboard traps
- [ ] Enter/Space activates controls

---

### 2.2 ARIA Live Regions

**Issue**: Dynamic content changes not announced
**WCAG**: 4.1.3 Status Messages (AA)

**Remediation**:
```html
<!-- ILLUSTRATIVE EXAMPLE - Live Regions -->

<!-- For important updates -->
<div aria-live="polite" aria-atomic="true" id="status-region">
  <!-- Dynamic content inserted here -->
</div>

<!-- For urgent/time-sensitive updates -->
<div aria-live="assertive" id="error-region">
  <!-- Error messages here -->
</div>

<script>
// Update status messages
function updateStatus(message) {
  const region = document.getElementById('status-region');
  region.textContent = message;
}

// Scene change announcement
function announceSceneChange(sceneName) {
  updateStatus(`Now viewing: ${sceneName}`);
}

// Progress updates
function announceProgress(percent) {
  if (percent % 25 === 0) { // Announce at 25%, 50%, 75%, 100%
    updateStatus(`Loading progress: ${percent}% complete`);
  }
}
</script>
```

**Verification**:
- [ ] Screen reader announces updates
- [ ] Appropriate politeness level
- [ ] No excessive announcements
- [ ] Works with VoiceOver and NVDA

---

### 2.3 Heading Structure

**Issue**: Missing or incorrect heading hierarchy
**WCAG**: 1.3.1 Info and Relationships (A)

**Remediation**:
```html
<!-- ILLUSTRATIVE EXAMPLE - Proper Heading Structure -->

<!-- ❌ Bad structure -->
<h1>Corn Revolution</h1>
<h3>Our Story</h3>  <!-- Skipped h2 -->
<h5>Mission</h5>    <!-- Skipped h4 -->

<!-- ✅ Good structure -->
<h1>Corn Revolution</h1>
  <h2>Our Story</h2>
    <h3>The Beginning</h3>
    <h3>Our Mission</h3>
  <h2>Products</h2>
    <h3>Fresh Corn</h3>
    <h3>Processed Corn</h3>

<!-- For visual styling without heading -->
<p class="heading-style-h2">This looks like h2 but isn't</p>
```

**Verification**:
- [ ] Only one h1 per page
- [ ] No skipped heading levels
- [ ] Headings describe content
- [ ] Use WAVE or similar to check

---

### 2.4 Link Purpose

**Issue**: Vague link text like "click here"
**WCAG**: 2.4.4 Link Purpose (In Context) (A)

**Remediation**:
```html
<!-- ILLUSTRATIVE EXAMPLE - Descriptive Links -->

<!-- ❌ Bad link text -->
<a href="/about">Click here</a>
<a href="/products">Learn more</a>
<a href="/contact">Read more</a>

<!-- ✅ Good link text -->
<a href="/about">Learn about our sustainable farming</a>
<a href="/products">View our corn products</a>
<a href="/contact">Contact our sales team</a>

<!-- If link opens new window -->
<a href="/external" target="_blank" rel="noopener">
  Partner website
  <span class="sr-only">(opens in new window)</span>
</a>

<!-- Download links -->
<a href="/catalog.pdf" download>
  Download product catalog (PDF, 2.3MB)
</a>
```

**Verification**:
- [ ] Links make sense out of context
- [ ] No duplicate link text for different URLs
- [ ] New window/download indicated

---

## 🟡 PRIORITY 3: Enhancements (Week 3)

### 3.1 Reduced Motion Support

**Issue**: No option to reduce animations
**WCAG**: 2.3.3 Animation from Interactions (AAA)

**Remediation**:
```css
/* ILLUSTRATIVE EXAMPLE - Reduced Motion */

@media (prefers-reduced-motion: reduce) {
  /* Disable all animations */
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
  
  /* Keep essential transitions but make them instant */
  .essential-transition {
    transition: opacity 0.001s;
  }
}
```

```javascript
// ILLUSTRATIVE EXAMPLE - JS Motion Check

const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;

if (prefersReducedMotion) {
  // Use static images instead of WebGL
  showStaticFallback();
  
  // Disable parallax scrolling
  disableParallax();
  
  // Show content without scroll animations
  gsap.globalTimeline.clear();
}
```

---

### 3.2 Text Resize Support

**Issue**: Layout breaks at 200% zoom
**WCAG**: 1.4.4 Resize Text (AA)

**Remediation**:
```css
/* ILLUSTRATIVE EXAMPLE - Scalable Text */

/* Use relative units */
body {
  font-size: 16px; /* Base size */
}

h1 {
  font-size: 2.5rem; /* 40px at default */
}

p {
  font-size: 1rem; /* 16px at default */
  line-height: 1.5;
}

/* Container adapts to text size */
.content-container {
  max-width: 70ch; /* Character-based width */
  padding: 1.5rem;
}

/* Test at 200% zoom */
@media (min-resolution: 192dpi) {
  /* High DPI adjustments if needed */
}
```

**Verification**:
- [ ] Zoom browser to 200%
- [ ] All text remains readable
- [ ] No content overflow
- [ ] No horizontal scrolling

---

### 3.3 Error Identification

**Issue**: Form errors not clearly communicated
**WCAG**: 3.3.1 Error Identification (A)

**Remediation**:
```html
<!-- ILLUSTRATIVE EXAMPLE - Form Error Handling -->

<form novalidate>
  <div class="form-group">
    <label for="email">Email Address *</label>
    <input 
      type="email" 
      id="email" 
      name="email"
      aria-required="true"
      aria-invalid="false"
      aria-describedby="email-error"
    >
    <span id="email-error" class="error-message" role="alert">
      <!-- Error message inserted by JS -->
    </span>
  </div>
</form>

<script>
function validateEmail(input) {
  const errorSpan = document.getElementById('email-error');
  
  if (!input.value) {
    input.setAttribute('aria-invalid', 'true');
    errorSpan.textContent = 'Email is required';
    input.focus();
    return false;
  }
  
  if (!input.value.includes('@')) {
    input.setAttribute('aria-invalid', 'true');
    errorSpan.textContent = 'Please enter a valid email address';
    input.focus();
    return false;
  }
  
  input.setAttribute('aria-invalid', 'false');
  errorSpan.textContent = '';
  return true;
}
</script>
```

---

### 3.4 Page Title

**Issue**: Generic or missing page titles
**WCAG**: 2.4.2 Page Titled (A)

**Remediation**:
```html
<!-- ILLUSTRATIVE EXAMPLE - Page Titles -->

<!-- ❌ Bad titles -->
<title>Home</title>
<title>Page</title>
<title>Untitled</title>

<!-- ✅ Good titles -->
<title>Corn Revolution - Sustainable Premium Corn Products</title>
<title>Our Story | Corn Revolution</title>
<title>Contact Sales | Corn Revolution</title>

<!-- For single-page apps, update dynamically -->
<script>
function updatePageTitle(sectionName) {
  document.title = `${sectionName} | Corn Revolution`;
}
</script>
```

---

## 🟢 PRIORITY 4: Advanced Enhancements (Backlog)

### 4.1 WebGL Text Alternative

Full alternative experience for screen reader users (detailed in AM3-01).

### 4.2 Touch Target Size

Ensure all touch targets are minimum 44×44px (detailed in F3-01).

### 4.3 Language Identification

```html
<html lang="en">
  <!-- Content in English -->
  <p>Welcome to Corn Revolution.</p>
  
  <!-- Content in other language -->
  <p lang="es">Bienvenido a Corn Revolution.</p>
</html>
```

---

## ✅ Testing Checklist

### Automated Testing

| Tool | What It Tests | Run Frequency |
|------|--------------|---------------|
| Lighthouse | Overall score | Every build |
| axe DevTools | WCAG violations | Every PR |
| WAVE | Visual issues | Weekly |
| Pa11y | Automated checks | CI/CD |

### Manual Testing

| Test | How To Test | Target |
|------|-------------|--------|
| Keyboard | Tab through entire page | All functions work |
| Screen Reader | Use NVDA/VoiceOver | All content read |
| Zoom | 200% browser zoom | No content loss |
| Color | Grayscale mode | Info not color-dependent |

### User Testing

- [ ] Test with actual screen reader users
- [ ] Test with keyboard-only users
- [ ] Test with users with motor impairments
- [ ] Gather feedback and iterate

---

## 🔗 Cross-References

| Document | Relationship |
|----------|--------------|
| AM2-01 (Gap Analysis) | Issue identification |
| AM2-02 (WCAG Compliance) | Compliance baseline |
| AM3-01 (Roadmap) | Implementation sequence |
| AM3-02 (Testing Strategy) | Verification methods |
| F3-02 (Fallback) | Alternative experience |

---

## 📊 Data Classification

| Category | Classification |
|----------|----------------|
| **Primary Data** | Lighthouse score (83/100) |
| **Standards** | WCAG 2.1 AA requirements |
| **Code Examples** | Illustrative (not from live site) |
| **Prioritization** | Based on impact/effort matrix |

---

*Document Status: ✅ COMPLETED*
*Last Updated: 2025-12-11*
