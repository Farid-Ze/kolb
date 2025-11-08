# KLSI 4.0 Quick Reference

**Last Updated:** November 8, 2025  
**Status:** ✅ Production Ready

---

## 🚀 Quick Start

```powershell
# Setup
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt

# Run migrations
alembic upgrade head

# Start server
uvicorn app.main:app --reload

# Run tests
pytest tests/ -v
```

**API Docs:** http://localhost:8000/docs

---

## 📊 Key Metrics

| Metric | Value | Status |
|--------|-------|--------|
| **Tests** | 55/55 passing | ✅ |
| **Tables** | 34+ | ✅ |
| **LFI Contexts** | 8 | ✅ |
| **Learning Styles** | 9 | ✅ |
| **Norm Groups** | 5-tier precedence | ✅ |
| **Documentation** | 6,100+ lines | ✅ |
| **Formula Accuracy** | 100% | ✅ |

---

## 🧮 Core Formulas

### LFI (Learning Flexibility Index)

```
Kendall's W = 12S / [m² × (n³ - n)]
where:
  m = 8 contexts
  n = 4 modes (CE, RO, AC, AE)
  S = Σ(Rᵢ - R̄)²

LFI = 1 - W
Range: [0, 1]
  0 = Inflexible (always same style)
  1 = Maximally flexible (different style per context)
```

### Learning Styles (9 Types)

```
ACCE = AC - CE (Abstract-Concrete axis)
AERO = AE - RO (Active-Reflective axis)

Style Grid (3×3):
           AERO ≤ 0    1-11    ≥ 12
ACCE ≤ 5   Imagining   Acting   Deciding
 6-14      Reflecting  Balancing Thinking
 ≥ 15      Analyzing   Experiencing Initiating
```

---

## 🗄️ Database Quick Reference

### Key Tables

```sql
-- Core assessment
assessment_sessions (status, user_id)
user_responses (session_id, item_id, choice_id, rank_value)

-- Scoring pipeline
scale_scores (CE, RO, AC, AE raw sums)
combination_scores (ACCE, AERO dialectics)
user_learning_styles (primary + backup)
percentile_scores (with norm_group_used)

-- LFI system
lfi_context_scores (8 contexts × 4 ranks per session)
learning_flexibility_index (W, LFI, percentile, level)
backup_learning_styles (contextual flexibility)

-- Norms
normative_conversion_table (multi-tier: EDU/COUNTRY/AGE/GENDER/Total)
```

### Quick Queries

```sql
-- Check session completeness
SELECT s.id, COUNT(r.id) AS responses,
       ls.primary_style_type_id,
       lfi.LFI_score,
       lfi.flexibility_level
FROM assessment_sessions s
LEFT JOIN user_responses r ON r.session_id = s.id
LEFT JOIN user_learning_styles ls ON ls.session_id = s.id
LEFT JOIN learning_flexibility_index lfi ON lfi.session_id = s.id
WHERE s.id = 123
GROUP BY s.id;

-- Norm group usage stats
SELECT norm_group_used, COUNT(*) 
FROM percentile_scores 
GROUP BY norm_group_used;

-- LFI distribution by flexibility level
SELECT flexibility_level, 
       COUNT(*) AS count,
       AVG(LFI_score) AS avg_lfi,
       AVG(W_coefficient) AS avg_w
FROM learning_flexibility_index
GROUP BY flexibility_level
ORDER BY flexibility_level;
```

---

## 🔧 Service Functions

### Location: `app/services/scoring.py`

| Function | Purpose | Input | Output |
|----------|---------|-------|--------|
| `compute_raw_scale_scores()` | Sum ranks per mode | session_id | ScaleScores (CE/RO/AC/AE) |
| `compute_combination_scores()` | Compute dialectics | ScaleScores | CombinationScores (ACCE/AERO) |
| `assign_learning_style()` | 9-style classification | CombinationScores | UserLearningStyle (primary + backup) |
| `compute_lfi()` | **LFI pipeline** | session_id | LearningFlexibilityIndex |
| `compute_kendalls_w()` | Kendall's W formula | 8 context dicts | W ∈ [0,1] |
| `validate_lfi_context_ranks()` | Input validation | 8 context dicts | None (raises on error) |
| `apply_percentiles()` | Norm conversion | scores | PercentileScores |
| `finalize_session()` | **Complete pipeline** | session_id | Full results dict |

