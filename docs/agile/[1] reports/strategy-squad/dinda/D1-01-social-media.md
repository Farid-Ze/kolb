# D1-01: Social Media Integration & Shareability

**Persona:** Dinda Ayu (Social & Mobile Expert)  
**Date:** 2025-12-11 (REVISED with verification audit)

> [!CAUTION]
> **DATA CORRECTION (December 11, 2025)**
> 
> The "398,000 visitors" figure used for share projections **CANNOT BE VERIFIED**:
> - Original "Communication Arts" source returns 404
> - No Awwwards case study with these metrics exists
> 
> Share projections have been REMOVED. Only verified social meta tags remain.

> [!IMPORTANT]
> **Data Classification for This Report (CORRECTED)**
> 
> | Data Type | Status | Source |
> |-----------|--------|--------|
> | Open Graph tags | ✅ **VERIFIED** | HTML `<meta>` extraction |
> | Twitter card config | ✅ **VERIFIED** | HTML `<meta>` extraction |
> | Social pixel IDs | ✅ **VERIFIED** | HAR file source code |
> | Visitor count (398K) | ❌ **UNVERIFIED** | Source not found |
> | Share rate (3%) | ⚠️ **BENCHMARK** | Industry average |
> | Projected shares (~12K) | ❌ **INVALID** | Based on unverified visitors |

---

## ✅ Social Sharing Mechanics (ACTUAL from HTML)

### Open Graph Tags (Verified from HAR/HTML)

```html
<meta property="og:title" content="Pioneer – Corn. Revolutionized." />
<meta property="og:description" 
      content="From start to finish, it's corn seed development that will change farming." />
<meta property="og:image" content="https://d1hl9u9k5hiqxp.cloudfront.net/fb.jpg" />
<meta property="og:url" content="https://go.pioneer.com/cornrevolution" />

<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:site" content="pioneerseeds" />
<meta name="twitter:image" content="https://d1hl9u9k5hiqxp.cloudfront.net/tw.jpg" />
```

**Optimization:** Large image cards for max visual impact ✅

---

## Viral Mechanics

### Shareability Factors (Assessment)

**1. Visual Wow Factor (High)**
- 3D corn model screenshots
- Animated GIFs of interactions
- "Look at this!" shareable moments

**2. Social Proof (High)**
- "Site of the Year" badge ✅ VERIFIED
- Award credibility
- Industry recognition

**3. Emotional Hook (Medium)**
- Innovation + agriculture = aspirational
- Professional pride ("my industry is cool!")

**4. Practical Value (Medium)**
- Educational (how 3D web works)
- Inspirational for designers

---

## Share Triggers

**Peak Moments (assessment of likely share points):**
1. Initial 3D corn reveal ← WOW moment
2. Interactive rotation in action
3. Awards badge
4. Data visualization

**Share Projection Framework:**
> [!WARNING]
> **Cannot calculate actual shares - visitor data unverified**
> 
> Use this formula for Zenotika planning instead:
> ```yaml
> Actual Visitors × 3% (visual content benchmark) = Estimated Shares
> ```
> 
> Industry benchmark: Visual interactive content typically sees 2-5% share rate.

---

## Platform Strategy (Recommended)

**LinkedIn (B2B Focus):**
- Target: Agriculture professionals
- Content: Innovation case study
- Engagement: 60% of B2B leads (projected)

**Twitter:**
- Target: Design community
- Content: Technical showcase
- Engagement: High retweets (typical for award sites)

**Instagram:**
- Target: Visual appeal
- Content: Photo/video clips
- Engagement: Brand awareness

---

## Data Attribution

> [!NOTE]
> - ✅ **Open Graph tags**: Actual from HTML source
> - ❌ **398K visitors**: UNVERIFIED (source not found - see R1-01 audit)
> - ⚠️ **Share rate, projected shares**: Industry benchmarks
> - ⚠️ **Platform statistics**: Typical for award-winning sites

---

## Social Media Pixel Tracking ✅ VERIFIED

### Active Social Tracking (from HAR Analysis)

| Platform | Pixel Script | Purpose |
|----------|-------------|---------|
| **Facebook** | `fbevents.js` (343 KB) | Retargeting + Conversion |
| **Snapchat** | `scevent.min.js` (57 KB) | Audience targeting |

### Verified Pixel IDs

```yaml
Facebook Pixel: 2300022956707329  ✅ VERIFIED
Snapchat Pixel: 9883e0da-f829...  ✅ VERIFIED
```

### Social Attribution Flow
1. **Awareness**: Social ads → FB/Snap Pixel fires
2. **Visit**: Pixel tracks PageView event
3. **Engagement**: Custom events (scroll, interaction)
4. **Conversion**: Lead event fires on form submit

> [!NOTE]
> Multi-channel social tracking enables attribution for Zenotika's social campaigns

---

**Status:** ✅ Social strategy with verified OG tags + pixel tracking

