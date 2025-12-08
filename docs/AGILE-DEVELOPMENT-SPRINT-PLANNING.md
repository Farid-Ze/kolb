# 🚀 FASE 1: AGILE DEVELOPMENT - SPRINT PLANNING

## Pendekatan Objektif Berbasis Data Aktual
### Corn Revolution Technical Analysis & Implementation

---

> **Project Lead (Farid):** *"Terima kasih atas koreksinya. Anda benar - kita perlu fokus pada data objektif dan aktual.  Setiap persona akan melakukan analisis teknis langsung terhadap cornrevolution.resn. global menggunakan tools yang terverifikasi.  Semua findings harus didukung oleh evidence yang dapat direproduksi."*

---

## 📋 METODOLOGI OBJEKTIF

```
╔═══════════════════════════════════════════════════════════════════════════════════════╗
║                                                                                        ║
║           🔬 OBJECTIVE ANALYSIS METHODOLOGY                                            ║
║              Evidence-Based Technical Assessment                                       ║
║                                                                                        ║
╠═══════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                        ║
║  DATA COLLECTION APPROACH:                                                             ║
║  ├── Primary: Direct website inspection (cornrevolution.resn.global)                  ║
║  ├── Tools: Chrome DevTools, Lighthouse, WebPageTest, WAVE, axe-core                  ║
║  ├── Network: Throttled testing (3G, 4G, Fiber simulations)                           ║
║  ├── Devices: Real device testing + BrowserStack emulation                            ║
║  └── Validation: Cross-reference dengan documented sources                            ║
║                                                                                        ║
║  OBJECTIVITY STANDARDS:                                                                ║
║  ├── Quantifiable metrics only (numbers, percentages, scores)                         ║
║  ├── Reproducible tests (methodology documented)                                      ║
║  ├── Source attribution for all claims                                                ║
║  ├── Acknowledgment of design trade-offs (not "failures")                             ║
║  └── Context-aware assessment (experiential site ≠ utility site)                      ║
║                                                                                        ║
║  NOTED DESIGN DECISIONS (Per Awwwards Jury):                                           ║
║  "Corn Revolution intentionally prioritizes experiential immersion over               ║
║   traditional performance/accessibility metrics - this is a documented                ║
║   creative decision, not an oversight."                                               ║
║                                                                                        ║
║  Source: Awwwards jury commentary, July 2020                                          ║
║                                                                                        ║
╚═══════════════════════════════════════════════════════════════════════════════════════╝
```

---

## 👥 SPRINT 1: PERSONA TECHNICAL ASSIGNMENTS

---

### 🔧 TECHNICAL SQUAD - OBJECTIVE TASKS

---

**Kevin Wijaya (Tech Lead) - Performance Analysis**

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  KEVIN'S SPRINT 1 TASKS: Performance Baseline Documentation                         │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  TASK K1-01: Lighthouse Audit Execution                                              │
│  ─────────────────────────────────────────────────────────────────────────────────  │
│  Tool: Chrome Lighthouse (Performance, Accessibility, Best Practices, SEO)          │
│  Target: cornrevolution.resn.global                                                 │
│  Conditions: Desktop, Mobile (simulated), Multiple runs for average                 │
│                                                                                      │
│  DELIVERABLE: Raw Lighthouse JSON + Screenshot scores                               │
│  FORMAT: lighthouse-report-[date]-[device].json                                     │
│                                                                                      │
│  ─────────────────────────────────────────────────────────────────────────────────  │
│                                                                                      │
│  TASK K1-02: Network Waterfall Analysis                                              │
│  ─────────────────────────────────────────────────────────────────────────────────  │
│  Tool: Chrome DevTools Network Tab                                                   │
│  Metrics to capture:                                                                 │
│  ├── Total requests count                                                           │
│  ├── Total transfer size (MB)                                                       │
│  ├── DOMContentLoaded timing                                                        │
│  ├── Load event timing                                                              │
│  ├── Largest assets (top 10 by size)                                                │
│  └── Asset type breakdown (JS, CSS, Images, WebGL assets, Fonts)                    │
│                                                                                      │
│  DELIVERABLE: HAR file export + summary spreadsheet                                 │
│                                                                                      │
│  ─────────────────────────────────────────────────────────────────────────────────  │
│                                                                                      │
│  TASK K1-03: WebPageTest Multi-Location Test                                         │
│  ─────────────────────────────────────────────────────────────────────────────────  │
│  Tool: webpagetest.org                                                               │
│  Locations: Virginia USA, Singapore, Frankfurt                                       │
│  Connections: Cable, 3G, 4G LTE                                                      │
│  Runs: 3 per configuration                                                          │
│                                                                                      │
│  DELIVERABLE: WebPageTest result URLs + Core Web Vitals summary                     │
│                                                                                      │
│  ─────────────────────────────────────────────────────────────────────────────────  │
│                                                                                      │
│  TASK K1-04: JavaScript Bundle Analysis                                              │
│  ─────────────────────────────────────────────────────────────────────────────────  │
│  Tool: Chrome DevTools Sources + Coverage tab                                        │
│  Metrics:                                                                            │
│  ├── Total JS size (compressed/uncompressed)                                        │
│  ├── Code coverage percentage                                                       │
│  ├── Main thread blocking time                                                      │
│  └── Third-party scripts identification                                             │
│                                                                                      │
│  DELIVERABLE: Coverage report screenshot + blocking time metrics                    │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

