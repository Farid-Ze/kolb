# R4-03: ROI Calculation Templates

## 📋 METADATA
- **Task ID**: R4-03
- **Persona**: Rizky Firmansyah (Business Analyst)
- **Sprint**: 4 - Validation & Handoff
- **Status**: ✅ COMPLETED
- **Created**: 2025-12-11
- **Dependencies**: R2-01, R3-01, R4-01

---

## 🎯 OBJECTIVE

Provide ready-to-use ROI calculation templates for Zenotika WebGL experiential projects.

---

## 📊 ROI CALCULATION TEMPLATES

### 1. Basic ROI Calculator

#### Formula
```
ROI = ((Total Returns - Total Investment) / Total Investment) × 100
```

#### Template

| Line Item | Amount | Notes |
|-----------|--------|-------|
| **INVESTMENT** | | |
| Development costs | $ | One-time |
| Design costs | $ | One-time |
| Infrastructure (Year 1) | $ | Annual |
| Marketing costs | $ | Campaign-specific |
| Maintenance (Year 1) | $ | Annual |
| **Total Investment** | **$** | |
| | | |
| **RETURNS** | | |
| Direct revenue attributed | $ | Tracked conversions |
| Influenced revenue | $ | Attributed at X% |
| Cost savings | $ | Vs. alternatives |
| **Total Returns** | **$** | |
| | | |
| **ROI** | **%** | |

#### Example Calculation

| Line Item | Amount |
|-----------|--------|
| **INVESTMENT** | |
| Development | $80,000 |
| Design | $40,000 |
| Infrastructure (Year 1) | $12,000 |
| Marketing | $50,000 |
| Maintenance (Year 1) | $15,000 |
| **Total Investment** | **$197,000** |
| | |
| **RETURNS** | |
| Direct revenue | $350,000 |
| Influenced revenue (50%) | $150,000 |
| Cost savings | $30,000 |
| **Total Returns** | **$530,000** |
| | |
| **ROI** | **169%** |

### 2. Lead-Based ROI Calculator

#### Formula
```
Revenue = Leads × Close Rate × Average Deal Size
ROI = ((Revenue - Cost) / Cost) × 100
```

#### Template

| Metric | Value | Source |
|--------|-------|--------|
| **LEAD METRICS** | | |
| Total leads generated | | Analytics |
| Marketing Qualified Leads (MQLs) | | CRM |
| Sales Qualified Leads (SQLs) | | CRM |
| | | |
| **CONVERSION RATES** | | |
| Lead to MQL rate | % | CRM |
| MQL to SQL rate | % | CRM |
| SQL to Customer rate | % | CRM |
| Overall close rate | % | Calculated |
| | | |
| **REVENUE METRICS** | | |
| Average deal size | $ | CRM |
| Customers acquired | | Calculated |
| Revenue generated | $ | Calculated |
| | | |
| **COST METRICS** | | |
| Total campaign cost | $ | Actuals |
| | | |
| **EFFICIENCY METRICS** | | |
| Cost per lead | $ | Calculated |
| Cost per customer | $ | Calculated |
| ROI | % | Calculated |

#### Example Calculation

| Metric | Value |
|--------|-------|
| Total leads | 1,500 |
| MQLs (60%) | 900 |
| SQLs (40% of MQL) | 360 |
| Customers (25% of SQL) | 90 |
| Average deal size | $15,000 |
| Revenue generated | $1,350,000 |
| Total cost | $200,000 |
| **ROI** | **575%** |

### 3. Multi-Touch Attribution ROI

#### Attribution Models

| Model | Description | Best For |
|-------|-------------|----------|
| First Touch | 100% to first interaction | Awareness |
| Last Touch | 100% to final interaction | Conversion |
| Linear | Equal across all touches | Balanced view |
| Position-Based | 40/20/40 | Common B2B |
| Data-Driven | Algorithm-based | Mature programs |

#### Template (Position-Based 40/20/40)

| Touch Point | Attribution | Revenue Credit |
|-------------|-------------|----------------|
| First Touch (40%) | | |
| - Paid Search | $ | |
| - Social | $ | |
| - Other | $ | |
| **First Touch Total** | 40% | **$** |
| | | |
| Middle Touches (20%) | | |
| - Email | $ | |
| - Retargeting | $ | |
| - Other | $ | |
| **Middle Touches Total** | 20% | **$** |
| | | |
| Last Touch (40%) | | |
| - Direct | $ | |
| - Organic | $ | |
| - Other | $ | |
| **Last Touch Total** | 40% | **$** |
| | | |
| **Total Revenue** | 100% | **$** |

### 4. Payback Period Calculator

#### Formula
```
Payback Period (months) = Total Investment / Monthly Revenue
```

#### Template

