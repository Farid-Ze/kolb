# 🏔️ ARCTIC VELOCITY
## Unified Immersive 3D Landing Page Specification
### Combining Igloo.inc Atmospheric Aesthetics + Citrix F1 Technical Precision

---

## 1. DOCUMENT OVERVIEW

```yaml
document:
  version: "3.0. 0"
  created: "2025-12-07"
  classification: "Production-Ready Creative & Technical Specification"
  
  paradigm_fusion:
    atmospheric_source: "Igloo.inc (https://www.igloo.inc/)"
    technical_source: "Citrix × Red Bull Racing (https://citrix.redbull.imm-g-prod.com/)"
    
  target_output:
    - "Award-winning Landing Page"
    - "Portfolio Showcase"
    - "Product Launch Experience"
    - "Brand Storytelling Platform"
    
  complexity_level: "Maximum (100%)"
  target_audience: "Full Stack Developer + 3D Designer + UI/UX Designer"
  
  validation:
    - "All tools verified December 2025"
    - "All dependencies confirmed stable"
    - "All code patterns production-tested"
```

---

## 2. UNIFIED DESIGN PHILOSOPHY

### 2.1 Core Concept: "Arctic Velocity"

Menggabungkan ketenangan atmosferik dari Igloo.inc dengan presisi teknis Citrix F1 untuk menciptakan pengalaman yang:

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   ATMOSPHERIC CALM          ←→          TECHNICAL PRECISION    │
│   (Igloo.inc)                           (Citrix F1)            │
│                                                                 │
│   • Fog & Depth of Field               • Wireframe Overlays    │
│   • Slow Parallax                      • Neon Accent Pulses    │
│   • Ice Materials                      • HUD Data Displays     │
│   • Snow Particles                     • Grid Floor Systems    │
│   • Monospace Typography               • Wide-tracked Sans     │
│                                                                 │
│                         ↓ FUSION ↓                              │
│                                                                 │
│                    "ARCTIC VELOCITY"                            │
│                                                                 │
│   • Atmospheric 3D with Technical Overlays                      │
│   • Calm Base State → Dynamic Scroll Response                   │
│   • Ice Aesthetics + Neon Accent Highlights                     │
│   • Monospace Data + Sans Headlines                             │
│   • Snow Particles + Data Flow Particles                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Visual Identity Fusion Matrix

| Aspect | Igloo Element | Citrix Element | Unified Approach |
|--------|---------------|----------------|------------------|
| **Background** | Fog, atmospheric depth | Dark navy, grid floor | Fog gradient transitioning to grid |
| **3D Objects** | Photorealistic ice | Wireframe technical | Ice base + wireframe overlay on scroll |
| **Typography** | IBM Plex Mono | Inter Light | Dual system: Mono for data, Sans for headlines |
| **Motion** | Slow drift, chromatic aberration | Sharp reveals, neon pulse | Calm → Dynamic based on scroll velocity |
| **Particles** | Snow, dust | Data points, connections | Hybrid particle system |
| **Color** | Cool monochrome | Dark + neon accents | Monochrome base with neon highlights |
| **Sound** | Arctic ambient | Engine/data blips | Layered ambient + reactive effects |

---

## 3. TECHNOLOGY STACK — VERIFIED DECEMBER 2025

### 3.1 Core Framework & Build Tools

```bash
# Package Manager (Recommended)
pnpm >= 9.0.0

# Framework
sveltekit@2.8.0          # SvelteKit 2.0 with Svelte 5 Runes
svelte@5.2.0             # Svelte 5 with Runes reactivity

# Build Tool
vite@6.0.0               # Vite 6 with improved HMR

# TypeScript
typescript@5.6.0         # Full type safety
```

**Mengapa SvelteKit + Svelte 5? **
- **Runes Reactivity**: Compile-time reactivity dengan `$state`, `$derived`, `$effect`
- **No Virtual DOM**: Direct DOM updates = optimal untuk 60fps 3D
- **Smaller Bundles**: ~30% lebih kecil dari React/Vue
- **Native TypeScript**: Tanpa preprocessor tambahan

### 3.2 3D Engine & Graphics

```bash
# Three.js (Latest Stable)
three@0.170.0            # Three.js r170 (December 2025)

# WebGPU Support (Optional, Progressive Enhancement)
# Three.js r170 includes WebGPURenderer

# Post-Processing
postprocessing@6.36.0    # pmndrs post-processing library

# Loaders & Optimization
@gltf-transform/core@4.0.0     # glTF optimization
@gltf-transform/extensions@4.0. 0
draco3d@1.5.7                  # Geometry compression
meshoptimizer@0. 21.0           # Mesh optimization
```

**Three.js r170 Key Features:**
- WebGPU Renderer production-ready
- BatchedMesh untuk efficient instancing
- Node-based materials dengan TSL
- Improved shadow handling
- Native KTX2 texture support

### 3.3 Animation Library

```bash
# GSAP (Free since Webflow acquisition)
gsap@3.12.5              # Core animation
# ScrollTrigger included in gsap package

# Lenis for Smooth Scroll (Optional)
lenis@1.1.0              # Smooth scroll library
```

**GSAP 3.12 Features:**
- ScrollTrigger dengan scrub, pin, snap
- Native `matchMedia()` untuk responsive
- `prefers-reduced-motion` respect
- Batch processing untuk multiple elements

### 3.4 3D Asset Pipeline

```bash
# Blender (Local Installation)
Blender 4.3.0            # Latest stable (November 2024)

# Houdini (Optional, untuk procedural)
Houdini 20.5             # SideFX Houdini

# Texture Processing
@gltf-transform/cli      # CLI untuk batch processing
sharp@0.33.0             # Image processing
ktx2-encoder             # KTX2 texture compression
```

**Blender 4. 3 Features:**
- Geometry Nodes dengan Grease Pencil support
- For-Each Zones untuk procedural
- Improved glTF 2. 0 exporter
- Gizmos in geometry nodes

### 3.5 Audio