**Andi Pratama (WebGL Developer) - Technical Stack Analysis**

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  ANDI'S SPRINT 1 TASKS: WebGL & Framework Identification                             │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  TASK A1-01: Three.js Version & Configuration Detection                             │
│  ─────────────────────────────────────────────────────────────────────────────────  │
│  Method: Console inspection, source map analysis                                    │
│  Commands to execute:                                                                │
│  ├── console.log(THREE. REVISION) // if exposed                                      │
│  ├── Check window objects for Three.js instances                                    │
│  ├── Network tab: identify three.js/three.min.js requests                           │
│  └── Source inspection for GLSL shader code patterns                                │
│                                                                                      │
│  DELIVERABLE: Tech stack identification document with evidence screenshots          │
│                                                                                      │
│  ─────────────────────────────────────────────────────────────────────────────────  │
│                                                                                      │
│  TASK A1-02: WebGL Context Analysis                                                  │
│  ─────────────────────────────────────────────────────────────────────────────────  │
│  Tool: Spector.js browser extension                                                  │
│  Capture:                                                                            │
│  ├── WebGL context type (WebGL 1 or 2)                                              │
│  ├── Draw calls per frame                                                           │
│  ├── Shader programs count                                                          │
│  ├── Texture count and sizes                                                        │
│  └── Buffer objects count                                                           │
│                                                                                      │
│  DELIVERABLE: Spector. js capture export + analysis notes                            │
│                                                                                      │
│  ─────────────────────────────────────────────────────────────────────────────────  │
│                                                                                      │
│  TASK A1-03: Animation Library Detection                                             │
│  ─────────────────────────────────────────────────────────────────────────────────  │
│  Method: Source inspection, global object checking                                  │
│  Check for:                                                                          │
│  ├── window.gsap or window.TweenMax (GSAP)                                          │
│  ├── window.anime (Anime.js)                                                        │
│  ├── Scroll event handling patterns                                                 │
│  └── RAF (requestAnimationFrame) implementation patterns                            │
│                                                                                      │
│  DELIVERABLE: Library identification with version numbers where detectable          │
│                                                                                      │
│  ─────────────────────────────────────────────────────────────────────────────────  │
│                                                                                      │
│  TASK A1-04: Scroll-to-Animation Mapping Documentation                               │
│  ─────────────────────────────────────────────────────────────────────────────────  │
│  Method: Manual scroll + DevTools performance recording                             │
│  Document:                                                                           │
│  ├── Scroll position checkpoints (every 10%)                                        │
│  ├── Visual state at each checkpoint (screenshots)                                  │
│  ├── Frame rate during scroll (Performance tab)                                     │
│  └── Memory usage pattern during scroll                                             │
│                                                                                      │
│  DELIVERABLE: Scroll-state mapping document with 11 screenshots (0-100%)            │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

**Fajar Ramadhan (Compatibility) - Device & Network Testing**

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  FAJAR'S SPRINT 1 TASKS: Real-World Compatibility Testing                            │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  TASK F1-01: Real Device Testing Matrix                                              │
│  ─────────────────────────────────────────────────────────────────────────────────  │
│  Devices to test (actual hardware where available):                                 │
│  ├── Desktop: Windows 10/11 (Chrome, Firefox, Edge)                                 │
│  ├── MacOS: Safari, Chrome                                                          │
│  ├── Android: Samsung mid-range (A52/A53), Xiaomi budget                            │
│  ├── iOS: iPhone 12/13, iPad                                                        │
│  └── Fallback: BrowserStack for unavailable devices                                 │
│                                                                                      │
│  Metrics per device:                                                                 │
│  ├── Does site load?  (Y/N)                                                          │
│  ├── Time to first visual (stopwatch)                                               │
│  ├── Scroll responsiveness (subjective 1-5 + FPS if measurable)                     │
│  ├── Any crashes or freezes?  (document)                                             │
│  └── Touch interactions work? (Y/N)                                                 │
│                                                                                      │
│  DELIVERABLE: Device compatibility matrix spreadsheet                               │
│                                                                                      │
│  ─────────────────────────────────────────────────────────────────────────────────  │
│                                                                                      │
│  TASK F1-02: Network Throttling Tests                                                │
│  ─────────────────────────────────────────────────────────────────────────────────  │
│  Tool: Chrome DevTools Network Throttling                                            │
│  Conditions:                                                                         │
│  ├── No throttling (baseline)                                                       │
│  ├── Fast 3G (562. 5 KB/s down, 150ms RTT)                                           │
│  ├── Slow 3G (500 KB/s down, 400ms RTT)                                             │
│  ├── Offline (check for any fallback)                                               │
│  └── Custom: 1 Mbps (common shared WiFi)                                            │
│                                                                                      │
│  Metrics per condition:                                                              │
│  ├── Load time until interactive                                                    │
│  ├── Does loading indicator appear?                                                 │
│  ├── Timeout/errors observed?                                                       │
│  └── Experience degradation notes                                                   │
│                                                                                      │
│  DELIVERABLE: Network condition impact report                                       │
│                                                                                      │
│  ─────────────────────────────────────────────────────────────────────────────────  │
│                                                                                      │
│  TASK F1-03: Progressive Enhancement Check                                           │
│  ─────────────────────────────────────────────────────────────────────────────────  │
│  Tests:                                                                              │
│  ├── JavaScript disabled: What renders?                                              │
│  ├── WebGL unavailable: Fallback behavior?                                           │
│  ├── CSS-only mode: Any content visible?                                            │
│  └── Images disabled: Alt text present?                                             │
│                                                                                      │
│  DELIVERABLE: Progressive enhancement analysis with screenshots                     │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

