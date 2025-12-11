# R3-03: Success Metrics Definition
## KPI Framework for WebGL Experience Projects

---

## Document Information

| Field | Value |
|-------|-------|
| **Document ID** | R3-03 |
| **Sprint** | 3 - Implementation Planning |
| **Persona** | Rizky Maulana (Business Analyst) |
| **Priority** | 🔴 HIGH |
| **Status** | ✅ COMPLETED |
| **Created** | 2025-12-11 |
| **References** | R2-01, R2-03, R3-01, C3-02 |

---

## 📋 Executive Summary

This document defines the complete success metrics framework for WebGL experiential projects. Based on Sprint 2 analysis and verified industry benchmarks, these KPIs enable objective measurement of project success across business, engagement, and technical dimensions.

---

## 📊 KPI Framework Structure

### Three-Tier Metrics Model

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SUCCESS METRICS HIERARCHY                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  TIER 1: BUSINESS OUTCOMES (North Star Metrics)              │   │
│  │  • Revenue Impact  • Lead Generation  • ROI                  │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                       │
│                              ▼                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  TIER 2: ENGAGEMENT METRICS (Leading Indicators)             │   │
│  │  • Conversion Rate  • Time on Site  • Scroll Depth           │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                       │
│                              ▼                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  TIER 3: OPERATIONAL METRICS (Health Indicators)             │   │
│  │  • Performance  • Accessibility  • Error Rates               │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🎯 TIER 1: Business Outcome Metrics

### Primary KPIs

| Metric | Definition | Target | Benchmark Source |
|--------|------------|--------|------------------|
| **Lead Conversion Rate** | Form submissions / Unique visitors | ≥3.5% | Ruler Analytics 2025 |
| **Cost Per Lead (CPL)** | Total investment / Leads generated | <$150 | Industry average |
| **Return on Investment** | (Revenue - Cost) / Cost × 100 | ≥200% (Y1) | Internal target |
| **Lead Quality Score** | % of leads progressing to opportunity | ≥25% | CRM benchmark |

### Calculation Methods

```javascript
// ILLUSTRATIVE EXAMPLE - Business Metrics Calculations

const businessMetrics = {
  // Lead Conversion Rate
  leadConversionRate: (formSubmissions, uniqueVisitors) => {
    return (formSubmissions / uniqueVisitors) * 100;
  },
  
  // Cost Per Lead
  costPerLead: (totalInvestment, leadsGenerated) => {
    return totalInvestment / leadsGenerated;
  },
  
  // Return on Investment
  roi: (revenueGenerated, totalInvestment) => {
    return ((revenueGenerated - totalInvestment) / totalInvestment) * 100;
  },
  
  // Lead Quality Score
  leadQualityScore: (opportunitiesCreated, totalLeads) => {
    return (opportunitiesCreated / totalLeads) * 100;
  },
  
  // Customer Acquisition Cost
  cac: (totalMarketingSpend, customersAcquired) => {
    return totalMarketingSpend / customersAcquired;
  },
  
  // Lifetime Value to CAC Ratio
  ltvCacRatio: (averageLifetimeValue, cac) => {
    return averageLifetimeValue / cac;
  }
};

// Example usage
const lcr = businessMetrics.leadConversionRate(350, 10000);
console.log(`Lead Conversion Rate: ${lcr.toFixed(2)}%`); // 3.50%
```

### Measurement Cadence

| Metric | Frequency | Report Type | Stakeholders |
|--------|-----------|-------------|--------------|
| Lead CVR | Daily | Dashboard | Marketing |
| CPL | Weekly | Report | Marketing, Finance |
| ROI | Monthly | Executive Report | Leadership |
| Lead Quality | Monthly | CRM Report | Sales, Marketing |

---

## 📈 TIER 2: Engagement Metrics

### Core Engagement KPIs

| Metric | Definition | Target | Benchmark |
|--------|------------|--------|-----------|
| **Scroll Depth** | % of page scrolled | ≥70% | 52% (Contentsquare) |
| **Time on Page** | Active time spent | ≥90s | 52s (Contentsquare) |
| **Interaction Rate** | Sessions with interactions | ≥35% | ~20% (estimated) |
| **Bounce Rate** | Single-page sessions | ≤40% | 56% (Contentsquare) |
| **Return Visitor Rate** | Returning / Total | ≥15% | 10-12% (typical) |

