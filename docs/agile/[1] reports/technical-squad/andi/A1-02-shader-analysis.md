# A1-02: Shader Analysis - GLSL Custom Shaders

**Persona:** Andi Pratama (Teknik Informatika - WebGL Implementation Expert)  
**Date:** 2025-12-10  
**Focus:** Custom GLSL shaders for photorealistic rendering

---

## Executive Summary

Corn Revolution uses custom GLSL (OpenGL Shading Language) shaders for photorealistic 3D rendering. Based on Three.js patterns and visual quality analysis, the site implements:
- Custom vertex shaders for geometry manipulation
- Advanced fragment shaders for PBR materials
- Post-processing shaders for cinematic effects

> [!IMPORTANT]
> **Data Classification for This Report**
> 
> | Data Type | Status | Source |
> |-----------|--------|--------|
> | THREE.REVISION: 102 | ✅ **VERIFIED** | Live JS test 2025-12-10 |
> | WebGL 2.0 support | ✅ **VERIFIED** | Live JS test |
> | Max Texture Size: 16384 | ✅ **VERIFIED** | gl.MAX_TEXTURE_SIZE |
> | **WebGL Extensions: 35** | ✅ **VERIFIED** | getSupportedExtensions() |
> | **Float textures supported** | ✅ **VERIFIED** | OES_texture_float extension |
> | **Anisotropic filtering** | ✅ **VERIFIED** | EXT_texture_filter_anisotropic |
> | **S3TC/BPTC compression** | ✅ **VERIFIED** | Compression extensions |
> | Shader directory structure | ✅ **VERIFIED** | Webpack `/gl/shaders/` in DevTools |
> | All GLSL code examples | 🔴 **EXAMPLE CODE** | Standard patterns (not extracted) |
> | Shader count (25-30) | ❌ **NOT VERIFIABLE** | Cannot count at runtime |
> 
> **None of the GLSL code shown below is extracted from the actual site.**
> All examples represent standard patterns for achieving the observed visual effects.

---

## Shader Architecture

### Vertex Shader Responsibilities
- Position transformations (model → world → view → clip space)
- Normal calculations for lighting
- UV coordinate passing for textures
- Vertex color/attribute interpolation

### Fragment Shader Responsibilities  
- Per-pixel lighting calculations
- Texture sampling and blending
- Material properties (roughness, metalness)
- Special effects (fresnel, subsurface scattering)

---

## Custom Vertex Shader Patterns

### Corn Growth Animation (Illustrative)

> [!NOTE]
> The following code is an **example reconstruction** of standard GLSL patterns. The actual source code is minified and cannot be extracted in a readable format.

```glsl
// RECONSTRUCTED EXAMPLE: Vertex shader for organic growth
uniform float uGrowthProgress; // 0.0 to 1.0
uniform float uTime;

attribute vec3 originalPosition;
attribute vec3 grownPosition;

varying vec3 vNormal;
varying vec2 vUv;

void main() {
    // Interpolate between seed and full size
    vec3 pos = mix(originalPosition, grownPosition, uGrowthProgress);
    
    // Add organic wind motion
    float windStrength = 0.1 * uGrowthProgress;
    pos.x += sin(uTime + pos.y * 2.0) * windStrength;
    pos.z += cos(uTime * 0.7 + pos.y * 1.5) * windStrength;
    
    // Transform to clip space
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    
    // Pass to fragment shader
    vNormal = normalMatrix * normal;
    vUv = uv;
}
```

---

## Fragment Shader Implementations

### PBR Material Shader (Illustrative)

```glsl
// Physically-Based Rendering for corn kernels
uniform sampler2D uAlbedoMap;
uniform sampler2D uNormalMap;
uniform sampler2D uRoughnessMap;
uniform float uMetalness;

varying vec3 vNormal;
varying vec2 vUv;
varying vec3 vViewPosition;

// PBR lighting model
vec3 calculatePBR(vec3 albedo, vec3 normal, float roughness, float metalness) {
    vec3 viewDir = normalize(-vViewPosition);
    vec3 lightDir = normalize(vec3(1.0, 1.0, 0.5)); // Sun direction
    
    // Fresnel (Schlick approximation)
    vec3 F0 = mix(vec3(0.04), albedo, metalness);
    vec3 halfVector = normalize(lightDir + viewDir);
    float cosTheta = max(dot(halfVector, viewDir), 0.0);
    vec3 fresnel = F0 + (1.0 - F0) * pow(1.0 - cosTheta, 5.0);
    
    // Diffuse (Lambert)
    float NdotL =max(dot(normal, lightDir), 0.0);
    vec3 diffuse = albedo * NdotL * (1.0 - metalness);
    
    // Specular (Cook-Torrance)
    float roughness2 = roughness * roughness;
    float spec = pow(max(dot(normal, halfVector), 0.0), (2.0 / roughness2) - 2.0);
    vec3 specular = fresnel * spec;
    
    return diffuse + specular;
}

void main() {
    // Sample textures
    vec3 albedo = texture2D(uAlbedoMap, vUv).rgb;
    vec3 normalSample = texture2D(uNormalMap, vUv).rgb * 2.0 - 1.0;
    float roughness = texture2D(uRoughnessMap, vUv).r;
    
    // Transform normal to world space
    vec3 normal = normalize(vNormal + normalSample);
    
    // Calculate PBR lighting
    vec3 color = calculatePBR(albedo, normal, roughness, uMetalness);
    
    // Tone mapping (ACES approximation)
    color = (color * (2.51 * color + 0.03)) / (color * (2.43 * color + 0.59) + 0.14);
    
    gl_FragColor = vec4(color, 1.0);
}
```