### Location: `app/services/regression.py`

| Function | Purpose |
|----------|---------|
| `analyze_lfi_contexts()` | Which styles used per context |
| `generate_lfi_heatmap()` | 8×4 rank matrix for visualization |
| `fit_lfi_curve()` | Style intensity vs LFI regression |

---

## 🧪 Testing

### Run Specific Tests

```powershell
# LFI computation
pytest tests/test_lfi_computation.py -v

# Percentile comparison
pytest tests/test_lfi_percentile_comparison.py -v

# Style boundaries
pytest tests/test_style_boundaries.py -v

# Full suite
pytest tests/ -v --tb=short

# With coverage
pytest tests/ --cov=app --cov-report=html
```

### Test Categories

| Category | Files | Tests |
|----------|-------|-------|
| **Psychometrics** | 5 files | 23 tests |
| **Validation** | 3 files | 8 tests |
| **Analytics** | 3 files | 12 tests |
| **API** | 2 files | 4 tests |
| **Business Logic** | 2 files | 8 tests |

---

## 📐 Validation Rules

### Ipsative Ranking (Learning Style Items)

```python
# Each of 12 items must rank CE/RO/AC/AE as [1,2,3,4]
valid = {"CE": 1, "RO": 2, "AC": 3, "AE": 4}  ✅
invalid = {"CE": 1, "RO": 2, "AC": 2, "AE": 4}  ❌ (duplicate rank)
```

### LFI Context Ranking

```python
# Each of 8 contexts must rank modes as [1,2,3,4]
for ctx in contexts:
    assert set(ctx.keys()) == {'CE', 'RO', 'AC', 'AE'}
    assert sorted(ctx.values()) == [1, 2, 3, 4]
```

---

## 🔄 API Workflow

### 1. User Registration

```bash
POST /auth/register
{
  "email": "user@example.com",
  "password": "securepass123",
  "full_name": "John Doe",
  "date_of_birth": "2000-01-15",
  "gender": "Male",
  "education_level": "University Degree",
  "country": "Indonesia"
}

Response: 201 Created
{
  "id": 42,
  "email": "user@example.com",
  "role": "MAHASISWA"
}
```

### 2. Authentication

```bash
POST /auth/login
{
  "email": "user@example.com",
  "password": "securepass123"
}

Response: 200 OK
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer"
}
```

### 3. Create Session

```bash
POST /sessions
Headers: Authorization: Bearer {token}

Response: 201 Created
{
  "id": 123,
  "user_id": 42,
  "status": "Started",
  "created_at": "2025-11-08T10:30:00Z"
}
```

### 4. Submit Responses

```bash
POST /sessions/123/responses
{
  "item_id": 1,
  "rankings": {
    "CE": 4,
    "RO": 2,
    "AC": 1,
    "AE": 3
  }
}

Repeat for all 12 learning style items + 8 LFI contexts
```

### 5. Finalize Session

```bash
POST /sessions/123/finalize

Response: 200 OK
{
  "session_id": 123,
  "learning_style": {
    "primary": "Balancing",
    "backup": "Reflecting",
    "ACCE": 8,
    "AERO": 5
  },
  "lfi": {
    "W_coefficient": 0.234,
    "LFI_score": 0.766,
    "percentile": 62.4,
    "flexibility_level": "Moderate"
  },
  "percentiles": {
    "CE": 45.2,
    "RO": 58.1,
    ...
  }
}
```

### 6. Generate Report

```bash
GET /reports/123

Response: PDF/JSON with:
- Kite chart visualization
- Style description
- LFI context analysis
- Learning recommendations
```

---

## 🎯 Norm Group Precedence

