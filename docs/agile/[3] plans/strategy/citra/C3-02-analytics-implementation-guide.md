# C3-02: Analytics Implementation Guide
## Tracking Configuration for WebGL Experiences

---

## Document Information

| Field | Value |
|-------|-------|
| **Document ID** | C3-02 |
| **Sprint** | 3 - Implementation Planning |
| **Persona** | Citra Dewi A. (Marketing Analyst) |
| **Priority** | 🔴 HIGH |
| **Status** | ✅ COMPLETED |
| **Created** | 2025-12-11 |
| **References** | C2-01, C2-03, C3-01 |

---

## 📋 Executive Summary

This guide defines analytics implementation standards for tracking user engagement in WebGL experiential sites. Based on Sprint 2 analysis of the Corn Revolution site and Ruler Analytics 2025 benchmarks (3.5% B2B CVR), this document provides actionable tracking specifications to measure and optimize conversion performance.

---

## 📊 Analytics Architecture

### Recommended Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Collection** | Google Analytics 4 | Event tracking, user flow |
| **Tag Management** | Google Tag Manager | Centralized tag deployment |
| **Attribution** | Ruler Analytics | B2B attribution modeling |
| **Heatmaps** | Hotjar / Microsoft Clarity | Visual behavior analysis |
| **A/B Testing** | Google Optimize (or alternative) | Experiment tracking |

### Data Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ANALYTICS DATA FLOW                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   User Interaction                                                   │
│         │                                                            │
│         ▼                                                            │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐            │
│   │   DataLayer │───▶│     GTM     │───▶│    GA4      │            │
│   │   Events    │    │   Tags      │    │   BigQuery  │            │
│   └─────────────┘    └─────────────┘    └─────────────┘            │
│         │                   │                  │                     │
│         │                   ▼                  ▼                     │
│         │            ┌─────────────┐    ┌─────────────┐            │
│         │            │   Hotjar    │    │   Looker    │            │
│         │            │   Clarity   │    │   Studio    │            │
│         │            └─────────────┘    └─────────────┘            │
│         │                                                            │
│         ▼                                                            │
│   ┌─────────────┐                                                   │
│   │    Ruler    │───▶ CRM Integration                               │
│   │  Analytics  │                                                   │
│   └─────────────┘                                                   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🏷️ Data Layer Specification

### Core Data Layer Structure

```javascript
// ILLUSTRATIVE EXAMPLE - Data Layer Initialization

window.dataLayer = window.dataLayer || [];

// Page-level data
dataLayer.push({
  event: 'page_data',
  page: {
    title: 'Corn Revolution - Premium Corn Experience',
    path: '/',
    type: 'experiential_landing',
    language: 'en',
    environment: 'production'
  },
  user: {
    id: null, // Set on identification
    status: 'anonymous',
    deviceCategory: 'desktop',
    browserSupport: {
      webgl: true,
      webgl2: true
    }
  }
});
```

### WebGL-Specific Events

```javascript
// ILLUSTRATIVE EXAMPLE - WebGL Event Tracking

// Scene load events
function trackSceneLoad(sceneName, loadTime, assetCount) {
  dataLayer.push({
    event: 'webgl_scene_load',
    scene: {
      name: sceneName,
      loadTime: loadTime, // milliseconds
      assetCount: assetCount
    },
    performance: {
      fps: getCurrentFPS(),
      memoryUsage: performance.memory?.usedJSHeapSize || null
    }
  });
}

// 3D interaction events
function track3DInteraction(interactionType, objectName, details) {
  dataLayer.push({
    event: 'webgl_interaction',
    interaction: {
      type: interactionType, // 'click', 'hover', 'drag', 'zoom'
      object: objectName,
      details: details
    },
    timing: {
      timestamp: Date.now(),
      sessionTime: getSessionDuration()
    }
  });
}

// Scene transition events
function trackSceneTransition(fromScene, toScene, method) {
  dataLayer.push({
    event: 'webgl_scene_transition',
    transition: {
      from: fromScene,
      to: toScene,
      method: method, // 'scroll', 'click', 'auto'
      scrollDepth: getScrollPercentage()
    }
  });
}
```

---

## 📈 Event Tracking Plan

### Critical Events (Must Track)

| Event Name | Trigger | Parameters | Priority |
|------------|---------|------------|----------|
| `page_view` | Page load complete | page_title, page_path | 🔴 HIGH |
| `webgl_loaded` | WebGL canvas ready | load_time, success | 🔴 HIGH |
| `scroll_depth` | 25%, 50%, 75%, 100% | percentage, scene | 🔴 HIGH |
| `cta_click` | CTA button click | cta_text, cta_location | 🔴 HIGH |
| `form_start` | First form field focus | form_name | 🔴 HIGH |
| `form_submit` | Form submission | form_name, success | 🔴 HIGH |
| `lead_generated` | Successful lead capture | lead_source | 🔴 HIGH |

### Engagement Events (Should Track)

