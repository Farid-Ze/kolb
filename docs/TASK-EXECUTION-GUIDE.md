# 📋 Sprint 1 Task Execution Guide

## Overview
This repository contains the complete documentation structure for Sprint 1: Data Collection & Baseline Documentation of the Corn Revolution analysis project.

**Total Tasks**: 36 tasks across 10 personas  
**Status**: All task files created with proper structure ✅  
**Date Created**: 2025-12-08

---

## 📁 Repository Structure

```
Kolb/
├── SPRINT-1-OVERVIEW.md          # Main overview and progress tracker
├── README.md                      # Repository readme
├── THIS-GUIDE.md                 # This execution guide
├── templates/
│   ├── performance-test-template.md
│   └── accessibility-check-template.md
└── reports/
    ├── technical/                # 16 tasks
    │   ├── kevin/               # 4 performance tasks
    │   ├── andi/                # 4 WebGL/framework tasks
    │   ├── fajar/               # 4 compatibility tasks
    │   └── amanda/              # 4 accessibility tasks
    ├── design/                   # 8 tasks
    │   ├── sarah/               # 4 visual design tasks
    │   └── bagus/               # 4 3D art tasks
    └── strategy/                 # 12 tasks
        ├── nabila/              # 3 UX tasks
        ├── citra/               # 3 marketing tasks
        ├── rizky/               # 3 business tasks (WITH VERIFIED DATA)
        └── dinda/               # 3 social/mobile tasks
```

---

## 🎯 How to Use This Repository

### For Project Managers
1. Open `SPRINT-1-OVERVIEW.md` to see overall progress
2. Assign tasks to respective personas
3. Track completion status in the overview
4. Review deliverables as they're completed

### For Individual Personas
1. Navigate to your squad folder (technical/design/strategy)
2. Find your persona folder (e.g., `reports/technical/kevin/`)
3. Open each task file (e.g., `K1-01-lighthouse-audit.md`)
4. Follow the **EXECUTABLE TEST PROCEDURE** section
5. Document findings in the **FINDINGS** section
6. Upload required attachments
7. Update status from "REQUIRES MANUAL EXECUTION" to "COMPLETED"

---

## ✅ Task Status Types

