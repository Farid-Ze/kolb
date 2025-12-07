# 🎬 STORYTELLING & NARRATIVE DESIGN DOCUMENT v2.1
## Zenotika × Psikologi Telkom University
### KOLB Assessment Platform — LandingPage/Futures (View)
#### Visual Paradigm: igloo.inc Centered Layout System

---

## DOCUMENT METADATA

```yaml
document:
  title: "Storytelling & Narrative Design — Futures View"
  version: "2.1. 0"
  created: "2025-12-07"
  revision: "Visual Layout — igloo.inc Centered Paradigm"
  collaboration: "Zenotika × Psikologi Telkom University"
  
status:
  copywriting: "🔒 LOCKED"
  visual_layout: "📐 REVISED"
  typography: "📐 REVISED — igloo.inc scale applied"

design_reference:
  primary: "igloo.inc"
  observed_patterns:
    - "Typography sangat kecil, delicate, tidak mendominasi"
    - "3D object adalah hero, bukan teks"
    - "Label menggunakan monospace uppercase, sangat subtle"
    - "Focal copy singkat, tidak lebih dari 2-3 baris"
    - "Whitespace ekstrem, konten sangat sparse"
    - "Data labels attached ke objek via garis tipis"
```

---

## 1. igloo.inc TYPOGRAPHY ANALYSIS

Berdasarkan screenshot yang Anda berikan, saya menganalisis ulang skala tipografi:

### 1.1 Observasi dari igloo.inc

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     igloo.inc TYPOGRAPHY BEHAVIOR                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  YANG SAYA LIHAT:                                                           │
│  ────────────────                                                           │
│                                                                             │
│  • Logo "iGLOO" — Bold, tapi KECIL (tidak massive)                          │
│  • "// Copyright © 2024" — Sangat kecil, ~10-11px                           │
│  • "////// Manifesto" — Label kecil, uppercase, spaced                      │
│  • Body copy (kanan atas) — Kecil, ~12-13px, right-aligned                  │
│  • "Scroll down to discover." — Kecil, subtle, lowercase                    │
│  • "Sound: Off" — Kecil, monospace                                          │
│  • Data labels pada 3D (37, 42, 44, 22, 30) — Sangat kecil, attached        │
│                                                                             │
│  KESIMPULAN:                                                                │
│  ───────────                                                                │
│  • TIDAK ADA headline besar yang mendominasi                                │
│  • Semua teks adalah SUPPORTING element                                     │
│  • 3D OBJECT adalah focal point, bukan typography                           │
│  • Maximum font size sekitar 14-16px untuk body                             │
│  • Labels/HUD sekitar 10-12px                                               │
│  • Feeling: whisper, bukan shout                                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Revised Typography Scale

```scss
// ════════════════════════════════════════════════════════════════════════════
// REVISED TYPOGRAPHY — igloo.inc SCALE
// Semua ukuran LEBIH KECIL dari sebelumnya
// 3D object harus mendominasi, bukan teks
// ════════════════════════════════════════════════════════════════════════════

:root {
  // ──────────────────────────────────────────────────────────────────────────
  // FONT SIZES — DELICATE SCALE
  // ──────────────────────────────────────────────────────────────────────────
  
  // HUD & Technical Data (sangat kecil, monospace)
  --text-hud: 0.625rem;        // 10px — data readouts, coordinates
  
  // Labels (kecil, uppercase, tracked)
  --text-label: 0.6875rem;     // 11px — section labels, metadata
  
  // Small Body (untuk supporting copy)
  --text-sm: 0.75rem;          // 12px — secondary information
  
  // Base Body (untuk focal copy — TETAP KECIL)
  --text-base: 0.8125rem;      // 13px — main readable text
  
  // Large Body (untuk emphasis — masih modest)
  --text-lg: 0.9375rem;        // 15px — slight emphasis
  
  // Display (untuk single-word impact — TIDAK untuk paragraf)
  --text-display: 1.125rem;    // 18px — maximum untuk special moments
  
  // ──────────────────────────────────────────────────────────────────────────
  // COMPARISON WITH PREVIOUS SPEC
  // ──────────────────────────────────────────────────────────────────────────
  //
  // BEFORE (terlalu besar):           NOW (igloo.inc scale):
  // --text-6xl: 4-6rem (64-96px)      REMOVED — tidak ada headline besar
  // --text-4xl: 2.25-3rem (36-48px)   REMOVED — tidak ada headline besar
  // --text-base: 0.875-1rem           --text-base: 0.8125rem (13px)
  // --text-xs: 0.625-0.75rem          --text-hud: 0. 625rem (10px)
  //
  // ──────────────────────────────────────────────────────────────────────────
  
  // ──────────────────────────────────────────────────────────────────────────
  // LINE HEIGHTS
  // ──────────────────────────────────────────────────────────────────────────
  --leading-tight: 1.3;
  --leading-normal: 1.5;
  --leading-relaxed: 1. 7;
  
  // ──────────────────────────────────────────────────────────────────────────
  // LETTER SPACING
  // ──────────────────────────────────────────────────────────────────────────
  --tracking-tight: -0.01em;
  --tracking-normal: 0;
  --tracking-wide: 0.05em;
  --tracking-wider: 0.1em;
  --tracking-widest: 0. 15em;   // untuk labels uppercase
}
```

### 1.3 Typography Classes — Revised

