# K3-03: Performance Monitoring Dashboard Specification

## 📋 METADATA
- **Persona**: Kevin Wijaya - Frontend Performance Specialist
- **Task ID**: K3-03
- **Date**: 2025-12-11
- **Sprint**: Sprint 3 - Implementation Planning
- **Status**: ✅ COMPLETED
- **Priority**: 🟡 MEDIUM

> [!IMPORTANT]
> **Data Classification for This Plan**
> 
> | Data Type | Status | Source |
> |-----------|--------|--------|
> | Core Web Vitals | ✅ **VERIFIED** | Google/web.dev |
> | RAIL Model | ✅ **VERIFIED** | Google Chrome |
> | Metrics | ⚠️ **RECOMMENDATION** | Based on best practices |

---

## 🎯 OBJECTIVE

Implement real-time performance monitoring dashboard to track Core Web Vitals, WebGL metrics, and user experience indicators in production.

---

## 📊 KEY METRICS

### Core Web Vitals (Google)

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| LCP (Largest Contentful Paint) | ≤2.5s | 2.5-4.0s | >4.0s |
| FID (First Input Delay) | ≤100ms | 100-300ms | >300ms |
| CLS (Cumulative Layout Shift) | ≤0.1 | 0.1-0.25 | >0.25 |
| INP (Interaction to Next Paint) | ≤200ms | 200-500ms | >500ms |

### WebGL Performance Metrics

| Metric | Target | Warning | Critical |
|--------|--------|---------|----------|
| FPS | ≥55 | 30-55 | <30 |
| Frame Time | ≤18ms | 18-33ms | >33ms |
| Draw Calls | <200 | 200-300 | >300 |
| GPU Memory | <256MB | 256-512MB | >512MB |

### Loading Metrics

| Metric | Target | Warning | Critical |
|--------|--------|---------|----------|
| TTFB | <200ms | 200-500ms | >500ms |
| FCP | <1.0s | 1.0-2.5s | >2.5s |
| TTI | <3.0s | 3.0-5.0s | >5.0s |
| Total Load | <3.0s | 3.0-5.0s | >5.0s |

---

## 🔧 IMPLEMENTATION

### Performance Observer Setup

```javascript
// Core Web Vitals monitoring
class PerformanceMonitor {
  constructor() {
    this.metrics = {};
    this.observers = [];
    this.reportCallback = null;
  }
  
  init() {
    this.observeLCP();
    this.observeFID();
    this.observeCLS();
    this.observeINP();
    this.observeLongTasks();
    this.observeResources();
  }
  
  observeLCP() {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.metrics.lcp = lastEntry.startTime;
      this.report('LCP', this.metrics.lcp);
    });
    
    observer.observe({ type: 'largest-contentful-paint', buffered: true });
    this.observers.push(observer);
  }
  
  observeFID() {
    const observer = new PerformanceObserver((list) => {
      const entry = list.getEntries()[0];
      this.metrics.fid = entry.processingStart - entry.startTime;
      this.report('FID', this.metrics.fid);
    });
    
    observer.observe({ type: 'first-input', buffered: true });
    this.observers.push(observer);
  }
  
  observeCLS() {
    let clsValue = 0;
    let sessionValue = 0;
    let sessionEntries = [];
    
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          const firstEntry = sessionEntries[0];
          const lastEntry = sessionEntries[sessionEntries.length - 1];
          
          if (sessionValue &&
              entry.startTime - lastEntry.startTime < 1000 &&
              entry.startTime - firstEntry.startTime < 5000) {
            sessionValue += entry.value;
            sessionEntries.push(entry);
          } else {
            sessionValue = entry.value;
            sessionEntries = [entry];
          }
          
          if (sessionValue > clsValue) {
            clsValue = sessionValue;
            this.metrics.cls = clsValue;
            this.report('CLS', clsValue);
          }
        }
      }
    });
    
    observer.observe({ type: 'layout-shift', buffered: true });
    this.observers.push(observer);
  }
  
  observeINP() {
    let maxDuration = 0;
    
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > maxDuration) {
          maxDuration = entry.duration;
          this.metrics.inp = maxDuration;
          this.report('INP', maxDuration);
        }
      }
    });
    
    observer.observe({ type: 'event', buffered: true, durationThreshold: 16 });
    this.observers.push(observer);
  }
  
  observeLongTasks() {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.report('LongTask', {
          duration: entry.duration,
          startTime: entry.startTime,
          name: entry.name
        });
      }
    });
    
    observer.observe({ type: 'longtask', buffered: true });
    this.observers.push(observer);
  }
  
  observeResources() {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.initiatorType === 'fetch' || entry.initiatorType === 'xmlhttprequest') {
          this.report('Resource', {
            name: entry.name,
            duration: entry.duration,
            size: entry.transferSize
          });
        }
      }
    });
    
    observer.observe({ type: 'resource', buffered: true });
    this.observers.push(observer);
  }
  
  report(metric, value) {
    console.log(`[Performance] ${metric}:`, value);
    
    if (this.reportCallback) {
      this.reportCallback(metric, value);
    }
    
    // Send to analytics
    if (window.gtag) {
      gtag('event', 'web_vitals', {
        event_category: 'Performance',
        event_label: metric,
        value: typeof value === 'number' ? Math.round(value) : 0,
        metric_value: value,
        non_interaction: true
      });
    }
  }
  
  getMetrics() {
    return { ...this.metrics };
  }
  
  destroy() {
    this.observers.forEach(o => o.disconnect());
    this.observers = [];
  }
}

// Initialize
const perfMonitor = new PerformanceMonitor();
perfMonitor.init();
```

