# AM3-01: Accessibility Implementation Roadmap

## 📋 METADATA
- **Persona**: Amanda Sari - Accessibility Specialist
- **Task ID**: AM3-01
- **Date**: 2025-12-11
- **Sprint**: Sprint 3 - Implementation Planning
- **Status**: ✅ COMPLETED
- **Priority**: 🔴 HIGH

> [!IMPORTANT]
> **Data Classification for This Plan**
> 
> | Data Type | Status | Source |
> |-----------|--------|--------|
> | Current Accessibility Score | ✅ **VERIFIED** | PageSpeed Insights 83/100 |
> | WCAG Guidelines | ✅ **VERIFIED** | W3C Official Specification |
> | axe-core Classifications | ✅ **VERIFIED** | Deque Systems Docs |
> | Implementation Steps | ⚠️ **RECOMMENDATION** | Best practices |

---

## 🎯 OBJECTIVE

Create an actionable accessibility improvement roadmap for WebGL experiential sites, targeting WCAG 2.1 AA compliance for controllable elements while acknowledging canvas-based limitations.

---

## 📊 CURRENT STATE (Verified Baseline)

### Accessibility Metrics (✅ Verified)

| Metric | Current | Target | Gap |
|--------|---------|--------|-----|
| Lighthouse Accessibility | **83/100** | 90+ | +7 points |
| Focusable Elements | 38 | — | ✅ Good |
| Skip Links | ❌ Missing | Required | Critical |
| H1 Heading | ❌ Missing | Required | Critical |
| `<main>` Landmark | ❌ Missing | Required | Important |
| `lang` Attribute | ❌ Missing | Required | Critical |
| Zoom Disabled | ❌ Failure | Fix | Important |

### WCAG Failure Summary (✅ Verified from AM2-01)

| Issue | WCAG Criterion | Severity | Fixable? |
|-------|----------------|----------|----------|
| Zoom disabled (`user-scalable=no`) | 1.4.4 | SERIOUS | ✅ YES |
| Missing `lang` attribute | 3.1.1 | SERIOUS | ✅ YES |
| Missing skip links | 2.4.1 | SERIOUS | ✅ YES |
| Missing `<main>` landmark | 1.3.1 | MODERATE | ✅ YES |
| No H1 heading | 1.3.1 | MODERATE | ✅ YES |
| No `:focus` styles | 2.4.7 | SERIOUS | ✅ YES |
| Canvas content inaccessible | — | KNOWN | ⚠️ Limited |

---

## 🚀 ACCESSIBILITY ROADMAP

### Phase 1: Critical Fixes (Week 1) - 100% Fixable

#### 1.1 Document Language Declaration
**WCAG**: 3.1.1 Language of Page (Level A)
**Effort**: 5 minutes | **Impact**: HIGH

**Current**:
```html
<html>
```

**Fixed**:
```html
<html lang="en">
```

**Verification**: Lighthouse will pass this check immediately.

---

#### 1.2 Remove Zoom Restriction
**WCAG**: 1.4.4 Resize Text (Level AA)
**Effort**: 5 minutes | **Impact**: HIGH

**Current**:
```html
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
```

**Fixed**:
```html
<meta name="viewport" content="width=device-width, initial-scale=1">
```

**Note**: For WebGL experiences where zoom interferes with 3D interaction, provide alternative text scaling:
```html
<button aria-label="Increase text size">A+</button>
<button aria-label="Decrease text size">A-</button>
```

---

#### 1.3 Add Skip Navigation Link
**WCAG**: 2.4.1 Bypass Blocks (Level A)
**Effort**: 30 minutes | **Impact**: HIGH

```html
<!-- First element after <body> -->
<a href="#main-content" class="skip-link">Skip to main content</a>

<!-- Target element -->
<main id="main-content" tabindex="-1">
  <!-- Main experience content -->
</main>

<style>
.skip-link {
  position: absolute;
  top: -40px;
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

---

#### 1.4 Add Landmark Regions
**WCAG**: 1.3.1 Info and Relationships (Level A)
**Effort**: 1 hour | **Impact**: MEDIUM

```html
<body>
  <a href="#main-content" class="skip-link">Skip to main content</a>
  
  <header role="banner">
    <!-- Logo, navigation if any -->
  </header>
  
  <main id="main-content" role="main">
    <!-- WebGL canvas and experience -->
    <h1 class="visually-hidden">Pioneer – Corn. Revolutionized.</h1>
  </main>
  
  <footer role="contentinfo">
    <!-- Footer content -->
  </footer>
