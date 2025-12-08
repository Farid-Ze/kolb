---
name: zenotika-kolb-immersive
description: |
  Full-stack immersive 3D landing page development for KOLB Assessment Platform. 
  Combines igloo.inc atmospheric design (Awwwards SOTY 2024) with Citrix Red Bull F1 
  technical aesthetics. Covers WebGL/Three.js, GLSL shaders, Svelte 5, GSAP animations,
  and KOLB FastAPI backend integration. Use when building 3D web experiences, scroll 
  animations, custom shaders, psychometric visualizations, or integrating with KOLB API.
version: "1.0.0"
author: "Zenotika Development Team"
triggers:
  - "3D"
  - "WebGL"
  - "Three.js"
  - "shader"
  - "GLSL"
  - "fragment"
  - "vertex"
  - "scroll animation"
  - "GSAP"
  - "ScrollTrigger"
  - "Lenis"
  - "smooth scroll"
  - "Svelte"
  - "Vite"
  - "runes"
  - "$state"
  - "$derived"
  - "$effect"
  - "KOLB"
  - "assessment"
  - "learning style"
  - "psychometric"
  - "KLSI"
  - "igloo.inc"
  - "Citrix"
  - "immersive"
  - "particles"
  - "post-processing"
  - "landing page"
  - "interactive"
  - "WebGL canvas"
  - "frost effect"
  - "HUD"
  - "neon"
  - "chromatic aberration"
  - "bloom"
  - "depth of field"
---

# Zenotika KOLB Immersive Landing Page

## Quick Start

```bash
# Clone and install
git clone <repository-url>
cd zenotika-landing
pnpm install

# Development
pnpm dev

# Production build
pnpm build
pnpm preview

# Asset optimization (models + textures)
pnpm optimize
```

## Project Overview

Immersive 3D landing page for **KOLB Assessment Platform** — a psychometric assessment 
system implementing the Kolb Learning Style Inventory (KLSI) 4.0. 

### Design Paradigm Fusion

| Source | Aesthetic | Technical Elements |
|--------|-----------|-------------------|
| **igloo.inc** | Atmospheric, meditative | Ice shaders, fog, frost, slow drift |
| **Citrix Red Bull F1** | Technical, energetic | HUD, neon, data streams, velocity response |

The unified concept **"Cognitive Flow"** transitions between calm and intensity based 
on user scroll velocity. 

---

## Architecture

```
src/
├── lib/
│   ├── three/                    # WebGL Engine
│   │   ├── Engine.ts             # Core renderer orchestrator
│   │   ├── CameraController.ts   # Scroll-driven camera system
│   │   ├── SceneManager.ts       # Scene state management
│   │   ├── objects/              # 3D Objects
│   │   │   ├── ZenotikaStrands.ts # Hero particle strands
│   │   │   ├── KolbGrid.ts       # 3×3 learning styles grid
│   │   │   └── RadarChart3D.ts   # Results visualization
│   │   ├── materials/            # Custom Materials
│   │   │   └── GridMaterial.ts   # Neon wireframe
│   │   ├── shaders/              # GLSL Shaders
│   │   │   ├── strands.vert.glsl
│   │   │   ├── strands.frag.glsl
│   │   │   └── postprocess/
│   │   │       ├── frost.glsl
│   │   │       └── chromatic.glsl
│   │   └── postprocessing/       # Effect Pipeline
│   │       ├── EffectPipeline.ts
│   │       ├── FrostPass.ts
│   │       └── VelocityPass.ts
│   ├── animation/                # Animation System
│   │   ├── ScrollController.ts   # Lenis smooth scroll
│   │   ├── Timeline.ts           # GSAP master timeline
│   │   └── Transitions.ts        # Section transitions
│   ├── api/                      # KOLB API Client
│   │   ├── kolb.ts               # API methods
│   │   └── types.ts              # TypeScript types
│   └── stores/                   # Svelte 5 Runes State
│       ├── scroll.svelte.ts
│       ├── scene.svelte.ts
│       └── assessment.svelte.ts
├── components/
│   ├── canvas/
│   │   ├── WebGLCanvas.svelte    # Main 3D canvas
│   │   └── LoadingScreen.svelte
│   ├── sections/
│   │   ├── HeroSection.svelte
│   │   ├── AssessmentSection.svelte
│   │   ├── StylesSection.svelte
│   │   ├── ResultsSection.svelte
│   │   └── CTASection.svelte
│   └── ui/
│       ├── HUD.svelte            # Citrix-style data overlay
│       ├── Navigation.svelte
│       └── ScrollIndicator.svelte
└── styles/
    └── tokens/
        ├── _colors.scss
        ├── _typography.scss
        └── _spacing.scss
```