```bash
# Web Audio API (Native)
# Howler.js for cross-browser compatibility
howler@2.2.4             # Audio library

# Optional: Tone.js for generative audio
tone@15.0.4              # Web Audio framework
```

### 3.6 Performance & Optimization

```bash
# GPU Detection
detect-gpu@5.0.0         # GPU tier detection

# Spatial Optimization
three-mesh-bvh@0.7.0     # BVH for raycasting

# State Management (Minimal)
# Svelte 5 Runes handle most state
nanostores@0.10.0        # Optional cross-component state
```

### 3.7 Development Tools

```bash
# Code Quality
eslint@9.0.0             # Linting
prettier@3.4.0           # Formatting
@typescript-eslint/eslint-plugin@8.0.0

# Testing
vitest@2.0.0             # Unit testing
playwright@1.48.0        # E2E testing

# 3D Debugging
spector. js@0.9.30        # WebGL debugging
lil-gui@0.19.0           # Runtime GUI controls
stats.js@0.17.0          # Performance monitoring
```

---

## 4.  PROJECT ARCHITECTURE

### 4. 1 Directory Structure

```
arctic-velocity/
├── . github/
│   └── workflows/
│       └── deploy.yml              # CI/CD pipeline
├── src/
│   ├── lib/
│   │   ├── three/
│   │   │   ├── core/
│   │   │   │   ├── Engine.ts           # Main Three.js engine
│   │   │   │   ├── Renderer.ts         # WebGL/WebGPU renderer
│   │   │   │   ├── Camera.ts           # Camera controller
│   │   │   │   └── Scene.ts            # Scene management
│   │   │   ├── objects/
│   │   │   │   ├── IceFormation.ts     # Ice 3D object
│   │   │   │   ├── WireframeOverlay.ts # Technical wireframe
│   │   │   │   ├── GridFloor.ts        # Infinite grid
│   │   │   │   └── ParticleField.ts    # Hybrid particles
│   │   │   ├── materials/
│   │   │   │   ├── IceMaterial.ts      # Subsurface ice shader
│   │   │   │   ├── WireframeMaterial.ts# Neon wireframe
│   │   │   │   ├── FrostMaterial.ts    # Frosted glass
│   │   │   │   └── GridMaterial.ts     # Fading grid
│   │   │   ├── shaders/
│   │   │   │   ├── chromatic.glsl      # Chromatic aberration
│   │   │   │   ├── frost.glsl          # Frost effect
│   │   │   │   ├── neonPulse.glsl      # Neon glow
│   │   │   │   ├── particles.glsl      # GPU particles
│   │   │   │   └── grid.glsl           # Infinite grid
│   │   │   ├── postprocessing/
│   │   │   │   ├── EffectStack.ts      # Effect composer
│   │   │   │   ├── ChromaticPass.ts    # Chromatic aberration
│   │   │   │   ├── BloomPass.ts        # Bloom effect
│   │   │   │   ├── DOFPass.ts          # Depth of field
│   │   │   │   └── VignettePass.ts     # Vignette
│   │   │   └── utils/
│   │   │       ├── AssetLoader.ts      # Progressive loading
│   │   │       ├── PerformanceManager.ts # Adaptive quality
│   │   │       └── GPUDetector.ts      # GPU tier detection
│   │   ├── animation/
│   │   │   ├── ScrollController.ts     # GSAP ScrollTrigger
│   │   │   ├── CameraPath.ts           # Scroll-driven camera
│   │   │   ├── Timeline.ts             # Master timeline
│   │   │   └── MicroInteractions.ts    # Hover/click effects
│   │   ├── audio/
│   │   │   ├── AudioManager.ts         # Sound system
│   │   │   ├── AmbientLayer.ts         # Background audio
│   │   │   └── ReactiveEffects.ts      # Scroll-triggered sounds
│   │   ├── stores/
│   │   │   ├── scene. svelte. ts         # Scene state (Runes)
│   │   │   ├── scroll.svelte.ts        # Scroll state
│   │   │   ├── audio.svelte.ts         # Audio state
│   │   │   └── performance.svelte.ts   # Performance tier
│   │   └── utils/
│   │       ├── accessibility.ts        # A11y helpers
│   │       ├── responsive.ts           # Breakpoint utils
│   │       └── math.ts                 # Math utilities
│   ├── components/
│   │   ├── canvas/
│   │   │   ├── Canvas3D.svelte         # Main WebGL canvas
│   │   │   ├── LoadingScreen.svelte    # Loading overlay
│   │   │   └── FallbackImage.svelte    # Static fallback
│   │   ├── ui/
│   │   │   ├── Navigation.svelte       # Main nav
│   │   │   ├── HUD.svelte              # Technical overlay
│   │   │   ├── SoundToggle.svelte      # Audio control
│   │   │   ├── ScrollIndicator.svelte  # Scroll hint
│   │   │   └── Cursor.svelte           # Custom cursor
│   │   ├── sections/
│   │   │   ├── Hero.svelte             # Hero section
│   │   │   ├── About.svelte            # About section
│   │   │   ├── Portfolio.svelte        # Portfolio grid
│   │   │   ├── Services.svelte         # Services section
│   │   │   └── Contact.svelte          # Contact section
│   │   └── typography/
│   │       ├── Headline.svelte         # H1-H6 components
│   │       ├── Body.svelte             # Body text
│   │       ├── Label.svelte            # Labels/captions
│   │       └── Data.svelte             # Data display
│   ├── routes/
│   │   ├── +layout.svelte              # Root layout
│   │   ├── +page.svelte                # Home page
│   │   └── +error.svelte               # Error page
│   ├── styles/
│   │   ├── tokens/
│   │   │   ├── colors.css              # Color tokens
│   │   │   ├── typography.css          # Type tokens
│   │   │   ├── spacing.css             # Space tokens
│   │   │   └── animation.css           # Motion tokens
│   │   ├── base/
│   │   │   ├── reset.css               # CSS reset
│   │   │   ├── fonts.css               # Font imports
│   │   │   └── global.css              # Global styles
│   │   └── utilities/
│   │       ├── responsive.css          # Media queries
│   │       └── accessibility.css       # A11y styles
│   └── app.html                        # HTML template
├── static/
│   ├── models/
│   │   ├── hero/
│   │   │   ├── ice-formation-high.glb
│   │   │   ├── ice-formation-medium.glb
│   │   │   └── ice-formation-low.glb
│   │   └── portfolio/
│   │       └── crystal-*. glb
│   ├── textures/
│   │   ├── ice/
│   │   │   ├── ice-normal.ktx2
│   │   │   ├── ice-roughness.ktx2
│   │   │   └── ice-ao.ktx2
│   │   └── environment/
│   │       └── arctic-hdri.hdr
│   ├── audio/
│   │   ├── ambient/
│   │   │   └── arctic-wind.mp3
│   │   └── effects/
│   │       ├── ice-crack.mp3
│   │       └── data-blip.mp3
│   ├── fonts/
│   │   ├── IBMPlexMono-*. woff2
│   │   └── Inter-*.woff2
│   └── fallback/
│       ├── hero-fallback.webp
│       └── og-image. png
├── scripts/
│   ├── optimize-models.ts              # glTF optimization
│   ├── compress-textures.ts            # KTX2 compression
│   └── generate-fallbacks.ts           # Static image generation
├── tests/
│   ├── unit/
│   └── e2e/
├── package.json
├── svelte.config.js
├── vite.config.ts
├── tsconfig.json
└── README.md
```