### Scene-Level Metrics

| Metric | Definition | Target |
|--------|------------|--------|
| **Scene Completion Rate** | Users completing scene | ≥75% per scene |
| **Scene Dwell Time** | Time spent in scene | 15-30s per scene |
| **Scene Drop-off Rate** | Users leaving at scene | <25% per scene |
| **Interaction per Scene** | Avg clicks/taps | ≥1 per scene |

### Engagement Funnel

```
┌───────────────────────────────────────────────────────────────┐
│                  ENGAGEMENT FUNNEL                             │
├───────────────────────────────────────────────────────────────┤
│                                                                │
│  Page Load         ████████████████████████████████  100%     │
│                              │                                 │
│  WebGL Loaded      ██████████████████████████████    95%      │
│                              │                                 │
│  Scene 1 Complete  ████████████████████████████      85%      │
│                              │                                 │
│  Scene 2 Complete  ██████████████████████            65%      │
│                              │                                 │
│  Scene 3 Complete  ████████████████                  50%      │
│                              │                                 │
│  CTA Visible       ████████████████                  50%      │
│                              │                                 │
│  CTA Clicked       ████████████                      35%      │
│                              │                                 │
│  Form Started      ████████                          25%      │
│                              │                                 │
│  Form Completed    █████                             15%      │
│                              │                                 │
│  Lead Generated    ████                              3.5%     │
│                                                                │
└───────────────────────────────────────────────────────────────┘
```

### Engagement Tracking Implementation

```javascript
// ILLUSTRATIVE EXAMPLE - Engagement Tracking

class EngagementMetrics {
  constructor() {
    this.metrics = {
      scrollDepth: 0,
      timeOnPage: 0,
      interactions: [],
      scenesViewed: new Set(),
      scenesDwellTime: {}
    };
    
    this.startTime = Date.now();
    this.currentScene = null;
    this.sceneStartTime = null;
    
    this.init();
  }
  
  init() {
    // Scroll depth tracking
    window.addEventListener('scroll', () => {
      const scrollPercent = window.scrollY / 
        (document.documentElement.scrollHeight - window.innerHeight);
      this.metrics.scrollDepth = Math.max(
        this.metrics.scrollDepth, 
        Math.round(scrollPercent * 100)
      );
    });
    
    // Interaction tracking
    document.addEventListener('click', (e) => {
      const interactive = e.target.closest('[data-track]');
      if (interactive) {
        this.metrics.interactions.push({
          type: 'click',
          element: interactive.dataset.track,
          timestamp: Date.now() - this.startTime
        });
      }
    });
    
    // Time tracking (active time)
    setInterval(() => {
      if (document.visibilityState === 'visible') {
        this.metrics.timeOnPage += 1;
      }
    }, 1000);
    
    // Send on unload
    window.addEventListener('beforeunload', () => this.sendMetrics());
  }
  
  trackSceneEnter(sceneName) {
    this.currentScene = sceneName;
    this.sceneStartTime = Date.now();
    this.metrics.scenesViewed.add(sceneName);
    
    dataLayer.push({
      event: 'scene_enter',
      scene_name: sceneName
    });
  }
  
  trackSceneExit(sceneName) {
    if (this.currentScene === sceneName && this.sceneStartTime) {
      const dwellTime = (Date.now() - this.sceneStartTime) / 1000;
      this.metrics.scenesDwellTime[sceneName] = 
        (this.metrics.scenesDwellTime[sceneName] || 0) + dwellTime;
      
      dataLayer.push({
        event: 'scene_exit',
        scene_name: sceneName,
        dwell_time: dwellTime
      });
    }
  }
  
  sendMetrics() {
    dataLayer.push({
      event: 'engagement_complete',
      engagement: {
        scroll_depth: this.metrics.scrollDepth,
        time_on_page: this.metrics.timeOnPage,
        interaction_count: this.metrics.interactions.length,
        scenes_viewed: this.metrics.scenesViewed.size,
        total_scenes: 5 // Configure based on site
      }
    });
  }
  
  getEngagementScore() {
    // Composite engagement score (0-100)
    const scrollScore = this.metrics.scrollDepth * 0.3;
    const timeScore = Math.min(this.metrics.timeOnPage / 120, 1) * 100 * 0.3;
    const interactionScore = Math.min(this.metrics.interactions.length / 10, 1) * 100 * 0.2;
    const sceneScore = (this.metrics.scenesViewed.size / 5) * 100 * 0.2;
    
    return Math.round(scrollScore + timeScore + interactionScore + sceneScore);
  }
}
```

