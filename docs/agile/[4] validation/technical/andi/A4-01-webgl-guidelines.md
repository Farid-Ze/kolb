# A4-01: WebGL Architecture Guidelines

## 📋 METADATA
- **Task ID**: A4-01
- **Persona**: Andi Pratama (Senior Developer)
- **Sprint**: 4 - Validation & Handoff
- **Status**: ✅ COMPLETED
- **Created**: 2025-12-11
- **Dependencies**: A1-01/02/03, A2-01/02/03, A3-01/02/03

---

## 🎯 OBJECTIVE

Consolidate WebGL architecture best practices from Corn Revolution analysis into definitive guidelines for Zenotika experiential web projects.

---

## 🏗️ WEBGL ARCHITECTURE GUIDELINES

### 1. Application Architecture

#### Recommended Structure
```
src/
├── core/
│   ├── Engine.ts           # Main rendering engine
│   ├── SceneManager.ts     # Scene lifecycle management
│   ├── AssetLoader.ts      # Centralized asset loading
│   └── EventBus.ts         # Application events
├── scenes/
│   ├── BaseScene.ts        # Abstract scene class
│   ├── IntroScene.ts       # Individual scenes
│   └── MainScene.ts
├── components/
│   ├── Camera.ts           # Camera controls
│   ├── Lighting.ts         # Lighting setup
│   └── PostProcessing.ts   # Effects pipeline
├── utils/
│   ├── DeviceDetection.ts  # Capability detection
│   ├── PerformanceMonitor.ts
│   └── MemoryManager.ts
└── shaders/
    ├── vertex/
    └── fragment/
```

#### Core Engine Pattern
```typescript
// ILLUSTRATIVE EXAMPLE - Core Engine Structure
class Engine {
  private renderer: THREE.WebGLRenderer;
  private sceneManager: SceneManager;
  private clock: THREE.Clock;
  private isRunning: boolean = false;
  
  constructor(container: HTMLElement) {
    this.renderer = this.createRenderer(container);
    this.sceneManager = new SceneManager();
    this.clock = new THREE.Clock();
  }
  
  private createRenderer(container: HTMLElement): THREE.WebGLRenderer {
    const renderer = new THREE.WebGLRenderer({
      antialias: window.devicePixelRatio === 1,
      powerPreference: 'high-performance',
      stencil: false,
      depth: true
    });
    
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    
    container.appendChild(renderer.domElement);
    return renderer;
  }
  
  public start(): void {
    this.isRunning = true;
    this.tick();
  }
  
  private tick(): void {
    if (!this.isRunning) return;
    
    const delta = this.clock.getDelta();
    this.sceneManager.update(delta);
    this.sceneManager.render(this.renderer);
    
    requestAnimationFrame(() => this.tick());
  }
  
  public dispose(): void {
    this.isRunning = false;
    this.sceneManager.dispose();
    this.renderer.dispose();
  }
}
```

### 2. Scene Management

#### Scene Lifecycle
```typescript
// ILLUSTRATIVE EXAMPLE - Scene Base Class
abstract class BaseScene {
  protected scene: THREE.Scene;
  protected camera: THREE.PerspectiveCamera;
  protected isLoaded: boolean = false;
  
  abstract load(): Promise<void>;
  abstract update(delta: number): void;
  abstract dispose(): void;
  
  public async initialize(): Promise<void> {
    this.scene = new THREE.Scene();
    this.camera = this.createCamera();
    await this.load();
    this.isLoaded = true;
  }
  
  protected createCamera(): THREE.PerspectiveCamera {
    const aspect = window.innerWidth / window.innerHeight;
    return new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
  }
  
  public render(renderer: THREE.WebGLRenderer): void {
    if (this.isLoaded) {
      renderer.render(this.scene, this.camera);
    }
  }
}
```

#### Scene Transitions
```typescript
// ILLUSTRATIVE EXAMPLE - Scene Transition
class SceneManager {
  private currentScene: BaseScene | null = null;
  private nextScene: BaseScene | null = null;
  private transitionProgress: number = 0;
  
  public async transitionTo(scene: BaseScene): Promise<void> {
    this.nextScene = scene;
    await this.nextScene.initialize();
    
    // Fade out current
    await this.fadeOut();
    
    // Dispose old scene
    if (this.currentScene) {
      this.currentScene.dispose();
    }
    
    // Switch scenes
    this.currentScene = this.nextScene;
    this.nextScene = null;
    
    // Fade in new
    await this.fadeIn();
  }
}
```

### 3. Asset Loading Strategy

#### Loader Architecture
```typescript
// ILLUSTRATIVE EXAMPLE - Asset Loader
class AssetLoader {
  private gltfLoader: GLTFLoader;
  private textureLoader: THREE.TextureLoader;
  private loadingManager: THREE.LoadingManager;
  private cache: Map<string, any> = new Map();
  
  constructor() {
    this.loadingManager = new THREE.LoadingManager();
    this.setupLoaders();
  }
  
  private setupLoaders(): void {
    // GLTF with Draco
    this.gltfLoader = new GLTFLoader(this.loadingManager);
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('/draco/');
    this.gltfLoader.setDRACOLoader(dracoLoader);
    
    // Texture loader
    this.textureLoader = new THREE.TextureLoader(this.loadingManager);
  }
  
  public async loadModel(url: string): Promise<THREE.Group> {
    if (this.cache.has(url)) {
      return this.cache.get(url).clone();
    }
    
    const gltf = await this.gltfLoader.loadAsync(url);
    this.cache.set(url, gltf.scene);
    return gltf.scene.clone();
  }
  
  public async loadTexture(url: string): Promise<THREE.Texture> {
    if (this.cache.has(url)) {
      return this.cache.get(url);
    }
    
    const texture = await this.textureLoader.loadAsync(url);
    texture.colorSpace = THREE.SRGBColorSpace;
    this.cache.set(url, texture);
    return texture;
  }
}
```

