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

Sesuai dengan best practices Anthropic, file pendukung berada di `../.claude/skills/`:

- [.claude/skills/webgl-shaders.md](../.claude/skills/webgl-shaders.md) — Shader development
- [.claude/skills/kolb-api.md](../.claude/skills/kolb-api.md) — KOLB API integration
- [.claude/skills/svelte-patterns.md](../.claude/skills/svelte-patterns.md) — Svelte 5 patterns