### Subsurface Scattering Shader

```glsl
// For translucent corn kernels and young leaves
uniform vec3 uLightPos;
uniform vec3 uSubsurfaceColor; // Yellow-orange for corn
uniform float uThickness;
uniform float uScatterStrength;

varying vec3 vNormal;
varying vec3 vWorldPosition;

void main() {
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    vec3 lightDir = normalize(uLightPos - vWorldPosition);
    
    // Front-side lighting (standard)
    float frontLight = max(dot(vNormal, lightDir), 0.0);
    
    // Back-side contribution (subsurface)
    float backLight = max(dot(-vNormal, lightDir), 0.0);
    float subsurface = pow(backLight, uScatterStrength) * uThickness;
    
    // Combine
    vec3 color = vec3(frontLight) + uSubsurfaceColor * subsurface;
    
    gl_FragColor = vec4(color, 1.0);
}
```

---

## Post-Processing Shaders

### Bloom/Glow Shader (Illustrative)

```glsl
// Extract bright areas for bloom effect
uniform sampler2D tDiffuse;
uniform float uThreshold;
uniform float uIntensity;

varying vec2 vUv;

void main() {
    vec4 color = texture2D(tDiffuse, vUv);
    
    // Luminance calculation
    float lum = dot(color.rgb, vec3(0.299, 0.587, 0.114));
    
    // Extract bright areas above threshold
    float bloom = smoothstep(uThreshold, uThreshold + 0.1, lum);
    vec3 bloomColor = color.rgb * bloom * uIntensity;
    
    gl_FragColor = vec4(bloomColor, 1.0);
}
```

### Depth of Field Shader

```glsl
// Cinematic focus effect
uniform sampler2D tDiffuse;
uniform sampler2D tDepth;
uniform float uFocusDistance;
uniform float uAperture;

varying vec2 vUv;

void main() {
    float depth = texture2D(tDepth, vUv).r;
    float blurAmount = abs(depth - uFocusDistance) * uAperture;
    
    // Gaussian blur based on depth
    vec3 color = vec3(0.0);
    float totalWeight = 0.0;
    
    for (float x = -2.0; x <= 2.0; x++) {
        for (float y = -2.0; y <= 2.0; y++) {
            vec2 offset = vec2(x, y) * blurAmount * 0.01;
            float weight = exp(-(x*x + y*y) / 2.0);
            color += texture2D(tDiffuse, vUv + offset).rgb * weight;
            totalWeight += weight;
        }
    }
    
    gl_FragColor = vec4(color / totalWeight, 1.0);
}
```

### Color Grading Shader

```glsl
// Cinematic color correction
uniform sampler2D tDiffuse;
uniform vec3 uShadowsColor;
uniform vec3 uMidtonesColor;
uniform vec3 uHighlightsColor;
uniform float uContrast;
uniform float uSaturation;

varying vec2 vUv;

void main() {
    vec4 color = texture2D(tDiffuse, vUv);
    
    // Luminance-based color grading
    float lum = dot(color.rgb, vec3(0.299, 0.587, 0.114));
    
    // Shadows, midtones, highlights
    vec3 shadows = uShadowsColor * (1.0 - lum);
    vec3 midtones = uMidtonesColor * (lum * (1.0 - lum) * 4.0);
    vec3 highlights = uHighlightsColor * lum;
    
    vec3 graded = color.rgb + shadows + midtones + highlights;
    
    // Contrast
    graded = (graded - 0.5) * uContrast + 0.5;
    
    // Saturation
    float gray = dot(graded, vec3(0.299, 0.587, 0.114));
    graded = mix(vec3(gray), graded, uSaturation);
    
    gl_FragColor = vec4(graded, 1.0);
}
```

---

## Shader Optimization Techniques

### Move Calculations to Vertex Shader

```glsl
// BAD: Per-pixel calculation (fragment shader)
void main() {
    vec3 lightDir = normalize(uLightPos - vWorldPosition); // Every pixel!
    // ... lighting calc
}

// GOOD: Per-vertex calculation (vertex shader)
varying vec3 vLightDir;
void main() {
    vLightDir = normalize(uLightPos - worldPosition); // Once per vertex
    // Pass to fragment shader
}
```

**Performance Gain:** 10-100x fewer calculations

### Shader Precalculations

```glsl
// Precompute expensive operations
uniform float uTime;

// BAD
float wave = sin(uTime * 3.14159);

// GOOD (pass precomputed from CPU)
uniform float uWaveSin; // Calculated once in JS
```

---

## Projected Shader Count (from /webpack/gl/shaders/)

Based on visual complexity:
- **Vertex Shaders:** 5-10 unique (growth, wind, camera-facing billboards)
- **Fragment Shaders:** 10-15 unique (PBR, subsurface, particles, terrain)
- **Post-Processing:** 5-8 unique (bloom, DOF, color grade, vignette, FXAA)

**Total: ~25-30 shader programs**

---

## Sources

1. **Three.js Shaders**: https://threejs.org/examples/?q=shader
2. **GLSL Sandbox**: http://glslsandbox.com/
3. **Book of Shaders**: https://thebookofshaders.com/
4. **Subsurface Scattering**: GPU Gems articles

**Report Status:** ✅ Complete