---

## ⚙️ TIER 3: Operational Metrics

### Performance KPIs

| Metric | Definition | Target | Measurement |
|--------|------------|--------|-------------|
| **Load Time** | Time to interactive | <3s | Lighthouse |
| **Frame Rate** | Average FPS | ≥55fps | Performance API |
| **Error Rate** | JS errors / sessions | <0.5% | Error tracking |
| **Uptime** | Available time / Total | ≥99.9% | Monitoring |
| **Core Web Vitals** | LCP, FID, CLS | Pass | PageSpeed Insights |

### Technical Health Metrics

| Metric | Definition | Target |
|--------|------------|--------|
| **LCP** | Largest Contentful Paint | <2.5s |
| **FID** | First Input Delay | <100ms |
| **CLS** | Cumulative Layout Shift | <0.1 |
| **TTI** | Time to Interactive | <3.8s |
| **TBT** | Total Blocking Time | <300ms |

### Accessibility Metrics

| Metric | Definition | Target |
|--------|------------|--------|
| **Lighthouse Accessibility** | Automated score | ≥90 |
| **WCAG Violations** | Critical issues | 0 |
| **Keyboard Navigable** | Full keyboard access | 100% |
| **Screen Reader Compatible** | Content accessible | Yes |

### Performance Monitoring

```javascript
// ILLUSTRATIVE EXAMPLE - Performance Metrics Collection

class PerformanceMetrics {
  constructor() {
    this.metrics = {};
    this.collectCoreWebVitals();
    this.collectCustomMetrics();
  }
  
  collectCoreWebVitals() {
    // LCP
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.metrics.lcp = lastEntry.startTime;
    }).observe({ type: 'largest-contentful-paint', buffered: true });
    
    // FID
    new PerformanceObserver((list) => {
      const firstInput = list.getEntries()[0];
      this.metrics.fid = firstInput.processingStart - firstInput.startTime;
    }).observe({ type: 'first-input', buffered: true });
    
    // CLS
    let clsValue = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      }
      this.metrics.cls = clsValue;
    }).observe({ type: 'layout-shift', buffered: true });
  }
  
  collectCustomMetrics() {
    // WebGL load time
    window.addEventListener('webgl-ready', (e) => {
      this.metrics.webglLoadTime = e.detail.loadTime;
    });
    
    // FPS monitoring
    let frameCount = 0;
    let lastTime = performance.now();
    
    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        this.metrics.currentFPS = frameCount;
        frameCount = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(measureFPS);
    };
    measureFPS();
  }
  
  getReport() {
    return {
      coreWebVitals: {
        lcp: this.metrics.lcp,
        fid: this.metrics.fid,
        cls: this.metrics.cls,
        passing: this.checkCWVPass()
      },
      custom: {
        webglLoadTime: this.metrics.webglLoadTime,
        averageFPS: this.metrics.currentFPS
      }
    };
  }
  
  checkCWVPass() {
    return (
      this.metrics.lcp < 2500 &&
      this.metrics.fid < 100 &&
      this.metrics.cls < 0.1
    );
  }
}
```

---

## 📊 Dashboard Specification

### Executive Dashboard