### WebGL Performance Tracking

```javascript
// WebGL-specific metrics
class WebGLMonitor {
  constructor(renderer) {
    this.renderer = renderer;
    this.metrics = {
      fps: [],
      frameTime: [],
      drawCalls: [],
      triangles: [],
      memory: []
    };
    this.lastTime = performance.now();
  }
  
  sample() {
    const now = performance.now();
    const delta = now - this.lastTime;
    this.lastTime = now;
    
    // FPS
    const fps = 1000 / delta;
    this.metrics.fps.push(fps);
    
    // Frame time
    this.metrics.frameTime.push(delta);
    
    // Renderer stats
    const info = this.renderer.info;
    this.metrics.drawCalls.push(info.render.calls);
    this.metrics.triangles.push(info.render.triangles);
    this.metrics.memory.push(info.memory.geometries + info.memory.textures);
    
    // Keep last 300 samples (5 seconds at 60fps)
    Object.keys(this.metrics).forEach(key => {
      if (this.metrics[key].length > 300) {
        this.metrics[key].shift();
      }
    });
  }
  
  getStats() {
    const average = arr => arr.length ? arr.reduce((a, b) => a + b) / arr.length : 0;
    const percentile = (arr, p) => {
      const sorted = [...arr].sort((a, b) => a - b);
      const index = Math.ceil((p / 100) * sorted.length) - 1;
      return sorted[index] || 0;
    };
    
    return {
      fps: {
        avg: average(this.metrics.fps),
        min: Math.min(...this.metrics.fps),
        p5: percentile(this.metrics.fps, 5)
      },
      frameTime: {
        avg: average(this.metrics.frameTime),
        max: Math.max(...this.metrics.frameTime),
        p95: percentile(this.metrics.frameTime, 95)
      },
      drawCalls: {
        avg: average(this.metrics.drawCalls),
        max: Math.max(...this.metrics.drawCalls)
      },
      triangles: {
        avg: average(this.metrics.triangles),
        max: Math.max(...this.metrics.triangles)
      }
    };
  }
}
```

### Dashboard UI Component

