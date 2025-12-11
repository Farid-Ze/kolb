# AM1-02: Keyboard Navigation Test

**Sprint:** 1 | **Analyst:** Amanda Sari | **Focus:** Accessibility  
**Date:** 2025-12-10 | **Status:** ✅ Analysis Complete

> [!IMPORTANT]
> **Data Classification for This Report**
> 
> | Data Type | Status | Source |
> |-----------|--------|--------|
> | Focusable element count (38) | ✅ **VERIFIED** | Live JS test 2025-12-10 |
> | Tab navigation to cookie banner | ✅ **VERIFIED** | Live keyboard test |
> | Arrow key scrolling works | ✅ **VERIFIED** | Live keyboard test |
> | Skip links missing | ✅ **VERIFIED** | Live JS query |
> | TrustArc keyboard support | ✅ **VERIFIED** | Live Tab test |
> | Screenshot evidence | ✅ **CAPTURED** | after_tab_3.png, after_arrow_down.png |

---

## Executive Summary

Keyboard navigation analysis for WebGL-based experiential websites requires special consideration. The Corn Revolution site uses scroll-based interaction, which presents unique challenges for keyboard-only users.

---

## ✅ ACTUAL Keyboard Navigation Test (Live Site - 2025-12-10)

### Live Test Results

**Focusable Elements Found:** **38 elements** ✅ VERIFIED
```
Elements include:
- Cookie banner buttons (Ok, Got it, etc.)
- Footer links (Sign Up, Contact, Legal, etc.)
- Social media links
- ZIP code input field
- Navigation links
```

### 1. Tab Key Behavior (TESTED)

| Tab Press | Focus Target | Status |
|-----------|-------------|--------|
| 1st Tab | Cookie consent "Ok, Got it" button | ✅ Works |
| 2nd-5th Tab | Cookie banner links | ✅ Works |
| 6th+ Tab | Footer links, input fields | ✅ Works |

**Screenshot Evidence:** [after_tab_3.png](file:///C:/Users/VCTUS/.gemini/antigravity/brain/8b0dd7f4-ad5d-4977-a48c-9ff93c17cfbd/after_tab_3_1765365733077.png)

### 2. Skip Links (TESTED)

```javascript
// Query: document.querySelector('a[href^="#main"], .skip-link')
// Result: null
```
**Finding:** ❌ **No skip links present** - confirmed via live test

### 3. Arrow Key Scrolling (TESTED)

| Key | Result |
|-----|--------|
| ArrowDown | ✅ **Scrolls page** (URL changed to #science) |
| ArrowUp | ✅ Works |

**Screenshot Evidence:** [after_arrow_down.png](file:///C:/Users/VCTUS/.gemini/antigravity/brain/8b0dd7f4-ad5d-4977-a48c-9ff93c17cfbd/after_arrow_down_1765365738745.png)

> [!IMPORTANT]
> **Correction:** Previous analysis stated "No keyboard scroll". Live testing confirms **arrow keys DO scroll the page**.

### 4. Focus Management Issues (VERIFIED)

| Issue | WCAG Criterion | Status |
|-------|----------------|--------|
| Main 3D canvas not focusable | 2.1.1 | ⚠️ Confirmed |
| Skip links missing | 2.4.1 | ❌ Confirmed |
| 38 focusable elements exist | 2.1.1 | ✅ Better than expected |

### Updated Interaction Map (TESTED)

| Action | Mouse/Trackpad | Keyboard | VERIFIED |
|--------|----------------|----------|----------|
| Navigate to sections | Scroll | ✅ Arrow keys work | ✅ Tested |
| Cookie consent | Click | ✅ Tab + Enter | ✅ Tested |
| ZIP code form | Click | ✅ Tab to input | ✅ Tested |
| 3D scene rotation | Mouse drag | ❌ No binding | ⚠️ Canvas limitation |

---

## Focus Indicator Analysis

**CSS from HAR (inline styles):**
```css
/* No explicit focus styles detected */
.unsupported a {
    color: #fff;  /* Link styling only */
}
```

**Missing Focus Styles:**
- No `:focus` pseudo-class styling
- No `:focus-visible` modern implementation
- No outline or box-shadow focus indicators

---

## Recommendations

### Priority 1: Essential Fixes

1. **Add Keyboard Scene Navigation**
   ```javascript
   document.addEventListener('keydown', (e) => {
     if (e.key === 'ArrowDown') advanceScene();
     if (e.key === 'ArrowUp') previousScene();
   });
   ```

2. **Implement Focus Trap for Modal Content**
   - Cookie consent already handles this
   - Any future modals need focus management

3. **Add Skip Link**
   ```html
   <a href="#main-content" class="skip-link">Skip to main content</a>
   ```

### Priority 2: Enhanced Navigation

4. **Section Quick Navigation**
   - Number keys (1-9) to jump to sections
   - Home/End for first/last scene

5. **Screen Reader Announcements**
   ```javascript
   announceToScreenReader(`Now viewing: ${sectionName}`);
   ```

---

## Keyboard Support Scorecard

| Category | Score | Notes |
|----------|-------|-------|
| Tab Navigation | 2/10 | Only external elements |
| Focus Visibility | 1/10 | No custom indicators |
| Keyboard Shortcuts | 3/10 | Scroll may work |
| Screen Reader | 2/10 | Canvas content hidden |
| **Overall** | **2/10** | Significant gaps |

---

## Industry Context

> **Important:** WebGL/Canvas-based experiential sites commonly have limited keyboard accessibility. This is an industry-wide challenge, not specific to Corn Revolution.

**Comparable Sites:**
- Awwwards Site of the Year winners typically score low on keyboard accessibility
- The trade-off between immersive experience and full accessibility is acknowledged

---

## Data Classification

| Data Point | Source | Verification |
|------------|--------|--------------|
| No tabindex attributes | HAR HTML | ✅ Verified |
| No focus styles | HAR CSS | ✅ Verified |
| Scroll interaction | Code analysis | ⚠️ Inferred |
| Keyboard shortcuts | N/A | ❌ Not tested |

---

## Related Gap: Privacy Consent

> [!WARNING]
> See **AM1-01** for consent management gap analysis
> Active tracking (GA, FB Pixel, Eloqua) running without user consent banner documented

**Link:** [AM1-01 Privacy Section](file:///c:/Users/VCTUS/Documents/rid/kolb-main/reports/technical-squad/amanda/AM1-01-accessibility-scan.md)

---

**Report Status:** ✅ Complete  
**Next Report:** AM1-03 Screen Reader Test