---

## Core Components

### 1. WebGL Engine

```typescript
import { Engine } from '$lib/three/Engine';

const engine = new Engine({
  canvas: canvasElement,
  antialias: true,
  powerPreference: 'high-performance',
  debug: import.meta.env.DEV,
});

// Add update callback
engine.addUpdateCallback((delta, elapsed) => {
  // Update logic here
});

// Start render loop
engine.start();

// Cleanup
engine.dispose();
```

**Performance Tiers** (auto-detected):
- `high`: Full effects, 3000 particles, 2x DPR
- `medium`: Reduced particles, 1.5x DPR
- `low`: Minimal effects, 800 particles, 1x DPR

### 2. Camera Controller

```typescript
import { CameraController, KOLB_CAMERA_KEYFRAMES } from '$lib/three/CameraController';

const cameraController = new CameraController({
  camera: engine.getCamera(),
  keyframes: KOLB_CAMERA_KEYFRAMES,
  smoothness: 0.08,
});

// Update in render loop
cameraController.update(delta);

// Get current state
const progress = cameraController.getScrollProgress();
const velocity = cameraController.getScrollVelocity();
```

**Keyframe Structure**:
```typescript
interface CameraKeyframe {
  progress: number;      // 0-1 scroll progress
  position: THREE.Vector3;
  lookAt: THREE.Vector3;
  fov?: number;
}
```

### 3. Logo Material (igloo.inc Style)

```typescript
import { ZenotikaStrands } from '$lib/three/objects/ZenotikaStrands';

const strands = new ZenotikaStrands();
scene.add(strands.points);

// Update in render loop
strands.update(elapsed, scrollProgress, scrollVelocity);
```

**Shader Features**:
- Multi-octave simplex noise displacement
- Fresnel rim lighting
- Subsurface scattering approximation
- Velocity-responsive neon pulse
- Scroll-based fade transitions

### 4. Particle System

```typescript
import { NeuronParticles } from '$lib/three/objects/NeuronParticles';

const particles = new NeuronParticles({
  count: 3000,
  bounds: new THREE.Box3(
    new THREE.Vector3(-15, -10, -15),
    new THREE.Vector3(15, 15, 15)
  ),
  snowRatio: 0.6, // 60% snow, 40% data
});

scene.add(particles.getMesh());

// Update in render loop
particles.update(delta, elapsed);
```

**Hybrid Behavior**:
- Low velocity → Snow particles dominate (igloo.inc meditative)
- High velocity → Data particles dominate (Citrix energetic)

### 5. Post-Processing Pipeline

```typescript
import { EffectPipeline } from '$lib/three/postprocessing/EffectPipeline';

const effects = new EffectPipeline({
  renderer: engine.getRenderer(),
  scene: engine.getScene(),
  camera: engine.getCamera(),
  performanceTier: engine.getPerformanceTier(),
});

// Render with effects
effects.render(delta);
```

**Effects Stack**:
1. Bloom (velocity-responsive intensity)
2. Chromatic Aberration (velocity-responsive offset)
3. Vignette (section transition darkening)
4. Depth of Field (high tier only)
5. Frost Pass (igloo.inc signature)
6. SMAA (medium/high tiers)

### 6. Kolb Grid Visualization

```typescript
import { KolbGrid } from '$lib/three/objects/KolbGrid';

const grid = new KolbGrid({
  cellSize: 2,
  gap: 0.3,
  depth: 0.5,
  activeStyle: 'BALANCING', // Optional initial selection
});

scene.add(grid.getGroup());

// Handle interaction
grid.handleMouseMove(camera, normalizedX, normalizedY);
const clickedStyle = grid.handleClick(camera, normalizedX, normalizedY);

// Set active style programmatically
grid.setActiveStyle('THINKING');

// Update in render loop
grid.update(delta, elapsed);
```