```html
<!-- Performance Dashboard Overlay -->
<div id="perf-dashboard" class="perf-dashboard" hidden>
  <button class="perf-toggle" aria-label="Toggle performance dashboard">📊</button>
  
  <div class="perf-panel">
    <h3>Performance Monitor</h3>
    
    <!-- Core Web Vitals -->
    <div class="perf-section">
      <h4>Core Web Vitals</h4>
      <div class="perf-metric">
        <span class="metric-label">LCP</span>
        <span class="metric-value" id="metric-lcp">--</span>
        <span class="metric-unit">s</span>
        <span class="metric-status" id="status-lcp">⏳</span>
      </div>
      <div class="perf-metric">
        <span class="metric-label">FID</span>
        <span class="metric-value" id="metric-fid">--</span>
        <span class="metric-unit">ms</span>
        <span class="metric-status" id="status-fid">⏳</span>
      </div>
      <div class="perf-metric">
        <span class="metric-label">CLS</span>
        <span class="metric-value" id="metric-cls">--</span>
        <span class="metric-unit"></span>
        <span class="metric-status" id="status-cls">⏳</span>
      </div>
    </div>
    
    <!-- WebGL Stats -->
    <div class="perf-section">
      <h4>WebGL Performance</h4>
      <div class="perf-metric">
        <span class="metric-label">FPS</span>
        <span class="metric-value" id="metric-fps">--</span>
        <span class="metric-unit"></span>
        <span class="metric-status" id="status-fps">⏳</span>
      </div>
      <div class="perf-metric">
        <span class="metric-label">Draw Calls</span>
        <span class="metric-value" id="metric-draws">--</span>
        <span class="metric-unit"></span>
        <span class="metric-status" id="status-draws">⏳</span>
      </div>
      <div class="perf-metric">
        <span class="metric-label">Triangles</span>
        <span class="metric-value" id="metric-tris">--</span>
        <span class="metric-unit">K</span>
        <span class="metric-status" id="status-tris">⏳</span>
      </div>
    </div>
    
    <!-- Memory -->
    <div class="perf-section">
      <h4>Memory</h4>
      <div class="perf-metric">
        <span class="metric-label">JS Heap</span>
        <span class="metric-value" id="metric-heap">--</span>
        <span class="metric-unit">MB</span>
        <span class="metric-status" id="status-heap">⏳</span>
      </div>
    </div>
  </div>
</div>
```

```css
/* Dashboard Styles */
.perf-dashboard {
  position: fixed;
  bottom: 20px;
  left: 20px;
  z-index: 10000;
  font-family: 'Roboto Mono', monospace;
  font-size: 12px;
}

.perf-toggle {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  cursor: pointer;
  font-size: 18px;
}

.perf-panel {
  position: absolute;
  bottom: 50px;
  left: 0;
  width: 280px;
  background: rgba(0, 0, 0, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 16px;
  display: none;
}

.perf-dashboard.open .perf-panel {
  display: block;
}

.perf-panel h3 {
  margin: 0 0 12px;
  font-size: 14px;
  color: #F7C948;
}

.perf-section {
  margin-bottom: 16px;
}

.perf-section h4 {
  margin: 0 0 8px;
  font-size: 11px;
  color: #888;
  text-transform: uppercase;
}

.perf-metric {
  display: flex;
  align-items: center;
  padding: 4px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.metric-label {
  flex: 1;
  color: #CCC;
}

.metric-value {
  font-weight: bold;
  color: #FFF;
  min-width: 60px;
  text-align: right;
}

.metric-unit {
  color: #888;
  width: 30px;
  text-align: left;
  margin-left: 4px;
}

.metric-status {
  width: 20px;
  text-align: center;
}

/* Status Colors */
.status-good { color: #4CAF50; }
.status-warning { color: #FFC107; }
.status-critical { color: #F44336; }
```

### Dashboard Controller