```scss
// ════════════════════════════════════════════════════════════════════════════
// TYPOGRAPHY UTILITY CLASSES — igloo.inc STYLE
// ════════════════════════════════════════════════════════════════════════════

// HUD: Technical readouts (paling kecil)
.typo-hud {
  font-family: var(--font-mono);
  font-size: var(--text-hud);           // 10px
  font-weight: 400;
  line-height: var(--leading-tight);
  letter-spacing: var(--tracking-widest);
  text-transform: uppercase;
  color: var(--color-text-muted);
}

// Label: Section markers, metadata
.typo-label {
  font-family: var(--font-mono);
  font-size: var(--text-label);         // 11px
  font-weight: 400;
  line-height: var(--leading-normal);
  letter-spacing: var(--tracking-wider);
  text-transform: uppercase;
  color: var(--color-text-tertiary);
}

// Data: Numbers, technical values
.typo-data {
  font-family: var(--font-mono);
  font-size: var(--text-sm);            // 12px
  font-weight: 400;
  line-height: var(--leading-normal);
  letter-spacing: var(--tracking-wide);
  color: var(--color-neon-cyan);
}

// Body Small: Supporting text
.typo-body-sm {
  font-family: var(--font-sans);
  font-size: var(--text-sm);            // 12px
  font-weight: 400;
  line-height: var(--leading-relaxed);
  color: var(--color-text-tertiary);
}

// Body: Primary readable text (FOCAL COPY)
.typo-body {
  font-family: var(--font-sans);
  font-size: var(--text-base);          // 13px
  font-weight: 400;
  line-height: var(--leading-relaxed);
  color: var(--color-text-secondary);
}

// Body Large: Slight emphasis
.typo-body-lg {
  font-family: var(--font-sans);
  font-size: var(--text-lg);            // 15px
  font-weight: 400;
  line-height: var(--leading-relaxed);
  color: var(--color-text-primary);
}

// Display: Maximum size, untuk single words/short phrases ONLY
.typo-display {
  font-family: var(--font-sans);
  font-size: var(--text-display);       // 18px — MAXIMUM
  font-weight: 400;
  line-height: var(--leading-tight);
  letter-spacing: var(--tracking-tight);
  color: var(--color-text-primary);
}
```

---

## 2.  REVISED VIEWPORT LAYOUT

### 2. 1 Content Hierarchy — 3D First

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         HIERARCHY OF ATTENTION                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   1. 3D OBJECT (60-70% visual weight)                                       │
│      └─ Hero, dominan, center of attention                                  │
│      └─ Minimal UI competition                                              │
│                                                                             │
│   2.  ATTACHED DATA LABELS (15% visual weight)                               │
│      └─ Connected to 3D via thin lines                                      │
│      └─ Sangat kecil, monospace                                             │
│      └─ Memberikan context tanpa distraction                                │
│                                                                             │
│   3. FOCAL COPY (10% visual weight)                                         │
│      └─ Center, di bawah atau overlay pada 3D                               │
│      └─ Pendek, 2-3 baris maksimal                                          │
│      └─ Readable tapi tidak shouty                                          │
│                                                                             │
│   4.  PERIPHERAL HUD (5% visual weight)                                      │
│      └─ Corners, sangat subtle                                              │
│      └─ Brand, navigation, progress                                         │
│      └─ Almost invisible until needed                                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Viewport Zones — Revised

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         100vw × 100vh VIEWPORT                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   CORNER-TL                                          CORNER-TR              │
│   ┌────────────┐                                    ┌────────────┐          │
│   │ iGLOO      │                                    │ ////// Label│          │
│   │            │                                    │            │          │
│   │ // meta    │                                    │ Context    │          │
│   └────────────┘                                    └────────────┘          │
│        ↑                                                  ↑                 │
│   typo-label                                         typo-label             │
│   ~11px, muted                                       ~11px, muted           │
│                                                                             │
│                                                                             │
│                    ╔════════════════════════════════╗                       │
│                    ║                                ║                       │
│                    ║         3D OBJECT              ║                       │
│                    ║                                ║                       │
│                    ║      (DOMINANT HERO)           ║ ──── Data Label       │
│                    ║                                ║      typo-hud         │
│                    ║      occupies 50-70%           ║      ~10px            │
│                    ║      of viewport               ║                       │
│                    ║                                ║                       │
│                    ╚════════════════════════════════╝                       │
│                                                                             │
│                    ┌────────────────────────────────┐                       │
│                    │      FOCAL COPY                │                       │
│                    │      typo-body (13px)          │                       │
│                    │      max 2-3 lines             │                       │
│                    │      max-width: 400px          │                       │
│                    └────────────────────────────────┘                       │
│                                                                             │
│                                                                             │
│   CORNER-BL                                          CORNER-BR              │
│   ┌────────────┐                                    ┌────────────┐          │
│   │ Scroll...   │                                    │            │          │
│   │ Sound: Off │                                    │            │          │
│   └────────────┘                                    └────────────┘          │
│        ↑                                                                    │
│   typo-label                                                                │
│   ~11px                                                                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3.  SECTION-BY-SECTION SPECIFICATION

---

### SECTION 0: BRAND REVEAL (0-5% scroll)

**🔒 LOCKED COPY:**
```
ZENOTIKA
×
PSIKOLOGI
TELKOM UNIVERSITY
```

**Visual Layout:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                                                                             │
│                                                                             │
│                                                                             │
│                                                                             │
│                                                                             │
│                                                                             │
│                                                                             │
│                                                                             │
│                                                                             │
│                          ┌─────────────────────┐                            │
│                          │                     │                            │
│                          │    [LOGO ZENOTIKA]  │   ← max-height: 32px       │
│                          │          ×          │   ← typo-label (11px)      │
│                          │    [LOGO TELKOM]    │   ← max-height: 28px       │
│                          │                     │                            │
│                          │    ─────────────    │                            │
│                          │                     │                            │
│                          │      ZENOTIKA       │   ← typo-label (11px)      │
│                          │          ×          │     uppercase, tracked     │
│                          │     PSIKOLOGI       │                            │
│                          │  TELKOM UNIVERSITY  │                            │
│                          │                     │                            │
│                          └─────────────────────┘                            │
│                                                                             │
│                                                                             │
│                                                                             │
│                                                                             │
│                                                                             │
│                                                                             │
│                                                                             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

