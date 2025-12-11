# AM3-02: Automated Accessibility Testing Strategy

## 📋 METADATA
- **Persona**: Amanda Putri - Accessibility Specialist
- **Task ID**: AM3-02
- **Date**: 2025-12-11
- **Sprint**: Sprint 3 - Implementation Planning
- **Status**: ✅ COMPLETED
- **Priority**: 🟡 MEDIUM

> [!IMPORTANT]
> **Data Classification for This Plan**
> 
> | Data Type | Status | Source |
> |-----------|--------|--------|
> | WCAG Criteria | ✅ **VERIFIED** | W3C WCAG 2.1 |
> | Testing Tools | ✅ **VERIFIED** | Official Documentation |
> | Issue Counts | ✅ **VERIFIED** | AM2-01 Analysis |
> | Strategy | ⚠️ **RECOMMENDATION** | Based on best practices |

---

## 🎯 OBJECTIVE

Establish comprehensive automated accessibility testing strategy ensuring continuous WCAG compliance throughout development and deployment cycles.

---

## 📊 BASELINE FROM AM2-01 AUDIT

### Critical Issues to Monitor

| Issue Category | Count | WCAG Level | Priority |
|----------------|-------|------------|----------|
| Missing Form Labels | 3 | AA | HIGH |
| Missing Skip Links | 1 | AA | HIGH |
| Missing Lang Attribute | 1 | AA | HIGH |
| Alt Text Issues | 5 | AA | MEDIUM |
| Focus Management | 4 | AA | MEDIUM |
| Color Contrast | 2 | AA | MEDIUM |

### Target Compliance

| Level | Current | Target | Timeline |
|-------|---------|--------|----------|
| WCAG A | ~70% | 100% | Week 2 |
| WCAG AA | ~50% | 100% | Week 4 |
| WCAG AAA | ~20% | 50% | Ongoing |

---

## 🔧 AUTOMATED TESTING TOOLS

### Tool Stack

| Tool | Type | Purpose | Integration |
|------|------|---------|-------------|
| **axe-core** | Library | Runtime testing | Jest/CI |
| **Pa11y** | CLI | Page testing | CI pipeline |
| **Lighthouse** | Browser | Audit scoring | CI/Manual |
| **WAVE** | Extension | Manual review | Development |
| **eslint-plugin-jsx-a11y** | Linter | Static analysis | IDE/CI |

### Tool Selection Rationale

```
axe-core
├── Pros: Industry standard, low false positives, fast
├── Cons: Requires DOM, limited dynamic content
└── Use: Unit tests, CI gate

Pa11y
├── Pros: CLI, CI-friendly, configurable
├── Cons: Single page focus
└── Use: Page-level CI testing

Lighthouse
├── Pros: Comprehensive, actionable, trusted
├── Cons: Performance overhead
└── Use: Pre-release audits
```

---

## 🧪 TESTING IMPLEMENTATION

### Jest + axe-core Integration

```javascript
// tests/accessibility.test.js
const { axe, toHaveNoViolations } = require('jest-axe');

expect.extend(toHaveNoViolations);

describe('Accessibility Tests', () => {
  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = '';
  });
  
  test('Hero section has no accessibility violations', async () => {
    document.body.innerHTML = `
      <section id="hero" aria-labelledby="hero-title">
        <h1 id="hero-title">Corn Revolution</h1>
        <p>Explore the future of agriculture</p>
        <button type="button">Get Started</button>
      </section>
    `;
    
    const results = await axe(document.body);
    expect(results).toHaveNoViolations();
  });
  
  test('Form has proper labels', async () => {
    document.body.innerHTML = `
      <form aria-labelledby="form-title">
        <h2 id="form-title">Contact Us</h2>
        <div>
          <label for="name">Name</label>
          <input type="text" id="name" name="name" required>
        </div>
        <div>
          <label for="email">Email</label>
          <input type="email" id="email" name="email" required>
        </div>
        <button type="submit">Submit</button>
      </form>
    `;
    
    const results = await axe(document.body);
    expect(results).toHaveNoViolations();
  });
  
  test('Navigation is keyboard accessible', async () => {
    document.body.innerHTML = `
      <nav aria-label="Main navigation">
        <a href="#section1">Section 1</a>
        <a href="#section2">Section 2</a>
        <a href="#section3">Section 3</a>
      </nav>
    `;
    
    const results = await axe(document.body);
    expect(results).toHaveNoViolations();
  });
  
  test('Images have alt text', async () => {
    document.body.innerHTML = `
      <img src="/corn.jpg" alt="Golden corn field at sunset">
      <img src="/logo.svg" alt="Corn Revolution logo">
      <img src="/decorative.svg" alt="" role="presentation">
    `;
    
    const results = await axe(document.body);
    expect(results).toHaveNoViolations();
  });
});
```

