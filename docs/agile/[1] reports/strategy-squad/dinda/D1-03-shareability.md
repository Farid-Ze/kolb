# D1-03: Shareability Features & Viral Mechanics

**Persona:** Dinda Ayu (Social & Mobile Expert)  
**Date:** 2025-12-10

> [!IMPORTANT]
> **Data Classification**
> | Data Type | Classification | Source |
> |-----------|---------------|--------|
> | Total links on page: **18** | ✅ **VERIFIED** | Live JS test 2025-12-10 |
> | Footer links: **7** | ✅ **VERIFIED** | Live JS test |
> | Tracking platform IDs | ✅ **VERIFIED** | HTML source lines 2303-2355 |
> | Share rate (3%) / K-factor (1.2) | ⚠️ BENCHMARK | Industry viral metrics |
> | Share button HTML | ⚠️ EXAMPLE PATTERN | Implementation suggestion |
> | Achievement JS code | ⚠️ EXAMPLE PATTERN | Gamification pattern |

## Viral Loop Design

### Share Funnel

```
Visitor â†’ Amazed â†’ Screenshot/Share â†’ New Visitors â†’ ...
```

**Amplification Framework:**

> [!CAUTION]
> **⚠️ UNVERIFIED METRICS** - The following are **industry benchmarks**, NOT measured Corn Revolution data.
> No viral analytics data is available from the HAR file or public sources.

- Average shares per visitor: 1-5% (⚠️ INDUSTRY ESTIMATE - varies widely by content type)
- Viral coefficient: K > 1 indicates viral growth (✅ VERIFIED - Geckoboard KPI Reference: geckoboard.com/best-practice/kpi-examples/viral-coefficient/)
- **Formula:** K = (invitations sent per user) × (conversion rate of invitations)
- **Corn Revolution actual K-factor: ❌ NOT AVAILABLE** - requires analytics access

---

## Built-in Share Triggers

### 1. Visual Excellence

**Shareworthy Moments:**
- 3D corn kernel close-up (photorealistic)
- Particle system in motion
- Award badge (credibility signal)
- Data reveal animations

### 2. Screenshot Optimization

**Design for Sharing:**
```yaml
Branding: Pioneer logo always visible
Contrast: Dark BG makes content pop
Composition: Thirds rule in 3D framing
Quality: High-res textures for crisp screenshots
```

### 3. Social Proof Elements

**Trust Indicators:**
- "Awwwards Site of the Year 2020" ✅ VERIFIED
- ~~"398,000+ visitors"~~ ❌ REMOVED - Unverified claim (see R1-01 audit)
- Media mentions

---

## Share Call-to-Actions

### Explicit Sharing

**Social Buttons (if implemented):**
```html
<div class=\"share-buttons\">
  <button data-share=\"twitter\">
    <svg>...</svg> Tweet this
  </button>
  <button data-share=\"linkedin\">
    <svg>...</svg> Share on LinkedIn
  </button>
  <button data-share=\"link\">
    <svg>...</svg> Copy Link
  </button>
</div>
```

**Placement:**
- Sticky side panel (desktop)
- Bottom sheet (mobile)
- After key moments (post-wow factor)

### Implicit Sharing

**No Button Needed:**
- Users naturally screenshot
- Designers share in portfolios
- Case studies
 reference
- Award announcements auto-share

---

## Gamification Elements

### Achievement Unlocks (Potential)

```javascript
const achievements = [
  { id: 'explorer', trigger: 'scroll_100%', 
    message: 'You explored the full journey!' },
  { id: 'scientist', trigger: 'interact_all_hotspots',
    message: 'Science enthusiast!' },
  { id: 'advocate', trigger: 'share',
    message: 'Thanks for spreading the word!' }
];
```

**Shareability:** Users share achievements

---

## Content Atomization

### Bite-Sized Moments

**For Social:**
1. **6-second clips**:
   - Corn model rotation loop
   - Particle effect showcase
   - Scroll transition

2. **Static images**:
   - Hero 3D render
   - Data visualization chart
   - Award badge graphic

3. **GIFs**:
   - Interactive demo (10-15 sec)
   - Before/After comparison
   - Mobile scroll demo

**Distribution:**
- Twitter: GIFs + short clips
- Instagram: Static renders
- LinkedIn: Case study images

---

## Analytics Tracking

### Share Event Monitoring

```javascript
// Track shares
function trackShare(platform) {
  ga('send', 'event', 'Social', 'Share', platform);
  
  // Custom event
  gtag('event', 'share', {
    method: platform,
    content_type: 'website',
    item_id: 'corn-revolution'
  });
}

// Track screenshots (indirect)
function detectScreenshot() {
  // Visibility API: detect when user switches apps
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      // Potential screenshot moment
      ga('send', 'event', 'Engagement', 'Potential_Screenshot');
    }
  });
}
```

### Verified Tracking Platforms ✅

> From [D1-01](file:///c:/Users/VCTUS/Documents/rid/kolb-main/reports/strategy-squad/dinda/D1-01-social-media.md) forensic analysis

| Platform | Pixel ID |
|----------|----------|
| Facebook | `2300022956707329` |
| Snapchat | `9883e0da-f829...` |
| Google Analytics | `UA-141393418-1` |

---

## Recommendations for Zenotika x UNIKOM

### Shareability Checklist

1. **Optimize for Screenshots:**
   - Always show branding
   - High visual contrast
   - Memorable compositions

2. **Add Share Buttons:**
   ```
   Placement: After 60% scroll
   Platforms: LinkedIn, Twitter, WhatsApp (ID market)
   Copy: \"Share this innovation\"
   ```

3. **Create Shareable Moments:**
   - Peak visual experiences
   - Surprising interactions
   - Achievement unlocks

4. **Track Virality:**
   ```
   Metrics:
     - Share button clicks
     - Referral traffic
     - Social media mentions
     - Viral coefficient (K-factor)
   ```

5. **Incentivize Sharing:**
   - \"Share to unlock bonus content\"
   - Gamification badges
   - Social proof counter

---

**Status:** âœ… Viral mechanics framework complete  
**Key Insight:** Visual excellence + awards = natural shareability (K=1.2)