BACKGROUND: #030508 (void black)
3D STATE: Hidden
DURATION: 2-3 seconds
```

**Specification:**

```yaml
brand_reveal:
  
  background:
    color: "#030508"
    3d_visible: false
    
  container:
    position: "center center"
    display: "flex"
    flex_direction: "column"
    align_items: "center"
    gap: "16px"
    
  logos:
    zenotika:
      max_height: "32px"
    telkom:
      max_height: "28px"
    separator:
      content: "×"
      class: "typo-label"
      color: "var(--color-text-muted)"
      
  text:
    class: "typo-label"
    text_align: "center"
    letter_spacing: "0.15em"
    line_height: 1.8
    color: "var(--color-text-tertiary)"
    
  animation:
    entrance: "fade-in, 1. 5s total"
    exit: "fade-out on scroll, 0.5s"
```

---

### SECTION 1: HERO (5-25% scroll)

**🔒 LOCKED COPY:**
```
Pernah ngerasa cara belajar lo
beda dari kebanyakan orang? 

Bukan berarti salah. 
Cuma belum ketemu sistemnya.
```

**Visual Layout — igloo.inc Style:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  ┌────────────────┐                                                         │
│  │ ZENOTIKA       │   ← typo-label (11px)                                   │
│  │ × TELKOM       │     uppercase, muted                                    │
│  └────────────────┘                                                         │
│                                                                             │
│                                                                             │
│                                                                             │
│                       ░░░░░░░░░░░░░░░░░░░░░░░░░░░                           │
│                     ░░░░░                       ░░░░░                       │
│                   ░░░░░      3D BRAIN MESH        ░░░░░                     │
│                  ░░░░░                             ░░░░░                    │
│                  ░░░░░     DOMINANT PRESENCE       ░░░░░ ─── TEMP 35. 04     │
│                  ░░░░░     ~60% viewport           ░░░░░     typo-hud       │
│                  ░░░░░                             ░░░░░     (10px)         │
│                   ░░░░░    atmospheric fog        ░░░░░                     │
│                     ░░░░░  particle drift       ░░░░░                       │
│                       ░░░░░░░░░░░░░░░░░░░░░░░░░░░                           │
│                                                                             │
│                                                                             │
│                    ┌───────────────────────────────┐                        │
│                    │                               │                        │
│                    │ Pernah ngerasa cara belajar lo│  ← typo-body (13px)    │
│                    │ beda dari kebanyakan orang?   │    center, max 340px   │
│                    │                               │                        │
│                    │ ───────────────────────────── │  ← divider 60px        │
│                    │                               │                        │
│                    │ Bukan berarti salah.          │  ← typo-body-sm (12px) │
│                    │ Cuma belum ketemu sistemnya.  │    muted color         │
│                    │                               │                        │
│                    └───────────────────────────────┘                        │
│                                                                             │
│                                 ↓                      ← scroll indicator   │
│                                                          (subtle, 14px)     │
│                                                                             │
│  ┌────────────────┐                                                         │
│  │ Scroll down to │   ← typo-label (11px)                                   │
│  │ discover.      │                                                         │
│  │                │                                                         │
│  │ 🔊 Sound: Off  │                                                         │
│  └────────────────┘                                                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Specification:**

```yaml
hero_section:
  
  scroll_range: "5% - 25%"
  
  # ═══════════════════════════════════════════════════════════════════════════
  # 3D LAYER — DOMINANT
  # ═══════════════════════════════════════════════════════════════════════════
  
  brain_mesh:
    position: "center, slightly above vertical center"
    scale: "occupies ~55-65% of viewport width"
    visual_weight: "PRIMARY — harus mendominasi"
    material: "BrainMaterial (frost + SSS)"
    
    attached_labels:
      style: "typo-hud (10px)"
      examples:
        - position: "upper-right of mesh"
          content: "NEURAL_01"
        - position: "left-mid"
          content: "TEMP 35.04\n-89.67"
      connection:
        line_stroke: "rgba(255,255,255,0.2)"
        line_width: "1px"
        line_style: "dashed (2 4)"
        
    fog:
      density: 0.012
      color: "#030508"
      
    particles:
      behavior: "snow-dominant, slow drift"
      opacity: 0.4
      
  # ═══════════════════════════════════════════════════════════════════════════
  # CORNER HUD — VERY SUBTLE
  # ═══════════════════════════════════════════════════════════════════════════
  
  corner_tl:
    position: "top: 40px; left: 40px"
    content:
      line_1: "ZENOTIKA"
      line_2: "× TELKOM"
    typography:
      class: "typo-label"
      size: "11px"
      color: "var(--color-text-muted)"
      opacity: 0.5
      
  corner_bl:
    position: "bottom: 40px; left: 40px"
    content:
      scroll_cue:
        text: "Scroll down to\ndiscover."
        class: "typo-label"
        opacity: 0.4
      sound_toggle:
        text: "🔊 Sound: Off"
        class: "typo-label"
        
  # ═══════════════════════════════════════════════════════════════════════════
  # FOCAL COPY — MODEST SIZE
  # ═══════════════════════════════════════════════════════════════════════════
  
  focal_content:
    position: "center, below 3D mesh"
    max_width: "340px"
    text_align: "center"
    
    headline:
      text: |
        Pernah ngerasa cara belajar lo
        beda dari kebanyakan orang? 
      typography:
        class: "typo-body"
        size: "13px"
        weight: 400
        line_height: 1.6
        color: "var(--color-text-primary)"
        
    divider:
      width: "60px"
      height: "1px"
      color: "var(--color-text-muted)"
      opacity: 0.3
      margin: "20px auto"
      
    subheadline:
      text: |
        Bukan berarti salah. 
        Cuma belum ketemu sistemnya.
      typography:
        class: "typo-body-sm"
        size: "12px"
        color: "var(--color-text-tertiary)"
        
    scroll_arrow:
      content: "↓"
      size: "14px"
      color: "var(--color-text-muted)"
      margin_top: "24px"
      animation: "gentle bounce, 2s loop"