### ♿ ACCESSIBILITY SQUAD - OBJECTIVE TASKS

---

**Amanda Sari (HCI/Accessibility) - WCAG Audit**

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  AMANDA'S SPRINT 1 TASKS: Accessibility Technical Audit                              │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  CONTEXT NOTE:                                                                       │
│  "Corn Revolution is an experiential WebGL site.  Traditional accessibility          │
│   metrics may not fully apply. This audit documents the technical state             │
│   objectively, acknowledging the site's creative priorities."                       │
│                                                                                      │
│  ─────────────────────────────────────────────────────────────────────────────────  │
│                                                                                      │
│  TASK AM1-01: Automated Accessibility Scan                                           │
│  ─────────────────────────────────────────────────────────────────────────────────  │
│  Tools:                                                                              │
│  ├── axe-core browser extension (run full page scan)                                │
│  ├── WAVE browser extension                                                         │
│  ├── Lighthouse Accessibility audit                                                 │
│  └── IBM Equal Access Checker                                                       │
│                                                                                      │
│  For each tool, document:                                                            │
│  ├── Total issues found (Critical, Serious, Moderate, Minor)                        │
│  ├── Issue categories                                                               │
│  └── Export full report                                                             │
│                                                                                      │
│  DELIVERABLE: Consolidated automated audit report (JSON/CSV + summary)              │
│                                                                                      │
│  ─────────────────────────────────────────────────────────────────────────────────  │
│                                                                                      │
│  TASK AM1-02: Keyboard Navigation Test                                               │
│  ─────────────────────────────────────────────────────────────────────────────────  │
│  Method: Navigate entire site using only keyboard                                   │
│  Document:                                                                           │
│  ├── Can all interactive elements be reached via Tab?                                │
│  ├── Is focus indicator visible?                                                     │
│  ├── Can scroll be controlled via keyboard (Arrow keys, Space, Page Up/Down)?       │
│  ├── Any keyboard traps?                                                             │
│  └── Skip links present?                                                            │
│                                                                                      │
│  DELIVERABLE: Keyboard navigation checklist (Pass/Fail/N/A per criterion)           │
│                                                                                      │
│  ─────────────────────────────────────────────────────────────────────────────────  │
│                                                                                      │
│  TASK AM1-03: Screen Reader Test                                                     │
│  ─────────────────────────────────────────────────────────────────────────────────  │
│  Tools: NVDA (Windows) or VoiceOver (Mac)                                            │
│  Test scenarios:                                                                     │
│  ├── Page load announcement                                                         │
│  ├── Landmark regions detection                                                     │
│  ├── Heading structure                                                              │
│  ├── Image alt text                                                                 │
│  ├── Link/button announcements                                                      │
│  └── Dynamic content updates announced?                                              │
│                                                                                      │
│  DELIVERABLE: Screen reader experience transcript/notes                             │
│                                                                                      │
│  ─────────────────────────────────────────────────────────────────────────────────  │
│                                                                                      │
│  TASK AM1-04: prefers-reduced-motion Check                                           │
│  ─────────────────────────────────────────────────────────────────────────────────  │
│  Method:                                                                             │
│  ├── Enable "Reduce motion" in OS settings                                         │
│  ├── Or use Chrome DevTools: Rendering > Emulate CSS media > prefers-reduced-motion │
│  Document:                                                                           │
│  ├── Does site behavior change?                                                      │
│  ├── Animations reduced/stopped?                                                    │
│  └── Alternative experience provided?                                               │
│                                                                                      │
│  DELIVERABLE: Reduced motion behavior documentation                                 │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

### 🎨 DESIGN SQUAD - OBJECTIVE TASKS

---

**Sarah Putri W.  (Visual Design) - Design System Extraction**

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  SARAH'S SPRINT 1 TASKS: Visual Design Documentation                                │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  TASK S1-01: Color Palette Extraction                                                │
│  ─────────────────────────────────────────────────────────────────────────────────  │
│  Tool: Browser color picker extension + CSS inspection                              │
│  Method:                                                                             │
│  ├── Screenshot key frames at 0%, 25%, 50%, 75%, 100% scroll                        │
│  ├── Use color picker to extract dominant colors                                    │
│  ├── Check CSS for defined color variables                                          │
│  └── Document hex values with usage context                                         │
│                                                                                      │
│  DELIVERABLE: Color palette document (hex codes, usage, contrast ratios)            │
│                                                                                      │
│  ─────────────────────────────────────────────────────────────────────────────────  │
│                                                                                      │
│  TASK S1-02: Typography Analysis                                                     │
│  ─────────────────────────────────────────────────────────────────────────────────  │
│  Tool: WhatFont extension + DevTools                                                 │
│  Document:                                                                           │
│  ├── Font families used (loaded via @font-face or system)                           │
│  ├── Font sizes (px/rem values observed)                                            │
│  ├── Font weights                                                                   │
│  ├── Line heights                                                                   │
│  ├── Letter spacing                                                                 │
│  └── Note: Much typography rendered in WebGL canvas (document separately)           │
│                                                                                      │
│  DELIVERABLE: Typography specification document                                     │
│                                                                                      │
│  ─────────────────────────────────────────────────────────────────────────────────  │
│                                                                                      │
│  TASK S1-03: Section-by-Section Visual Documentation                                 │
│  ─────────────────────────────────────────────────────────────────────────────────  │
│  Method: Full-page screenshot at 11 scroll positions (0-100% in 10% increments)     │
│  Tool: Browser full-page screenshot or manual                                        │
│  For each position, note:                                                            │
│  ├── Dominant visual element                                                        │
│  ├── Color scheme active                                                            │
│  ├── Typography visible                                                             │
│  └── Animation state (static capture limitations noted)                             │
│                                                                                      │
│  DELIVERABLE: Visual journey document (11 annotated screenshots)                    │
│                                                                                      │
│  ─────────────────────────────────────────────────────────────────────────────────  │
│                                                                                      │
│  TASK S1-04: Animation Timing Documentation                                          │
│  ─────────────────────────────────────────────────────────────────────────────────  │
│  Method: Screen recording + frame analysis                                           │
│  Tool: OBS or screen recorder + video editor for frame inspection                   │
│  Document:                                                                           │
│  ├── Transition durations (estimated from video frames)                             │
│  ├── Easing curves observed (linear, ease-in-out, etc.)                             │
│  ├── Scroll-animation sync behavior                                                 │
│  └── Key animation sequences (describe)                                             │
│                                                                                      │
│  DELIVERABLE: Animation timing reference document                                   │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