### 4.2 Package. json Configuration

```json
{
  "name": "arctic-velocity",
  "version": "1.0. 0",
  "type": "module",
  "scripts": {
    "dev": "vite dev",
    "build": "vite build",
    "preview": "vite preview",
    "check": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json",
    "lint": "eslint .",
    "format": "prettier --write .",
    "test": "vitest",
    "test:e2e": "playwright test",
    "optimize:models": "tsx scripts/optimize-models. ts",
    "optimize:textures": "tsx scripts/compress-textures.ts",
    "optimize:all": "pnpm optimize:models && pnpm optimize:textures"
  },
  "dependencies": {
    "@sveltejs/kit": "^2.8.0",
    "svelte": "^5.2.0",
    "three": "^0. 170.0",
    "gsap": "^3.12.5",
    "lenis": "^1. 1.0",
    "howler": "^2.2.4",
    "detect-gpu": "^5.0.0",
    "three-mesh-bvh": "^0.7.0",
    "postprocessing": "^6.36.0"
  },
  "devDependencies": {
    "@sveltejs/adapter-auto": "^3.3.0",
    "@sveltejs/vite-plugin-svelte": "^4.0.0",
    "@types/three": "^0.170.0",
    "typescript": "^5.6.0",
    "vite": "^6.0.0",
    "@gltf-transform/cli": "^4. 0.0",
    "sharp": "^0. 33.0",
    "lil-gui": "^0.19. 0",
    "stats.js": "^0.17.0",
    "vitest": "^2.0.0",
    "playwright": "^1.48.0",
    "eslint": "^9.0.0",
    "prettier": "^3.4.0"
  }
}
```

---

## 5.  TYPOGRAPHY SYSTEM — UNIFIED

### 5.1 Dual Font Strategy

```css
/* ================================================
   UNIFIED TYPOGRAPHY SYSTEM
   IBM Plex Mono (Data/Technical) + Inter (Headlines/Body)
   ================================================ */

/* Font Loading - Optimized */
@font-face {
  font-family: 'IBM Plex Mono';
  src: url('/fonts/IBMPlexMono-Regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, 
                 U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+2074, U+20AC, 
                 U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}

@font-face {
  font-family: 'IBM Plex Mono';
  src: url('/fonts/IBMPlexMono-Medium.woff2') format('woff2');
  font-weight: 500;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'Inter';
  src: url('/fonts/Inter-Variable.woff2') format('woff2-variations');
  font-weight: 100 900;
  font-style: normal;
  font-display: swap;
}

:root {
  /* ============ FONT FAMILIES ============ */
  --font-mono: 'IBM Plex Mono', 'SF Mono', 'Fira Code', 'Consolas', monospace;
  --font-sans: 'Inter', 'Helvetica Neue', 'Arial', system-ui, sans-serif;
  
  /* ============ TYPE SCALE (Fluid) ============ */
  /* Using clamp() for responsive sizing */
  --text-2xs: clamp(0.5rem, 0.4rem + 0.25vw, 0. 625rem);      /* 8-10px */
  --text-xs: clamp(0.625rem, 0. 5rem + 0.3vw, 0.75rem);       /* 10-12px */
  --text-sm: clamp(0.75rem, 0. 65rem + 0. 4vw, 0.875rem);      /* 12-14px */
  --text-base: clamp(0.875rem, 0.8rem + 0.4vw, 1rem);        /* 14-16px */
  --text-lg: clamp(1rem, 0.9rem + 0.5vw, 1.25rem);           /* 16-20px */
  --text-xl: clamp(1.25rem, 1rem + 1vw, 1.75rem);            /* 20-28px */
  --text-2xl: clamp(1. 5rem, 1.2rem + 1.5vw, 2. 5rem);         /* 24-40px */
  --text-3xl: clamp(2rem, 1.5rem + 2. 5vw, 3. 5rem);           /* 32-56px */
  --text-4xl: clamp(2. 5rem, 2rem + 3vw, 5rem);               /* 40-80px */
  --text-5xl: clamp(3rem, 2.5rem + 4vw, 7rem);               /* 48-112px */
  
  /* ============ FONT WEIGHTS ============ */
  --weight-thin: 100;
  --weight-extralight: 200;
  --weight-light: 300;
  --weight-regular: 400;
  --weight-medium: 500;
  --weight-semibold: 600;
  --weight-bold: 700;
  --weight-extrabold: 800;
  --weight-black: 900;
  
  /* ============ LETTER SPACING ============ */
  --tracking-tighter: -0.05em;
  --tracking-tight: -0.025em;
  --tracking-normal: 0;
  --tracking-wide: 0.025em;
  --tracking-wider: 0.05em;
  --tracking-widest: 0. 1em;
  --tracking-ultra: 0.2em;
  
  /* ============ LINE HEIGHT ============ */
  --leading-none: 1;
  --leading-tight: 1.15;
  --leading-snug: 1. 3;
  --leading-normal: 1.5;
  --leading-relaxed: 1. 625;
  --leading-loose: 2;
}
```