</body>
```

---

#### 1.5 Add Focus Indicators
**WCAG**: 2.4.7 Focus Visible (Level AA)
**Effort**: 30 minutes | **Impact**: HIGH

```css
/* Global focus indicator */
:focus {
  outline: 3px solid #4A90D9;
  outline-offset: 2px;
}

/* Remove default only when custom is applied */
:focus:not(:focus-visible) {
  outline: none;
}

:focus-visible {
  outline: 3px solid #4A90D9;
  outline-offset: 2px;
}

/* High contrast mode support */
@media (forced-colors: active) {
  :focus {
    outline: 3px solid CanvasText;
  }
}
```

---

### Phase 2: Semantic Structure (Week 2)

#### 2.1 Heading Hierarchy
**WCAG**: 1.3.1 Info and Relationships (Level A)

```html
<main id="main-content">
  <h1 class="visually-hidden">Pioneer – Corn. Revolutionized.</h1>
  
  <section aria-labelledby="science-heading">
    <h2 id="science-heading">Science</h2>
    <h3>Chapter 1</h3>
    <!-- Content -->
  </section>
  
  <section aria-labelledby="results-heading">
    <h2 id="results-heading">Real World Testing</h2>
    <h3>Chapter 2</h3>
    <!-- Content -->
  </section>
</main>
```

**Visually Hidden Class**:
```css
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

---

#### 2.2 ARIA Live Regions for Dynamic Content
**WCAG**: 4.1.3 Status Messages (Level AA)

```html
<!-- Announce scroll progress to screen readers -->
<div 
  aria-live="polite" 
  aria-atomic="true" 
  class="visually-hidden"
  id="scroll-announcer">
</div>

<script>
// Announce section changes
function announceSection(sectionName) {
  const announcer = document.getElementById('scroll-announcer');
  announcer.textContent = `Now viewing: ${sectionName}`;
}

// Throttled scroll handler
let lastSection = '';
window.addEventListener('scroll', throttle(() => {
  const currentSection = getCurrentSection();
  if (currentSection !== lastSection) {
    announceSection(currentSection);
    lastSection = currentSection;
  }
}, 1000));
</script>
```

---

### Phase 3: Form Accessibility (Week 3)

#### 3.1 Lead Capture Form Enhancement
**WCAG**: Multiple criteria

```html
<form id="lead-form" aria-labelledby="form-heading">
  <h2 id="form-heading">Contact Us</h2>
  
  <div class="form-group">
    <label for="name">Full Name <span aria-hidden="true">*</span></label>
    <input 
      type="text" 
      id="name" 
      name="name" 
      required
      aria-required="true"
      aria-describedby="name-hint"
      autocomplete="name">
    <span id="name-hint" class="hint">Enter your first and last name</span>
  </div>
  
  <div class="form-group">
    <label for="email">Email Address <span aria-hidden="true">*</span></label>
    <input 
      type="email" 
      id="email" 
      name="email" 
      required
      aria-required="true"
      aria-describedby="email-error"
      aria-invalid="false"
      autocomplete="email">
    <span id="email-error" class="error" role="alert" hidden></span>
  </div>
  
  <button type="submit">Submit</button>
</form>

<script>
// Error handling with accessibility
function showError(inputId, message) {
  const input = document.getElementById(inputId);
  const error = document.getElementById(`${inputId}-error`);
  
  input.setAttribute('aria-invalid', 'true');
  error.textContent = message;
  error.hidden = false;
  input.focus();
}
</script>
```

---

### Phase 4: Enhanced Keyboard Navigation (Week 4)

#### 4.1 Keyboard Shortcuts
**Best Practice**: Provide keyboard alternatives

```javascript
const keyboardShortcuts = {
  'Space': () => togglePlayPause(),
  'ArrowDown': () => scrollToNextSection(),
  'ArrowUp': () => scrollToPrevSection(),
  'Home': () => scrollToStart(),
  'End': () => scrollToEnd(),
  '1-9': (num) => scrollToSection(num),
  '?': () => showKeyboardHelp(),
  'Escape': () => closeModals()
};

document.addEventListener('keydown', (e) => {
  // Don't intercept when user is in form field
  if (e.target.matches('input, textarea, select')) return;
  
  const handler = keyboardShortcuts[e.key];
  if (handler) {
    e.preventDefault();
    handler(e.key);
  }
});
```

#### 4.2 Keyboard Help Modal