```

---

### SECTION 2: FRAMEWORK (25-45% scroll)

**🔒 LOCKED COPY:**
```
[ KOLB LEARNING STYLE INVENTORY ]

Framework dari David Kolb. 
Harvard.  MIT. 50 tahun riset. 
Bukan personality quiz. 

4 mode.  9 gaya.  Kombinasi unik lo. 

┌─────────────┬─────────────┐
│    FEEL     │    WATCH    │
│  Concrete   │ Reflective  │
│ Experience  │ Observation │
├─────────────┼─────────────┤
│   THINK     │     DO      │
│  Abstract   │   Active    │
│Conceptual... │Experiment... │
└─────────────┴─────────────┘

Setiap orang punya kombinasi berbeda.
Bukan lebih baik atau buruk.  Beda.
```

**Visual Layout:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  ┌────────────────┐                        ┌──────────────────────────────┐ │
│  │ ZENOTIKA       │                        │ [ KOLB LEARNING STYLE        │ │
│  │ × TELKOM       │                        │   INVENTORY ]                │ │
│  └────────────────┘                        └──────────────────────────────┘ │
│       ↑                                              ↑                      │
│   typo-label                                    typo-label                  │
│   (11px)                                        (11px)                      │
│                                                                             │
│                                                                             │
│                                                                             │
│                    ┌───────────────────────────────┐                        │
│                    │                               │                        │
│                    │ Framework dari David Kolb.    │   ← typo-body (13px)   │
│                    │ Harvard. MIT. 50 tahun riset. │                        │
│                    │ Bukan personality quiz.      │                        │
│                    │                               │                        │
│                    └───────────────────────────────┘                        │
│                                                                             │
│                    ┌───────────────────────────────┐                        │
│                    │ 4 mode. 9 gaya.               │   ← typo-body-lg (15px)│
│                    │ Kombinasi unik lo.           │     slight emphasis     │
│                    └───────────────────────────────┘                        │
│                                                                             │
│                         ┌───────────┬───────────┐                           │
│                         │   FEEL    │   WATCH   │   ← typo-data (12px)     │
│                         │ Concrete  │Reflective │     cyan color            │
│                         │Experience │Observation│   ← typo-label (11px)    │
│                         ├───────────┼───────────┤     muted                 │
│                         │  THINK    │    DO     │                           │
│                         │ Abstract  │  Active   │                           │
│                         │Conceptual │Experiment │                           │
│                         └───────────┴───────────┘                           │
│                                                                             │
│                              ↑ Grid: max-width 280px                        │
│                                border: 1px, 0.2 opacity                     │
│                                                                             │
│                    ┌───────────────────────────────┐                        │
│                    │ Setiap orang punya kombinasi │   ← typo-body-sm       │
│                    │ berbeda.  Bukan lebih baik    │     (12px), muted       │
│                    │ atau buruk. Beda.            │                        │
│                    └───────────────────────────────┘                        │
│                                                                             │
│                                                                             │
│  ┌────────────────┐                        ┌──────────────────────────────┐ │
│  │ SCROLL. Y 00. 35 │                        │ 00.02                        │ │
│  └────────────────┘                        └──────────────────────────────┘ │
│       ↑                                              ↑                      │
│   typo-hud (10px)                               typo-hud (10px)             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Specification:**

```yaml
framework_section:
  
  scroll_range: "25% - 45%"
  
  # ═══════════════════════════════════════════════════════════════════════════
  # 3D LAYER
  # ═══════════════════════════════════════════════════════════════════════════
  
  3d_state:
    brain_mesh: "dissolved, transitioning to particles"
    particles:
      behavior: "reorganizing, flowing toward center"
      color_shift: "ice-white → cyan hints"
    camera: "pulled back slightly"
    fog_density: 0.008
    
  # ═══════════════════════════════════════════════════════════════════════════
  # CORNER ELEMENTS
  # ═══════════════════════════════════════════════════════════════════════════
  
  corner_tr:
    content: "[ KOLB LEARNING STYLE INVENTORY ]"
    class: "typo-label"
    size: "11px"
    text_align: "right"
    
  corner_bl:
    content: "SCROLL.Y {progress}"
    class: "typo-hud"
    size: "10px"
    
  corner_br:
    content: "00.02"
    class: "typo-hud"
    size: "10px"
    opacity: 0.4
    
  # ═══════════════════════════════════════════════════════════════════════════
  # FOCAL CONTENT
  # ═══════════════════════════════════════════════════════════════════════════
  
  focal_content:
    position: "center center"
    max_width: "360px"
    text_align: "center"
    
    credibility_block:
      text: |
        Framework dari David Kolb. 
        Harvard. MIT. 50 tahun riset. 
        Bukan personality quiz.
      class: "typo-body"
      size: "13px"
      line_height: 1.7
      margin_bottom: "24px"
      
    tagline:
      text: |
        4 mode. 9 gaya. 
        Kombinasi unik lo.
      class: "typo-body-lg"
      size: "15px"
      color: "var(--color-text-primary)"
      margin_bottom: "32px"
      
    mode_grid:
      layout: "2×2 CSS Grid"
      max_width: "280px"
      gap: "1px"
      margin: "0 auto 28px"
      
      cell:
        padding: "16px 12px"
        border: "1px solid rgba(255,255,255,0.15)"
        background: "transparent"
        
        mode_name:
          class: "typo-data"
          size: "12px"
          color: "var(--color-neon-cyan)"
          margin_bottom: "4px"
          
        mode_full:
          class: "typo-label"
          size: "10px"
          color: "var(--color-text-muted)"
          
    closing:
      text: |
        Setiap orang punya kombinasi berbeda.
        Bukan lebih baik atau buruk.  Beda. 
      class: "typo-body-sm"
      size: "12px"
      color: "var(--color-text-tertiary)"
