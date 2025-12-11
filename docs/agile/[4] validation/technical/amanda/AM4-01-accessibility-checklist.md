# AM4-01: Accessibility Compliance Checklist

## 📋 METADATA
- **Task ID**: AM4-01
- **Persona**: Amanda Sari (QA & Accessibility)
- **Sprint**: 4 - Validation & Handoff
- **Status**: ✅ COMPLETED
- **Created**: 2025-12-11
- **Dependencies**: AM1-01/02/03, AM2-01/02/03, AM3-01/02/03

---

## 🎯 OBJECTIVE

Provide a comprehensive WCAG 2.1 AA compliance checklist for Zenotika WebGL projects with specific guidance for canvas-based experiences.

---

## ✅ WCAG 2.1 AA COMPLIANCE CHECKLIST

### Principle 1: Perceivable

#### 1.1 Text Alternatives

| Criterion | Requirement | WebGL Implementation | Status |
|-----------|-------------|---------------------|--------|
| **1.1.1** Non-text Content | Provide text alternatives | Canvas aria-label, live regions | ⬜ |

**Implementation Checklist:**
- [ ] Canvas element has descriptive `aria-label`
- [ ] Dynamic content announced via `aria-live` regions
- [ ] Decorative elements marked with `aria-hidden="true"`
- [ ] Important visual information has text alternative
- [ ] Scene descriptions available for screen readers

**WebGL-Specific Code:**
```html
<canvas 
  id="webgl-canvas"
  role="img"
  aria-label="Interactive 3D product visualization showing corn growth cycle"
  aria-describedby="scene-description"
></canvas>

<div id="scene-description" class="sr-only" aria-live="polite">
  <!-- Updated dynamically as scene changes -->
  Currently viewing: Introduction scene with rotating corn seed
</div>
```

#### 1.3 Adaptable

| Criterion | Requirement | WebGL Implementation | Status |
|-----------|-------------|---------------------|--------|
| **1.3.1** Info and Relationships | Programmatic structure | Semantic HTML around canvas | ⬜ |
| **1.3.2** Meaningful Sequence | Logical reading order | Tab order, focus management | ⬜ |
| **1.3.3** Sensory Characteristics | Don't rely on shape/color alone | Text labels, patterns | ⬜ |

**Implementation Checklist:**
- [ ] All interactive UI uses semantic HTML (buttons, links)
- [ ] Form fields have proper labels
- [ ] Tab order follows visual order
- [ ] Instructions don't rely solely on color

#### 1.4 Distinguishable

| Criterion | Requirement | WebGL Implementation | Status |
|-----------|-------------|---------------------|--------|
| **1.4.1** Use of Color | Color not sole indicator | Icons, text, patterns | ⬜ |
| **1.4.3** Contrast (Minimum) | 4.5:1 for text | UI overlays on canvas | ⬜ |
| **1.4.4** Resize Text | 200% without loss | Responsive typography | ⬜ |
| **1.4.10** Reflow | No horizontal scroll at 320px | Responsive layout | ⬜ |
| **1.4.11** Non-text Contrast | 3:1 for UI components | Buttons, inputs | ⬜ |
| **1.4.12** Text Spacing | No loss with spacing increase | Flexible containers | ⬜ |
| **1.4.13** Content on Hover/Focus | Dismissible, hoverable | Tooltips, popovers | ⬜ |

**Implementation Checklist:**
- [ ] All text meets 4.5:1 contrast ratio
- [ ] UI components meet 3:1 contrast ratio
- [ ] Text scales to 200% without content loss
- [ ] No horizontal scrolling at 320px viewport
- [ ] Color-blind friendly palette used

---

### Principle 2: Operable

#### 2.1 Keyboard Accessible

| Criterion | Requirement | WebGL Implementation | Status |
|-----------|-------------|---------------------|--------|
| **2.1.1** Keyboard | All functions via keyboard | Scene navigation, UI controls | ⬜ |
| **2.1.2** No Keyboard Trap | Can leave any element | Focus management | ⬜ |
| **2.1.4** Character Key Shortcuts | Configurable or off | Custom shortcuts | ⬜ |

**Implementation Checklist:**
- [ ] All interactive elements keyboard accessible
- [ ] Visible focus indicators on all elements
- [ ] Focus can exit canvas back to page
- [ ] Custom keyboard shortcuts documented
- [ ] Single-key shortcuts can be disabled

