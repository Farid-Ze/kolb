# C4-03: Measurement Standards

## 📋 METADATA
- **Task ID**: C4-03
- **Persona**: Citra Dewi (Marketing Analyst)
- **Sprint**: 4 - Validation & Handoff
- **Status**: ✅ COMPLETED
- **Created**: 2025-12-11
- **Dependencies**: C2-03, C3-03, K4-03

---

## 🎯 OBJECTIVE

Establish comprehensive measurement standards for Zenotika WebGL experiential projects including analytics setup, tracking protocols, and reporting frameworks.

---

## 📊 MEASUREMENT STANDARDS

### 1. Analytics Architecture

#### Tracking Stack

```
RECOMMENDED ANALYTICS STACK
├── Primary Analytics
│   └── Google Analytics 4 (GA4)
│
├── Behavior Analytics
│   ├── Hotjar/FullStory (Session recording)
│   └── Custom scroll tracking
│
├── A/B Testing
│   └── Google Optimize / VWO
│
├── Tag Management
│   └── Google Tag Manager (GTM)
│
└── Data Warehouse (optional)
    └── BigQuery for GA4 export
```

### 2. GA4 Configuration

#### Essential Events

| Event | Trigger | Parameters |
|-------|---------|------------|
| `page_view` | Page load | page_title, page_location |
| `scroll` | 25/50/75/90% | percent_scrolled |
| `scene_view` | Scene enters viewport | scene_name, scene_number |
| `cta_view` | CTA visible | cta_name, cta_position |
| `cta_click` | CTA clicked | cta_name, destination |
| `form_start` | Form field focus | form_name |
| `form_submit` | Form submitted | form_name, success |
| `video_start` | Video plays | video_name |
| `share` | Share button click | platform, content |

#### Custom Events for WebGL

```javascript
// Scene Tracking
gtag('event', 'scene_view', {
  scene_name: 'product_reveal',
  scene_number: 3,
  time_on_previous: 12.5
});

// 3D Interaction Tracking
gtag('event', 'model_interaction', {
  interaction_type: 'rotate',
  model_name: 'product_hero',
  duration: 5.2
});

// Performance Events
gtag('event', 'performance_metric', {
  metric_name: 'webgl_fps',
  value: 58,
  device_type: 'desktop'
});
```

### 3. GTM Implementation

#### Container Structure

```
GTM CONTAINER SETUP
├── Tags
│   ├── GA4 Configuration
│   ├── GA4 Event Tags
│   ├── Conversion Pixels
│   └── A/B Test Scripts
│
├── Triggers
│   ├── Page View
│   ├── Scroll Depth
│   ├── Element Visibility
│   ├── Click Events
│   └── Custom Events
│
└── Variables
    ├── Data Layer Variables
    ├── DOM Elements
    ├── URL Parameters
    └── Custom JavaScript
```

#### Data Layer Structure

```javascript
// Initial Data Layer
dataLayer = [{
  'pageType': 'experience',
  'environment': 'production',
  'userType': 'new', // or 'returning'
  'deviceCapability': 'webgl2', // or 'webgl1', 'fallback'
}];

// Event Push Example
dataLayer.push({
  'event': 'sceneComplete',
  'sceneData': {
    'sceneName': 'introduction',
    'sceneNumber': 1,
    'timeOnScene': 15.3,
    'interactions': 3
  }
});
```

### 4. Key Performance Indicators

#### Primary KPIs

| KPI | Definition | Target | Frequency |
|-----|------------|--------|-----------|
| **Conversion Rate** | Completions / Visitors | >3% | Daily |
| **Bounce Rate** | Single-page sessions | <40% | Daily |
| **Avg. Session Duration** | Time on site | >90s | Daily |
| **Scroll Depth** | % reaching bottom | >75% | Weekly |

#### Secondary KPIs

| KPI | Definition | Target | Frequency |
|-----|------------|--------|-----------|
| Scene Completion | All scenes viewed | >60% | Weekly |
| CTA Click Rate | Clicks / Views | >5% | Weekly |
| Form Start Rate | Form starts / CTA clicks | >80% | Weekly |
| Form Completion | Submits / Starts | >60% | Weekly |

#### Technical KPIs

| KPI | Definition | Target | Frequency |
|-----|------------|--------|-----------|
| LCP | Largest Contentful Paint | <2.5s | Daily |
| FPS | Frames per second | >55fps | Weekly |
| Error Rate | JS errors / Sessions | <1% | Daily |
| Fallback Rate | Fallback served | <5% | Weekly |