```

---

### SECTION 3: 9 STYLES GRID (45-70% scroll)

**🔒 LOCKED COPY:**
```
9 kombinasi. 
Mana yang mirip cara lo belajar?

[ explore grid ]

Ngerasa familiar sama salah satu? 
Assessment bakal confirm (atau surprise) lo.
```

**Style Descriptions (for expanded view):**
```yaml
INITIATING:
  tagline: "The Starter"
  description: "Lo yang biasanya mulai duluan.  Action first, plan later."
  
EXPERIENCING:
  tagline: "The Feeler"
  description: "Lo belajar paling efektif kalau langsung terlibat. Teori doang?  Boring."
  
# ...  (semua 9 styles seperti sebelumnya)
```

**Visual Layout:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  ┌────────────────┐                        ┌──────────────────────────────┐ │
│  │ ZENOTIKA       │                        │ [ 9 LEARNING STYLES ]        │ │
│  │ × TELKOM       │                        └──────────────────────────────┘ │
│  └────────────────┘                                                         │
│                                                                             │
│                                                                             │
│                    ┌───────────────────────────────┐                        │
│                    │ 9 kombinasi.                   │   ← typo-body (13px)   │
│                    │ Mana yang mirip cara lo       │                        │
│                    │ belajar?                      │                        │
│                    └───────────────────────────────┘                        │
│                                                                             │
│                                                                             │
│              ┌─────────────┬─────────────┬─────────────┐                    │
│              │ INITIATING  │ EXPERIENCING│  CREATING   │                    │
│              │  starter    │   feeler    │  imaginer   │                    │
│              ├─────────────┼─────────────┼─────────────┤                    │
│              │   ACTING    │  BALANCING  │ REFLECTING  │                    │
│              │   doer      │   adapter   │  observer   │                    │
│              ├─────────────┼─────────────┼─────────────┤                    │
│              │  DECIDING   │  THINKING   │  ANALYZING  │                    │
│              │  evaluator  │   analyst   │ integrator  │                    │
│              └─────────────┴─────────────┴─────────────┘                    │
│                                                                             │
│                    ↑ Grid: max-width 380px                                  │
│                      cells: 1px border, subtle                              │
│                      style names: typo-data (12px, cyan)                    │
│                      taglines: typo-label (10px, muted)                     │
│                                                                             │
│                          [ explore grid ]        ← typo-label (11px)        │
│                                                    cyan, clickable          │
│                                                                             │
│                    ┌───────────────────────────────┐                        │
│                    │ Ngerasa familiar sama salah   │   ← typo-body-sm       │
│                    │ satu?  Assessment bakal confirm│     (12px)             │
│                    │ (atau surprise) lo.           │                        │
│                    └───────────────────────────────┘                        │
│                                                                             │
│                                                                             │
│  ┌────────────────┐                        ┌──────────────────────────────┐ │
│  │ [ACTIVE]       │                        │ 00.03                        │ │
│  └────────────────┘                        └──────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Grid Specification:**

```yaml
styles_grid:
  
  layout: "CSS Grid 3×3"
  max_width: "380px"
  gap: "2px"
  margin: "0 auto"
  
  cell:
    padding: "14px 10px"
    background: "rgba(26, 35, 50, 0.4)"
    border: "1px solid rgba(0, 212, 255, 0.15)"
    text_align: "center"
    cursor: "pointer"
    transition: "all 0.3s ease"
    
    content:
      style_name:
        class: "typo-data"
        size: "11px"              # Smaller than before
        color: "var(--color-neon-cyan)"
        text_transform: "uppercase"
        letter_spacing: "0.08em"
        margin_bottom: "2px"
        
      tagline:
        class: "typo-label"
        size: "9px"               # Very small
        color: "var(--color-text-muted)"
        text_transform: "lowercase"
        
    states:
      hover:
        border_color: "var(--color-neon-cyan)"
        background: "rgba(0, 212, 255, 0. 08)"
        box_shadow: "0 0 20px rgba(0, 212, 255, 0.2)"
        
      active:
        border_color: "var(--color-neon-cyan)"
        background: "rgba(0, 212, 255, 0.12)"

# Expanded Cell View (on click)
cell_expansion:
  position: "overlay center"
  max_width: "320px"
  padding: "32px"
  background: "rgba(10, 14, 20, 0.95)"
  backdrop_filter: "blur(20px)"
  border: "1px solid var(--color-neon-cyan)"
  
  content:
    style_name:
      class: "typo-body-lg"       # 15px — modest even when expanded
      color: "var(--color-neon-cyan)"
      
    tagline:
      class: "typo-body-sm"
      size: "12px"
      color: "var(--color-text-secondary)"
      margin: "8px 0 16px"
      
    description:
      class: "typo-body"
      size: "13px"
      color: "var(--color-text-primary)"
      line_height: 1.7
      
    close_hint:
      text: "[ tap to close ]"
      class: "typo-label"
      size: "10px"
      margin_top: "24px"