**Bagus Setiawan (3D Art) - 3D Asset Analysis**

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  BAGUS'S SPRINT 1 TASKS: 3D Technical Documentation                                  │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  TASK B1-01: 3D Asset Identification                                                 │
│  ─────────────────────────────────────────────────────────────────────────────────  │
│  Tool: Network tab filter for 3D file types (. glb, .gltf, .obj, .fbx, .json)        │
│  Document:                                                                           │
│  ├── List all 3D model files loaded                                                 │
│  ├── File sizes                                                                     │
│  ├── Load order/timing                                                              │
│  └── Texture files associated (. jpg, .png, . ktx, .basis)                            │
│                                                                                      │
│  DELIVERABLE: 3D asset inventory spreadsheet                                        │
│                                                                                      │
│  ─────────────────────────────────────────────────────────────────────────────────  │
│                                                                                      │
│  TASK B1-02: Lighting Analysis                                                       │
│  ─────────────────────────────────────────────────────────────────────────────────  │
│  Method: Visual observation + Spector. js shader inspection                          │
│  Document:                                                                           │
│  ├── Light types observed (directional, point, ambient, etc.)                       │
│  ├── Light color temperatures at different scroll positions                         │
│  ├── Shadow presence/quality                                                        │
│  └── Lighting transitions during scroll                                             │
│                                                                                      │
│  DELIVERABLE: Lighting reference document with screenshots                          │
│                                                                                      │
│  ─────────────────────────────────────────────────────────────────────────────────  │
│                                                                                      │
│  TASK B1-03: Material/Shader Observation                                             │
│  ─────────────────────────────────────────────────────────────────────────────────  │
│  Tool: Spector.js shader inspection                                                  │
│  Document (where detectable):                                                        │
│  ├── PBR material usage indicators                                                  │
│  ├── Custom shader effects (DOF, bloom, etc.)                                       │
│  ├── Texture types (albedo, normal, roughness, metallic)                            │
│  └── Post-processing effects chain                                                  │
│                                                                                      │
│  DELIVERABLE: Material/shader technical notes                                       │
│                                                                                      │
│  ─────────────────────────────────────────────────────────────────────────────────  │
│                                                                                      │
│  TASK B1-04: Particle System Documentation                                           │
│  ─────────────────────────────────────────────────────────────────────────────────  │
│  Method: Visual observation + performance impact measurement                        │
│  Document:                                                                           │
│  ├── Particle effects identified (location in scroll journey)                       │
│  ├── Estimated particle counts (visual assessment)                                  │
│  ├── Performance impact during particle-heavy sections                              │
│  └── Particle behavior (physics, emission patterns)                                 │
│                                                                                      │
│  DELIVERABLE: Particle system reference document                                    │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

### 📊 STRATEGY SQUAD - OBJECTIVE TASKS

---

**Nabila Zahra (Psychology/UX) - User Journey Mapping**

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  NABILA'S SPRINT 1 TASKS: Experience Flow Documentation                              │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  TASK N1-01: Scroll Position to Content Mapping                                      │
│  ─────────────────────────────────────────────────────────────────────────────────  │
│  Method: Manual scroll documentation                                                │
│  Document at every 5% scroll position (0%, 5%, 10%...  100%):                        │
│  ├── Primary visual content visible                                                 │
│  ├── Text/copy visible (exact words)                                                │
│  ├── Interactive elements available                                                 │
│  └── Transition state (entering/exiting scene)                                      │
│                                                                                      │
│  DELIVERABLE: Scroll-content mapping spreadsheet (21 data points)                   │
│                                                                                      │
│  ─────────────────────────────────────────────────────────────────────────────────  │
│                                                                                      │
│  TASK N1-02: Call-to-Action Inventory                                                │
│  ─────────────────────────────────────────────────────────────────────────────────  │
│  Method: Full scroll-through documentation                                          │
│  For each CTA found:                                                                 │
│  ├── Location (scroll percentage)                                                   │
│  ├── CTA text (exact)                                                               │
│  ├── Destination (if clicked - document URL)                                        │
│  ├── Visual treatment (color, size, animation)                                      │
│  └── Context (what content surrounds it)                                            │
│                                                                                      │
│  DELIVERABLE: CTA inventory document                                                │
│                                                                                      │
│  ─────────────────────────────────────────────────────────────────────────────────  │
│                                                                                      │
│  TASK N1-03: Information Architecture Mapping                                        │
│  ─────────────────────────────────────────────────────────────────────────────────  │
│  Document:                                                                           │
│  ├── Navigation elements (fixed nav, in-page links)                                 │
│  ├── Section headers/titles (exact text)                                            │
│  ├── Content hierarchy (what comes before/after)                                    │
│  └── External links (destinations)                                                  │
│                                                                                      │
│  DELIVERABLE: Site structure/IA diagram                                             │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