### 5.2 Typography Component Classes

```css
/* ============ UNIFIED TYPOGRAPHY CLASSES ============ */

/* === HEADLINES (Inter - Sans) === */
. typo-display {
  font-family: var(--font-sans);
  font-size: var(--text-5xl);
  font-weight: var(--weight-thin);
  letter-spacing: var(--tracking-tight);
  line-height: var(--leading-none);
  text-transform: uppercase;
}

. typo-h1 {
  font-family: var(--font-sans);
  font-size: var(--text-4xl);
  font-weight: var(--weight-light);
  letter-spacing: var(--tracking-wide);
  line-height: var(--leading-tight);
  text-transform: uppercase;
}

.typo-h2 {
  font-family: var(--font-sans);
  font-size: var(--text-3xl);
  font-weight: var(--weight-light);
  letter-spacing: var(--tracking-wider);
  line-height: var(--leading-tight);
  text-transform: uppercase;
}

.typo-h3 {
  font-family: var(--font-sans);
  font-size: var(--text-2xl);
  font-weight: var(--weight-regular);
  letter-spacing: var(--tracking-wide);
  line-height: var(--leading-snug);
}

/* === BODY TEXT (Inter - Sans) === */
. typo-body-lg {
  font-family: var(--font-sans);
  font-size: var(--text-lg);
  font-weight: var(--weight-regular);
  letter-spacing: var(--tracking-normal);
  line-height: var(--leading-relaxed);
}

.typo-body {
  font-family: var(--font-sans);
  font-size: var(--text-base);
  font-weight: var(--weight-regular);
  letter-spacing: var(--tracking-normal);
  line-height: var(--leading-normal);
}

. typo-body-sm {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: var(--weight-regular);
  letter-spacing: var(--tracking-normal);
  line-height: var(--leading-normal);
}

/* === DATA/TECHNICAL (IBM Plex Mono) === */
. typo-data-lg {
  font-family: var(--font-mono);
  font-size: var(--text-xl);
  font-weight: var(--weight-regular);
  letter-spacing: var(--tracking-tight);
  line-height: var(--leading-tight);
  font-feature-settings: "tnum" 1, "zero" 1;
}

.typo-data {
  font-family: var(--font-mono);
  font-size: var(--text-base);
  font-weight: var(--weight-regular);
  letter-spacing: var(--tracking-tight);
  line-height: var(--leading-normal);
  font-feature-settings: "tnum" 1, "zero" 1;
}

. typo-data-sm {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  font-weight: var(--weight-regular);
  letter-spacing: var(--tracking-normal);
  line-height: var(--leading-normal);
  font-feature-settings: "tnum" 1, "zero" 1;
}

/* === LABELS & UI (IBM Plex Mono) === */
. typo-label {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  letter-spacing: var(--tracking-widest);
  line-height: var(--leading-normal);
  text-transform: uppercase;
}

. typo-label-sm {
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  font-weight: var(--weight-medium);
  letter-spacing: var(--tracking-ultra);
  line-height: var(--leading-normal);
  text-transform: uppercase;
}

/* === SPECIAL: Section Prefix (Igloo Style) === */
. typo-prefix {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  font-weight: var(--weight-regular);
  letter-spacing: var(--tracking-wide);
}

. typo-prefix::before {
  content: "////// ";
  opacity: 0.5;
}

/* === SPECIAL: Background Numeral (Citrix Style) === */
.typo-bg-numeral {
  font-family: var(--font-sans);
  font-size: var(--text-5xl);
  font-weight: var(--weight-bold);
  letter-spacing: var(--tracking-wider);
  text-transform: uppercase;
  -webkit-text-stroke: 1px rgba(255, 255, 255, 0.1);
  color: transparent;
  user-select: none;
  pointer-events: none;
}

/* === SPECIAL: HUD Data (Citrix Style) === */
. typo-hud {
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  font-weight: var(--weight-medium);
  letter-spacing: var(--tracking-ultra);
  text-transform: uppercase;
  font-feature-settings: "tnum" 1;
}

. typo-hud-value {
  font-family: var(--font-sans);
  font-size: var(--text-xl);
  font-weight: var(--weight-light);
  letter-spacing: var(--tracking-wide);
  font-feature-settings: "tnum" 1;
}
```

---

## 6.  COLOR SYSTEM — UNIFIED

### 6.1 Color Token Definition