```
User submits assessment
  ↓
1. Try: "EDU:University Degree" (from users.education_level)
   ↓ (not found)
2. Try: "COUNTRY:Indonesia" (from users.country)
   ↓ (not found)
3. Try: "AGE:19-24" (computed from date_of_birth)
   ↓ (not found)
4. Try: "GENDER:Male" (from users.gender)
   ↓ (not found)
5. Try: "Total" (global norms from DB)
   ↓ (not found)
6. Fallback: Appendix 7 lookup (app/data/norms.py)
   ✅ Always succeeds (89 LFI entries)
```

**Track:** `percentile_scores.norm_group_used` shows which norm was applied.

---

## 🛠️ Admin Tools

### Import Norms

```bash
POST /admin/norms/import
Headers: 
  Authorization: Bearer {mediator_token}
  Content-Type: multipart/form-data
Body: CSV file

CSV Format:
norm_group,scale_name,raw_score,percentile
Total,CE,12,7.4
Total,CE,13,14.8
EDU:University Degree,LFI,75,52.3
COUNTRY:Indonesia,ACCE,5,33.3
```

### Seed Assessment Items

```bash
POST /admin/seed-items
# Creates 12 learning style items + 48 choices
# Creates 8 LFI context items
```

---

## 📚 Key Documents

| Document | Purpose | Lines |
|----------|---------|-------|
| `psychometrics_spec.md` | Formula specifications | 350 |
| `14-learning-flexibility-index-computation.md` | LFI technical guide | 800 |
| `15-implementation-status-report.md` | **Production status** | 1,150 |
| `02-relational-model.md` | Database schema | 600 |
| `03-klsi-overview.md` | KLSI theory intro | 400 |

---

## ⚠️ Critical Reminders

### Never Modify Formulas Without Citations

❌ **Don't:**
```python
if acce_raw < 6:  # Hard-coded cutpoint
    style = "Imagining"
```

✅ **Do:**
```python
for style_name, rule in STYLE_CUTS.items():
    if rule(acce_raw, aero_raw):
        primary_style = style_name
# Cutpoints from Appendix 1, Figures 4-5
```

### Always Validate Ipsative Constraints

```python
from app.services.validation import validate_ipsative_response

validate_ipsative_response(session_id, item_id, rankings, db)
# Raises HTTPException(400) if invalid
```

### Use Service Layer for Business Logic

❌ **Don't:** Put scoring logic in routers  
✅ **Do:** Call `scoring.finalize_session()` from router

---

## 🔗 Quick Links

- **API Docs (Swagger):** http://localhost:8000/docs
- **API Docs (ReDoc):** http://localhost:8000/redoc
- **Academic Source:** `The Kolb Learning Style Inventory 4.0 - Guide.md` (project root)
- **GitHub Repo:** https://github.com/Farid-Ze/kolb
- **Kolb Official Site:** https://www.learningfromexperience.com

---

## 🆘 Troubleshooting

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "Ranking not unique" | Duplicate ranks in item | Check `validate_ipsative_response()` |
| "Session already finalized" | Re-submitting finalization | Return existing results (idempotent) |
| "Percentile not found" | Missing norm row | Check fallback triggered (Appendix 7) |
| "Kendall's W out of range" | Bug in computation | Verify sum of ranks = 20 per mode |

### Debug SQL

```sql
-- Incomplete session diagnosis
SELECT s.id, 
       COUNT(DISTINCT r.item_id) AS items_answered,
       EXISTS(SELECT 1 FROM scale_scores WHERE session_id=s.id) AS has_scores,
       EXISTS(SELECT 1 FROM learning_flexibility_index WHERE session_id=s.id) AS has_lfi
FROM assessment_sessions s
LEFT JOIN user_responses r ON r.session_id = s.id
WHERE s.id = 123
GROUP BY s.id;
```

---

**For detailed implementation, see:** `docs/15-implementation-status-report.md`  
**For formulas, see:** `docs/psychometrics_spec.md`  
**For LFI details, see:** `docs/14-learning-flexibility-index-computation.md`