**9 Learning Styles**:
```
┌─────────────┬─────────────┬─────────────┐
│ INITIATING  │ EXPERIENCING│ CREATING    │  ← CE dominant
├─────────────┼─────────────┼─────────────┤
│ ACTING      │ BALANCING   │ REFLECTING  │  ← Middle
├─────────────┼─────────────┼─────────────┤
│ DECIDING    │ THINKING    │ ANALYZING   │  ← AC dominant
└─────────────┴─────────────┴─────────────┘
  AE dominant   Middle        RO dominant
```

---

## Animation System

### Scroll Controller (Lenis)

```typescript
import { initScrollController, getScrollController } from '$lib/animation/ScrollController';

// Initialize
const scroll = initScrollController({
  lerp: 0.1,
  duration: 1.2,
  smoothWheel: true,
});

// Programmatic scroll
scroll.scrollTo('#section-id', { duration: 1.5 });
scroll.scrollTo(1000, { offset: -100 });

// Get state
const velocity = scroll.getVelocity();
const progress = scroll.getProgress();
```

### Scroll Velocity Event

```typescript
// Listen globally
window.addEventListener('scrollVelocity', ((e: CustomEvent) => {
  const { progress, velocity, direction } = e.detail;
  
  // Velocity states
  if (velocity < 200) {
    // CALM: igloo.inc aesthetic
  } else if (velocity < 500) {
    // ACTIVE: transitional
  } else {
    // VELOCITY: Citrix aesthetic
  }
}) as EventListener);
```

### GSAP Timeline

```typescript
import { masterTimeline } from '$lib/animation/Timeline';

// Register section animation
masterTimeline.registerSection({
  sectionId: 'hero',
  trigger: '#hero-section',
  start: 'top top',
  end: 'bottom top',
  scrub: 1,
  animations: [
    { target: '.hero-title', opacity: 0, y: -50 },
    { target: '.hero-subtitle', opacity: 0, y: -30 },
  ],
  onEnter: () => console.log('Entered hero'),
});

// Create text reveal
const tl = masterTimeline.createTextReveal(element, {
  duration: 1,
  stagger: 0.02,
});

// Create parallax
masterTimeline.createParallax(element, { speed: 0.5 });

// Create grid reveal (for Kolb 3x3)
masterTimeline.createGridReveal(gridItems, {
  from: 'center',
  stagger: 0.1,
});
```

---

## KOLB API Integration

### API Client

```typescript
import { kolbAPI, APIError } from '$lib/api/kolb';

// Set authentication token
kolbAPI.setToken(jwtToken);

// Create session
try {
  const session = await kolbAPI.createSession({
    instrument_code: 'KLSI',
    instrument_version: '4.0',
  });
} catch (err) {
  if (err instanceof APIError) {
    console.error(`API Error ${err.status}: ${err.message}`);
  }
}

// Get delivery package (assessment items)
const delivery = await kolbAPI.getDeliveryPackage(sessionId, 'id'); // locale

// Submit response
await kolbAPI.submitResponse(sessionId, {
  item_id: 'item-uuid',
  rankings: [
    { option_id: 'opt-1', rank: 1 },
    { option_id: 'opt-2', rank: 2 },
    { option_id: 'opt-3', rank: 3 },
    { option_id: 'opt-4', rank: 4 },
  ],
  response_time_ms: 5230,
});

// Finalize and get results
const result = await kolbAPI.finalizeSession(sessionId);

// Get scores
const scores = await kolbAPI.getScores(sessionId);

// Get full report
const report = await kolbAPI.getReport(sessionId);
```

### Assessment Store (Svelte 5 Runes)

```typescript
import { assessmentStore } from '$lib/stores/assessment.svelte';

// Start new assessment
await assessmentStore.startSession('KLSI');

// Access state (reactive)
const isLoading = assessmentStore.isLoading;
const currentItem = assessmentStore.currentItem;
const progress = assessmentStore.progress;
const canFinalize = assessmentStore.canFinalize;

// Submit response
await assessmentStore.submitResponse({
  item_id: currentItem.id,
  rankings: [... ],
  response_time_ms: elapsed,
});

// Navigation
assessmentStore.goNext();
assessmentStore.goBack();
assessmentStore.goToItem(5);

// Finalize
const result = await assessmentStore.finalize();

// Access results
const scores = assessmentStore.scores;

// Reset
assessmentStore.reset();
```

### Score Response Structure