**Citra Dewi A. (Marketing) - Conversion Flow Analysis**

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  CITRA'S SPRINT 1 TASKS: Conversion Path Documentation                               │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  TASK C1-01: Lead Capture Mechanism Documentation                                    │
│  ─────────────────────────────────────────────────────────────────────────────────  │
│  Method: Complete the conversion flow                                               │
│  Document:                                                                           │
│  ├── Form fields required (list each)                                               │
│  ├── Form location (scroll percentage)                                              │
│  ├── Form submission behavior (AJAX?  redirect?)                                     │
│  ├── Thank you page/confirmation                                                    │
│  └── Any validation messages                                                        │
│                                                                                      │
│  DELIVERABLE: Lead capture flow document with screenshots                           │
│                                                                                      │
│  ─────────────────────────────────────────────────────────────────────────────────  │
│                                                                                      │
│  TASK C1-02: Analytics/Tracking Detection                                            │
│  ─────────────────────────────────────────────────────────────────────────────────  │
│  Tool: Browser DevTools Network tab + Ghostery/uBlock origin                        │
│  Detect:                                                                             │
│  ├── Google Analytics (GA4 or UA)                                                   │
│  ├── Google Tag Manager                                                             │
│  ├── Facebook Pixel                                                                 │
│  ├── LinkedIn Insight Tag                                                           │
│  ├── Other tracking scripts                                                         │
│  └── Cookie consent mechanism                                                       │
│                                                                                      │
│  DELIVERABLE: Tracking technology inventory                                         │
│                                                                                      │
│  ─────────────────────────────────────────────────────────────────────────────────  │
│                                                                                      │
│  TASK C1-03: Brand Messaging Extraction                                              │
│  ─────────────────────────────────────────────────────────────────────────────────  │
│  Method: Extract ALL visible text/copy from the site                                │
│  Document:                                                                           │
│  ├── Headlines (exact text, location)                                               │
│  ├── Body copy (exact text, location)                                               │
│  ├── CTA text (exact text, location)                                                │
│  ├── Footer content                                                                 │
│  └── Any data/statistics displayed                                                  │
│                                                                                      │
│  DELIVERABLE: Complete copy inventory document                                      │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

**Rizky Maulana (Business) - Business Context Research**

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  RIZKY'S SPRINT 1 TASKS: External Source Verification                               │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  TASK R1-01: Award/Recognition Verification                                          │
│  ─────────────────────────────────────────────────────────────────────────────────  │
│  Sources to verify:                                                                  │
│  ├── awwwards.com - Site of the Day, Month, Year (exact dates, URLs)               │
│  ├── thefwa.com - Site of the Day/Month                                             │
│  ├── cssdesignawards.com                                                            │
│  └── Communication Arts                                                             │
│                                                                                      │
│  For each:                                                                           │
│  ├── Verification URL                                                               │
│  ├── Award date                                                                     │
│  ├── Jury scores (if available)                                                     │
│  └── Screenshot of award page                                                       │
│                                                                                      │
│  DELIVERABLE: Verified awards document with source URLs                             │
│                                                                                      │
│  ─────────────────────────────────────────────────────────────────────────────────  │
│                                                                                      │
│  TASK R1-02: Agency Credit Verification                                              │
│  ─────────────────────────────────────────────────────────────────────────────────  │
│  Sources:                                                                            │
│  ├── resn.co. nz portfolio page                                                      │
│  ├── baderrutter.com case study                                                     │
│  ├── Behance project page                                                           │
│  └── LinkedIn announcements                                                         │
│                                                                                      │
│  Verify:                                                                             │
│  ├── Agency names and roles                                                         │
│  ├── Client name (Pioneer/Corteva)                                                  │
│  ├── Launch date                                                                    │
│  └── Team credits (if available)                                                    │
│                                                                                      │
│  DELIVERABLE: Verified credits document                                             │
│                                                                                      │
│  ─────────────────────────────────────────────────────────────────────────────────  │
│                                                                                      │
│  TASK R1-03: Published Metrics Collection                                            │
│  ─────────────────────────────────────────────────────────────────────────────────  │
│  Sources to search:                                                                  │
│  ├── Communication Arts case study                                                  │
│  ├── Agency blog posts                                                              │
│  ├── PR releases                                                                    │
│  ├── Interview articles                                                             │
│  └── Conference presentations                                                       │
│                                                                                      │
│  Metrics to find (if published):                                                    │
│  ├── Visitor counts                                                                 │
│  ├── Lead/conversion numbers                                                        │
│  ├── Engagement metrics                                                             │
│  └── Business impact statements                                                     │
│                                                                                      │
│  NOTE: Only document metrics that are publicly cited with sources                   │
│                                                                                      │
│  DELIVERABLE: Verified metrics document with source citations                       │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