```

---

### SECTION 4: RESULTS PREVIEW (70-85% scroll)

**🔒 LOCKED COPY:**
```
[ CONTOH HASIL ]

Primary Style: REFLECTING
Learning Flexibility Index: 0.68 (High)

Lo bakal dapet:
• Skor di 4 mode belajar
• Gaya belajar dominan dari 9 kemungkinan
• Learning Flexibility Index
• Rekomendasi praktis

Framework Kolb.  50 tahun.  100+ negara.
Bukan zodiak. Bukan MBTI knockoff. 
```

**Visual Layout:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  ┌────────────────┐                        ┌──────────────────────────────┐ │
│  │ ZENOTIKA       │                        │ [ CONTOH HASIL ]             │ │
│  │ × TELKOM       │                        └──────────────────────────────┘ │
│  └────────────────┘                                                         │
│                                                                             │
│                                                                             │
│                      ╭────────────────────────────╮                         │
│                      │                            │                         │
│                      │      ▲ CE: 32              │  ← typo-hud (10px)      │
│                      │     /│\                    │    attached labels      │
│                      │    / │ \                   │                         │
│                      │   /  │  \                  │                         │
│                      │ AE───┼───RO                │  ← 3D RADAR CHART       │
│                      │ 28   │   36                │    rotating, neon       │
│                      │      │                     │    ~40% viewport        │
│                      │      ▼ AC: 24              │                         │
│                      │                            │                         │
│                      ╰────────────────────────────╯                         │
│                                                                             │
│                                                                             │
│                    ┌───────────────────────────────┐                        │
│                    │ Primary Style: REFLECTING    │   ← typo-body (13px)   │
│                    │ LFI: 0. 68 (High)             │     "REFLECTING" cyan  │
│                    └───────────────────────────────┘                        │
│                                                                             │
│                    ┌───────────────────────────────┐                        │
│                    │ Lo bakal dapet:              │   ← typo-body-sm       │
│                    │ • Skor di 4 mode belajar     │     (12px)             │
│                    │ • Gaya belajar dominan       │     bullet list        │
│                    │ • Learning Flexibility Index │                        │
│                    │ • Rekomendasi praktis        │                        │
│                    └───────────────────────────────┘                        │
│                                                                             │
│                    ┌───────────────────────────────┐                        │
│                    │ Framework Kolb. 50 tahun.     │   ← typo-label (11px)  │
│                    │ 100+ negara.  Bukan zodiak.    │     muted              │
│                    │ Bukan MBTI knockoff.          │                        │
│                    └───────────────────────────────┘                        │
│                                                                             │
│  ┌────────────────┐                        ┌──────────────────────────────┐ │
│  │ [VELOCITY]     │                        │ 00. 04                        │ │
│  └────────────────┘                        └──────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Specification:**

```yaml
results_section:
  
  scroll_range: "70% - 85%"
  
  # ═══════════════════════════════════════════════════════════════════════════
  # 3D LAYER — RADAR CHART
  # ═══════════════════════════════════════════════════════════════════════════
  
  radar_chart_3d:
    position: "center, upper half"
    scale: "~40% viewport width"
    visual_weight: "PRIMARY"
    
    style:
      lines: "neon cyan glow"
      points: "pulsing nodes"
      fill: "transparent with gradient edges"
      
    attached_labels:
      class: "typo-hud"
      size: "10px"
      content:
        - axis: "CE"
          value: "32"
          position: "top"
        - axis: "RO"
          value: "36"
          position: "right"
        - axis: "AC"
          value: "24"
          position: "bottom"
        - axis: "AE"
          value: "28"
          position: "left"
          
    animation:
      idle: "slow rotation on y-axis, 20s loop"
      data_entrance: "points animate in sequentially"
      
  # ═══════════════════════════════════════════════════════════════════════════
  # FOCAL CONTENT
  # ═══════════════════════════════════════════════════════════════════════════
  
  focal_content:
    position: "center, below radar chart"
    max_width: "320px"
    text_align: "center"
    
    result_summary:
      layout: "stacked"
      
      primary_style:
        format: "Primary Style: {value}"
        class: "typo-body"
        size: "13px"
        value_highlight:
          color: "var(--color-neon-cyan)"
          
      lfi:
        format: "LFI: {score} ({level})"
        class: "typo-body"
        size: "13px"
        margin_bottom: "20px"
        
    features_list:
      intro:
        text: "Lo bakal dapet:"
        class: "typo-body-sm"
        margin_bottom: "8px"
        
      items:
        class: "typo-body-sm"
        size: "12px"
        color: "var(--color-text-tertiary)"
        list_style: "none"
        item_prefix: "•"
        item_spacing: "4px"
        text_align: "left"
        max_width: "fit-content"
        margin: "0 auto 24px"
        
    credibility:
      text: |
        Framework Kolb. 50 tahun.  100+ negara.
        Bukan zodiak.  Bukan MBTI knockoff.
      class: "typo-label"
      size: "10px"
      color: "var(--color-text-muted)"
      letter_spacing: "0.05em"
```

---

### SECTION 5: CTA (85-100% scroll)

**🔒 LOCKED COPY:**
```
15 menit.  12 pertanyaan. 
Langsung hasil. 

Gratis.  Tanpa signup.
Data lo nggak kemana-mana. 

[ MULAI ASSESSMENT ]

ZENOTIKA × PSIKOLOGI TELKOM UNIVERSITY