| Event Name | Trigger | Parameters | Priority |
|------------|---------|------------|----------|
| `scene_view` | Each scene reached | scene_name, entry_method | 🟡 MEDIUM |
| `video_play` | Video starts | video_title, duration | 🟡 MEDIUM |
| `video_complete` | Video ends | video_title, watch_time | 🟡 MEDIUM |
| `3d_interaction` | User interacts with 3D | object_name, interaction_type | 🟡 MEDIUM |
| `hotspot_click` | Info hotspot clicked | hotspot_name, scene | 🟡 MEDIUM |
| `time_on_scene` | Scene exit | scene_name, duration | 🟡 MEDIUM |

### Performance Events (Nice to Have)

| Event Name | Trigger | Parameters | Priority |
|------------|---------|------------|----------|
| `fps_drop` | FPS < 30 for 5s | avg_fps, scene | 🟢 LOW |
| `asset_load_fail` | Asset fails to load | asset_name, error | 🟢 LOW |
| `webgl_fallback` | Fallback triggered | fallback_reason | 🟢 LOW |
| `memory_warning` | High memory usage | memory_mb | 🟢 LOW |

---

## 🔧 GTM Implementation

### Container Structure

```
GTM Container: Corn Revolution
├── Tags
│   ├── GA4 Configuration
│   ├── GA4 - Page View
│   ├── GA4 - Scroll Depth
│   ├── GA4 - WebGL Load
│   ├── GA4 - Scene View
│   ├── GA4 - CTA Click
│   ├── GA4 - Form Start
│   ├── GA4 - Form Submit
│   ├── GA4 - Lead Generated
│   ├── Hotjar Tracking Code
│   └── Ruler Analytics
│
├── Triggers
│   ├── Page View - All Pages
│   ├── Scroll Depth - 25/50/75/100
│   ├── Custom Event - webgl_loaded
│   ├── Custom Event - webgl_scene_view
│   ├── Click - CTA Buttons
│   ├── Form Submit
│   └── Custom Event - lead_generated
│
└── Variables
    ├── DataLayer - page.title
    ├── DataLayer - page.path
    ├── DataLayer - scene.name
    ├── DataLayer - interaction.type
    ├── DataLayer - performance.fps
    └── JS Variable - Scroll Percentage
```

### GA4 Configuration Tag

```javascript
// ILLUSTRATIVE EXAMPLE - GA4 Config

// GTM Tag Configuration
{
  "tagType": "GA4 Configuration",
  "measurementId": "G-XXXXXXXXXX",
  "settings": {
    "send_page_view": false, // Manual page views
    "cookie_flags": "SameSite=None;Secure",
    "user_properties": {
      "webgl_support": "{{DLV - user.browserSupport.webgl}}",
      "device_category": "{{DLV - user.deviceCategory}}"
    }
  }
}
```

### Custom Event Tag Example

```javascript
// ILLUSTRATIVE EXAMPLE - Scene View Event Tag

// GTM Tag: GA4 - Scene View
{
  "tagType": "GA4 Event",
  "eventName": "scene_view",
  "parameters": {
    "scene_name": "{{DLV - scene.name}}",
    "entry_method": "{{DLV - transition.method}}",
    "scroll_depth": "{{DLV - transition.scrollDepth}}",
    "session_time": "{{DLV - timing.sessionTime}}"
  },
  "trigger": "Custom Event - webgl_scene_view"
}
```

---

## 📊 Custom Dimensions & Metrics

### GA4 Custom Dimensions

| Dimension Name | Scope | Description |
|----------------|-------|-------------|
| `webgl_support` | User | WebGL version supported |
| `device_tier` | Session | Performance tier (high/medium/low) |
| `entry_source` | Session | Traffic source detail |
| `experience_type` | Session | Full WebGL or fallback |

### GA4 Custom Metrics

| Metric Name | Type | Description |
|-------------|------|-------------|
| `total_scenes_viewed` | Sum | Count of unique scenes viewed |
| `avg_scene_duration` | Average | Time spent per scene |
| `interaction_count` | Sum | Total 3D interactions |
| `performance_score` | Average | Avg FPS during session |

### Implementation

```javascript
// ILLUSTRATIVE EXAMPLE - Custom Dimensions

// Set user-scoped dimension
gtag('set', 'user_properties', {
  webgl_support: detectWebGLSupport(),
  first_visit_date: getFirstVisitDate()
});

// Set session-scoped dimension with event
gtag('event', 'session_start', {
  device_tier: detectDeviceTier(),
  experience_type: isWebGLActive() ? 'full_webgl' : 'fallback'
});
```

---

## 📈 Conversion Tracking

### Goal Configuration

Based on Ruler Analytics 2025 B2B benchmarks:

| Goal | Type | Target | Benchmark |
|------|------|--------|-----------|
| Lead Form Submit | Destination | /thank-you | 3.5% CVR |
| Contact Request | Event | form_submit (contact) | 1.7% |
| Product Inquiry | Event | form_submit (inquiry) | 2.0% |
| Demo Request | Event | form_submit (demo) | 0.8% |

### Enhanced Ecommerce (If Applicable)