**Dinda Ayu L. (Social/Mobile) - Social Presence Analysis**

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  DINDA'S SPRINT 1 TASKS: Social Sharing & Mobile UX Documentation                   │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  TASK D1-01: Open Graph / Social Sharing Meta Tags                                   │
│  ─────────────────────────────────────────────────────────────────────────────────  │
│  Tool: View page source + metatags. io                                               │
│  Document:                                                                           │
│  ├── og:title                                                                       │
│  ├── og:description                                                                 │
│  ├── og:image (URL + dimensions)                                                    │
│  ├── og:url                                                                         │
│  ├── twitter:card type                                                              │
│  └── Any other social meta tags                                                     │
│                                                                                      │
│  Test share preview:                                                                 │
│  ├── Facebook Sharing Debugger                                                      │
│  ├── Twitter Card Validator                                                         │
│  └── LinkedIn Post Inspector                                                        │
│                                                                                      │
│  DELIVERABLE: Social meta tags inventory + preview screenshots                      │
│                                                                                      │
│  ─────────────────────────────────────────────────────────────────────────────────  │
│                                                                                      │
│  TASK D1-02: Mobile Viewport & Touch Behavior                                        │
│  ─────────────────────────────────────────────────────────────────────────────────  │
│  Tool: Chrome DevTools Device Mode                                                   │
│  Devices to simulate:                                                                │
│  ├── iPhone 12/13 Pro (390x844)                                                     │
│  ├── iPhone SE (375x667)                                                            │
│  ├── Samsung Galaxy S21 (360x800)                                                   │
│  ├── iPad (768x1024)                                                                │
│  └── iPad Pro (1024x1366)                                                           │
│                                                                                      │
│  Document per device:                                                                │
│  ├── Content fits viewport?  (Y/N)                                                   │
│  ├── Horizontal scroll present? (Y/N)                                               │
│  ├── Touch targets adequate size? (min 44x44px)                                     │
│  ├── Pinch-to-zoom behavior                                                         │
│  └── Screenshot at key scroll positions                                             │
│                                                                                      │
│  DELIVERABLE: Mobile viewport compatibility report                                  │
│                                                                                      │
│  ─────────────────────────────────────────────────────────────────────────────────  │
│                                                                                      │
│  TASK D1-03: Share Functionality Audit                                               │
│  ─────────────────────────────────────────────────────────────────────────────────  │
│  Document:                                                                           │
│  ├── Are there share buttons on the site?  (location, platforms)                     │
│  ├── Native share API used?  (navigator.share)                                       │
│  ├── Shareable URL structure                                                        │
│  └── Deep linking to sections possible?                                             │
│                                                                                      │
│  DELIVERABLE: Share functionality analysis                                          │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📅 SPRINT 1 TIMELINE - OBJECTIVE MILESTONES

```
╔═══════════════════════════════════════════════════════════════════════════════════════╗
║                    SPRINT 1: DATA COLLECTION & BASELINE                               ║
║                    Duration: 2 Weeks                                                  ║
║                    Goal: Complete objective technical documentation                   ║
╠═══════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                        ║
║  WEEK 1: PRIMARY DATA COLLECTION                                                       ║
║  ────────────────────────────────────────────────────────────────────────────────     ║
║                                                                                        ║
║  Day 1-2: Setup & Initial Scans                                                        ║
║  ├── Kevin: Lighthouse audits, WebPageTest submission                                 ║
║  ├── Andi: Spector.js setup, initial WebGL capture                                    ║
║  ├── Fajar: Device matrix preparation, network throttling setup                       ║
║  ├── Amanda: Automated accessibility scans (axe, WAVE)                                ║
║  └── All: Verify cornrevolution.resn.global accessible                                ║
║                                                                                        ║
║  Day 3-4: Deep Technical Analysis                                                      ║
║  ├── Kevin: Network waterfall analysis, bundle inspection                             ║
║  ├── Andi: WebGL context analysis, Three.js detection                                 ║
║  ├── Fajar: Multi-device testing (minimum 6 devices)                                  ║
║  ├── Amanda: Keyboard navigation, screen reader test                                  ║
║  └── Sarah: Color extraction, typography identification                               ║
║                                                                                        ║
║  Day 5: Visual & 3D Documentation                                                      ║
║  ├── Sarah: Section screenshots (11 positions)                                        ║
║  ├── Bagus: 3D asset inventory, lighting analysis                                     ║
║  └── Nabila: Scroll-content mapping (21 data points)                                  ║
║                                                                                        ║
║  WEEK 2: ANALYSIS & COMPILATION                                                        ║
║  ────────────────────────────────────────────────────────────────────────────────     ║
║                                                                                        ║
║  Day 6-7: External Source Verification                                                 ║
║  ├── Rizky: Award verification, agency credits                                        ║
║  ├── Citra: Lead capture flow, tracking detection                                     ║
║  ├── Dinda: Social meta tags, mobile viewport tests                                   ║
║  └── Cross-check: Verify all external source URLs                                     ║
║                                                                                        ║
║  Day 8-9: Data Compilation                                                             ║
║  ├── All: Compile individual reports                                                  ║
║  ├── Format: Standardized deliverable templates                                       ║
║  ├── Review: Peer review of data accuracy                                             ║
║  └── Gaps: Identify missing data, re-test if needed                                   ║
║                                                                                        ║
║  Day 10: Sprint Review & Documentation                                                 ║
║  ├── Consolidate all deliverables                                                     ║
║  ├── Create master findings document                                                  ║
║  ├── Identify discrepancies/anomalies                                                 ║
║  └── Prepare Sprint 2 backlog based on findings                                       ║
║                                                                                        ║
╚═══════════════════════════════════════════════════════════════════════════════════════╝
```

---

## 📋 DELIVERABLE TEMPLATES

---