```typescript
interface ScoreResponse {
  session_id: string;
  scale_scores: {
    CE: number;  // 12-48
    RO: number;  // 12-48
    AC: number;  // 12-48
    AE: number;  // 12-48
  };
  combination_scores: {
    ACCE: number;      // -36 to +36
    AERO: number;      // -36 to +36
    balance_acce: number;
    balance_aero: number;
  };
  learning_style: {
    primary_style: string;  // e.g., "Balancing"
    style_code: string;     // e.g., "B"
    intensity: {
      level: string;        // "low" | "moderate" | "high"
      magnitude: number;
    };
  };
  lfi: {
    score: number;          // 0-1
    w_coefficient: number;
    interpretation: string;
  };
}
```

---

## Design System

### Colors

```scss
// Base (Citrix dark tech)
--color-bg-void: #030508;
--color-bg-primary: #0A0E14;
--color-bg-secondary: #0F1419;

// Neural (igloo.inc ice)
--color-neural-deep: #1A2332;
--color-ice-surface: #A8CADF;
--color-ice-highlight: #D4E8F5;

// Neon (Citrix accents)
--color-neon-cyan: #00D4FF;
--color-neon-magenta: #FF0080;
--color-neon-gold: #FFB800;

// Kolb Learning Modes
--color-mode-ce: #FF6B6B;  // Concrete Experience
--color-mode-ro: #4ECDC4;  // Reflective Observation
--color-mode-ac: #45B7D1;  // Abstract Conceptualization
--color-mode-ae: #96E6A1;  // Active Experimentation
```

### Typography

```scss
// Font families
--font-mono: 'IBM Plex Mono', monospace;  // Data, labels (igloo.inc)
--font-sans: 'Inter', sans-serif;          // Headlines, body

// Sizes (fluid)
--text-6xl: clamp(4rem, 3rem + 3vw, 6rem);     // Display
--text-4xl: clamp(2.25rem, 1.8rem + 1.5vw, 3rem); // Headline
--text-base: clamp(0.875rem, 0.8rem + 0.25vw, 1rem); // Body
--text-xs: clamp(0.625rem, 0.5rem + 0.25vw, 0.75rem); // HUD data
```

### Typography Classes

```scss
.typo-display    // Large headlines
.typo-headline   // Section titles
.typo-body       // Main content
.typo-data       // Monospace numbers (cyan, glowing)
.typo-data-sm    // Small data labels
.typo-hud        // HUD readouts (uppercase, tracked)
.typo-label      // UI labels
```

---

## Svelte 5 Patterns

### Runes Syntax

```svelte
<script lang="ts">
  // State
  let count = $state(0);
  let items = $state<string[]>([]);
  
  // Derived
  const doubled = $derived(count * 2);
  const hasItems = $derived(items.length > 0);
  
  // Effect
  $effect(() => {
    console.log('Count changed:', count);
    // Cleanup returned function runs on destroy
    return () => console.log('Cleanup');
  });
  
  // Props with defaults
  let { title = 'Default', onAction }: {
    title?: string;
    onAction?: () => void;
  } = $props();
</script>
```

### Canvas Component Pattern

```svelte
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  
  let canvas: HTMLCanvasElement | null = $state(null);
  let isReady = $state(false);
  
  onMount(() => {
    if (!canvas) return;
    // Initialize WebGL
    isReady = true;
  });
  
  onDestroy(() => {
    // Cleanup WebGL resources
  });
</script>

<canvas bind:this={canvas}></canvas>
```

---

## Performance Optimization

### Model Optimization

```bash
# Run optimization script
pnpm optimize:models

# Manual with gltf-transform
npx gltf-transform optimize input.glb output.glb --compress draco
```

### Texture Optimization

```bash
# Convert to WebP
pnpm optimize:textures

# KTX2 for GPU compression (advanced)
npx ktx create --format UASTC input.png output.ktx2
```

### Code Splitting

```typescript
// vite.config.ts
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'three': ['three'],
        'gsap': ['gsap'],
        'postprocessing': ['postprocessing'],
      },
    },
  },
}
```

### Lazy Loading

```svelte
{#await import('$lib/three/objects/KolbGrid')}
  <LoadingPlaceholder />
{:then { KolbGrid }}
  <!-- Use KolbGrid -->
{/await}
```

---

## Environment Variables