```
┌─────────────────────────────────────────────────────────────────────┐
│                    EXECUTIVE KPI DASHBOARD                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐│
│  │ Lead CVR    │  │ ROI         │  │ Engagement  │  │ Performance ││
│  │   3.5%      │  │   215%      │  │    78/100   │  │   Pass ✓    ││
│  │   ▲ +0.5%   │  │   ▲ +15%    │  │   ▲ +12    │  │   All Green ││
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘│
│                                                                      │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  CONVERSION FUNNEL (Last 30 Days)                              │ │
│  │  Visits → WebGL → Scroll 50% → CTA View → Form → Lead         │ │
│  │  10,000 → 9,500 → 6,500 → 5,000 → 2,500 → 350                 │ │
│  │   100%  →  95%  →  65%  →  50%  →  25%  → 3.5%                │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌──────────────────────────┐  ┌──────────────────────────┐       │
│  │  TREND: Lead CVR         │  │  DEVICE BREAKDOWN        │       │
│  │  [Line chart 90 days]    │  │  Desktop: 4.2% CVR       │       │
│  │                          │  │  Mobile:  2.1% CVR       │       │
│  │                          │  │  Tablet:  3.5% CVR       │       │
│  └──────────────────────────┘  └──────────────────────────┘       │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Reporting Schedule

| Report | Frequency | Audience | Metrics |
|--------|-----------|----------|---------|
| Real-time Dashboard | Live | Operations | Performance, Errors |
| Daily KPI Email | Daily | Marketing | CVR, Traffic, Leads |
| Weekly Performance | Weekly | Team | All Tier 2 & 3 |
| Monthly Business Review | Monthly | Leadership | All Tier 1 |
| Quarterly ROI Report | Quarterly | Executive | ROI, LTV, Strategic |

---

## 🎯 Target Setting Framework

### SMART Targets

| Metric | Specific | Measurable | Achievable | Relevant | Time-bound |
|--------|----------|------------|------------|----------|------------|
| Lead CVR | Increase conversion rate | 3.5% target | +20% from baseline | Core business goal | Q1 2025 |
| ROI | Positive return | 200% target | Industry comparable | Financial sustainability | Year 1 |
| Engagement | Improve scroll depth | 70% target | +35% improvement | Indicates content value | Month 3 |

### Target Validation

```javascript
// ILLUSTRATIVE EXAMPLE - Target Feasibility Check

function validateTarget(baseline, target, industryBenchmark) {
  const improvement = ((target - baseline) / baseline) * 100;
  const feasibility = {
    improvement: improvement.toFixed(1) + '%',
    vsIndustry: ((target / industryBenchmark) * 100).toFixed(1) + '%',
    difficulty: 'Medium',
    confidence: 'High'
  };
  
  // Difficulty assessment
  if (improvement > 50) {
    feasibility.difficulty = 'Very Hard';
    feasibility.confidence = 'Low';
  } else if (improvement > 30) {
    feasibility.difficulty = 'Hard';
    feasibility.confidence = 'Medium';
  } else if (improvement > 15) {
    feasibility.difficulty = 'Medium';
    feasibility.confidence = 'High';
  } else {
    feasibility.difficulty = 'Easy';
    feasibility.confidence = 'Very High';
  }
  
  return feasibility;
}

// Example
const cvr = validateTarget(2.8, 3.5, 3.5);
// { improvement: "25.0%", vsIndustry: "100.0%", difficulty: "Medium", confidence: "High" }
```

---

## ✅ Implementation Checklist

### Pre-Launch

- [ ] All KPIs defined and documented
- [ ] Tracking code implemented (see C3-02)
- [ ] Dashboard configured
- [ ] Baseline metrics captured
- [ ] Targets approved by stakeholders
- [ ] Alert thresholds set

### Post-Launch

- [ ] Daily monitoring active
- [ ] Weekly reports automated
- [ ] Monthly reviews scheduled
- [ ] Quarterly ROI analysis planned
- [ ] Optimization recommendations documented

---

## 🔗 Cross-References

| Document | Relationship |
|----------|--------------|
| R2-01 (ROI Calculation) | ROI methodology |
| R3-01 (Business Impact) | Impact projections |
| R3-02 (Business Case) | Justification template |
| C3-02 (Analytics Guide) | Tracking implementation |
| K3-03 (Monitoring) | Technical metrics |

---

## 📊 Data Classification

| Category | Classification |
|----------|----------------|
| **Primary Data** | Ruler Analytics 2025, Contentsquare 2024 |
| **Targets** | Based on verified benchmarks |
| **Code Examples** | Illustrative (not from live site) |
| **Framework** | Industry-standard KPI methodology |

---

*Document Status: ✅ COMPLETED*
*Last Updated: 2025-12-11*
