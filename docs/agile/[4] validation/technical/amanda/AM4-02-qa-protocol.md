# AM4-02: QA Testing Protocol

## 📋 METADATA
- **Task ID**: AM4-02
- **Persona**: Amanda Sari (QA & Accessibility)
- **Sprint**: 4 - Validation & Handoff
- **Status**: ✅ COMPLETED
- **Created**: 2025-12-11
- **Dependencies**: AM3-02, K4-01, F4-02

---

## 🎯 OBJECTIVE

Define comprehensive QA testing protocols for Zenotika WebGL projects ensuring quality across performance, functionality, and accessibility.

---

## 📋 QA TESTING PROTOCOL

### 1. Test Planning

#### Test Categories
| Category | Priority | Automation | Frequency |
|----------|----------|------------|-----------|
| Smoke Tests | 🔴 Critical | Full | Every build |
| Functional | 🔴 Critical | Partial | Daily |
| Performance | 🔴 Critical | Full | Daily |
| Accessibility | 🔴 Critical | Partial | Daily |
| Visual Regression | 🟡 High | Full | Per PR |
| Cross-browser | 🟡 High | Full | Weekly |
| Device Testing | 🟡 High | Manual | Weekly |
| Security | 🟡 High | Full | Per release |

#### Test Environments
| Environment | Purpose | Data | URL Pattern |
|-------------|---------|------|-------------|
| Local | Development | Mock | localhost:3000 |
| Dev | Integration | Mock | dev.project.zenotika.com |
| Staging | UAT | Production-like | staging.project.zenotika.com |
| Production | Live | Real | project.zenotika.com |

### 2. Smoke Test Suite

#### Critical Path Tests
```typescript
// ILLUSTRATIVE EXAMPLE - Smoke Test Suite
describe('Smoke Tests', () => {
  it('should load the page without errors', async () => {
    const response = await page.goto(BASE_URL);
    expect(response.status()).toBe(200);
    
    const errors = await page.evaluate(() => window.__errors || []);
    expect(errors).toHaveLength(0);
  });
  
  it('should initialize WebGL or show fallback', async () => {
    await page.waitForSelector('#webgl-canvas, #fallback-experience', {
      timeout: 10000
    });
    
    const hasExperience = await page.evaluate(() => {
      return !!document.querySelector('#webgl-canvas') || 
             !!document.querySelector('#fallback-experience');
    });
    
    expect(hasExperience).toBe(true);
  });
  
  it('should complete initial loading within 5 seconds', async () => {
    const startTime = Date.now();
    await page.waitForSelector('[data-loaded="true"]');
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(5000);
  });
  
  it('should have working primary CTA', async () => {
    const cta = await page.waitForSelector('[data-testid="primary-cta"]');
    expect(cta).toBeTruthy();
    
    const isVisible = await cta.isVisible();
    expect(isVisible).toBe(true);
  });
});
```

### 3. Functional Testing

#### WebGL Interaction Tests
```typescript
// ILLUSTRATIVE EXAMPLE - Functional Tests
describe('WebGL Interactions', () => {
  describe('Scroll Navigation', () => {
    it('should progress scenes on scroll', async () => {
      const initialScene = await getActiveScene();
      
      await scrollPage(500);
      await waitForAnimation();
      
      const newScene = await getActiveScene();
      expect(newScene).not.toBe(initialScene);
    });
    
    it('should maintain scroll position on refresh', async () => {
      await scrollPage(1000);
      const scrollBefore = await getScrollPosition();
      
      await page.reload();
      
      const scrollAfter = await getScrollPosition();
      expect(scrollAfter).toBeCloseTo(scrollBefore, 50);
    });
  });
  
  describe('UI Controls', () => {
    it('should open navigation menu', async () => {
      await page.click('[data-testid="menu-button"]');
      
      const menu = await page.waitForSelector('[data-testid="nav-menu"]');
      expect(await menu.isVisible()).toBe(true);
    });
    
    it('should play/pause audio', async () => {
      const audioButton = await page.$('[data-testid="audio-toggle"]');
      if (!audioButton) return; // Audio optional
      
      await audioButton.click();
      const isMuted = await page.evaluate(() => window.__audioMuted);
      
      await audioButton.click();
      const isUnmuted = await page.evaluate(() => !window.__audioMuted);
      
      expect(isMuted || isUnmuted).toBe(true);
    });
  });
});
```

#### Form Testing
```typescript
describe('Lead Capture Form', () => {
  it('should validate required fields', async () => {
    await page.click('[data-testid="submit-button"]');
    
    const errors = await page.$$('[data-error="true"]');
    expect(errors.length).toBeGreaterThan(0);
  });
  
  it('should validate email format', async () => {
    await page.fill('[data-testid="email-input"]', 'invalid-email');
    await page.click('[data-testid="submit-button"]');
    
    const emailError = await page.$('[data-testid="email-error"]');
    expect(emailError).toBeTruthy();
  });
  
  it('should submit successfully with valid data', async () => {
    await page.fill('[data-testid="name-input"]', 'Test User');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="company-input"]', 'Test Company');
    
    await page.click('[data-testid="submit-button"]');
    
    const success = await page.waitForSelector('[data-testid="success-message"]');
    expect(success).toBeTruthy();
  });
});
```

### 4. Performance Testing

