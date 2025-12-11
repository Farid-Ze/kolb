# Accessibility Check Template

## Test Metadata
- **Test Date**: YYYY-MM-DD HH:MM UTC
- **Tester**: [Name]
- **Test ID**: [Task ID]
- **WCAG Level Target**: [A/AA/AAA]

---

## Test Configuration

### Environment
- **Browser**: [Browser Name + Version]
- **Screen Reader**: [NVDA/JAWS/VoiceOver + Version]
- **OS**: [Operating System + Version]
- **Assistive Technology**: [Additional tools used]

### Test Scope
- **URL Tested**: [Full URL]
- **Pages Tested**: [Number/List of pages]
- **Test Duration**: [Time spent]

---

## Automated Scan Results

### Tools Used
| Tool | Version | Issues Found | Severity Breakdown |
|------|---------|--------------|-------------------|
| [Tool Name] | [Version] | [N] | Critical: [N], Serious: [N], Moderate: [N], Minor: [N] |

### Export Files
- **axe-core**: `[filename.json]`
- **WAVE**: `[filename.json/csv]`
- **Lighthouse A11y**: `[filename.json]`
- **IBM Equal Access**: `[filename.json]`

---

## Manual Testing Results

### Keyboard Navigation
| Test Item | Result | Notes |
|-----------|--------|-------|
| Tab navigation order | ⬜ Pass / ⬜ Fail / ⬜ N/A | [Details] |
| Focus visibility | ⬜ Pass / ⬜ Fail / ⬜ N/A | [Details] |
| Keyboard traps | ⬜ Pass / ⬜ Fail / ⬜ N/A | [Details] |
| Skip links | ⬜ Pass / ⬜ Fail / ⬜ N/A | [Details] |
| Modal/Dialog accessibility | ⬜ Pass / ⬜ Fail / ⬜ N/A | [Details] |
| Dropdown menus | ⬜ Pass / ⬜ Fail / ⬜ N/A | [Details] |

### Screen Reader Testing
| Element Type | Announced Correctly | Issues |
|--------------|-------------------|---------|
| Landmarks | ⬜ Yes / ⬜ No | [Details] |
| Headings hierarchy | ⬜ Yes / ⬜ No | [Details] |
| Images (alt text) | ⬜ Yes / ⬜ No | [Details] |
| Links/Buttons | ⬜ Yes / ⬜ No | [Details] |
| Form labels | ⬜ Yes / ⬜ No | [Details] |
| Dynamic content | ⬜ Yes / ⬜ No | [Details] |
| ARIA labels | ⬜ Yes / ⬜ No | [Details] |

---

## Issues Found

### Critical Issues (WCAG Level A)
| Issue ID | Description | WCAG Criterion | Location | Severity |
|----------|-------------|----------------|----------|----------|
| [ID] | [Description] | [Criterion] | [Selector/URL] | Critical |

### Serious Issues (WCAG Level AA)
| Issue ID | Description | WCAG Criterion | Location | Severity |
|----------|-------------|----------------|----------|----------|
| [ID] | [Description] | [Criterion] | [Selector/URL] | Serious |

### Moderate Issues
| Issue ID | Description | WCAG Criterion | Location | Severity |
|----------|-------------|----------------|----------|----------|
| [ID] | [Description] | [Criterion] | [Selector/URL] | Moderate |

---

## Positive Findings
[Document accessibility features that are implemented well]

---

## Motion & Animation
| Check | Result | Notes |
|-------|--------|-------|
| `prefers-reduced-motion` respected | ⬜ Yes / ⬜ No / ⬜ Partial | [Details] |
| Alternative experience provided | ⬜ Yes / ⬜ No / ⬜ N/A | [Details] |
| Animation controls available | ⬜ Yes / ⬜ No | [Details] |

---

## Screen Reader Transcript Excerpt
```
[Include relevant portions of screen reader announcements]
```

---

## Recommendations
1. [Priority 1 recommendation]
2. [Priority 2 recommendation]
3. [Priority 3 recommendation]

---

## Context Notes
[Any additional context about intentional design decisions, creative trade-offs, or experiential goals that may affect traditional accessibility metrics]

---

**Report Status**: ⬜ Draft | ⬜ In Review | ⬜ Complete  
**Last Updated**: YYYY-MM-DD HH:MM UTC
