# A4-02: Code Quality Standards

## 📋 METADATA
- **Task ID**: A4-02
- **Persona**: Andi Pratama (Senior Developer)
- **Sprint**: 4 - Validation & Handoff
- **Status**: ✅ COMPLETED
- **Created**: 2025-12-11
- **Dependencies**: A3-02, K4-02

---

## 🎯 OBJECTIVE

Define comprehensive code quality standards for Zenotika WebGL projects ensuring maintainability, performance, and team collaboration.

---

## 📐 CODE QUALITY STANDARDS

### 1. TypeScript Configuration

#### tsconfig.json (Required)
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "moduleResolution": "bundler",
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "exactOptionalPropertyTypes": true,
    "noUncheckedIndexedAccess": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

### 2. ESLint Configuration

#### .eslintrc.js (Required Rules)
```javascript
module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking'
  ],
  rules: {
    // Errors (must fix)
    'no-console': 'error',
    'no-debugger': 'error',
    'no-var': 'error',
    'prefer-const': 'error',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/explicit-function-return-type': 'error',
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-floating-promises': 'error',
    
    // Warnings (should fix)
    'complexity': ['warn', { max: 10 }],
    'max-depth': ['warn', { max: 4 }],
    'max-lines-per-function': ['warn', { max: 50 }],
    '@typescript-eslint/naming-convention': ['warn', {
      selector: 'interface',
      format: ['PascalCase'],
      prefix: ['I']
    }]
  }
};
```

### 3. Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Classes | PascalCase | `SceneManager` |
| Interfaces | IPascalCase | `ISceneConfig` |
| Functions | camelCase | `loadAssets()` |
| Variables | camelCase | `currentScene` |
| Constants | SCREAMING_SNAKE | `MAX_TEXTURE_SIZE` |
| Private members | _camelCase | `_isInitialized` |
| Type aliases | TPascalCase | `TDeviceTier` |
| Enums | PascalCase | `DeviceTier.HIGH` |
| Files | kebab-case | `scene-manager.ts` |

### 4. Code Documentation

#### JSDoc Requirements
```typescript
/**
 * Manages WebGL scene lifecycle and transitions.
 * 
 * @remarks
 * This class handles scene loading, updates, and disposal.
 * Memory management is handled automatically.
 * 
 * @example
 * ```typescript
 * const manager = new SceneManager();
 * await manager.loadScene(new IntroScene());
 * manager.start();
 * ```
 */
class SceneManager {
  /**
   * Current active scene.
   * @internal
   */
  private _currentScene: IScene | null = null;
  
  /**
   * Loads and transitions to a new scene.
   * 
   * @param scene - The scene to load
   * @param transition - Optional transition configuration
   * @returns Promise that resolves when transition completes
   * @throws {SceneLoadError} If scene fails to load
   */
  public async loadScene(
    scene: IScene,
    transition?: ITransitionConfig
  ): Promise<void> {
    // Implementation
  }
}
```

### 5. Code Review Checklist

#### Required Checks (Must Pass)
- [ ] TypeScript strict mode compiles without errors
- [ ] ESLint passes with no errors
- [ ] All functions have explicit return types
- [ ] No `any` types without justification comment
- [ ] No console.log statements (use proper logging)
- [ ] Memory disposal implemented for all resources
- [ ] Error handling for async operations
- [ ] Unit tests for business logic

#### Recommended Checks (Should Pass)
- [ ] Function complexity < 10
- [ ] Function length < 50 lines
- [ ] Max nesting depth < 4
- [ ] JSDoc for public APIs
- [ ] No magic numbers (use constants)
- [ ] Meaningful variable names
- [ ] Single responsibility principle

### 6. Git Workflow

#### Branch Naming
```
feature/[ticket]-[description]    # feature/ZEN-123-scene-manager
bugfix/[ticket]-[description]     # bugfix/ZEN-456-memory-leak
hotfix/[ticket]-[description]     # hotfix/ZEN-789-context-loss
refactor/[description]            # refactor/asset-loader
```

#### Commit Message Format
```
type(scope): subject

body (optional)

footer (optional)
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`

Example:
```
feat(scenes): add transition effects between scenes

- Implemented fade transition
- Added slide transition
- Configurable duration and easing

Closes ZEN-123
```

#### Pull Request Template
```markdown
## Description
[Brief description of changes]

## Type of Change
- [ ] Feature
- [ ] Bug fix
- [ ] Performance improvement
- [ ] Refactor
- [ ] Documentation

## Testing
- [ ] Unit tests added/updated
- [ ] Manual testing completed
- [ ] Performance impact assessed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No new warnings
```

### 7. Testing Standards

#### Test Structure
```typescript
describe('SceneManager', () => {
  describe('loadScene', () => {
    it('should load scene successfully', async () => {
      // Arrange
      const manager = new SceneManager();
      const scene = new MockScene();
      
      // Act
      await manager.loadScene(scene);
      
      // Assert
      expect(manager.currentScene).toBe(scene);
      expect(scene.isLoaded).toBe(true);
    });
    
    it('should dispose previous scene', async () => {
      // Arrange
      const manager = new SceneManager();
      const oldScene = new MockScene();
      const newScene = new MockScene();
      await manager.loadScene(oldScene);
      
      // Act
      await manager.loadScene(newScene);
      
      // Assert
      expect(oldScene.isDisposed).toBe(true);
    });
  });
});
```

#### Coverage Requirements
| Category | Minimum | Target |
|----------|---------|--------|
| Business Logic | 80% | 90% |
| Utilities | 90% | 95% |
| Components | 70% | 80% |
| Overall | 75% | 85% |

---

## ✅ QUALITY GATES

### CI/CD Pipeline Checks
| Check | Blocking | Threshold |
|-------|----------|-----------|
| TypeScript compile | ✅ Yes | 0 errors |
| ESLint | ✅ Yes | 0 errors |
| Unit tests | ✅ Yes | 100% pass |
| Test coverage | ⚠️ Warning | 75% |
| Bundle size | ⚠️ Warning | <500KB |
| Lighthouse score | ⚠️ Warning | >80 |

### Pre-Merge Requirements
- [ ] 2 approving reviews
- [ ] All CI checks pass
- [ ] No unresolved comments
- [ ] Branch up to date with main

---

## 📚 CROSS-REFERENCES

| Document | Content |
|----------|---------|
| K4-02 | Technical standards |
| A4-01 | WebGL architecture |
| A4-03 | Technology stack |

---

## 📊 DATA CLASSIFICATION

| Data Type | Classification | Source |
|-----------|----------------|--------|
| TypeScript config | ✅ VERIFIED | Official docs |
| ESLint rules | ✅ VERIFIED | Best practices |
| Coverage targets | ✅ VERIFIED | Industry standards |

---

**Document Status**: ✅ COMPLETED  
**Last Updated**: 2025-12-11  
**Owner**: Andi Pratama (Senior Developer)