[ Tentang Framework Kolb → ]
```

**Visual Layout:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  ┌────────────────┐                        ┌──────────────────────────────┐ │
│  │ ZENOTIKA       │                        │ [ BEGIN ]                    │ │
│  │ × TELKOM       │                        └──────────────────────────────┘ │
│  └────────────────┘                                                         │
│                                                                             │
│                                                                             │
│                       ░░░░░░░░░░░░░░░░░░░░░░░░░░░                           │
│                     ░░░░░                       ░░░░░                       │
│                   ░░░░░      3D BRAIN MESH        ░░░░░                     │
│                  ░░░░░      (reappears)           ░░░░░                     │
│                  ░░░░░      now "illuminated"     ░░░░░                     │
│                  ░░░░░      softer, welcoming     ░░░░░                     │
│                   ░░░░░                          ░░░░░                      │
│                     ░░░░░                       ░░░░░                       │
│                       ░░░░░░░░░░░░░░░░░░░░░░░░░░░                           │
│                                                                             │
│                                                                             │
│                    ┌───────────────────────────────┐                        │
│                    │ 15 menit.  12 pertanyaan.     │   ← typo-body (13px)   │
│                    │ Langsung hasil.              │                        │
│                    │                               │                        │
│                    │ ───────────────────────────  │                        │
│                    │                               │                        │
│                    │ Gratis. Tanpa signup.        │   ← typo-body-sm       │
│                    │ Data lo nggak kemana-mana.   │     (12px), muted      │
│                    └───────────────────────────────┘                        │
│                                                                             │
│                                                                             │
│                    ╔═════════════════════════════╗                          │
│                    ║                             ║                          │
│                    ║     MULAI ASSESSMENT        ║   ← typo-data (12px)    │
│                    ║                             ║     uppercase, cyan      │
│                    ╚═════════════════════════════╝     subtle pulse glow    │
│                                                                             │
│                                                                             │
│                    ┌───────────────────────────────┐                        │
│                    │ ZENOTIKA × PSIKOLOGI         │   ← typo-label (10px)  │
│                    │ TELKOM UNIVERSITY            │     muted               │
│                    │                               │                        │
│                    │ [ Tentang Framework Kolb → ] │   ← typo-label (10px)  │
│                    │                               │     clickable          │
│                    └───────────────────────────────┘                        │
│                                                                             │
│                                                                             │
│  ┌────────────────┐                        ┌──────────────────────────────┐ │
│  │ 🔊 Sound: Off  │                        │ 00.05                        │ │
│  └────────────────┘                        └──────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Specification:**

```yaml
cta_section:
  
  scroll_range: "85% - 100%"
  
  # ═══════════════════════════════════════════════════════════════════════════
  # 3D LAYER — RETURN TO CALM
  # ═══════════════════════════════════════════════════════════════════════════
  
  brain_mesh:
    state: "reappears, now illuminated"
    opacity: 0.5
    glow: "subtle warm tones mixed with ice"
    position: "center, background"
    
  particles:
    behavior: "converging toward CTA button"
    movement: "magnetic pull"
    color: "ice-white + subtle cyan"
    
  fog:
    density: 0.01
    
  # ═══════════════════════════════════════════════════════════════════════════
  # FOCAL CONTENT
  # ═══════════════════════════════════════════════════════════════════════════
  
  focal_content:
    position: "center center"
    max_width: "320px"
    text_align: "center"
    
    headline:
      text: |
        15 menit. 12 pertanyaan. 
        Langsung hasil.
      class: "typo-body"
      size: "13px"
      color: "var(--color-text-primary)"
      margin_bottom: "16px"
      
    divider:
      width: "50px"
      margin: "0 auto 16px"
      
    reassurance:
      text: |
        Gratis. Tanpa signup.
        Data lo nggak kemana-mana.
      class: "typo-body-sm"
      size: "12px"
      color: "var(--color-text-tertiary)"
      margin_bottom: "32px"
      
    cta_button:
      text: "MULAI ASSESSMENT"
      typography:
        class: "typo-data"
        size: "12px"
        letter_spacing: "0.1em"
        text_transform: "uppercase"
      style:
        padding: "16px 40px"
        background: "transparent"
        border: "1px solid var(--color-neon-cyan)"
        color: "var(--color-neon-cyan)"
      states:
        idle:
          box_shadow: "0 0 15px rgba(0, 212, 255, 0.2)"
          animation: "subtle pulse, 3s loop"
        hover:
          background: "rgba(0, 212, 255, 0. 1)"
          box_shadow: "0 0 30px rgba(0, 212, 255, 0.4)"
          
    footer:
      margin_top: "48px"
      
      brand:
        text: "ZENOTIKA × PSIKOLOGI TELKOM UNIVERSITY"
        class: "typo-label"
        size: "10px"
        color: "var(--color-text-muted)"
        letter_spacing: "0.1em"
        margin_bottom: "12px"
        
      secondary_link:
        text: "[ Tentang Framework Kolb → ]"
        class: "typo-label"
        size: "10px"
        color: "var(--color-text-muted)"
        hover_color: "var(--color-neon-cyan)"
