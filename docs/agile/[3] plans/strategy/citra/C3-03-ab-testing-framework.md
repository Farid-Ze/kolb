# C3-03: A/B Testing Framework
## Experimentation Standards for WebGL Experiences

---

## Document Information

| Field | Value |
|-------|-------|
| **Document ID** | C3-03 |
| **Sprint** | 3 - Implementation Planning |
| **Persona** | Citra Dewi A. (Marketing Analyst) |
| **Priority** | 🟡 MEDIUM |
| **Status** | ✅ COMPLETED |
| **Created** | 2025-12-11 |
| **References** | C2-01, C3-01, C3-02 |

---

## 📋 Executive Summary

This framework defines A/B testing standards for WebGL experiential websites. Based on Sprint 2 insights and Ruler Analytics 2025 benchmarks (3.5% B2B CVR), this document provides structured experimentation guidelines to optimize conversion while maintaining the immersive experience.

---

## 🔬 Testing Philosophy

### Core Principles

1. **Data-Driven Decisions**: Test hypotheses, not opinions
2. **Statistical Rigor**: Require significance before declaring winners
3. **User Experience First**: Never compromise core experience for optimization
4. **Iterative Learning**: Build on test insights systematically

### What to Test vs. What Not to Test

| ✅ Test These | ❌ Don't Test These |
|--------------|-------------------|
| CTA placement & copy | Core 3D experience fidelity |
| Form length & fields | Brand visual identity |
| Scene order/pacing | Fundamental navigation paradigm |
| Loading experience | Accessibility features |
| Content messaging | Security/privacy features |
| Social proof elements | Core product information |

---

## 📊 Experiment Prioritization

### PIE Framework

| Factor | Definition | Score |
|--------|------------|-------|
| **P**otential | How much improvement is possible? | 1-10 |
| **I**mportance | How valuable is the traffic to this page? | 1-10 |
| **E**ase | How easy is this to implement? | 1-10 |

**Priority Score** = (P + I + E) / 3

### Prioritization Matrix

| Experiment | Potential | Importance | Ease | PIE Score | Priority |
|------------|-----------|------------|------|-----------|----------|
| CTA Button Color/Text | 7 | 9 | 9 | 8.3 | 🔴 HIGH |
| Form Field Reduction | 8 | 9 | 7 | 8.0 | 🔴 HIGH |
| Scene Order | 6 | 8 | 5 | 6.3 | 🟡 MEDIUM |
| Loading Animation | 5 | 7 | 8 | 6.7 | 🟡 MEDIUM |
| Social Proof Placement | 6 | 6 | 8 | 6.7 | 🟡 MEDIUM |

---

## 🧪 Experiment Types

### Type 1: Element Tests (Quick Wins)

**Duration**: 1-2 weeks  
**Traffic Split**: 50/50  
**Sample Size**: ~1,000 conversions per variant

| Element | Variants to Test |
|---------|------------------|
| CTA Button | Color, Text, Size, Position |
| Headlines | Value prop variations |
| Images | Product angles, contexts |
| Social Proof | Testimonials, logos, stats |

### Type 2: Experience Tests (Medium Effort)

**Duration**: 2-4 weeks  
**Traffic Split**: 50/50 or 70/30  
**Sample Size**: ~500 conversions per variant

| Experience | Variants to Test |
|------------|------------------|
| Scene Flow | Order, pacing, transitions |
| Loading | Skeleton, progress bar, animation |
| Form UX | Steps, fields, inline validation |
| Navigation | Fixed, scroll, minimal |

### Type 3: Concept Tests (Strategic)

**Duration**: 4-8 weeks  
**Traffic Split**: 80/20 initially  
**Sample Size**: ~200 conversions per variant

| Concept | Variants to Test |
|---------|------------------|
| Narrative Structure | Linear vs. exploratory |
| Personalization | Static vs. dynamic content |
| Engagement Model | Passive scroll vs. active interaction |
| Value Proposition | Product-led vs. story-led |

---

## 📐 Sample Size Calculator

### Formula

```
n = (Z²α/2 × 2p(1-p)) / MDE²

Where:
- n = Sample size per variant
- Zα/2 = Z-score for confidence level (1.96 for 95%)
- p = Baseline conversion rate
- MDE = Minimum Detectable Effect
```

### Quick Reference

**Baseline CVR: 3.5%** (Ruler Analytics 2025 B2B benchmark)

| MDE (Relative Lift) | Sample per Variant | Total Sample |
|--------------------|-------------------|--------------|
| 10% lift (3.5% → 3.85%) | 38,400 | 76,800 |
| 15% lift (3.5% → 4.03%) | 17,100 | 34,200 |
| 20% lift (3.5% → 4.20%) | 9,600 | 19,200 |
| 25% lift (3.5% → 4.38%) | 6,150 | 12,300 |

### Calculator Implementation