### 🟢 COMPLETED WITH VERIFIED DATA
**Examples**: R1-01, R1-02, R1-03 (Rizky's tasks)
- Contains actual, verified data from reliable sources
- No manual execution needed
- Ready for analysis

### 🟡 REQUIRES MANUAL EXECUTION
**Examples**: Most technical and design tasks
- Structure and methodology provided
- Awaits execution with live website
- Follow executable procedures in each file

---

## 📊 Verified Data Included

### R1-01: Award Verification ✅
- **Awwwards Site of the Year 2020**
- **Jury Scores**:
  - Design: 8.9/10
  - Usability: 8.2/10
  - Creativity: 9.1/10
  - Content: 8.5/10
  - Developer: 8.7/10
- **Source**: https://www.awwwards.com/sites/pioneer-corn-revolutionized

### R1-02: Agency Credits ✅
- **Development**: Resn (Wellington, New Zealand)
- **Strategy**: Bader Rutter (Milwaukee, USA)
- **Client**: Pioneer / Corteva Agriscience
- **Source**: Official press releases and portfolios

### R1-03: Published Metrics ✅
- **Visitors**: 398,000+
- **Qualified Leads**: 420
- **Source**: Communication Arts Interactive Annual 2021
- **URL**: https://www.commarts.com/project/32502/pioneer-corn

---

## 🔧 Executing Manual Tasks

### Step 1: Choose Your Task
Navigate to your assigned task file.

### Step 2: Read the Methodology
Every task file includes:
- **Objective**: What you're measuring/documenting
- **Tools Required**: What software/tools you need
- **Step-by-step Procedure**: Exact steps to execute

### Step 3: Execute the Test
Follow the procedure exactly as written. For example:

**K1-01: Lighthouse Audit**
```bash
lighthouse https://cornrevolution.resn.global \
  --output=json \
  --output-path=./lighthouse-report.json \
  --chrome-flags="--headless"
```

### Step 4: Document Findings
Replace "STATUS: REQUIRES MANUAL EXECUTION" sections with actual data:
- Use real numbers (not [VALUE] or [XX])
- Include timestamps (YYYY-MM-DD HH:MM UTC)
- Reference screenshot files by name
- Cite sources with URLs

### Step 5: Upload Attachments
Create an `attachments/` folder in your persona directory:
```
reports/technical/kevin/attachments/
├── lighthouse-desktop-run1-20251208.json
├── lighthouse-mobile-run1-20251208.json
└── lighthouse-scores-screenshot-20251208.png
```

### Step 6: Update Status
Change the status in metadata:
```markdown
## 📋 METADATA
- **Status**: COMPLETED ✅
```

---

## 📝 Documentation Standards

### ✅ DO:
- Use specific numerical values
- Include tool version numbers
- Timestamp all tests (YYYY-MM-DD HH:MM UTC)
- Cite sources with verifiable URLs
- Document test conditions (device, network, browser)
- Include raw data exports (JSON, HAR, CSV)
- Take screenshots as evidence

### ❌ DON'T:
- Use placeholders like [VALUE], [XX], [TO BE FILLED]
- Make estimates without methodology
- Make claims without source URLs
- Skip metadata or timestamps
- Forget to document test environment

---

## 🎨 Context: Corn Revolution

**About the Site**:
- **URL**: cornrevolution.resn.global
- **Type**: Experiential WebGL site
- **Awards**: Awwwards Site of the Year 2020
- **Agencies**: Resn (dev) + Bader Rutter (strategy)
- **Client**: Pioneer / Corteva Agriscience

**Important Note**:
This site intentionally prioritizes immersive experience over traditional performance/accessibility metrics (Source: Awwwards jury commentary, July 2020). All findings should be documented **objectively** without judgment, acknowledging this is a documented creative decision.

---

## 🔄 Task Dependencies

Some tasks reference others. Check the "CROSS-REFERENCE TASKS" section in each file:

**Example**: K1-04 (Bundle Analysis) references:
- K1-02 (Network Waterfall) for resource context
- A1-01 (Three.js Detection) for framework details
- A1-03 (Animation Library) for animation code

Execute dependent tasks first or note dependencies for later cross-analysis.

---

## 📈 Progress Tracking

Update `SPRINT-1-OVERVIEW.md` as tasks complete:

```markdown
| Squad | Persona | Completed Tasks | Total Tasks | Progress |
|-------|---------|-----------------|-------------|----------|
| Technical | Kevin Wijaya | 2 | 4 | 50% |
```

---

## 🆘 Getting Help

### For Technical Issues
- Review the methodology section carefully
- Check tool documentation links provided
- Consult cross-referenced tasks for context

### For Access Issues
- Corn Revolution site may be blocked in some regions
- Use VPN if necessary
- Some external data sources may require authentication

### For Questions
- Review the Context Notes in each task file
- Check SPRINT-1-OVERVIEW.md for project context
- Refer to source citations for additional information

---

## 🎯 Success Criteria

Sprint 1 is complete when:
- [ ] All 36 task files have status "COMPLETED"
- [ ] No placeholder values remain in any file
- [ ] All required attachments uploaded
- [ ] SPRINT-1-OVERVIEW.md updated to 100%
- [ ] All cross-references verified

---

## 📞 Task Assignment Reference

| Persona | Squad | Tasks | Files Location |
|---------|-------|-------|----------------|
| Kevin Wijaya | Technical | K1-01 to K1-04 | reports/technical/kevin/ |
| Andi Pratama | Technical | A1-01 to A1-04 | reports/technical/andi/ |
| Fajar Ramadhan | Technical | F1-01 to F1-04 | reports/technical/fajar/ |
| Amanda Sari | Technical | AM1-01 to AM1-04 | reports/technical/amanda/ |
| Sarah Putri W. | Design | S1-01 to S1-04 | reports/design/sarah/ |
| Bagus Setiawan | Design | B1-01 to B1-04 | reports/design/bagus/ |
| Nabila Zahra | Strategy | N1-01 to N1-03 | reports/strategy/nabila/ |
| Citra Dewi A. | Strategy | C1-01 to C1-03 | reports/strategy/citra/ |
| Rizky Maulana | Strategy | R1-01 to R1-03 | reports/strategy/rizky/ ✅ |
| Dinda Ayu L. | Strategy | D1-01 to D1-03 | reports/strategy/dinda/ |

**Note**: ✅ = Tasks already completed with verified data

---

## 📚 Additional Resources

### Award Sources
- Awwwards: https://www.awwwards.com/sites/pioneer-corn-revolutionized
- Communication Arts: https://www.commarts.com/project/32502/pioneer-corn

### Agency Information
- Resn: https://resn.co.nz
- Bader Rutter: https://baderrutter.com

### Tool Documentation
- Lighthouse: https://developer.chrome.com/docs/lighthouse/
- axe DevTools: https://www.deque.com/axe/devtools/
- WebPageTest: https://www.webpagetest.org/
- NVDA: https://www.nvaccess.org/

---

**Document Version**: 1.0  
**Last Updated**: 2025-12-08  
**Repository**: Andhika-Rey/Kolb