#### Automated Performance Checks
```typescript
// ILLUSTRATIVE EXAMPLE - Performance Tests
describe('Performance', () => {
  it('should meet LCP target (<2.5s)', async () => {
    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          resolve(entries[entries.length - 1].startTime);
        }).observe({ entryTypes: ['largest-contentful-paint'] });
      });
    });
    
    expect(metrics).toBeLessThan(2500);
  });
  
  it('should maintain 30+ FPS during scroll', async () => {
    const fpsValues: number[] = [];
    
    // Collect FPS during scroll
    await page.evaluate(() => {
      window.__fpsValues = [];
      const measure = () => {
        const now = performance.now();
        if (window.__lastFrame) {
          const fps = 1000 / (now - window.__lastFrame);
          window.__fpsValues.push(fps);
        }
        window.__lastFrame = now;
        if (window.__fpsValues.length < 60) {
          requestAnimationFrame(measure);
        }
      };
      requestAnimationFrame(measure);
    });
    
    await scrollPage(2000, { duration: 2000 });
    
    const fps = await page.evaluate(() => window.__fpsValues);
    const avgFps = fps.reduce((a, b) => a + b, 0) / fps.length;
    
    expect(avgFps).toBeGreaterThan(30);
  });
  
  it('should not exceed memory budget', async () => {
    const memory = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });
    
    const memoryMB = memory / 1024 / 1024;
    expect(memoryMB).toBeLessThan(300); // 300MB budget
  });
});
```

### 5. Accessibility Testing

#### Automated Accessibility Checks
```typescript
// ILLUSTRATIVE EXAMPLE - Accessibility Tests
describe('Accessibility', () => {
  it('should pass axe-core audit', async () => {
    const results = await new AxePuppeteer(page).analyze();
    
    const violations = results.violations.filter(
      v => ['critical', 'serious'].includes(v.impact!)
    );
    
    expect(violations).toHaveLength(0);
  });
  
  it('should be keyboard navigable', async () => {
    await page.keyboard.press('Tab');
    
    const focusedElement = await page.evaluate(() => {
      return document.activeElement?.tagName;
    });
    
    expect(focusedElement).not.toBe('BODY');
  });
  
  it('should have visible focus indicators', async () => {
    await page.keyboard.press('Tab');
    
    const hasOutline = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el) return false;
      
      const styles = window.getComputedStyle(el);
      return styles.outlineWidth !== '0px' || 
             styles.boxShadow !== 'none';
    });
    
    expect(hasOutline).toBe(true);
  });
  
  it('should respect reduced motion preference', async () => {
    await page.emulateMediaFeatures([
      { name: 'prefers-reduced-motion', value: 'reduce' }
    ]);
    
    await page.reload();
    
    const hasReducedMotion = await page.evaluate(() => {
      return document.body.classList.contains('reduced-motion');
    });
    
    expect(hasReducedMotion).toBe(true);
  });
});
```

### 6. Cross-Browser Testing Matrix

| Browser | Versions | Priority | Automation |
|---------|----------|----------|------------|
| Chrome | Latest, Latest-1 | 🔴 Critical | Yes |
| Firefox | Latest, Latest-1 | 🔴 Critical | Yes |
| Safari | Latest, Latest-1 | 🔴 Critical | Yes |
| Edge | Latest | 🟡 High | Yes |
| iOS Safari | Latest, Latest-1 | 🔴 Critical | Yes |
| Chrome Android | Latest | 🟡 High | Yes |

### 7. Bug Reporting Template

```markdown
## Bug Report

**Title**: [Brief description]

**Environment**:
- Browser: [Chrome 120]
- OS: [Windows 11]
- Device: [Desktop / Mobile]
- URL: [staging.project.zenotika.com]

**Steps to Reproduce**:
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Result**:
[What should happen]

**Actual Result**:
[What actually happened]

**Severity**: [Critical / High / Medium / Low]

**Screenshots/Videos**:
[Attachments]

**Console Errors**:
```
[Any console errors]
```

**Additional Context**:
[Any other relevant information]
```

---

## ✅ QA CHECKLIST BY PHASE

### Development Phase
- [ ] Unit tests passing
- [ ] Smoke tests passing
- [ ] No console errors
- [ ] Performance budgets met

### Pre-Staging
- [ ] All functional tests passing
- [ ] Cross-browser smoke tests
- [ ] Accessibility automated checks
- [ ] Visual regression baseline

### Staging
- [ ] Full regression suite
- [ ] Manual exploratory testing
- [ ] Device testing complete
- [ ] Accessibility manual audit
- [ ] Performance audit

### Pre-Production
- [ ] All tests passing
- [ ] Stakeholder sign-off
- [ ] Security scan completed
- [ ] Rollback plan verified

---

## 📚 CROSS-REFERENCES

| Document | Content |
|----------|---------|
| AM4-01 | Accessibility compliance |
| K4-01 | Performance checklist |
| F4-02 | Device compatibility |

---

## 📊 DATA CLASSIFICATION

| Data Type | Classification | Source |
|-----------|----------------|--------|
| Test thresholds | ✅ VERIFIED | Google/W3C standards |
| Browser support | ✅ VERIFIED | Can I Use |
| Code examples | ℹ️ ILLUSTRATIVE | Demonstration only |

---

**Document Status**: ✅ COMPLETED  
**Last Updated**: 2025-12-11  
**Owner**: Amanda Sari (QA & Accessibility)