```javascript
// ILLUSTRATIVE EXAMPLE - Sample Size Calculator

function calculateSampleSize(baselineRate, mde, confidence = 0.95, power = 0.8) {
  // Z-scores
  const zAlpha = confidence === 0.95 ? 1.96 : 2.58; // 95% or 99%
  const zBeta = power === 0.8 ? 0.84 : 1.28; // 80% or 90% power
  
  const p1 = baselineRate;
  const p2 = baselineRate * (1 + mde);
  const pBar = (p1 + p2) / 2;
  
  const numerator = Math.pow(zAlpha * Math.sqrt(2 * pBar * (1 - pBar)) + 
                    zBeta * Math.sqrt(p1 * (1 - p1) + p2 * (1 - p2)), 2);
  const denominator = Math.pow(p1 - p2, 2);
  
  return Math.ceil(numerator / denominator);
}

// Example usage
const sampleSize = calculateSampleSize(0.035, 0.15); // 3.5% baseline, 15% lift
console.log(`Required sample per variant: ${sampleSize}`);
```

---

## 🛠️ Testing Platform Selection

### Platform Comparison

| Platform | Best For | WebGL Support | Cost |
|----------|----------|---------------|------|
| Google Optimize | Simple tests | Limited | Free |
| VWO | Visual editor | Good | $$ |
| Optimizely | Enterprise | Excellent | $$$ |
| AB Tasty | UX testing | Good | $$ |
| LaunchDarkly | Feature flags | Excellent | $$ |

### Recommended: Hybrid Approach

```javascript
// ILLUSTRATIVE EXAMPLE - Feature Flag A/B Testing

class ExperimentManager {
  constructor() {
    this.experiments = new Map();
    this.userId = this.getUserId();
  }
  
  // Simple hash-based assignment
  assignVariant(experimentId, variants) {
    const hash = this.hashCode(`${this.userId}-${experimentId}`);
    const variantIndex = Math.abs(hash) % variants.length;
    return variants[variantIndex];
  }
  
  hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash;
  }
  
  runExperiment(experimentId, config) {
    const variant = this.assignVariant(experimentId, config.variants);
    
    // Track assignment
    this.trackAssignment(experimentId, variant);
    
    // Store for later reference
    this.experiments.set(experimentId, variant);
    
    return variant;
  }
  
  trackAssignment(experimentId, variant) {
    dataLayer.push({
      event: 'experiment_assignment',
      experiment: {
        id: experimentId,
        variant: variant
      }
    });
  }
  
  trackConversion(experimentId, conversionType) {
    const variant = this.experiments.get(experimentId);
    
    dataLayer.push({
      event: 'experiment_conversion',
      experiment: {
        id: experimentId,
        variant: variant,
        conversion: conversionType
      }
    });
  }
}

// Usage
const experimentManager = new ExperimentManager();

const ctaVariant = experimentManager.runExperiment('cta_test_001', {
  variants: ['control', 'variant_a', 'variant_b'],
  startDate: '2025-01-01',
  endDate: '2025-01-14'
});

// Apply variant
if (ctaVariant === 'variant_a') {
  document.querySelector('.cta').textContent = 'Start Your Journey';
} else if (ctaVariant === 'variant_b') {
  document.querySelector('.cta').textContent = 'Request Demo';
}
```

---

## 📋 Experiment Documentation Template

### Experiment Brief

```markdown
# Experiment: [Experiment Name]

## Hypothesis
If we [change], then [expected outcome] because [rationale].

## Metrics
- **Primary**: Conversion rate (form submissions / visitors)
- **Secondary**: 
  - Time to form start
  - Form completion rate
  - Bounce rate

## Variants
| Variant | Description | Screenshot |
|---------|-------------|------------|
| Control | Current state | [link] |
| Variant A | [Change] | [link] |
| Variant B | [Change] | [link] |

## Traffic Allocation
- Control: 33%
- Variant A: 33%
- Variant B: 34%

## Sample Size
- Required: X per variant
- Expected duration: Y weeks
- Minimum runtime: 2 full business cycles

## Success Criteria
- 95% statistical significance
- ≥10% relative lift in primary metric
- No degradation in secondary metrics >5%

## Risks & Mitigations
| Risk | Mitigation |
|------|------------|
| Low traffic | Extend duration |
| Technical issues | Kill switch ready |
| Seasonality | Account in analysis |
```

---

## 📊 Statistical Analysis

### Frequentist Approach

