# F4-03: Fallback Implementation Guide

## 📋 METADATA
- **Task ID**: F4-03
- **Persona**: Fajar Ramadhan (Frontend Specialist)
- **Sprint**: 4 - Validation & Handoff
- **Status**: ✅ COMPLETED
- **Created**: 2025-12-11
- **Dependencies**: F3-02, F4-01, AM4-03

---

## 🎯 OBJECTIVE

Provide comprehensive guidance for implementing fallback experiences when WebGL is unavailable or device capabilities are insufficient.

---

## 🔄 FALLBACK IMPLEMENTATION GUIDE

### 1. Detection Logic

#### When to Show Fallback
```typescript
// ILLUSTRATIVE EXAMPLE - Fallback Decision Logic
function shouldShowFallback(): boolean {
  // Check WebGL support
  if (!isWebGLSupported()) return true;
  
  // Check device tier
  const tier = detectDeviceTier();
  if (tier === 4) return true;
  
  // Check user preference
  if (localStorage.getItem('preferFallback') === 'true') return true;
  
  // Check connection (optional)
  if (isSlowConnection() && !hasViewedBefore()) return true;
  
  return false;
}

function isWebGLSupported(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('webgl2'))
    );
  } catch (e) {
    return false;
  }
}
```

### 2. Fallback Architecture

#### HTML Structure
```html
<!-- Main container with both experiences -->
<div id="experience-container">
  <!-- WebGL Experience (default) -->
  <div id="webgl-experience" class="experience" aria-hidden="false">
    <canvas id="webgl-canvas"></canvas>
    <div id="ui-overlay">
      <!-- Interactive UI elements -->
    </div>
  </div>
  
  <!-- Fallback Experience (hidden by default) -->
  <div id="fallback-experience" class="experience hidden" aria-hidden="true">
    <div class="fallback-hero">
      <picture>
        <source srcset="/fallback/hero.avif" type="image/avif">
        <source srcset="/fallback/hero.webp" type="image/webp">
        <img src="/fallback/hero.jpg" alt="[Descriptive alt text]" loading="eager">
      </picture>
    </div>
    <div class="fallback-content">
      <!-- All essential content -->
    </div>
  </div>
</div>
```

#### CSS Structure
```css
/* Base styles */
.experience {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.experience.hidden {
  display: none;
}

/* Fallback-specific styles */
.fallback-experience {
  overflow-y: auto;
  background: var(--bg-color);
}

.fallback-hero {
  width: 100%;
  height: 100vh;
  position: relative;
}

.fallback-hero img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .fallback-experience * {
    animation: none !important;
    transition: none !important;
  }
}
```

### 3. Fallback Content Requirements

#### Essential Content Checklist
- [ ] **Hero imagery** - High-quality representative images
- [ ] **Headline** - Primary message visible
- [ ] **Value proposition** - Key benefits communicated
- [ ] **Call to action** - Contact/conversion path available
- [ ] **Navigation** - All sections accessible
- [ ] **Contact information** - Ways to reach out

#### Image Optimization for Fallback
```
FALLBACK IMAGE SPECIFICATIONS
├── hero.avif (50-100 KB, 1920x1080)
├── hero.webp (75-150 KB, 1920x1080)
├── hero.jpg (100-200 KB, 1920x1080)
├── hero-mobile.avif (30-50 KB, 750x1334)
├── hero-mobile.webp (40-75 KB, 750x1334)
└── hero-mobile.jpg (50-100 KB, 750x1334)
```

### 4. Transition to Fallback

#### Graceful Degradation
```typescript
// ILLUSTRATIVE EXAMPLE - Graceful Transition
class ExperienceManager {
  private webglContainer: HTMLElement;
  private fallbackContainer: HTMLElement;
  
  async initialize(): Promise<void> {
    this.webglContainer = document.getElementById('webgl-experience')!;
    this.fallbackContainer = document.getElementById('fallback-experience')!;
    
    if (shouldShowFallback()) {
      this.showFallback('initial');
      return;
    }
    
    try {
      await this.initializeWebGL();
    } catch (error) {
      console.error('WebGL initialization failed:', error);
      this.showFallback('error');
    }
  }
  
  private async initializeWebGL(): Promise<void> {
    // Initialize WebGL with timeout
    const timeout = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timeout')), 10000);
    });
    
    const init = this.setupWebGLScene();
    
    await Promise.race([init, timeout]);
  }
  
  showFallback(reason: 'initial' | 'error' | 'user'): void {
    // Log reason for analytics
    this.logFallbackReason(reason);
    
    // Hide WebGL
    this.webglContainer.classList.add('hidden');
    this.webglContainer.setAttribute('aria-hidden', 'true');
    
    // Show fallback
    this.fallbackContainer.classList.remove('hidden');
    this.fallbackContainer.setAttribute('aria-hidden', 'false');
    
    // Clean up WebGL resources
    this.disposeWebGL();
  }
  
  private logFallbackReason(reason: string): void {
    gtag('event', 'fallback_shown', {
      event_category: 'Experience',
      event_label: reason,
      non_interaction: true
    });
  }
}
```