**WebGL Keyboard Implementation:**
```typescript
// ILLUSTRATIVE EXAMPLE - Keyboard Navigation
class KeyboardNavigation {
  private readonly KEY_BINDINGS = {
    'ArrowDown': () => this.scrollToNext(),
    'ArrowUp': () => this.scrollToPrevious(),
    'Home': () => this.scrollToStart(),
    'End': () => this.scrollToEnd(),
    'Escape': () => this.exitCanvas(),
    'Tab': (e: KeyboardEvent) => this.handleTab(e)
  };
  
  handleKeyDown(event: KeyboardEvent): void {
    const handler = this.KEY_BINDINGS[event.key];
    if (handler) {
      event.preventDefault();
      handler(event);
    }
  }
  
  exitCanvas(): void {
    // Return focus to page navigation
    const nextFocusable = document.querySelector('[data-post-canvas-focus]');
    (nextFocusable as HTMLElement)?.focus();
  }
}
```

#### 2.2 Enough Time

| Criterion | Requirement | WebGL Implementation | Status |
|-----------|-------------|---------------------|--------|
| **2.2.1** Timing Adjustable | Extend/disable timeouts | No auto-advance without control | ⬜ |
| **2.2.2** Pause, Stop, Hide | Control moving content | Animation controls | ⬜ |

**Implementation Checklist:**
- [ ] No time limits on content consumption
- [ ] Pause button for animations
- [ ] Auto-playing content can be stopped
- [ ] Moving content has duration < 5 seconds OR pause control

#### 2.3 Seizures and Physical Reactions

| Criterion | Requirement | WebGL Implementation | Status |
|-----------|-------------|---------------------|--------|
| **2.3.1** Three Flashes or Below | No content flashes >3/sec | Animation review | ⬜ |

**Implementation Checklist:**
- [ ] No content flashes more than 3 times per second
- [ ] Large flashing areas avoided
- [ ] Strobe effects removed or heavily limited

#### 2.4 Navigable

| Criterion | Requirement | WebGL Implementation | Status |
|-----------|-------------|---------------------|--------|
| **2.4.1** Bypass Blocks | Skip to main content | Skip links | ⬜ |
| **2.4.2** Page Titled | Descriptive titles | Document title | ⬜ |
| **2.4.3** Focus Order | Logical focus sequence | Tab index management | ⬜ |
| **2.4.4** Link Purpose | Clear link text | Descriptive CTAs | ⬜ |
| **2.4.6** Headings and Labels | Descriptive headings | Semantic structure | ⬜ |
| **2.4.7** Focus Visible | Visible focus indicator | Custom focus styles | ⬜ |

**Implementation Checklist:**
- [ ] Skip link to main content
- [ ] Skip link to bypass WebGL canvas
- [ ] Descriptive page title
- [ ] Logical heading hierarchy
- [ ] All links have descriptive text
- [ ] Focus indicator always visible (3:1 contrast)

**Focus Indicator CSS:**
```css
/* Custom focus indicator for WebGL UI */
:focus {
  outline: none;
}

:focus-visible {
  outline: 3px solid var(--focus-color, #005fcc);
  outline-offset: 2px;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  :focus-visible {
    outline: 3px solid currentColor;
    outline-offset: 3px;
  }
}
```

#### 2.5 Input Modalities

| Criterion | Requirement | WebGL Implementation | Status |
|-----------|-------------|---------------------|--------|
| **2.5.1** Pointer Gestures | Single pointer alternative | No multitouch required | ⬜ |
| **2.5.2** Pointer Cancellation | Can abort/undo | Click on release | ⬜ |
| **2.5.3** Label in Name | Accessible name matches visible | Button text matching | ⬜ |
| **2.5.4** Motion Actuation | Alternative to motion | No shake/tilt required | ⬜ |
| **2.5.5** Target Size | 44x44px minimum | Touch targets | ⬜ |

**Implementation Checklist:**
- [ ] All gestures have single-pointer alternative
- [ ] No multitouch required for any function
- [ ] Touch targets minimum 44x44 pixels
- [ ] No motion-only controls
- [ ] Click actions fire on release (up event)

---

### Principle 3: Understandable

#### 3.1 Readable

| Criterion | Requirement | WebGL Implementation | Status |
|-----------|-------------|---------------------|--------|
| **3.1.1** Language of Page | `lang` attribute set | HTML lang | ⬜ |
| **3.1.2** Language of Parts | Mark language changes | `lang` on elements | ⬜ |