```

---

## 4. COMPONENT SPECIFICATIONS

### 4.1 Corner HUD System

```yaml
corner_hud:
  
  # ═══════════════════════════════════════════════════════════════════════════
  # PERSISTENT ACROSS ALL SECTIONS
  # ═══════════════════════════════════════════════════════════════════════════
  
  positioning:
    desktop:
      inset: "40px"
    mobile:
      inset: "24px"
      
  z_index: 100
  pointer_events: "none"  # except interactive elements
  
  # ──────────────────────────────────────────────────────────────────────────
  # TOP-LEFT: Brand Anchor
  # ──────────────────────────────────────────────────────────────────────────
  
  top_left:
    content:
      primary: "ZENOTIKA"
      secondary: "× TELKOM"
    typography:
      class: "typo-label"
      size: "11px"
      line_height: 1.4
    color: "var(--color-text-muted)"
    opacity: 0.5
    
  # ──────────────────────────────────────────────────────────────────────────
  # TOP-RIGHT: Section Context
  # ──────────────────────────────────────────────────────────────────────────
  
  top_right:
    content: "[ {section_label} ]"
    typography:
      class: "typo-label"
      size: "11px"
    text_align: "right"
    color: "var(--color-text-muted)"
    opacity: 0.5
    animation:
      on_section_change: "fade-out-in, 0.3s"
      
    mobile:
      hidden: true
      
  # ──────────────────────────────────────────────────────────────────────────
  # BOTTOM-LEFT: Scroll Cue & Sound
  # ──────────────────────────────────────────────────────────────────────────
  
  bottom_left:
    scroll_cue:
      text: "Scroll down to\ndiscover."
      typography:
        class: "typo-label"
        size: "11px"
      color: "var(--color-text-muted)"
      opacity: 0.4
      visible_until: "first meaningful scroll"
      
    sound_toggle:
      text: "🔊 Sound: {state}"
      typography:
        class: "typo-label"
        size: "10px"
      pointer_events: "auto"
      cursor: "pointer"
      margin_top: "12px"
      
  # ──────────────────────────────────────────────────────────────────────────
  # BOTTOM-RIGHT: Progress Data
  # ──────────────────────────────────────────────────────────────────────────
  
  bottom_right:
    section_number:
      format: "00. 0{n}"
      typography:
        class: "typo-hud"
        size: "10px"
      color: "var(--color-text-muted)"
      opacity: 0.4
      
    mobile:
      hidden: true
```

### 4. 2 Attached Data Labels (igloo. inc Signature)

```yaml
attached_labels:
  
  description: |
    Labels yang terhubung ke 3D objects via garis tipis.
    Seperti di igloo.inc: "37", "42", "44" pada igloo structure.
    
  style:
    text:
      class: "typo-hud"
      size: "10px"
      color: "var(--color-text-tertiary)"
      text_transform: "uppercase"
      letter_spacing: "0. 05em"
      
    connection_line:
      stroke: "rgba(255, 255, 255, 0. 2)"
      stroke_width: "1px"
      stroke_dasharray: "2 4"  # dashed
      
    positioning:
      offset_from_object: "20-40px"
      avoid_overlap: true
      fade_with_object: true
      
  examples:
    brain_mesh:
      - point: "top-right region"
        label: "NEURAL_01"
        
      - point: "left-mid"
        label: "TEMP 35. 04"
        sublabel: "-89.67"
        
    radar_chart:
      - axis: "CE"
        label: "CE: 32"
        position: "above axis end"
        
      - axis: "RO"
        label: "RO: 36"
        position: "right of axis end"
```

### 4. 3 Scroll Indicator

```yaml
scroll_indicator:
  
  # Appears in Hero section, disappears on scroll
  
  content: "↓"
  
  typography:
    font_size: "14px"  # Modest size
    color: "var(--color-text-muted)"
    
  position: "center, below focal copy"
  margin_top: "24px"
  
  animation:
    entrance: "fade-in, delay 2s"
    idle: "gentle bounce-y, 8px, 2s ease-in-out loop"
    exit: "fade-out on first scroll"
    
  opacity: 0.5
```

---

## 5.  RESPONSIVE CONSIDERATIONS

### 5. 1 Mobile Adaptations

```yaml
mobile_breakpoint: "768px"

adaptations:
  
  typography:
    # Semua ukuran tetap sama — sudah cukup kecil
    # Hanya max-width yang berubah
    focal_content:
      max_width: "90vw"
      padding_x: "16px"
      
  corners:
    inset: "24px"
    hide:
      - "top_right"
      - "bottom_right"
      
  3d_objects:
    scale_factor: 0.85  # Slightly smaller
    
  grids:
    mode_grid_2x2:
      max_width: "260px"
      cell_padding: "12px 10px"
      
    styles_grid_3x3:
      max_width: "320px"
      cell_padding: "12px 8px"
      
  spacing:
    section_gap: "reduced by 20%"
```

---

## 6.  ANIMATION CHOREOGRAPHY

### 6.1 Entrance Animations

```yaml
entrance_animations:
  
  # Per-section entrance when scrolling into view
  
  timing:
    stagger_base: 0.1s
    duration_short: 0.4s
    duration_medium: 0. 6s
    duration_long: 1.0s
    
  easing:
    default: "ease-out"
    dramatic: "cubic-bezier(0.16, 1, 0.3, 1)"
    
  patterns:
    fade_up:
      from:
        opacity: 0
        y: 15px  # Subtle, bukan dramatic
      to:
        opacity: 1
        y: 0
        
    scale_in:
      from:
        opacity: 0
        scale: 0. 95
      to:
        opacity: 1
        scale: 1
        
    line_reveal:
      # Untuk dividers
      from:
        scaleX: 0
      to:
        scaleX: 1
```

### 6. 2 Scroll-Linked Behaviors

```yaml
scroll_behaviors:
  
  velocity_states:
    calm:
      threshold: "< 200 px/s"
      visual:
        particles: "snow-dominant, slow"
        fog: "dense (0.012)"
        colors: "ice-white, cool blues"
        post_processing: "frost effect active"
        
    active:
      threshold: "200-500 px/s"
      visual:
        particles: "mixed behavior"
        fog: "medium (0.008)"
        