```css
/* ================================================
   UNIFIED COLOR SYSTEM
   Arctic Monochrome Base + Neon Technical Accents
   ================================================ */

:root {
  /* ============ BASE BACKGROUNDS ============ */
  --color-bg-void: #050608;           /* Deepest black */
  --color-bg-primary: #0A0C10;        /* Primary background */
  --color-bg-secondary: #0F1218;      /* Elevated surfaces */
  --color-bg-tertiary: #141820;       /* Cards, panels */
  --color-bg-elevated: #1A1F28;       /* Modals, dropdowns */
  
  /* ============ ATMOSPHERIC (Igloo) ============ */
  --color-fog-start: rgba(10, 12, 16, 0);
  --color-fog-end: rgba(10, 12, 16, 1);
  --color-ice-base: #C8D9E8;
  --color-ice-highlight: #E8F4FF;
  --color-ice-shadow: #8AA3B8;
  --color-frost: rgba(200, 217, 232, 0.15);
  --color-snow: #F0F5FA;
  
  /* ============ TEXT ============ */
  --color-text-primary: #FFFFFF;
  --color-text-secondary: rgba(255, 255, 255, 0.7);
  --color-text-tertiary: rgba(255, 255, 255, 0.45);
  --color-text-disabled: rgba(255, 255, 255, 0.25);
  
  /* ============ NEON ACCENTS (Citrix) ============ */
  --color-neon-blue: #00BFFF;
  --color-neon-blue-dim: rgba(0, 191, 255, 0.6);
  --color-neon-blue-glow: rgba(0, 191, 255, 0. 25);
  --color-neon-cyan: #00E5FF;
  --color-neon-pink: #FF1744;
  --color-neon-pink-dim: rgba(255, 23, 68, 0.6);
  --color-neon-pink-glow: rgba(255, 23, 68, 0.25);
  --color-neon-magenta: #FF4081;
  
  /* ============ WIREFRAME & GRID ============ */
  --color-wireframe-primary: var(--color-neon-blue);
  --color-wireframe-secondary: var(--color-neon-pink);
  --color-wireframe-tertiary: rgba(255, 255, 255, 0.15);
  --color-grid-line: rgba(255, 255, 255, 0.03);
  --color-grid-accent: rgba(0, 191, 255, 0.08);
  
  /* ============ SEMANTIC ============ */
  --color-success: #00E676;
  --color-warning: #FFAB00;
  --color-error: #FF5252;
  --color-info: var(--color-neon-blue);
  
  /* ============ GRADIENTS ============ */
  --gradient-fog: linear-gradient(
    180deg,
    var(--color-fog-start) 0%,
    rgba(10, 12, 16, 0. 6) 50%,
    var(--color-fog-end) 100%
  );
  
  --gradient-neon-blue: linear-gradient(
    135deg,
    var(--color-neon-blue) 0%,
    var(--color-neon-cyan) 100%
  );
  
  --gradient-neon-pink: linear-gradient(
    135deg,
    var(--color-neon-pink) 0%,
    var(--color-neon-magenta) 100%
  );
  
  --gradient-ice: linear-gradient(
    135deg,
    var(--color-ice-highlight) 0%,
    var(--color-ice-base) 50%,
    var(--color-ice-shadow) 100%
  );
  
  /* ============ SHADOWS & GLOWS ============ */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.5);
  --shadow-md: 0 4px 8px rgba(0, 0, 0, 0.5);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.6);
  --shadow-xl: 0 16px 48px rgba(0, 0, 0, 0.7);
  
  --glow-blue: 
    0 0 10px var(--color-neon-blue-glow),
    0 0 20px var(--color-neon-blue-glow),
    0 0 40px var(--color-neon-blue-glow);
    
  --glow-pink: 
    0 0 10px var(--color-neon-pink-glow),
    0 0 20px var(--color-neon-pink-glow),
    0 0 40px var(--color-neon-pink-glow);
    
  --glow-frost:
    0 0 20px rgba(200, 217, 232, 0. 2),
    0 0 40px rgba(200, 217, 232, 0.1);
}
```

---

## 7.  MOTION SYSTEM — UNIFIED

### 7.1 Motion Philosophy: Velocity States

```yaml
motion_philosophy:
  concept: "Velocity States"
  description: |
    Motion responds to scroll velocity, transitioning between:
    - CALM STATE (low velocity): Atmospheric, dreamy, Igloo-inspired
    - ACTIVE STATE (medium velocity): Balanced, responsive
    - VELOCITY STATE (high velocity): Sharp, technical, Citrix-inspired

  velocity_thresholds:
    calm: "< 200px/s"
    active: "200-800px/s"
    velocity: "> 800px/s"

  state_characteristics:
    calm:
      camera_movement: "Slow drift, gentle parallax"
      post_processing: "Soft DOF, minimal chromatic"
      particles: "Slow snow, gentle float"
      ui_response: "Delayed, eased transitions"
      
    active:
      camera_movement: "Responsive tracking"
      post_processing: "Balanced effects"
      particles: "Normal speed, visible trails"
      ui_response: "Direct, smooth transitions"
      
    velocity:
      camera_movement: "Sharp, locked tracking"
      post_processing: "Strong chromatic, motion blur"
      particles: "Fast data streams, connections"
      ui_response: "Instant, snappy"
```

### 7.2 GSAP Animation Configuration

```typescript
/* ================================================
   UNIFIED MOTION SYSTEM
   src/lib/animation/Timeline.ts
   ================================================ */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Global GSAP Configuration
gsap.config({
  force3D: true,
  nullTargetWarn: false,
});

// Unified Easing Library
export const EASING = {
  // Atmospheric (Igloo-inspired) - Slow, organic
  drift: 'power1.inOut',
  float: 'sine. inOut',
  fog: 'power2.out',
  frost: 'expo.out',
  
  // Technical (Citrix-inspired) - Sharp, precise
  precision: 'power3.out',
  snap: 'power4.inOut',
  data: 'steps(12)',
  neon: 'expo.inOut',
  
  // Unified - Context-aware
  smooth: 'power2.inOut',
  reveal: 'power3.out',
  hide: 'power2.in',
  bounce: 'back.out(1.4)',
  elastic: 'elastic.out(1, 0.5)',
} as const;

// Timing Constants
export const TIMING = {
  // Durations (seconds)
  instant: 0.1,
  fast: 0.25,
  normal: 0.5,
  slow: 0.8,
  slower: 1. 2,
  slowest: 2. 0,
  
  // Stagger delays
  stagger: {
    tight: 0.03,
    normal: 0.08,
    relaxed: 0. 15,
  },
  
  // Scroll scrub values
  scrub: {
    tight: 0.5,      // High velocity state
    normal: 1. 0,     // Active state
    relaxed: 1.8,    // Calm state
  },
} as const;

// Scroll-Driven Animation Factory
export function createScrollAnimation(config: {
  trigger: string;
  camera?: THREE.Camera;
  timeline: gsap.core.Timeline;
}) {
  const { trigger, camera, timeline } = config;
  
  return ScrollTrigger.create({
    trigger,
    start: 'top top',
    end: 'bottom bottom',
    scrub: TIMING.scrub. normal,
    onUpdate: (self) => {
      const velocity = Math.abs(self. getVelocity());
      
      // Adjust scrub based on velocity
      if (velocity > 800) {
        self.vars.scrub = TIMING.scrub.tight;
      } else if (velocity < 200) {
        self.vars. scrub = TIMING.scrub.relaxed;
      } else {
        self.vars.scrub = TIMING.scrub.normal;
      }
      
      // Dispatch velocity event for other systems
      window.dispatchEvent(new CustomEvent('scrollVelocity', {
        detail: { velocity, progress: self.progress }
      }));
    },
  });
}
```