**Implementation Checklist:**
- [ ] `<html lang="en">` set correctly
- [ ] Language changes marked with `lang` attribute

#### 3.2 Predictable

| Criterion | Requirement | WebGL Implementation | Status |
|-----------|-------------|---------------------|--------|
| **3.2.1** On Focus | No context change on focus | Stable behavior | ⬜ |
| **3.2.2** On Input | No unexpected changes | User-initiated actions | ⬜ |
| **3.2.3** Consistent Navigation | Same nav across pages | Consistent UI | ⬜ |
| **3.2.4** Consistent Identification | Same functions named same | Consistent labels | ⬜ |

**Implementation Checklist:**
- [ ] Focus doesn't trigger scene changes
- [ ] Input doesn't cause unexpected navigation
- [ ] Navigation consistent throughout experience
- [ ] Same functions have same names/icons

#### 3.3 Input Assistance

| Criterion | Requirement | WebGL Implementation | Status |
|-----------|-------------|---------------------|--------|
| **3.3.1** Error Identification | Errors identified in text | Form validation | ⬜ |
| **3.3.2** Labels or Instructions | Inputs have labels | Form design | ⬜ |
| **3.3.3** Error Suggestion | Suggestions provided | Helpful error messages | ⬜ |
| **3.3.4** Error Prevention | Review before submit | Confirmation step | ⬜ |

**Implementation Checklist:**
- [ ] All form fields have visible labels
- [ ] Error messages are descriptive
- [ ] Error messages suggest corrections
- [ ] Confirmation before final submission

---

### Principle 4: Robust

#### 4.1 Compatible

| Criterion | Requirement | WebGL Implementation | Status |
|-----------|-------------|---------------------|--------|
| **4.1.1** Parsing | Valid HTML | HTML validation | ⬜ |
| **4.1.2** Name, Role, Value | Programmatic states | ARIA attributes | ⬜ |
| **4.1.3** Status Messages | Announced without focus | Live regions | ⬜ |

**Implementation Checklist:**
- [ ] HTML passes validation
- [ ] All custom components have roles
- [ ] State changes announced via ARIA
- [ ] Status messages use `aria-live`

---

## 🎨 REDUCED MOTION IMPLEMENTATION

```css
/* Comprehensive reduced motion support */
@media (prefers-reduced-motion: reduce) {
  /* Disable all animations */
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
  
  /* Show static content instead */
  .motion-content { display: none; }
  .static-content { display: block; }
}
```

```typescript
// ILLUSTRATIVE EXAMPLE - Reduced Motion Check
function shouldReduceMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function applyReducedMotion(): void {
  if (shouldReduceMotion()) {
    // Replace animations with instant transitions
    gsap.globalTimeline.timeScale(1000);
    
    // Show static fallback for complex animations
    document.body.classList.add('reduced-motion');
  }
}
```

---

## ✅ PRE-LAUNCH ACCESSIBILITY AUDIT

### Automated Testing
- [ ] axe-core scan passed (0 critical/serious)
- [ ] WAVE evaluation passed
- [ ] Lighthouse accessibility score > 90
- [ ] HTML validation passed

### Manual Testing
- [ ] Keyboard-only navigation tested
- [ ] Screen reader tested (NVDA, VoiceOver)
- [ ] Zoom to 200% tested
- [ ] High contrast mode tested
- [ ] Reduced motion tested

### Assistive Technology Testing
- [ ] NVDA (Windows)
- [ ] JAWS (Windows)
- [ ] VoiceOver (macOS/iOS)
- [ ] TalkBack (Android)

---

## 📚 CROSS-REFERENCES

| Document | Content |
|----------|---------|
| AM3-01 | Accessibility implementation plan |
| AM4-02 | QA testing protocol |
| AM4-03 | Inclusive design standards |
| F4-03 | Fallback implementation |

---

## 📊 DATA CLASSIFICATION

| Data Type | Classification | Source |
|-----------|----------------|--------|
| WCAG criteria | ✅ VERIFIED | W3C WCAG 2.1 |
| Implementation patterns | ✅ VERIFIED | WAI-ARIA practices |
| Code examples | ℹ️ ILLUSTRATIVE | Demonstration only |

---

**Document Status**: ✅ COMPLETED  
**Last Updated**: 2025-12-11  
**Owner**: Amanda Sari (QA & Accessibility)