```javascript
// ILLUSTRATIVE EXAMPLE - Product View Tracking

// When user views product in 3D
function trackProductView(product) {
  dataLayer.push({
    event: 'view_item',
    ecommerce: {
      currency: 'USD',
      value: product.price,
      items: [{
        item_id: product.sku,
        item_name: product.name,
        item_category: product.category,
        price: product.price
      }]
    }
  });
}

// When user adds to inquiry
function trackAddToInquiry(product) {
  dataLayer.push({
    event: 'add_to_cart', // Repurposed for B2B
    ecommerce: {
      currency: 'USD',
      value: product.price,
      items: [{
        item_id: product.sku,
        item_name: product.name,
        quantity: 1
      }]
    }
  });
}
```

---

## 🔥 Heatmap & Session Recording

### Hotjar/Clarity Configuration

| Feature | Configuration | Purpose |
|---------|---------------|---------|
| Heatmaps | Click, Move, Scroll | Visual engagement analysis |
| Session Recording | 10% of sessions | Qualitative behavior analysis |
| Feedback Widget | Post-conversion | User satisfaction |
| Surveys | Exit intent | Conversion barriers |

### WebGL Overlay Tracking

```javascript
// ILLUSTRATIVE EXAMPLE - Hotjar Custom Events

// Track 3D interactions for heatmap overlay
function track3DClickForHeatmap(screenX, screenY, objectName) {
  // Hotjar custom event
  if (window.hj) {
    hj('event', '3d_click');
    
    // Custom attribute for filtering
    hj('identify', null, {
      last_3d_interaction: objectName,
      interaction_x: screenX,
      interaction_y: screenY
    });
  }
}

// Tag recordings with segments
function tagRecording(tag) {
  if (window.hj) {
    hj('tagRecording', [tag]);
  }
}

// Usage
tagRecording('webgl_user');
tagRecording('completed_scroll');
tagRecording('form_starter');
```

---

## 📊 Reporting Dashboard Specifications

### KPI Dashboard Structure

```
┌─────────────────────────────────────────────────────────────────────┐
│                    WEBGL EXPERIENCE DASHBOARD                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  EXECUTIVE SUMMARY                                           │   │
│  │  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐            │   │
│  │  │Sessions│  │CVR %   │  │Leads   │  │Avg Time│            │   │
│  │  │ 12,450 │  │ 3.2%   │  │  398   │  │ 4:32   │            │   │
│  │  └────────┘  └────────┘  └────────┘  └────────┘            │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  ENGAGEMENT FUNNEL                                           │   │
│  │  Page View → Scene 1 → Scene 2 → Scene 3 → CTA → Form       │   │
│  │    100%   →   85%   →   62%   →   45%   → 28%  → 15%        │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌──────────────────────┐  ┌──────────────────────┐               │
│  │  SCENE PERFORMANCE   │  │  DEVICE BREAKDOWN    │               │
│  │  ┌────────────────┐  │  │  Desktop: 65%        │               │
│  │  │ Intro    │ 2:10│  │  │  Mobile:  28%        │               │
│  │  │ Story    │ 1:45│  │  │  Tablet:   7%        │               │
│  │  │ Product  │ 2:30│  │  │                      │               │
│  │  │ Contact  │ 1:15│  │  │  WebGL: 94%          │               │
│  │  └────────────────┘  │  │  Fallback: 6%        │               │
│  └──────────────────────┘  └──────────────────────┘               │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Automated Reports

| Report | Frequency | Recipients | Content |
|--------|-----------|------------|---------|
| Daily KPI Summary | Daily 8am | Marketing | Traffic, CVR, Leads |
| Weekly Performance | Monday | Team | Detailed engagement metrics |
| Monthly Analysis | 1st of month | Leadership | Trends, recommendations |
| Real-time Alerts | As triggered | Technical | Errors, performance issues |

---

## ✅ Implementation Checklist

### Pre-Launch

- [ ] GTM container created and configured
- [ ] GA4 property configured
- [ ] Data Layer implemented in code
- [ ] All critical events firing correctly
- [ ] Conversion goals configured
- [ ] Cross-domain tracking (if needed)
- [ ] Debug mode tested thoroughly

### Post-Launch Validation

- [ ] Real-time reports showing data
- [ ] No data discrepancies >5%
- [ ] All events appear in GA4 debug
- [ ] Heatmaps generating correctly
- [ ] Session recordings capturing

---

## 🔗 Cross-References

| Document | Relationship |
|----------|--------------|
| C2-01 (Conversion Analysis) | Baseline metrics |
| C2-03 (Tracking Analysis) | Current implementation review |
| C3-01 (Conversion Optimization) | Optimization targets |
| R3-01 (Business Impact) | ROI measurement |

---

## 📊 Data Classification

| Category | Classification |
|----------|----------------|
| **Primary Data** | Ruler Analytics 2025 (3.5% B2B CVR) |
| **Industry Standards** | GA4, GTM best practices |
| **Code Examples** | Illustrative (not from live site) |
| **Tools** | Industry-standard analytics platforms |

---

*Document Status: ✅ COMPLETED*
*Last Updated: 2025-12-11*