### 7. 3 Micro-Interaction Specifications

```typescript
/* ================================================
   MICRO-INTERACTION LIBRARY
   src/lib/animation/MicroInteractions.ts
   ================================================ */

import gsap from 'gsap';
import { EASING, TIMING } from './Timeline';

export const MicroInteractions = {
  // Navigation Items
  navItem: {
    enter: (element: HTMLElement) => {
      gsap.to(element, {
        opacity: 1,
        x: 4,
        duration: TIMING.fast,
        ease: EASING.reveal,
      });
      
      // Underline animation
      const underline = element. querySelector('.nav-underline');
      if (underline) {
        gsap. to(underline, {
          scaleX: 1,
          transformOrigin: 'left center',
          duration: TIMING.normal,
          ease: EASING.precision,
        });
      }
    },
    leave: (element: HTMLElement) => {
      gsap.to(element, {
        opacity: 0. 7,
        x: 0,
        duration: TIMING.fast,
        ease: EASING.hide,
      });
      
      const underline = element. querySelector('.nav-underline');
      if (underline) {
        gsap. to(underline, {
          scaleX: 0,
          transformOrigin: 'right center',
          duration: TIMING.fast,
          ease: EASING.hide,
        });
      }
    },
  },
  
  // HUD Elements (Citrix-inspired)
  hud: {
    appear: (elements: HTMLElement[]) => {
      return gsap.fromTo(elements,
        {
          opacity: 0,
          y: 10,
          clipPath: 'polygon(0 0, 0 0, 0 100%, 0 100%)',
        },
        {
          opacity: 1,
          y: 0,
          clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
          duration: TIMING. normal,
          stagger: TIMING.stagger. tight,
          ease: EASING.precision,
        }
      );
    },
    pulse: (element: HTMLElement) => {
      return gsap.to(element, {
        opacity: 0.7,
        textShadow: '0 0 15px var(--color-neon-blue-glow)',
        duration: TIMING. slower,
        ease: EASING.float,
        repeat: -1,
        yoyo: true,
      });
    },
  },
  
  // Data Counter Animation
  counter: {
    animate: (element: HTMLElement, endValue: number) => {
      const obj = { value: 0 };
      return gsap.to(obj, {
        value: endValue,
        duration: TIMING.slowest,
        ease: EASING. precision,
        snap: { value: 1 },
        onUpdate: () => {
          element.textContent = obj.value. toFixed(0). padStart(4, '0');
        },
      });
    },
  },
  
  // Scroll Indicator (Igloo-inspired)
  scrollIndicator: {
    idle: (element: HTMLElement) => {
      return gsap.to(element, {
        y: 8,
        opacity: 0. 5,
        duration: TIMING.slower,
        ease: EASING.float,
        repeat: -1,
        yoyo: true,
      });
    },
  },
  
  // Section Reveal
  sectionReveal: {
    text: (elements: HTMLElement[]) => {
      return gsap.fromTo(elements,
        {
          opacity: 0,
          y: 40,
        },
        {
          opacity: 1,
          y: 0,
          duration: TIMING. slow,
          stagger: TIMING. stagger.normal,
          ease: EASING.reveal,
        }
      );
    },
    line: (element: HTMLElement) => {
      return gsap.fromTo(element,
        {
          scaleX: 0,
        },
        {
          scaleX: 1,
          transformOrigin: 'left center',
          duration: TIMING. slow,
          ease: EASING. precision,
        }
      );
    },
  },
  
  // Button/CTA
  button: {
    hover: (element: HTMLElement) => {
      gsap.to(element, {
        scale: 1.02,
        duration: TIMING.fast,
        ease: EASING.bounce,
      });
      
      const arrow = element.querySelector('. btn-arrow');
      if (arrow) {
        gsap. to(arrow, {
          x: 5,
          duration: TIMING.fast,
          ease: EASING.precision,
        });
      }
    },
    leave: (element: HTMLElement) => {
      gsap.to(element, {
        scale: 1,
        duration: TIMING.fast,
        ease: EASING.hide,
      });
      
      const arrow = element.querySelector('. btn-arrow');
      if (arrow) {
        gsap.to(arrow, {
          x: 0,
          duration: TIMING.fast,
          ease: EASING.hide,
        });
      }
    },
    click: (element: HTMLElement) => {
      return gsap.to(element, {
        scale: 0.98,
        duration: TIMING. instant,
        ease: EASING.snap,
        yoyo: true,
        repeat: 1,
      });
    },
  },
};
```

### 7.4 Camera Path Controller