### 5. Reporting Framework

#### Daily Dashboard

| Metric | Visualization | Alert Threshold |
|--------|---------------|-----------------|
| Sessions | Line chart | <80% of average |
| Bounce Rate | Gauge | >50% |
| Conversion Rate | Gauge | <2% |
| Errors | Count | >10 |

#### Weekly Report Template

```markdown
## Weekly Performance Report

### Executive Summary
- Key wins:
- Concerns:
- Recommendations:

### Traffic Metrics
| Metric | This Week | Last Week | Change |
|--------|-----------|-----------|--------|
| Sessions | X | X | X% |
| Users | X | X | X% |
| Bounce Rate | X% | X% | X pp |

### Engagement Metrics
| Metric | This Week | Last Week | Change |
|--------|-----------|-----------|--------|
| Avg. Duration | Xs | Xs | X% |
| Scroll Depth | X% | X% | X pp |
| Scene Completion | X% | X% | X pp |

### Conversion Metrics
| Metric | This Week | Last Week | Change |
|--------|-----------|-----------|--------|
| Conversions | X | X | X% |
| CVR | X% | X% | X pp |
| Form Completion | X% | X% | X pp |

### Technical Performance
| Metric | This Week | Target | Status |
|--------|-----------|--------|--------|
| LCP | Xs | <2.5s | ✅/⚠️/❌ |
| FPS | Xfps | >55fps | ✅/⚠️/❌ |
| Errors | X | <10 | ✅/⚠️/❌ |
```

### 6. Attribution Model

#### Recommended Model

| Model | Use Case | Configuration |
|-------|----------|---------------|
| **Data-driven** | Sufficient data | GA4 default |
| **Position-based** | Limited data | 40/20/40 |
| **First-click** | Awareness focus | Custom |
| **Last-click** | Conversion focus | Comparison |

#### Channel Definitions

| Channel | Definition |
|---------|------------|
| Organic Search | Google/Bing non-paid |
| Paid Search | Google/Bing paid (gclid) |
| Social Organic | Social platform referrals |
| Social Paid | utm_medium=paid_social |
| Email | utm_medium=email |
| Direct | No referrer, no UTM |
| Referral | External sites |

### 7. Data Quality Standards

#### Validation Checklist

| Check | Frequency | Tool |
|-------|-----------|------|
| Event firing | Daily | GTM Preview |
| Data accuracy | Weekly | GA4 DebugView |
| Goal tracking | Weekly | GA4 Reports |
| Attribution | Monthly | GA4 Attribution |
| Cross-device | Monthly | GA4 User Explorer |

#### Common Issues & Fixes

| Issue | Detection | Fix |
|-------|-----------|-----|
| Missing events | Zero in reports | Check trigger conditions |
| Duplicate events | Inflated counts | Add trigger conditions |
| Wrong attribution | UTM override | Check GTM variable priority |
| Session splitting | Short sessions | Adjust timeout settings |

---

## ✅ MEASUREMENT IMPLEMENTATION CHECKLIST

### Setup
- [ ] GA4 property created
- [ ] GTM container installed
- [ ] Data layer implemented
- [ ] Custom events configured
- [ ] Goals/conversions defined

### Validation
- [ ] All events firing correctly
- [ ] Data appearing in reports
- [ ] Cross-domain tracking working
- [ ] Mobile tracking verified
- [ ] Conversion attribution correct

### Reporting
- [ ] Dashboard created
- [ ] Alerts configured
- [ ] Weekly report template ready
- [ ] Stakeholder access granted

---

## 📚 CROSS-REFERENCES

| Document | Content |
|----------|---------|
| C4-01 | Marketing integration |
| C4-02 | Conversion optimization |
| K4-03 | Metrics validation |
| R4-01 | Business metrics |

---

## 📊 DATA CLASSIFICATION

| Data Type | Classification | Source |
|-----------|----------------|--------|
| GA4 configuration | ✅ VERIFIED | Google Documentation |
| KPI definitions | ✅ VERIFIED | Industry standards |
| Attribution models | ✅ VERIFIED | Google Analytics |

---

**Document Status**: ✅ COMPLETED  
**Last Updated**: 2025-12-11  
**Owner**: Citra Dewi (Marketing Analyst)