### Template: Performance Test Result

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  PERFORMANCE TEST RESULT                                                             │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  Test ID: [PERF-001]                                                                │
│  Tester: [Name]                                                                     │
│  Date/Time: [YYYY-MM-DD HH:MM UTC]                                                  │
│  URL Tested: cornrevolution.resn.global                                             │
│                                                                                      │
│  TEST CONDITIONS:                                                                    │
│  ├── Tool: [Lighthouse / WebPageTest / etc.]                                        │
│  ├── Tool Version: [X.X.X]                                                          │
│  ├── Device: [Desktop / Mobile simulation]                                          │
│  ├── Browser: [Chrome XXX / Firefox XXX / etc.]                                     │
│  ├── Network: [No throttling / Fast 3G / Slow 3G / etc.]                            │
│  └── Location: [If applicable]                                                      │
│                                                                                      │
│  RAW METRICS:                                                                        │
│  ├── First Contentful Paint: [X.XX s]                                               │
│  ├── Largest Contentful Paint: [X.XX s]                                             │
│  ├── Time to Interactive: [X.XX s]                                                  │
│  ├── Total Blocking Time: [XXX ms]                                                  │
│  ├── Cumulative Layout Shift: [X.XX]                                                │
│  ├── Speed Index: [X. XX s]                                                          │
│  ├── Performance Score: [XX/100]                                                    │
│  ├── Accessibility Score: [XX/100]                                                  │
│  ├── Best Practices Score: [XX/100]                                                 │
│  └── SEO Score: [XX/100]                                                            │
│                                                                                      │
│  ATTACHMENTS:                                                                        │
│  ├── [ ] JSON report file                                                           │
│  ├── [ ] Screenshot of results                                                      │
│  └── [ ] HAR file (if applicable)                                                   │
│                                                                                      │
│  NOTES:                                                                              │
│  [Any observations, anomalies, or context]                                          │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

### Template: Accessibility Check Result

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  ACCESSIBILITY CHECK RESULT                                                          │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  Test ID: [A11Y-001]                                                                │
│  Tester: [Name]                                                                     │
│  Date/Time: [YYYY-MM-DD HH:MM UTC]                                                  │
│  URL Tested: cornrevolution.resn. global                                             │
│                                                                                      │
│  CONTEXT NOTE:                                                                       │
│  "This is an experiential WebGL site.  Results are documented objectively.            │
│   Design trade-offs between immersion and traditional accessibility are noted."     │
│                                                                                      │
│  TOOL: [axe-core / WAVE / etc.]                                                     │
│  Version: [X.X.X]                                                                   │
│                                                                                      │
│  AUTOMATED SCAN RESULTS:                                                             │
│  ├── Critical Issues: [X]                                                           │
│  ├── Serious Issues: [X]                                                            │
│  ├── Moderate Issues: [X]                                                           │
│  ├── Minor Issues: [X]                                                              │
│  └── Total: [X]                                                                     │
│                                                                                      │
│  TOP ISSUES (by frequency):                                                          │
│  1. [Issue type]: [Count] instances                                                 │
│  2. [Issue type]: [Count] instances                                                 │
│  3. [Issue type]: [Count] instances                                                 │
│                                                                                      │
│  MANUAL CHECKS:                                                                      │
│  ├── Keyboard Navigation: [Pass / Fail / Partial / N/A]                             │
│  ├── Focus Visible: [Pass / Fail / Partial / N/A]                                   │
│  ├── Screen Reader Announced: [Pass / Fail / Partial / N/A]                         │
│  ├── Skip Links Present: [Yes / No]                                                 │
│  └── Reduced Motion Respected: [Yes / No / Partial]                                 │
│                                                                                      │
│  ATTACHMENTS:                                                                        │
│  ├── [ ] Full scan export (JSON/CSV)                                                │
│  └── [ ] Screenshots of issues                                                      │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## ✅ SPRINT 1 ACCEPTANCE CRITERIA (OBJECTIVE)

