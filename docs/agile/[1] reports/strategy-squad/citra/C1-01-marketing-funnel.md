# C1-01: Marketing Funnel & Awareness Strategy

**Persona:** Citra Dewi (Marketing Strategy Expert)  
**Date:** 2025-12-11 (REVISED with verification audit)

> [!CAUTION]
> **CRITICAL DATA CORRECTION (December 11, 2025)**
> 
> The "398K visitors, 420 leads" claim was previously marked as VERIFIED from "Communication Arts"
> but **this source CANNOT BE VERIFIED**:
> - Communication Arts project page returns 404 error
> - No Awwwards case study with these metrics exists
> 
> **Use verified industry benchmarks instead.**

> [!IMPORTANT]
> **Data Classification for This Report (CORRECTED)**
> 
> | Data Type | Status | Source |
> |-----------|--------|--------|
> | 398K visitors, 420 leads | ❌ **UNVERIFIED** | Source not found |
> | Awards (SOTY 2020) | ✅ **VERIFIED** | Awwwards official |
> | Tracking IDs (GA, FB, Eloqua) | ✅ **VERIFIED** | HAR + Live JS test |
> | B2B Conversion Benchmarks | ✅ **VERIFIED** | Ruler Analytics 2025 |
> | Social reach (500K+) | ❌ **NOT VERIFIABLE** | Requires social analytics |
> | Viral coefficient (1.2x) | ❌ **NOT VERIFIABLE** | Requires tracking data |
> | Peak traffic distribution | ❌ **NOT VERIFIABLE** | Requires GA access |

---

## Marketing Funnel Stages

### Top of Funnel (TOFU) - Awareness

**Channels (✅ Verified Awards):**
```yaml
Awards & PR:
  - Awwwards Site of the Year 2020 ✅ VERIFIED
  - SOTD Score: 8.18/10 ✅ VERIFIED
  - Developer Award: 8.15/10 ✅ VERIFIED

Social Media (PROJECTED - not verified):
  - Twitter/LinkedIn shares by designers
  - Instagram visual showcases
  - Reach: ⚠️ UNKNOWN (requires social analytics)

Organic Search:
  - "Pioneer corn" brand searches
  - "3D agriculture website" discovery
```

**Content Type:**
- Visual (3D screenshots, videos)
- Awards badges
- "Innovation in AgTech" narrative

---

### Middle of Funnel (MOFU) - Consideration

**Using Verified Benchmarks (Databox 2024):**
```yaml
B2B Session Duration Median: 77.61 seconds ✅
Desktop 5+ min sessions: 21.4% ✅
Mobile 5+ min sessions: 14.6% ✅
```

**Engagement:**
- Interactive 3D exploration
- Scientific data review
- Competitor comparison (implied)

---

### Bottom of Funnel (BOFU) - Decision

**Conversion:**
- Clear CTA: "Contact Sales"
- Lead capture form → ❌ **UNVERIFIED (420 leads claim cannot be verified)**

**Verified Industry Benchmarks (Ruler Analytics 2025):**
```yaml
Industrial Sector Direct Traffic CVR: 5.0% ✅
Industrial Sector Organic Search CVR: 4.4% ✅
Industrial Sector Paid Search CVR: 3.4% ✅
Average B2B Tech CVR (Organic): 2.5% ✅
```

---

## Campaign Strategy (Assessment)

**Launch Campaign (Typical for premium sites):**
1. **Pre-launch:** Teaser campaign (2 weeks)
2. **Launch:** Awards submission + PR blitz
3. **Post-launch:** Sustained social engagement

**Results:**
```yaml
Total visitors: ❌ UNVERIFIED (398K claim - source not found)
Peak traffic: ❌ UNKNOWN (requires GA access)
Sustained: ❌ UNKNOWN (industry typical ~10K/month for SOTY sites)
Viral coefficient: ❌ UNKNOWN (requires tracking data)
```

**✅ Verified Award Impact:**
```yaml
Awwwards SOTY 2020: ✅ VERIFIED
SOTD Score: 8.18/10 ✅ VERIFIED
Developer Award: 8.15/10 ✅ VERIFIED
```

---

## Data Attribution

> [!CAUTION]
> **VERIFICATION AUDIT (December 11, 2025):**
> - ❌ **398K visitors, 420 leads**: UNVERIFIED - Communication Arts returns 404, source not found
> - ✅ **Awards**: Awwwards SOTY 2020, SOTD 8.18/10 VERIFIED
> - ⚠️ **Traffic distribution**: Industry benchmarks
> - ⚠️ **Viral coefficient, sustained traffic**: Typical for SOTY sites

---

## Analytics Tracking Implementation ✅ VERIFIED

> [!NOTE]
> **CRITICAL CORRECTION:** Analytics IS present on the site (earlier audit error corrected)

### Verified Tracking Platforms (CORRECTED December 11, 2025)

> [!NOTE]
> **IDs verified from VERIFIED_FORENSIC_AUDIT.md (HTML source lines 12-18)**

| Platform | Script | ID | Status |
|----------|--------|-----|--------|
| **Google Analytics** | `analytics.js` | **UA-141393418-1** | ✅ VERIFIED |
| **Facebook Pixel** | `fbevents.js` | **2300022956707329** | ✅ VERIFIED |
| **Snapchat Pixel** | `scevent.min.js` | **9883e0da-f829-4546-946f-bd621e12bd4a** | ✅ VERIFIED |
| **Oracle Eloqua** | `elqCfg.min.js` | **777435755** | ✅ VERIFIED |
| **TrustArc** | Consent Manager | **corteva.com** | ✅ VERIFIED |

### Gap Analysis for Zenotika

| Gap | Severity | Recommendation |
|-----|----------|----------------|
| No GA4 migration | ⚠️ Medium | Migrate from UA to GA4 |
| No consent management | 🔴 High | Implement GDPR cookie banner |
| No GTM container | ⚠️ Medium | Centralize via Google Tag Manager |

---

**Status:** ✅ Marketing funnel analysis with verified metrics + analytics audit