### Custom axe Rules Configuration

```javascript
// tests/axe-config.js
module.exports = {
  rules: [
    // Enable AAA checks for specific rules
    { id: 'color-contrast-enhanced', enabled: true },
    
    // Disable rules that need manual review
    { id: 'region', enabled: false }, // Complex layout exceptions
    
    // Custom configuration for specific rules
    {
      id: 'color-contrast',
      options: {
        noScroll: true
      }
    }
  ],
  
  // Run specific tags
  runOnly: {
    type: 'tag',
    values: ['wcag2a', 'wcag2aa', 'best-practice']
  },
  
  // Reporter configuration
  reporter: 'v2'
};
```

### Component-Level Testing

```javascript
// tests/components/Button.a11y.test.js
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import Button from '../components/Button';

describe('Button Accessibility', () => {
  test('renders accessible button with text', async () => {
    const { container } = render(
      <Button onClick={() => {}}>Click me</Button>
    );
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
  
  test('renders accessible button with icon', async () => {
    const { container } = render(
      <Button onClick={() => {}} aria-label="Close dialog">
        <CloseIcon aria-hidden="true" />
      </Button>
    );
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
  
  test('disabled button is properly marked', async () => {
    const { container, getByRole } = render(
      <Button onClick={() => {}} disabled>Submit</Button>
    );
    
    const button = getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-disabled', 'true');
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

---

## 🚀 CI/CD INTEGRATION

### GitHub Actions Workflow

```yaml
# .github/workflows/accessibility.yml
name: Accessibility Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  a11y-test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run axe-core tests
        run: npm run test:a11y
      
      - name: Build project
        run: npm run build
      
      - name: Start server
        run: npm run start &
        env:
          PORT: 3000
      
      - name: Wait for server
        run: npx wait-on http://localhost:3000
      
      - name: Run Pa11y tests
        run: |
          npx pa11y-ci --config .pa11yci.json
      
      - name: Run Lighthouse CI
        run: |
          npm install -g @lhci/cli
          lhci autorun
        env:
          LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}
      
      - name: Upload a11y report
        uses: actions/upload-artifact@v4
        with:
          name: accessibility-report
          path: reports/accessibility/
```

### Pa11y CI Configuration

```json
{
  "defaults": {
    "timeout": 30000,
    "wait": 2000,
    "standard": "WCAG2AA",
    "runners": ["axe", "htmlcs"],
    "chromeLaunchConfig": {
      "args": ["--no-sandbox"]
    }
  },
  "urls": [
    {
      "url": "http://localhost:3000/",
      "screenCapture": "./reports/screenshots/home.png",
      "actions": [
        "wait for element #hero to be visible"
      ]
    },
    {
      "url": "http://localhost:3000/#section2",
      "screenCapture": "./reports/screenshots/section2.png"
    },
    {
      "url": "http://localhost:3000/#contact",
      "screenCapture": "./reports/screenshots/contact.png"
    }
  ]
}
```

### Lighthouse CI Configuration

```json
{
  "ci": {
    "collect": {
      "url": [
        "http://localhost:3000/"
      ],
      "numberOfRuns": 3
    },
    "assert": {
      "assertions": {
        "categories:accessibility": ["error", { "minScore": 0.9 }],
        "categories:best-practices": ["warn", { "minScore": 0.8 }],
        "color-contrast": "error",
        "aria-allowed-attr": "error",
        "aria-required-attr": "error",
        "aria-valid-attr": "error",
        "button-name": "error",
        "bypass": "error",
        "document-title": "error",
        "html-has-lang": "error",
        "image-alt": "error",
        "link-name": "error",
        "list": "warn",
        "meta-viewport": "error"
      }
    },
    "upload": {
      "target": "temporary-public-storage"
    }
  }
}
```

---

## 📊 REPORTING & MONITORING

### Custom Report Generator

```javascript
// scripts/generate-a11y-report.js
const axe = require('axe-core');
const puppeteer = require('puppeteer');
const fs = require('fs').promises;

async function generateReport(urls) {
  const browser = await puppeteer.launch();
  const results = [];
  
  for (const url of urls) {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle0' });
    
    // Inject axe-core
    await page.addScriptTag({ path: require.resolve('axe-core') });
    
    // Run axe
    const axeResults = await page.evaluate(async () => {
      return await axe.run();
    });
    
    results.push({
      url,
      timestamp: new Date().toISOString(),
      violations: axeResults.violations,
      passes: axeResults.passes.length,
      incomplete: axeResults.incomplete.length
    });
    
    await page.close();
  }
  
  await browser.close();
  
  // Generate report
  const report = {
    generated: new Date().toISOString(),
    summary: {
      totalViolations: results.reduce((sum, r) => sum + r.violations.length, 0),
      totalPasses: results.reduce((sum, r) => sum + r.passes, 0),
      pagesScanned: results.length
    },
    results
  };
  
  // Save report
  await fs.writeFile(
    './reports/accessibility/report.json',
    JSON.stringify(report, null, 2)
  );
  
  // Generate HTML report
  const html = generateHTMLReport(report);
  await fs.writeFile('./reports/accessibility/report.html', html);
  
  return report;
}