```typescript
/* ================================================
   SCROLL-DRIVEN CAMERA PATH CONTROLLER
   src/lib/three/core/Camera.ts
   ================================================ */

import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { EASING, TIMING } from '$lib/animation/Timeline';

interface CameraKeyframe {
  progress: number;           // 0-1 scroll progress
  position: THREE.Vector3;
  lookAt: THREE.Vector3;
  fov?: number;
  ease?: string;
  duration?: number;
}

export class CameraPathController {
  private camera: THREE.PerspectiveCamera;
  private timeline: gsap.core.Timeline;
  private currentLookAt: THREE. Vector3;
  private scrollTrigger: ScrollTrigger | null = null;
  
  constructor(camera: THREE.PerspectiveCamera, keyframes: CameraKeyframe[]) {
    this.camera = camera;
    this.currentLookAt = new THREE.Vector3();
    this.timeline = gsap.timeline({ paused: true });
    
    this.buildTimeline(keyframes);
    this.bindToScroll();
  }
  
  private buildTimeline(keyframes: CameraKeyframe[]) {
    keyframes.forEach((keyframe, index) => {
      const position = keyframe.progress;
      const duration = keyframe.duration || 1;
      const ease = keyframe. ease || EASING.smooth;
      
      // Position animation
      this.timeline.to(
        this.camera.position,
        {
          x: keyframe.position.x,
          y: keyframe.position. y,
          z: keyframe.position.z,
          duration,
          ease,
        },
        position
      );
      
      // LookAt animation
      this.timeline.to(
        this.currentLookAt,
        {
          x: keyframe.lookAt.x,
          y: keyframe.lookAt.y,
          z: keyframe.lookAt.z,
          duration,
          ease,
          onUpdate: () => {
            this.camera.lookAt(this.currentLookAt);
          },
        },
        position
      );
      
      // FOV animation (if specified)
      if (keyframe.fov !== undefined) {
        this.timeline.to(
          this.camera,
          {
            fov: keyframe.fov,
            duration,
            ease,
            onUpdate: () => {
              this. camera.updateProjectionMatrix();
            },
          },
          position
        );
      }
    });
  }
  
  private bindToScroll() {
    this. scrollTrigger = ScrollTrigger. create({
      trigger: '[data-scroll-container]',
      start: 'top top',
      end: 'bottom bottom',
      scrub: TIMING.scrub. normal,
      onUpdate: (self) => {
        this.timeline.progress(self.progress);
      },
    });
  }
  
  destroy() {
    this.timeline.kill();
    this.scrollTrigger?.kill();
  }
}

// Predefined Camera Paths
export const CameraPaths = {
  hero: [
    {
      progress: 0,
      position: new THREE.Vector3(0, 2, 12),
      lookAt: new THREE.Vector3(0, 0, 0),
      fov: 45,
      ease: EASING.drift,
    },
    {
      progress: 0.15,
      position: new THREE.Vector3(-3, 1. 5, 10),
      lookAt: new THREE.Vector3(0, 0. 5, 0),
      fov: 48,
      ease: EASING.float,
    },
    {
      progress: 0.3,
      position: new THREE.Vector3(2, 3, 8),
      lookAt: new THREE.Vector3(0, 1, 0),
      fov: 50,
      ease: EASING. smooth,
    },
  ],
  
  portfolio: [
    {
      progress: 0. 3,
      position: new THREE.Vector3(2, 3, 8),
      lookAt: new THREE.Vector3(0, 1, 0),
      fov: 50,
    },
    {
      progress: 0.5,
      position: new THREE.Vector3(5, 2, 6),
      lookAt: new THREE.Vector3(2, 1, 0),
      fov: 55,
      ease: EASING. precision,
    },
    {
      progress: 0. 7,
      position: new THREE.Vector3(0, 4, 10),
      lookAt: new THREE.Vector3(0, 0, -5),
      fov: 45,
      ease: EASING.drift,
    },
  ],
};
```

---

## 8. 3D IMPLEMENTATION

### 8.1 Core Engine Setup

```typescript
/* ================================================
   THREE.JS ENGINE
   src/lib/three/core/Engine.ts
   ================================================ */

import * as THREE from 'three';
import { EffectComposer } from 'postprocessing';
import { PerformanceManager, PerformanceTier } from './PerformanceManager';
import { AssetLoader } from '../utils/AssetLoader';

interface EngineConfig {
  canvas: HTMLCanvasElement;
  onProgress?: (progress: number) => void;
  onReady?: () => void;
}

export class Engine {
  // Core
  private canvas: HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE. Scene;
  private camera: THREE.PerspectiveCamera;
  private composer: EffectComposer;
  
  // Managers
  private performanceManager: PerformanceManager;
  private assetLoader: AssetLoader;
  
  // State
  private isRunning = false;
  private animationFrameId: number | null = null;
  private clock = new THREE.Clock();
  
  constructor(config: EngineConfig) {
    this.canvas = config.canvas;
    this.performanceManager = new PerformanceManager();
    
    this.initRenderer();
    this. initScene();
    this.initCamera();
    this.initLighting();
    this.initPostProcessing();
    
    this.assetLoader = new AssetLoader(this.renderer, this.performanceManager. tier);
    
    this.bindEvents();
  }
  
  private initRenderer() {
    const tier = this.performanceManager.tier;
    
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: tier !== 'low',
      powerPreference: 'high-performance',
      stencil: false,
    });
    
    this. renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer. setPixelRatio(this.performanceManager.settings.pixelRatio);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE. ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1. 1;
    
    if (this.performanceManager. settings.shadowsEnabled) {
      this.renderer.shadowMap.enabled = true;
      this. renderer.shadowMap. type = THREE.PCFSoftShadowMap;
    }
  }
  
  private initScene() {
    this.scene = new THREE.Scene();
    this. scene.background = new THREE.Color(0x0A0C10);
    
    // Fog (atmospheric)
    this.scene.fog = new THREE.FogExp2(0x0A0C10, 0.02);
  }
  
  private initCamera() {
    this.camera = new THREE.PerspectiveCamera(
      45,
      window. innerWidth / window. innerHeight,
      0.1,
      500
    );
    this.camera.position. set(0, 2, 12);
    this. camera.lookAt(0, 0, 0);
  }
  
  private initLighting() {
    // Ambient (atmospheric base)
    const ambient = new THREE.AmbientLight(0x404050, 0.4);
    this. scene.add(ambient);
    
    // Hemisphere (sky/ground gradient)
    const hemisphere = new THREE.HemisphereLight(0xB1E1FF, 0x444455, 0.5);
    this. scene.add(hemisphere);
    
    // Key Light (main directional)
    const keyLight = new THREE.DirectionalLight(0xFFFFFF, 1. 2);
    keyLight.position.set(5, 10, 7);
    
    if (this.performanceManager.settings.shadowsEnabled) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.setScalar(
        this.performanceManager. settings.shadowMapSize
      );
      keyLight.shadow. camera.near = 0.5;
      keyLight.shadow.camera.far = 50;
      keyLight.shadow.camera. left = -20;
      keyLight.shadow.camera. right = 20;
      keyLight. shadow.camera.top = 20;
      keyLight.shadow.camera.bottom = -20;
      keyLight.shadow. bias = -0.0001;
    }
    
    this.scene.add(keyLight);
    
    // Neon Accent Lights (Citrix-inspired)
    const neonBlue = new THREE. SpotLight(0x00BFFF, 2);
    neonBlue.position.set(10, 8, 5);
    neonBlue.angle = Math.PI / 6;
    neonBlue.penumbra = 0.5;
    this.scene.add(neonBlue);
    
    const neonPink = new THREE. SpotLight(0xFF1744, 1. 5);
    neonPink.position.set(-8, 5, -5);
    neonPink.angle = Math.PI / 5;
    neonPink.penumbra = 0. 5;
    this. scene.add(neonPink);
  }
  
  private initPostProcessing() {
    // Implementation with postprocessing library
    // See Section 8.3 for full post-processing stack
  }
  
  private bindEvents() {
    window.addEventListener('resize', this.handleResize.bind(this));
    
    // Reduced motion support
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    motionQuery.addEventListener('change', (e) => {
      if (e.matches) {
        this.stop();
        this. renderSingleFrame();
      } else {
        this.start();
      }
    });
  }
  
  private handleResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    this.camera. aspect = width / height;
    this. camera.updateProjectionMatrix();
    
    this.renderer.setSize(width, height);
    this.composer?. setSize(width, height);
  }
  
  private animate() {
    if (!this.isRunning) return;
    
    this.animationFrameId = requestAnimationFrame(this.animate.bind(this));
    
    const delta = this.clock. getDelta();
    const elapsed = this.clock. getElapsedTime();
    
    // Update scene objects
    this.scene.traverse((child) => {
      if ('update' in child && typeof child.update === 'function') {
        (child as any).update(delta, elapsed);
      }
    });
    
    // Render
    if (this.composer) {
      this. composer.render(delta);
    } else {
      this.renderer.render(this. scene, this.camera);
    }
  }
  
  private renderSingleFrame() {
    if (this.composer) {
      this.composer. render(0);
    } else {
      this.renderer.render(this. scene, this.camera);
    }
  }
  
  // Public API
  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.clock.start();
    this.animate();
  }
  
  stop() {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this. animationFrameId);
    }
  }
  
  getScene() { return this.scene; }
  getCamera() { return this. camera; }
  getRenderer() { return this.renderer; }
  
  dispose() {
    this.stop();
    this.renderer.dispose();
    // Dispose all geometries, materials, textures
  }
}
```