### 5. User Choice Option

#### Toggle UI
```html
<!-- Experience toggle (for capable devices) -->
<div class="experience-toggle" role="switch" aria-checked="true" aria-label="3D experience toggle">
  <button id="toggle-3d" class="active">3D Experience</button>
  <button id="toggle-simple">Simple View</button>
</div>
```

```typescript
// ILLUSTRATIVE EXAMPLE - User Choice Handler
function setupExperienceToggle(): void {
  const toggle3D = document.getElementById('toggle-3d');
  const toggleSimple = document.getElementById('toggle-simple');
  
  toggle3D?.addEventListener('click', () => {
    localStorage.setItem('preferFallback', 'false');
    experienceManager.showWebGL();
  });
  
  toggleSimple?.addEventListener('click', () => {
    localStorage.setItem('preferFallback', 'true');
    experienceManager.showFallback('user');
  });
}
```

### 6. Error Recovery

#### Context Loss Handling
```typescript
// ILLUSTRATIVE EXAMPLE - Context Loss Recovery
class WebGLContextHandler {
  private renderer: THREE.WebGLRenderer;
  private contextLostCount: number = 0;
  private maxRetries: number = 2;
  
  setupContextHandling(): void {
    const canvas = this.renderer.domElement;
    
    canvas.addEventListener('webglcontextlost', (event) => {
      event.preventDefault();
      this.handleContextLost();
    });
    
    canvas.addEventListener('webglcontextrestored', () => {
      this.handleContextRestored();
    });
  }
  
  private handleContextLost(): void {
    this.contextLostCount++;
    
    if (this.contextLostCount > this.maxRetries) {
      // Too many failures, show fallback
      experienceManager.showFallback('error');
      return;
    }
    
    // Show temporary message
    this.showRecoveryMessage();
  }
  
  private handleContextRestored(): void {
    // Reinitialize scene
    this.reinitializeScene();
    this.hideRecoveryMessage();
  }
}
```

### 7. Fallback Analytics

#### Events to Track
```typescript
// ILLUSTRATIVE EXAMPLE - Fallback Analytics
const FALLBACK_EVENTS = {
  shown: (reason: string) => ({
    event: 'fallback_shown',
    category: 'Experience',
    label: reason
  }),
  
  interaction: (element: string) => ({
    event: 'fallback_interaction',
    category: 'Experience',
    label: element
  }),
  
  conversion: () => ({
    event: 'fallback_conversion',
    category: 'Experience',
    label: 'form_submit'
  }),
  
  switchTo3D: () => ({
    event: 'switch_to_webgl',
    category: 'Experience',
    label: 'user_choice'
  })
};
```

---

## ✅ FALLBACK IMPLEMENTATION CHECKLIST

### Content Preparation
- [ ] Hero images optimized (AVIF, WebP, JPG)
- [ ] Mobile-specific images created
- [ ] All text content accessible
- [ ] CTAs functional
- [ ] Forms working

### Technical Implementation
- [ ] Detection logic implemented
- [ ] Graceful transition working
- [ ] Context loss handled
- [ ] User toggle available
- [ ] Analytics tracking active

### Quality Assurance
- [ ] Fallback loads under 2s
- [ ] All content accessible
- [ ] WCAG 2.1 AA compliant
- [ ] Cross-browser tested
- [ ] Mobile responsive

---

## 📚 CROSS-REFERENCES

| Document | Content |
|----------|---------|
| F4-01 | Progressive enhancement playbook |
| F4-02 | Device compatibility matrix |
| AM4-03 | Inclusive design standards |

---

## 📊 DATA CLASSIFICATION

| Data Type | Classification | Source |
|-----------|----------------|--------|
| Detection methods | ✅ VERIFIED | MDN documentation |
| Image formats | ✅ VERIFIED | Can I Use |
| Analytics events | ✅ VERIFIED | GA4 documentation |

---

**Document Status**: ✅ COMPLETED  
**Last Updated**: 2025-12-11  
**Owner**: Fajar Ramadhan (Frontend Specialist)