function generateHTMLReport(report) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Accessibility Report</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
    .summary { background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
    .violation { background: #fee; border-left: 4px solid #f00; padding: 10px; margin: 10px 0; }
    .pass { background: #efe; border-left: 4px solid #0f0; padding: 10px; margin: 10px 0; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
  </style>
</head>
<body>
  <h1>Accessibility Report</h1>
  <p>Generated: ${report.generated}</p>
  
  <div class="summary">
    <h2>Summary</h2>
    <p>Pages Scanned: ${report.summary.pagesScanned}</p>
    <p>Total Violations: ${report.summary.totalViolations}</p>
    <p>Total Passes: ${report.summary.totalPasses}</p>
  </div>
  
  ${report.results.map(r => `
    <h2>${r.url}</h2>
    ${r.violations.map(v => `
      <div class="violation">
        <strong>${v.id}</strong>: ${v.description}
        <br>Impact: ${v.impact}
        <br>Nodes: ${v.nodes.length}
      </div>
    `).join('')}
  `).join('')}
</body>
</html>
  `;
}

// Run
const urls = [
  'http://localhost:3000/',
  'http://localhost:3000/#section2',
  'http://localhost:3000/#contact'
];

generateReport(urls)
  .then(report => {
    console.log('Report generated:', report.summary);
    process.exit(report.summary.totalViolations > 0 ? 1 : 0);
  })
  .catch(err => {
    console.error('Report generation failed:', err);
    process.exit(1);
  });
```

### Dashboard Integration

```javascript
// Accessibility metrics for monitoring dashboard
const a11yMetrics = {
  // Track violations over time
  trackViolation(violation) {
    if (window.gtag) {
      gtag('event', 'a11y_violation', {
        event_category: 'accessibility',
        event_label: violation.id,
        impact: violation.impact,
        count: violation.nodes.length
      });
    }
  },
  
  // Track test results
  trackTestRun(results) {
    if (window.gtag) {
      gtag('event', 'a11y_test_run', {
        event_category: 'accessibility',
        passes: results.passes,
        violations: results.violations.length,
        score: (results.passes / (results.passes + results.violations.length)) * 100
      });
    }
  }
};
```

---

## 🔍 MANUAL TESTING CHECKLIST

### Keyboard Navigation Test

```
[ ] Tab order follows visual flow
[ ] Focus indicator visible on all interactive elements
[ ] No keyboard traps
[ ] Skip link works correctly
[ ] Modal dialogs trap focus appropriately
[ ] Focus returns to trigger after modal close
[ ] All functionality accessible via keyboard
```

### Screen Reader Test

```
[ ] Page title announced correctly
[ ] Headings structure makes sense
[ ] Images have appropriate alt text
[ ] Forms announce labels and errors
[ ] Dynamic content changes announced
[ ] WebGL content has text alternatives
[ ] Navigation landmarks present
```

### Visual Test

```
[ ] Content visible at 200% zoom
[ ] Color contrast meets WCAG AA (4.5:1)
[ ] Not relying on color alone
[ ] Text readable without CSS
[ ] Focus indicators meet 3:1 contrast
```

---

## 🚀 IMPLEMENTATION ROADMAP

### Phase 1: Setup (Week 1)
- [ ] Install testing dependencies
- [ ] Configure Jest + axe-core
- [ ] Set up Pa11y CI

### Phase 2: Integration (Week 2)
- [ ] Add GitHub Actions workflow
- [ ] Configure Lighthouse CI
- [ ] Create initial test suite

### Phase 3: Coverage (Week 3)
- [ ] Add component-level tests
- [ ] Add page-level tests
- [ ] Implement custom rules

### Phase 4: Monitoring (Week 4)
- [ ] Set up reporting dashboard
- [ ] Configure alerts
- [ ] Document testing procedures

---

## 🔗 CROSS-REFERENCES

- **AM2-01**: Accessibility gap analysis (input)
- **AM2-02**: WCAG compliance review (input)
- **AM3-01**: Accessibility roadmap (companion)
- **AM3-03**: Remediation checklist (companion)

---

## 📚 VERIFIED SOURCES

| Source | Type | Used For |
|--------|------|----------|
| W3C WCAG 2.1 | Standard | Compliance criteria |
| Deque axe-core | Official Docs | Tool configuration |
| Pa11y | Official Docs | CI integration |
| Lighthouse | Google Docs | Audit configuration |

---