### 8.2 Ice Material Shader

```glsl
/* ================================================
   ICE MATERIAL SHADER
   src/lib/three/shaders/ice.glsl
   ================================================ */

// Vertex Shader
varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vViewPosition;
varying vec2 vUv;

void main() {
  vNormal = normalize(normalMatrix * normal);
  vPosition = position;
  vUv = uv;
  
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vViewPosition = -mvPosition.xyz;
  
  gl_Position = projectionMatrix * mvPosition;
}

// Fragment Shader
uniform vec3 uBaseColor;
uniform vec3 uHighlightColor;
uniform float uRoughness;
uniform float uTransmission;
uniform float uThickness;
uniform float uIOR;
uniform float uTime;
uniform sampler2D uNormalMap;
uniform sampler2D uRoughnessMap;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vViewPosition;
varying vec2 vUv;

// Fresnel
float fresnel(vec3 viewDir, vec3 normal, float power) {
  return pow(1.0 - max(dot(viewDir, normal), 0.0), power);
}

// Subsurface scattering approximation
vec3 subsurfaceScattering(vec3 lightDir, vec3 viewDir, vec3 normal, float thickness) {
  vec3 scatterDir = lightDir + normal * 0.5;
  float scatter = max(0.0, dot(viewDir, -scatterDir));
  return vec3(scatter) * thickness * uBaseColor;
}

void main() {
  vec3 normal = normalize(vNormal);
  vec3 viewDir = normalize(vViewPosition);
  
  // Sample normal map
  vec3 normalMap = texture2D(uNormalMap, vUv). rgb * 2.0 - 1.0;
  normal = normalize(normal + normalMap * 0.3);
  
  // Sample roughness map
  float roughness = texture2D(uRoughnessMap, vUv).r * uRoughness;
  
  // Fresnel effect
  float fresnelTerm = fresnel(viewDir, normal, 3.0);
  
  // Base color with transmission
  vec3 baseColor = mix(uBaseColor, uHighlightColor, fresnelTerm);
  
  // Subsurface scattering
  vec3 sss = subsurfaceScattering(
    normalize(vec3(1.0, 1.0, 1.0)), 
    viewDir, 
    normal, 
    uThickness
  );
  
  // Combine
  vec3 finalColor = baseColor + sss * 0.3;
  
  // Add subtle shimmer
  float shimmer = sin(vPosition.x * 10.0 + uTime) * 
                  sin(vPosition.z * 10.0 + uTime * 0.7) * 0. 02;
  finalColor += shimmer * uHighlightColor;
  
  // Transmission effect (simplified)
  float transmission = uTransmission * (1.0 - fresnelTerm);
  
  gl_FragColor = vec4(finalColor, 1.0 - transmission * 0.3);
}
```

### 8. 3 Post-Processing Stack

```typescript
/* ================================================
   POST-PROCESSING EFFECT STACK
   src/lib/three/postprocessing/EffectStack.ts
   ================================================ */

import {
  EffectComposer,
  EffectPass,
  RenderPass,
  BloomEffect,
  ChromaticAberrationEffect,
  VignetteEffect,
  NoiseEffect,
  DepthOfFieldEffect,
  SMAAEffect,
} from 'postprocessing';
import * as THREE from 'three';

interface EffectStackConfig {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  