```bash
# .env
VITE_KOLB_API_URL=http://localhost:8000/api/v1
VITE_ENABLE_DEBUG=false
VITE_ANALYTICS_ID=
```

```typescript
// Usage
const apiUrl = import.meta.env.VITE_KOLB_API_URL;
const isDebug = import.meta.env.DEV;
```

---

## Testing

### Unit Tests (Vitest)

```typescript
import { describe, it, expect } from 'vitest';
import { ZenotikaStrands } from '$lib/three/objects/ZenotikaStrands';

describe('ZenotikaStrands', () => {
  it('should initialize points', () => {
    const strands = new ZenotikaStrands();
    expect(strands.points).toBeDefined();
  });
});
```

### E2E Tests (Playwright)

```typescript
import { test, expect } from '@playwright/test';

test('landing page loads WebGL canvas', async ({ page }) => {
  await page.goto('/');
  
  const canvas = page.locator('canvas.webgl-canvas');
  await expect(canvas).toBeVisible();
  
  // Wait for loading to complete
  await expect(page.locator('.loading-overlay')).toBeHidden({ timeout: 10000 });
});

test('scroll triggers velocity event', async ({ page }) => {
  await page.goto('/');
  
  // Scroll and check HUD updates
  await page.mouse.wheel(0, 500);
  await page.waitForTimeout(500);
  
  const velocityDisplay = page.locator('.velocity-state');
  await expect(velocityDisplay).toContainText(/CALM|ACTIVE|VELOCITY/);
});
```

---

## Troubleshooting

### WebGL Context Lost

```typescript
canvas.addEventListener('webglcontextlost', (e) => {
  e.preventDefault();
  console.warn('WebGL context lost');
});

canvas.addEventListener('webglcontextrestored', () => {
  console.log('WebGL context restored');
  // Reinitialize engine
});
```

### Memory Leaks

```typescript
// Always dispose Three.js objects
function dispose() {
  geometry.dispose();
  material.dispose();
  texture.dispose();
  renderTarget.dispose();
  
  // Remove from scene
  scene.remove(mesh);
  
  // Clear references
  // @ts-expect-error allow GC
  mesh = null;
}
```

### Performance Issues

1. Check `engine.getPerformanceTier()` result
2. Reduce particle count for low-end devices
3. Disable post-processing effects progressively
4. Use LOD models based on camera distance
5. Profile with Chrome DevTools Performance tab

---

## Related Files

- Design System: @src/styles/tokens/
- Shader Sources: @src/lib/three/shaders/
- API Types: @src/lib/api/types.ts
- Camera Keyframes: @src/lib/three/CameraController.ts
- Learning Styles Data: @src/lib/api/types.ts (LEARNING_STYLES)

## External References

- [Three.js Documentation](https://threejs.org/docs/)
- [GSAP Documentation](https://greensock.com/docs/)
- [Svelte 5 Runes](https://svelte.dev/docs/svelte/$state)
- [postprocessing Library](https://github.com/pmndrs/postprocessing)
- [Lenis Smooth Scroll](https://github.com/studio-freight/lenis)
- [KOLB API Documentation](/docs/api/)

---

## Limitations

- WebGL 2.0 required (fallback to WebGL 1.0 not implemented)
- Safari iOS may have reduced particle counts due to GPU limitations
- Audio requires user interaction to start (browser autoplay policy)
- Maximum texture size limited by device GPU
- Extended sessions may accumulate memory — refresh recommended after 30+ minutes

## Error Codes

| Code | Meaning | Solution |
|------|---------|----------|
| `WEBGL_NOT_SUPPORTED` | Browser doesn't support WebGL | Upgrade browser |
| `CONTEXT_LOST` | GPU context lost | Page refresh |
| `ASSET_LOAD_FAILED` | Model/texture failed to load | Check network, retry |
| `API_401` | Authentication failed | Re-login |
| `API_404` | Session not found | Start new session |
| `API_422` | Validation error | Check request payload |
```

---

## 📁 Additional Skill Files

Sesuai dengan best practices Anthropic, file pendukung berada di `.claude/skills/`:

- [.claude/skills/webgl-shaders.md](.claude/skills/webgl-shaders.md) — Shader development
- [.claude/skills/kolb-api.md](.claude/skills/kolb-api.md) — KOLB API integration
- [.claude/skills/svelte-patterns.md](.claude/skills/svelte-patterns.md) — Svelte 5 patterns