```javascript
// ILLUSTRATIVE EXAMPLE - Statistical Significance Calculator

function calculateSignificance(controlConv, controlTotal, variantConv, variantTotal) {
  const p1 = controlConv / controlTotal;
  const p2 = variantConv / variantTotal;
  
  const pPooled = (controlConv + variantConv) / (controlTotal + variantTotal);
  
  const se = Math.sqrt(pPooled * (1 - pPooled) * (1/controlTotal + 1/variantTotal));
  
  const zScore = (p2 - p1) / se;
  
  // Two-tailed p-value
  const pValue = 2 * (1 - normalCDF(Math.abs(zScore)));
  
  return {
    controlRate: (p1 * 100).toFixed(2) + '%',
    variantRate: (p2 * 100).toFixed(2) + '%',
    relativeLift: (((p2 - p1) / p1) * 100).toFixed(1) + '%',
    zScore: zScore.toFixed(3),
    pValue: pValue.toFixed(4),
    significant: pValue < 0.05
  };
}

function normalCDF(x) {
  const a1 =  0.254829592;
  const a2 = -0.284496736;
  const a3 =  1.421413741;
  const a4 = -1.453152027;
  const a5 =  1.061405429;
  const p  =  0.3275911;
  
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.sqrt(2);
  
  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  
  return 0.5 * (1.0 + sign * y);
}

// Example usage
const result = calculateSignificance(350, 10000, 420, 10000);
console.log(result);
// {
//   controlRate: "3.50%",
//   variantRate: "4.20%",
//   relativeLift: "20.0%",
//   zScore: "2.713",
//   pValue: "0.0067",
//   significant: true
// }
```

### Bayesian Approach (Alternative)

```javascript
// ILLUSTRATIVE EXAMPLE - Bayesian A/B Test

function bayesianABTest(controlConv, controlTotal, variantConv, variantTotal, simulations = 10000) {
  // Beta distribution sampling
  const controlSamples = [];
  const variantSamples = [];
  
  for (let i = 0; i < simulations; i++) {
    controlSamples.push(betaSample(controlConv + 1, controlTotal - controlConv + 1));
    variantSamples.push(betaSample(variantConv + 1, variantTotal - variantConv + 1));
  }
  
  // Calculate probability variant > control
  let variantWins = 0;
  for (let i = 0; i < simulations; i++) {
    if (variantSamples[i] > controlSamples[i]) {
      variantWins++;
    }
  }
  
  const probabilityVariantBetter = variantWins / simulations;
  
  return {
    probabilityVariantBetter: (probabilityVariantBetter * 100).toFixed(1) + '%',
    recommendation: probabilityVariantBetter > 0.95 ? 'Implement Variant' : 'Continue Testing'
  };
}
```

---

## 🚫 Common Pitfalls to Avoid

### Statistical Pitfalls

| Pitfall | Description | Prevention |
|---------|-------------|------------|
| Peeking | Checking results early | Pre-define end date |
| Multiple Testing | Too many variants | Limit to 3-4 variants |
| Selection Bias | Uneven segments | Random assignment |
| Novelty Effect | Short-term reaction | Run minimum 2 weeks |
| Seasonality | Day/week variations | Include full cycles |

### Technical Pitfalls

| Pitfall | Description | Prevention |
|---------|-------------|------------|
| Flicker | Original shows briefly | Server-side implementation |
| Bot Traffic | Skewed results | Filter in analysis |
| Caching Issues | Wrong variant served | Cache-aware implementation |
| Tracking Gaps | Missing conversions | End-to-end QA |

---

## 📅 Testing Roadmap

### Q1 2025 Experiment Plan

| Week | Experiment | Type | Expected Lift |
|------|------------|------|---------------|
| 1-2 | CTA Text Variants | Element | 15% |
| 3-4 | Form Field Reduction | Experience | 20% |
| 5-6 | Loading Experience | Experience | 10% |
| 7-8 | Scene Order Test | Experience | 12% |
| 9-12 | Personalized Content | Concept | 25% |

---

## ✅ Implementation Checklist

### Pre-Experiment

- [ ] Hypothesis documented and approved
- [ ] Sample size calculated
- [ ] Tracking implemented and verified
- [ ] QA on all variants
- [ ] Kill switch tested
- [ ] Stakeholders informed

### During Experiment

- [ ] Daily monitoring (technical only)
- [ ] No changes to variants
- [ ] Document any anomalies
- [ ] Monitor for technical issues

### Post-Experiment

- [ ] Allow sufficient sample size
- [ ] Run statistical analysis
- [ ] Document learnings
- [ ] Implement winner (if significant)
- [ ] Plan follow-up tests

---

## 🔗 Cross-References

| Document | Relationship |
|----------|--------------|
| C2-01 (Conversion Analysis) | Baseline metrics |
| C3-01 (Conversion Optimization) | Optimization areas |
| C3-02 (Analytics Guide) | Tracking implementation |
| R3-01 (Business Impact) | ROI measurement |

---

## 📊 Data Classification

| Category | Classification |
|----------|----------------|
| **Primary Data** | Ruler Analytics 2025 (3.5% B2B CVR) |
| **Industry Standards** | Statistical testing best practices |
| **Code Examples** | Illustrative (not from live site) |
| **Formulas** | Standard statistical methods |

---

*Document Status: ✅ COMPLETED*
*Last Updated: 2025-12-11*