```
╔═══════════════════════════════════════════════════════════════════════════════════════╗
║                    SPRINT 1 ACCEPTANCE CRITERIA                                        ║
║                    All deliverables must meet these standards                          ║
╠═══════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                        ║
║  DATA QUALITY STANDARDS:                                                               ║
║                                                                                        ║
║  ☐ All metrics include specific numerical values (no vague terms)                     ║
║  ☐ All tools used are documented with version numbers                                 ║
║  ☐ All tests are dated and timestamped                                                ║
║  ☐ All external claims cite verifiable source URLs                                    ║
║  ☐ Screenshots attached where applicable                                              ║
║  ☐ Raw data exports included (JSON, HAR, CSV)                                         ║
║  ☐ Test conditions documented (device, network, browser)                              ║
║                                                                                        ║
║  MINIMUM DELIVERABLES PER PERSONA:                                                     ║
║                                                                                        ║
║  Kevin:                                                                                ║
║  ├── [ ] 3+ Lighthouse reports (different conditions)                                 ║
║  ├── [ ] 1 HAR file export                                                            ║
║  ├── [ ] 1 WebPageTest result URL                                                     ║
║  └── [ ] Bundle size documentation                                                    ║
║                                                                                        ║
║  Andi:                                                                                 ║
║  ├── [ ] Tech stack identification document                                           ║
║  ├── [ ] Spector.js capture export                                                    ║
║  ├── [ ] 11 scroll-state screenshots (0-100%)                                         ║
║  └── [ ] Animation library detection evidence                                         ║
║                                                                                        ║
║  Fajar:                                                                                ║
║  ├── [ ] Device compatibility matrix (minimum 6 devices)                              ║
║  ├── [ ] Network condition impact report (4 conditions)                               ║
║  └── [ ] Progressive enhancement check                                                ║
║                                                                                        ║
║  Amanda:                                                                               ║
║  ├── [ ] Automated scan exports (axe + WAVE)                                          ║
║  ├── [ ] Keyboard navigation checklist                                                ║
║  ├── [ ] Screen reader test notes                                                     ║
║  └── [ ] prefers-reduced-motion check                                                 ║
║                                                                                        ║
║  Sarah:                                                                                ║
║  ├── [ ] Color palette document (hex codes)                                           ║
║  ├── [ ] Typography specification                                                     ║
║  └── [ ] 11 annotated visual journey screenshots                                      ║
║                                                                                        ║
║  Bagus:                                                                                ║
║  ├── [ ] 3D asset inventory                                                           ║
║  ├── [ ] Lighting reference document                                                  ║
║  └── [ ] Material/shader notes                                                        ║
║                                                                                        ║
║  Nabila:                                                                               ║
║  ├── [ ] Scroll-content mapping (21 data points)                                      ║
║  ├── [ ] CTA inventory                                                                ║
║  └── [ ] IA diagram                                                                   ║
║                                                                                        ║
║  Citra:                                                                                ║
║  ├── [ ] Lead capture flow documentation                                              ║
║  ├── [ ] Tracking technology inventory                                                ║
║  └── [ ] Complete copy inventory                                                      ║
║                                                                                        ║
║  Rizky:                                                                                ║
║  ├── [ ] Verified awards document (with URLs)                                         ║
║  ├── [ ] Agency credits verification                                                  ║
║  └── [ ] Published metrics (source-cited only)                                        ║
║                                                                                        ║
║  Dinda:                                                                                ║
║  ├── [ ] Social meta tags inventory                                                   ║
║  ├── [ ] Mobile viewport report (5 devices)                                           ║
║  └── [ ] Share functionality analysis                                                 ║
║                                                                                        ║
╚═══════════════════════════════════════════════════════════════════════════════════════╝
```

---

## 🎯 SPRINT 1 OUTPUT: CONSOLIDATED BASELINE DOCUMENT

---

> **Amanda (Scrum Master):** *"At the end of Sprint 1, semua data akan dikompilasi menjadi satu dokumen baseline yang objektif. Dokumen ini akan menjadi foundation untuk Sprint 2 (analysis & interpretation) dan Sprint 3 (implementation planning)."*

---

```
╔═══════════════════════════════════════════════════════════════════════════════════════╗
║                                                                                        ║
║           📊 SPRINT 1 OUTPUT: CORN REVOLUTION TECHNICAL BASELINE                       ║
║                                                                                        ║
║  Document Structure:                                                                   ║
║                                                                                        ║
║  1. PERFORMANCE DATA                                                                   ║
║     ├── Lighthouse scores (multiple conditions)                                       ║
║     ├── Core Web Vitals measurements                                                  ║
║     ├── Asset inventory (sizes, types, counts)                                        ║
║     └── Network waterfall analysis                                                    ║
║                                                                                        ║
║  2. TECHNICAL STACK                                                                    ║
║     ├── Detected frameworks/libraries                                                 ║
║     ├── WebGL implementation details                                                  ║
║     ├── Animation system                                                              ║
║     └── Build/bundling observations                                                   ║
║                                                                                        ║
║  3. COMPATIBILITY MATRIX                                                               ║
║     ├── Device testing results                                                        ║
║     ├── Browser compatibility                                                         ║
║     ├── Network condition impact                                                      ║
║     └── Progressive enhancement behavior                                              ║
║                                                                                        ║
║  4.  ACCESSIBILITY STATUS                                                               ║
║     ├── Automated scan results                                                        ║
║     ├── Keyboard navigation status                                                    ║
║     ├── Screen reader compatibility                                                   ║
║     └── Motion preference handling                                                    ║
║     └── Context note on experiential design trade-offs                                ║
║                                                                                        ║
║  5. VISUAL DESIGN DOCUMENTATION                                                        ║
║     ├── Color palette (extracted)                                                     ║
║     ├── Typography (identified)                                                       ║
║     ├── Visual journey (screenshots)                                                  ║
║     └── Animation timing references                                                   ║
║                                                                                        ║
║  6. 3D ASSET DOCUMENTATION                                                             ║
║     ├── Asset inventory                                                               ║
║     ├── Lighting setup                                                                ║
║     ├── Material observations                                                         ║
║     └── Particle systems                                                              ║
║                                                                                        ║
║  7. CONTENT & UX MAPPING                                                               ║
║     ├── Scroll-content map                                                            ║
║     ├── CTA inventory                                                                 ║
║     ├── Information architecture                                                      ║
║     └── Conversion flow                                                               ║
║                                                                                        ║
║  8.  EXTERNAL VERIFICATION                                                              ║
║     ├── Awards (verified with sources)                                                ║
║     ├── Credits (verified)                                                            ║
║     ├── Published metrics (source-cited)                                              ║
║     └── Social/sharing analysis                                                       ║
║                                                                                        ║
║  ALL DATA OBJECTIVE, REPRODUCIBLE, AND SOURCE-CITED                                   ║
║                                                                                        ║
╚═══════════════════════════════════════════════════════════════════════════════════════╝
```

---

**Status:** 🚀 **SPRINT 1 READY TO BEGIN**

---

> **Project Lead (Farid):** *"Dengan metodologi objektif ini, setiap persona akan menghasilkan data yang dapat diverifikasi dan direproduksi.  Tidak ada asumsi - hanya fakta dan angka yang dapat diukur.  Mari kita mulai Sprint 1."*

---