#### Loading Priorities
| Priority | Asset Type | Loading Strategy |
|----------|------------|------------------|
| Critical | Hero models, above-fold textures | Blocking, preload hints |
| High | First interaction assets | Eager, parallel |
| Medium | Below-fold content | Lazy, intersection observer |
| Low | Optional enhancements | On-demand, idle callback |

### 4. Rendering Pipeline

#### Recommended Pipeline
```typescript
// ILLUSTRATIVE EXAMPLE - Render Pipeline
class RenderPipeline {
  private composer: EffectComposer;
  private renderPass: RenderPass;
  private bloomPass: UnrealBloomPass;
  private fxaaPass: ShaderPass;
  
  constructor(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera) {
    this.composer = new EffectComposer(renderer);
    
    // Base render
    this.renderPass = new RenderPass(scene, camera);
    this.composer.addPass(this.renderPass);
    
    // Bloom (conditional)
    if (this.shouldUseBloom()) {
      this.bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        0.5, // strength
        0.4, // radius
        0.85 // threshold
      );
      this.composer.addPass(this.bloomPass);
    }
    
    // Anti-aliasing
    this.fxaaPass = new ShaderPass(FXAAShader);
    this.fxaaPass.material.uniforms['resolution'].value.set(
      1 / window.innerWidth,
      1 / window.innerHeight
    );
    this.composer.addPass(this.fxaaPass);
  }
  
  private shouldUseBloom(): boolean {
    return DeviceDetection.getTier() <= 2; // Only for high/mid devices
  }
  
  public render(): void {
    this.composer.render();
  }
}
```

### 5. Memory Management

#### Memory Budget Guidelines
| Device Tier | Memory Budget | Texture Budget | Model Budget |
|-------------|---------------|----------------|--------------|
| Tier 1 | 512 MB | 256 MB | 128 MB |
| Tier 2 | 256 MB | 128 MB | 64 MB |
| Tier 3 | 128 MB | 64 MB | 32 MB |
| Tier 4 | 64 MB | 32 MB | 16 MB |

#### Disposal Pattern
```typescript
// ILLUSTRATIVE EXAMPLE - Resource Disposal
function disposeObject(object: THREE.Object3D): void {
  object.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      // Dispose geometry
      if (child.geometry) {
        child.geometry.dispose();
      }
      
      // Dispose materials
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(disposeMaterial);
        } else {
          disposeMaterial(child.material);
        }
      }
    }
  });
}

function disposeMaterial(material: THREE.Material): void {
  // Dispose textures
  Object.values(material).forEach((value) => {
    if (value instanceof THREE.Texture) {
      value.dispose();
    }
  });
  material.dispose();
}
```

### 6. Error Handling

#### WebGL Error Recovery
```typescript
// ILLUSTRATIVE EXAMPLE - Context Loss Handling
class ContextLossHandler {
  constructor(renderer: THREE.WebGLRenderer) {
    const canvas = renderer.domElement;
    
    canvas.addEventListener('webglcontextlost', (event) => {
      event.preventDefault();
      this.handleContextLost();
    });
    
    canvas.addEventListener('webglcontextrestored', () => {
      this.handleContextRestored();
    });
  }
  
  private handleContextLost(): void {
    // Stop render loop
    // Show user message
    // Log to analytics
  }
  
  private handleContextRestored(): void {
    // Reinitialize resources
    // Resume render loop
  }
}
```

---

## ✅ ARCHITECTURE CHECKLIST

### Project Setup
- [ ] TypeScript strict mode enabled
- [ ] Three.js r160+ installed
- [ ] Draco decoder configured
- [ ] Build pipeline optimized

### Core Implementation
- [ ] Engine class implemented
- [ ] Scene manager with lifecycle
- [ ] Asset loader with caching
- [ ] Memory manager active

### Quality Assurance
- [ ] Context loss handling
- [ ] Error boundaries
- [ ] Performance monitoring
- [ ] Memory leak testing

---

## 📚 CROSS-REFERENCES

| Document | Content |
|----------|---------|
| A3-01 | WebGL optimization details |
| K4-02 | Technical standards |
| F4-01 | Progressive enhancement |

---

## 📊 DATA CLASSIFICATION

| Data Type | Classification | Source |
|-----------|----------------|--------|
| Architecture patterns | ✅ VERIFIED | Three.js best practices |
| Memory budgets | ✅ VERIFIED | Industry standards |
| Code examples | ℹ️ ILLUSTRATIVE | Demonstration only |

---

**Document Status**: ✅ COMPLETED  
**Last Updated**: 2025-12-11  
**Owner**: Andi Pratama (Senior Developer)