| Month | Revenue | Cumulative Revenue | Investment Remaining |
|-------|---------|-------------------|---------------------|
| 1 | $ | $ | $ |
| 2 | $ | $ | $ |
| 3 | $ | $ | $ |
| 4 | $ | $ | $ |
| 5 | $ | $ | $ |
| 6 | $ | $ | $ |
| ... | ... | ... | ... |
| **Payback Month** | - | **= Investment** | **$0** |

#### Example

| Month | Revenue | Cumulative | Remaining |
|-------|---------|------------|-----------|
| 1 | $15,000 | $15,000 | $85,000 |
| 2 | $20,000 | $35,000 | $65,000 |
| 3 | $25,000 | $60,000 | $40,000 |
| 4 | $30,000 | $90,000 | $10,000 |
| 5 | $35,000 | $125,000 | **Paid back** |
| **Payback**: 4.3 months | | | |

### 5. Customer Lifetime Value (CLV) Based ROI

#### Formula
```
CLV = (Average Purchase × Purchase Frequency × Customer Lifespan) - CAC
Marketing ROI = (CLV × Customers - Marketing Cost) / Marketing Cost × 100
```

#### Template

| Metric | Value | Notes |
|--------|-------|-------|
| **CLV COMPONENTS** | | |
| Average purchase value | $ | Revenue per transaction |
| Purchase frequency (annual) | | Transactions per year |
| Customer lifespan (years) | | Avg. retention period |
| Gross margin | % | After COGS |
| **CLV (Gross)** | **$** | |
| | | |
| **ACQUISITION** | | |
| Customers acquired | | From experience |
| Customer Acquisition Cost | $ | Marketing cost / Customers |
| **CLV (Net)** | **$** | CLV - CAC |
| | | |
| **ROI CALCULATION** | | |
| Total customer value | $ | CLV × Customers |
| Marketing investment | $ | Campaign cost |
| **CLV-Based ROI** | **%** | |

### 6. Comparative ROI Analysis

#### Template

| Metric | WebGL Experience | Alternative A | Alternative B |
|--------|------------------|---------------|---------------|
| **Investment** | | | |
| Development | $ | $ | $ |
| Content | $ | $ | $ |
| Distribution | $ | $ | $ |
| **Total Cost** | **$** | **$** | **$** |
| | | | |
| **Performance** | | | |
| Reach | | | |
| Engagement rate | % | % | % |
| Conversion rate | % | % | % |
| Leads generated | | | |
| | | | |
| **Returns** | | | |
| Revenue | $ | $ | $ |
| | | | |
| **Efficiency** | | | |
| Cost per lead | $ | $ | $ |
| Cost per conversion | $ | $ | $ |
| **ROI** | **%** | **%** | **%** |

### 7. Annual ROI Summary

#### Template

| Quarter | Investment | Revenue | Cumulative ROI |
|---------|------------|---------|----------------|
| Q1 | $ | $ | % |
| Q2 | $ | $ | % |
| Q3 | $ | $ | % |
| Q4 | $ | $ | % |
| **Annual** | **$** | **$** | **%** |

| Year | Investment | Revenue | ROI | Trend |
|------|------------|---------|-----|-------|
| Year 1 | $ | $ | % | - |
| Year 2 | $ | $ | % | ↑/↓ |
| Year 3 | $ | $ | % | ↑/↓ |

---

## 🔢 ROI QUICK REFERENCE

### Formulas at a Glance

| Metric | Formula |
|--------|---------|
| **ROI** | (Returns - Investment) / Investment × 100 |
| **ROAS** | Revenue / Ad Spend × 100 |
| **CPL** | Total Cost / Leads |
| **CPA** | Total Cost / Acquisitions |
| **CLV** | (AOV × Frequency × Lifespan) - CAC |
| **Payback** | Investment / Monthly Revenue |

### Target Benchmarks

| Metric | Minimum | Target | Excellent |
|--------|---------|--------|-----------|
| ROI | 100% | 200% | 300%+ |
| Payback | <24 mo | <12 mo | <6 mo |
| CLV:CAC | 3:1 | 4:1 | 5:1+ |

---

## 📚 CROSS-REFERENCES

| Document | Content |
|----------|---------|
| R4-01 | Business metrics |
| R4-02 | Stakeholder reports |
| C4-03 | Measurement standards |

---

## 📊 DATA CLASSIFICATION

| Data Type | Classification | Source |
|-----------|----------------|--------|
| ROI formulas | ✅ VERIFIED | Finance standards |
| Benchmark targets | ✅ VERIFIED | Industry research |
| Template structures | ✅ VERIFIED | Best practices |

---

**Document Status**: ✅ COMPLETED  
**Last Updated**: 2025-12-11  
**Owner**: Rizky Firmansyah (Business Analyst)