```html
<dialog id="keyboard-help" aria-labelledby="kb-help-title">
  <h2 id="kb-help-title">Keyboard Shortcuts</h2>
  <dl>
    <dt><kbd>Space</kbd></dt>
    <dd>Pause/Resume experience</dd>
    
    <dt><kbd>↓</kbd> / <kbd>↑</kbd></dt>
    <dd>Navigate between sections</dd>
    
    <dt><kbd>Home</kbd> / <kbd>End</kbd></dt>
    <dd>Jump to start/end</dd>
    
    <dt><kbd>1</kbd>-<kbd>9</kbd></dt>
    <dd>Jump to section</dd>
    
    <dt><kbd>?</kbd></dt>
    <dd>Show this help</dd>
  </dl>
  <button onclick="this.closest('dialog').close()">Close</button>
</dialog>
```

---

### Phase 5: Motion & Preferences (Week 5)

#### 5.1 Reduced Motion Support
**WCAG**: 2.3.3 Animation from Interactions (Level AAA)

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
```

```javascript
// JavaScript implementation
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function setAnimationState() {
  if (prefersReducedMotion.matches) {
    // Disable GSAP animations
    gsap.globalTimeline.pause();
    // Show static version
    showStaticExperience();
  } else {
    gsap.globalTimeline.play();
  }
}

prefersReducedMotion.addEventListener('change', setAnimationState);
setAnimationState();
```

---

## 📊 IMPLEMENTATION PRIORITY MATRIX

| Fix | WCAG Level | Effort | Impact | Priority |
|-----|------------|--------|--------|----------|
| Add `lang` attribute | A | 5 min | HIGH | 🔴 P1 |
| Remove zoom restriction | AA | 5 min | HIGH | 🔴 P1 |
| Add skip link | A | 30 min | HIGH | 🔴 P1 |
| Add focus indicators | AA | 30 min | HIGH | 🔴 P1 |
| Add `<main>` landmark | A | 1 hour | MEDIUM | 🔴 P1 |
| Add H1 heading | A | 15 min | MEDIUM | 🔴 P1 |
| Form accessibility | A/AA | 2 hours | HIGH | 🟡 P2 |
| ARIA live regions | AA | 2 hours | MEDIUM | 🟡 P2 |
| Keyboard shortcuts | AAA | 4 hours | MEDIUM | 🟢 P3 |
| Reduced motion | AAA | 4 hours | MEDIUM | 🟢 P3 |

---

## 📈 EXPECTED OUTCOMES

### Accessibility Score Projection

| Phase | Current | Expected Score | Improvement |
|-------|---------|----------------|-------------|
| Baseline | 83/100 | — | — |
| After Phase 1 | — | 90/100 | +7 points |
| After Phase 2 | — | 93/100 | +3 points |
| After Phase 3 | — | 95/100 | +2 points |
| After Phase 4-5 | — | 95-98/100 | +0-3 points |

### Compliance Level Projection

| Level | Current | After Roadmap |
|-------|---------|---------------|
| WCAG 2.1 A | ~70% | 95%+ |
| WCAG 2.1 AA | ~50% | 85%+ |
| WCAG 2.1 AAA | ~20% | 40%+ |

---

## ⚠️ KNOWN LIMITATIONS

### Canvas-Based Content (Industry-Wide Challenge)

| Limitation | Status | Mitigation |
|------------|--------|------------|
| 3D scene screen reader access | ❌ Cannot fix | Provide text narrative |
| 3D object keyboard interaction | ❌ Cannot fix | Provide keyboard controls for navigation |
| Real-time canvas descriptions | ❌ Cannot fix | ARIA live region for key moments |

**Recommended Mitigation**: Create parallel accessible experience (see AM3-03).

---

## ✅ SUCCESS CRITERIA

- [ ] Lighthouse Accessibility score ≥90
- [ ] All Level A criteria addressed
- [ ] 80%+ Level AA criteria met
- [ ] Skip link functional
- [ ] Keyboard navigation complete
- [ ] Focus indicators visible
- [ ] Forms fully accessible
- [ ] Reduced motion respected

---

## 🔗 CROSS-REFERENCES

- **AM2-01**: Gap analysis (input)
- **AM2-02**: WCAG compliance interpretation (input)
- **AM2-03**: Inclusive design opportunities (input)
- **AM3-02**: WCAG checklist (companion)
- **AM3-03**: Alternative experience spec (follow-up)

---

## 📚 VERIFIED SOURCES

| Source | Type | Used For |
|--------|------|----------|
| WCAG 2.1 | W3C Standard | Criteria definitions |
| axe-core | Deque Systems | Impact classifications |
| PageSpeed Insights | Google | Current score |
| MDN Web Docs | Mozilla | Implementation patterns |

---