```javascript
// Dashboard controller
class PerformanceDashboard {
  constructor() {
    this.element = document.getElementById('perf-dashboard');
    this.perfMonitor = new PerformanceMonitor();
    this.webglMonitor = null;
    this.updateInterval = null;
    
    this.thresholds = {
      lcp: { good: 2500, poor: 4000 },
      fid: { good: 100, poor: 300 },
      cls: { good: 0.1, poor: 0.25 },
      fps: { good: 55, poor: 30 },
      drawCalls: { good: 200, poor: 300 }
    };
  }
  
  init(renderer) {
    // Show in dev mode
    if (location.hostname === 'localhost' || location.search.includes('debug')) {
      this.element.hidden = false;
    }
    
    // Initialize monitors
    this.perfMonitor.init();
    this.perfMonitor.reportCallback = (metric, value) => this.updateMetric(metric, value);
    
    if (renderer) {
      this.webglMonitor = new WebGLMonitor(renderer);
      this.startWebGLUpdates();
    }
    
    // Toggle button
    this.element.querySelector('.perf-toggle').addEventListener('click', () => {
      this.element.classList.toggle('open');
    });
    
    // Memory monitoring
    this.startMemoryUpdates();
  }
  
  updateMetric(metric, value) {
    const formatValue = (m, v) => {
      switch (m) {
        case 'LCP': return (v / 1000).toFixed(2);
        case 'FID': return Math.round(v);
        case 'CLS': return v.toFixed(3);
        case 'INP': return Math.round(v);
        default: return v;
      }
    };
    
    const getStatus = (m, v) => {
      const key = m.toLowerCase();
      const threshold = this.thresholds[key];
      if (!threshold) return 'good';
      
      if (v <= threshold.good) return 'good';
      if (v <= threshold.poor) return 'warning';
      return 'critical';
    };
    
    const statusEmoji = {
      good: '✅',
      warning: '⚠️',
      critical: '❌'
    };
    
    const valueEl = document.getElementById(`metric-${metric.toLowerCase()}`);
    const statusEl = document.getElementById(`status-${metric.toLowerCase()}`);
    
    if (valueEl) {
      valueEl.textContent = formatValue(metric, value);
    }
    
    if (statusEl) {
      const status = getStatus(metric, value);
      statusEl.textContent = statusEmoji[status];
      statusEl.className = `metric-status status-${status}`;
    }
  }
  
  startWebGLUpdates() {
    this.updateInterval = setInterval(() => {
      if (!this.webglMonitor) return;
      
      this.webglMonitor.sample();
      const stats = this.webglMonitor.getStats();
      
      this.updateMetric('FPS', stats.fps.avg);
      this.updateMetric('draws', stats.drawCalls.avg);
      this.updateMetric('tris', stats.triangles.avg / 1000);
    }, 1000);
  }
  
  startMemoryUpdates() {
    if (performance.memory) {
      setInterval(() => {
        const usedHeap = performance.memory.usedJSHeapSize / 1024 / 1024;
        document.getElementById('metric-heap').textContent = usedHeap.toFixed(1);
      }, 2000);
    }
  }
  
  destroy() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    this.perfMonitor.destroy();
  }
}

// Initialize with renderer
const dashboard = new PerformanceDashboard();
dashboard.init(renderer);
```

---

## 📊 REPORTING TO ANALYTICS

```javascript
// Send Core Web Vitals to analytics
function sendToAnalytics(metric, value) {
  // Google Analytics 4
  if (window.gtag) {
    gtag('event', metric, {
      event_category: 'Web Vitals',
      value: Math.round(metric === 'CLS' ? value * 1000 : value),
      metric_id: `v3-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      metric_value: value,
      metric_delta: value
    });
  }
  
  // Custom endpoint
  navigator.sendBeacon('/api/analytics/vitals', JSON.stringify({
    metric,
    value,
    url: location.href,
    timestamp: Date.now(),
    userAgent: navigator.userAgent
  }));
}
```

---

## 🔗 CROSS-REFERENCES

- **K3-01**: Optimization roadmap (input)
- **K3-02**: Asset loading strategy (input)
- **R3-01**: Business impact tracking (alignment)
- **Sprint 4**: Measurement & Validation

---
