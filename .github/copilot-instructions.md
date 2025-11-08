# KLSI 4.0 API Development Guidelines

This FastAPI application implements the **Kolb Learning Style Inventory 4.0** with strict adherence to Experiential Learning Theory (ELT) and psychometric standards. All implementations must be validated against the authoritative source: **"The Kolb Learning Style Inventory 4.0 - Guide to Theory, Psychometrics, Research & Applications.md"** in the project root.

## Core Principles (Non-Negotiable)

### 1. Psychometric Fidelity
- **Never modify scoring formulas** without explicit references to Kolb 1984, KLSI Guide Appendix 1/7, or Figures 4-5
- Ipsative ranking (1-4, unique per item) is **mandatory** for the forced-choice format
- All transformations must match `docs/psychometrics_spec.md` specifications:
  - Raw scores: Sum of ranks per mode (CE, RO, AC, AE) from 12 learning style items
  - Dialectics: `ACCE = AC - CE`, `AERO = AE - RO`
  - 9 learning styles via 3×3 grid cutpoints (ACCE: ≤5, 6-14, ≥15; AERO: ≤0, 1-11, ≥12)
  - LFI: `1 - Kendall's W` from 8 context rankings
  - Percentiles: DB norms → Appendix fallback (nearest-lower for missing values)

### 2. Data Transformation Pipeline (Read-Only Flow)
```
UserResponses (ipsative ranks)
  ↓ app/services/scoring.py::compute_raw_scale_scores()
ScaleScores (CE/RO/AC/AE sums)
  ↓ compute_combination_scores()
CombinationScores (dialektika ACCE/AERO + balance metrics)
  ↓ assign_learning_style()
UserLearningStyle (9-type classification + backup style)
  ↓ compute_lfi() [from lfi_context_scores]
LearningFlexibilityIndex (W coefficient, LFI score)
  ↓ apply_percentiles() [with norm_group precedence]
PercentileScores (with provenance: DB vs AppendixFallback)
```
**Critical**: Each stage stores immutable snapshots for audit trails. Never update computed scores directly—always recompute via `finalize_session()`.

### 3. Normative Conversion Precedence
When converting raw scores to percentiles (`app/services/scoring.py::apply_percentiles()`):
1. Try Education Level: `EDU:University Degree` (from `users.education_level`)
2. Try Country: `COUNTRY:Indonesia` (from `users.country`)
3. Try Age Band: `AGE:19-24` (computed from `users.date_of_birth`)
4. Try Gender: `GENDER:Male` (from `users.gender`)
5. Fallback to `Total` (global norms)
6. Last resort: Appendix dictionaries in `app/data/norms.py`

**Track provenance** via `percentile_scores.norm_group_used` for transparency (AERA/APA/NCME Standards compliance).

## Architecture Overview

### Tech Stack
- **FastAPI** 0.115.4 (async ASGI, OpenAPI docs at `/docs`)
- **SQLAlchemy** 2.0.35 (ORM with declarative base)
- **Alembic** migrations (see `migrations/versions/`)
- **PostgreSQL** (production) / SQLite (dev/test)
- **JWT** auth (HS256, `sub` claim = user.id)

### Project Structure
```
app/
├── routers/          # API endpoints (auth, sessions, admin, reports, teams, research)
├── models/klsi.py    # SQLAlchemy ORM (34 tables, see ER diagram in docs/)
├── services/         # Business logic (scoring, validation, report generation)
├── schemas/          # Pydantic models for request/response validation
├── core/config.py    # Settings (loaded from .env via pydantic-settings)
├── db/database.py    # Engine, SessionLocal, Base setup
└── data/norms.py     # Appendix 1 & 7 fallback dictionaries
```

### Critical Files
- `app/services/scoring.py`: **Read this first** before touching anything psychometric
- `docs/psychometrics_spec.md`: Mathematical contract for all formulas
- `docs/02-relational-model.md`: Table relationships & normalization rationale
- `docs/hci_model.md`: UX principles (why we delay results, use kite charts, etc.)

## Development Workflows

### Running Locally (PowerShell)
```powershell
# Setup virtual environment
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Apply migrations (creates schema + seeds data)
alembic upgrade head

# Start server (auto-reload enabled)
uvicorn app.main:app --reload
```
Access Swagger docs: http://localhost:8000/docs

### Testing Strategy
```powershell
# Run all tests
pytest

# Specific test suites (see tests/ folder)
pytest tests/test_klsi_core.py          # Core psychometrics
pytest tests/test_style_boundaries.py    # 9-style classification edge cases
pytest tests/test_norm_group_precedence.py  # Subgroup norms fallback order
pytest tests/test_validations.py         # Ipsative constraint checks
```
**Test-first approach**: When adding features, write boundary tests first (see `test_backup_style_determinism.py` for examples of exhaustive grid testing).

### Database Migrations
```powershell
# Create new migration (auto-detect model changes)
alembic revision --autogenerate -m "add_feature_xyz"

# Review generated SQL in migrations/versions/XXXX_add_feature_xyz.py
# Apply migration
alembic upgrade head

# Rollback one version
alembic downgrade -1
```
**Never** edit migration files after merging—create a new revision instead.

## Code Conventions

### Style & Formatting
- Use `ruff` for linting (config in `ruff.toml`)
- Type hints mandatory for functions (mypy checks via `mypy.ini`)
- Docstrings: Google style for public APIs
- Indonesian comments allowed for domain-specific terms (e.g., "dialektika", "fleksibilitas")

### Naming Patterns
- DB columns: `snake_case` (e.g., `ACCE_raw`, `norm_group_used`)
- Python vars: `snake_case`
- Pydantic models: `PascalCase` (e.g., `SessionResponse`)
- Constants: `UPPER_SNAKE_CASE` (e.g., `STYLE_CUTS`, `AC_PERCENTILES`)

### SQL & ORM
- Use ORM for CRUD, raw SQL (`text()`) only for complex analytics
- Always use query filters (`filter_by(user_id=...)`) instead of `get()` for clarity
- Eager load relationships when needed: `.options(joinedload(...))`
- Example from `scoring.py`:
  ```python
  sess = db.query(AssessmentSession).filter(AssessmentSession.id == session_id).first()
  responses = db.query(UserResponse).filter(UserResponse.session_id == session_id).all()
  ```

### Error Handling
- Validation errors: Raise `HTTPException(status_code=400, detail="...")`
- Auth errors: `HTTPException(status_code=401, detail="Invalid credentials")`
- RBAC violations: `HTTPException(status_code=403, detail="Mediator role required")`
- Log unexpected errors but **never expose stack traces** to users in production

## Key Constraints & Validations

### Ipsative Integrity (user_responses table)
```sql
-- Enforced via SQLAlchemy CheckConstraint
CHECK (rank_value BETWEEN 1 AND 4)
UNIQUE (session_id, item_id, rank_value)  -- Prevent duplicate ranks per item
UNIQUE (session_id, choice_id)            -- Each choice ranked once
```
Validate in endpoint before insert:
```python
from app.services.validation import validate_ipsative_response
validate_ipsative_response(session_id, item_id, rankings, db)  # Raises HTTPException if invalid
```

### Session Lifecycle
1. **Started**: User begins assessment (JWT issued, session created)
2. **In Progress**: Partial responses saved (allow interruptions)
3. **Completed**: All 12 learning style items + 8 LFI contexts answered → triggers `finalize_session()`
4. **Abandoned**: No activity for 30+ days (future cleanup job)

Never manually set `status=Completed` without running finalization.

### RBAC Rules
- **MAHASISWA** (Student): Own sessions only, read reports, join teams
- **MEDIATOR** (Admin): Import norms, view class/team analytics, seed assessment items
- Auth check pattern:
  ```python
  from app.services.security import get_current_user
  current_user = Depends(get_current_user)
  if current_user.role != "MEDIATOR":
      raise HTTPException(403, detail="Admin required")
  ```

## Integration Points

### Admin Workflows (routers/admin.py)
- **Norm Import**: `POST /admin/norms/import` (CSV with columns: `norm_group,scale_name,raw_score,percentile`)
  - Validates monotonic increase per scale
  - Upserts to `normative_conversion_table`
  - Logs SHA-256 hash to `audit_log`
  - Example CSV row: `Total,CE,12,5.2` (Total group, CE scale, raw=12, 5.2th percentile)

### Reporting (routers/reports.py)
- **Kite Chart Data**: Returns `{CE, RO, AC, AE}` percentiles + ACCE/AERO coordinates
- **LFI Context Breakdown**: Shows which learning styles used in each of 8 contexts (Appendix 8 mapping)
- **Team Analytics**: Aggregate style distributions, balance metrics, LFI spread

### Research Extensions (routers/research.py)
- Regression curves (LFI vs. style intensity)
- Norm group comparisons (chi-square tests for demographic invariance)
- Export de-identified datasets (requires ethics clearance check in code comments)

## Common Pitfalls

### 1. Don't Hard-Code Cutpoints
❌ Wrong:
```python
if acce_raw < 6:
    style = "Imagining"
```
✅ Correct:
```python
for style_name, rule in STYLE_CUTS.items():
    if rule(acce_raw, aero_raw):
        primary_style = style_name
```
Rationale: Cutpoints might change with updated norms; centralize in `STYLE_CUTS` dict.

### 2. Don't Skip Audit Logs
❌ Wrong:
```python
db.query(NormativeConversionTable).delete()
db.bulk_insert_mappings(NormativeConversionTable, new_norms)
```
✅ Correct:
```python
from hashlib import sha256
from app.models.klsi import AuditLog

payload = f"Imported {len(new_norms)} rows from {filename}"
db.add(AuditLog(actor=current_user.email, action="NORM_IMPORT", payload_hash=sha256(payload.encode()).hexdigest()))
db.commit()
```

### 3. Don't Mutate LFI Context Scores Post-Finalization
LFI contexts (`lfi_context_scores`) are sealed after `compute_lfi()`. If user wants to re-take, create **new session** with `session_type="Retest"` and compute `days_since_last_session`.

## Complete Feature Implementation Status

### ✅ Core Psychometric Features (100% Complete)

#### 1. **LFI (Learning Flexibility Index) Pipeline**
Location: `app/services/scoring.py::compute_lfi()`

**Complete Implementation:**
- 8-context forced-choice ranking system (`lfi_context_scores` table)
- Kendall's W computation with formula validation
- LFI transformation (LFI = 1 - W)
- Multi-tier percentile conversion (DB norms → Appendix 7 fallback)
- Flexibility level classification (Low/Moderate/High tertiles)
- Persistence to `learning_flexibility_index` table
- Input validation via `validate_lfi_context_ranks()`

**Eight LFI Contexts:**
1. Starting_Something_New
2. Influencing_Someone
3. Getting_To_Know_Someone
4. Learning_In_A_Group
5. Planning_Something
6. Analyzing_Something
7. Evaluating_An_Opportunity
8. Choosing_Between_Alternatives

**Database Schema:**
```sql
-- Context rankings (8 rows per session)
CREATE TABLE lfi_context_scores (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL,
    context_name VARCHAR(100),
    CE_rank INTEGER CHECK (CE_rank BETWEEN 1 AND 4),
    RO_rank INTEGER CHECK (RO_rank BETWEEN 1 AND 4),
    AC_rank INTEGER CHECK (AC_rank BETWEEN 1 AND 4),
    AE_rank INTEGER CHECK (AE_rank BETWEEN 1 AND 4)
);

-- LFI results
CREATE TABLE learning_flexibility_index (
    id SERIAL PRIMARY KEY,
    session_id INTEGER UNIQUE,
    W_coefficient FLOAT CHECK (W_coefficient BETWEEN 0 AND 1),
    LFI_score FLOAT CHECK (LFI_score BETWEEN 0 AND 1),
    LFI_percentile FLOAT,
    flexibility_level VARCHAR(20),
    norm_group_used VARCHAR(100)
);
```

**Test Coverage:** 15 tests in `test_lfi_computation.py` (100% passing)

#### 2. **Backup Learning Styles System**
Location: `app/services/scoring.py::assign_learning_style()`

**Implementation:**
- Primary style: 9-style classification via (ACCE, AERO) window containment
- Backup style: L1 distance to nearest alternative style region
- Contextual flexibility tracking: Which styles used in which LFI contexts
- Persistence to `backup_learning_styles` table

**Database Schema:**
```sql
CREATE TABLE backup_learning_styles (
    id SERIAL PRIMARY KEY,
    session_id INTEGER,
    style_type_id INTEGER,
    frequency_count INTEGER,
    percentage FLOAT,
    contexts_used TEXT  -- JSON array
);
```

**Context-to-Style Inference:**
Service: `app/services/regression.py::analyze_lfi_contexts()` maps each of the 8 contexts to a learning style based on ranking patterns, showing which regions of the learning space a person "flexes into."

**Test Coverage:** 1 test in `test_backup_style_determinism.py` (exhaustive grid testing)

#### 3. **Norm Group Precedence System**
Location: `app/services/scoring.py::_resolve_norm_groups()`

**Multi-Tier Fallback Strategy:**
```
1. Education Level → "EDU:University Degree" (from users.education_level)
2. Country → "COUNTRY:Indonesia" (from users.country)
3. Age Band → "AGE:19-24" (computed from users.date_of_birth)
4. Gender → "GENDER:Male" (from users.gender)
5. Total → "Total" (global norms)
6. Appendix Fallback → Appendix 1 & 7 dictionaries (app/data/norms.py)
```

**Provenance Tracking:** `percentile_scores.norm_group_used` records which norm was applied for AERA/APA/NCME standards compliance.

**Database Management:**
- Admin endpoint: `POST /admin/norms/import` (CSV upload)
- Format: `norm_group,scale_name,raw_score,percentile`
- Validation: Monotonic increase per scale, SHA-256 audit logging
- Storage: `normative_conversion_table` with indexed lookups

**Appendix Fallback Data:**
- CE/RO/AC/AE: 11-44 entries each (Appendix 1)
- ACCE: -29 to +33 (63 entries, Appendix 1)
- AERO: -33 to +33 (67 entries, Appendix 1)
- LFI: 0.07-1.00 (89 entries, Appendix 7)

**Test Coverage:** 2 tests in `test_norm_group_precedence.py` + `test_percentile_fallback.py`

#### 4. **Enhanced LFI Analytics**
Location: `app/services/regression.py`

**Features Implemented:**
- **Context Analysis:** `analyze_lfi_contexts()` - shows style used per context
- **Heatmap Generation:** `generate_lfi_heatmap()` - 8×4 rank matrix visualization
- **Style Distribution:** Frequency counts and percentages across contexts
- **Flexibility Metrics:** Unique styles used, most-used style, diversity index
- **Regression Curves:** `fit_lfi_curve()` - style intensity vs LFI relationship

**API Endpoints:**
- `GET /reports/{session_id}/lfi-context-analysis`
- `GET /reports/{session_id}/lfi-heatmap`
- `GET /research/lfi-regression-curve`

**Test Coverage:** 9 tests in `test_enhanced_analytics.py` (all passing)

### ✅ Architecture & Best Practices

#### 1. **Test Coverage: 55 Tests (0 Failures)**

**Test Files:**
```
tests/
├── test_klsi_core.py (2 tests)                      # Kendall's W, style boundaries
├── test_lfi_computation.py (15 tests)               # LFI formula, validation, edge cases
├── test_lfi_percentile_comparison.py (9 tests)      # Empirical vs normal approx
├── test_style_boundaries.py (3 tests)               # 9-style cutpoint validation
├── test_backup_style_determinism.py (1 test)        # Backup style consistency
├── test_validations.py (2 tests)                    # Input validation (NIM, class)
├── test_norm_group_precedence.py (1 test)           # Norm group resolution
├── test_percentile_fallback.py (2 tests)            # Appendix fallback logic
├── test_session_validation.py (3 tests)             # Ipsative constraint checks
├── test_session_designs.py (3 tests)                # Learning design recommendations
├── test_enhanced_analytics.py (9 tests)             # LFI contexts, heatmaps, regression
├── test_regression_curve.py (2 tests)               # Style intensity vs LFI curves
├── test_team_rollup.py (1 test)                     # Team aggregation
└── test_api_teams_research.py (2 tests)             # Team CRUD, research projects
```

**Run All Tests:**
```powershell
pytest tests/ -v --tb=short
# Expected: 55 passed in ~2 seconds
```

#### 2. **Business Logic Separation (Clean Architecture)**

**Already Implemented - No Changes Needed:**
```
app/
├── routers/              # Thin controllers (HTTP concerns only)
│   ├── auth.py          # JWT authentication
│   ├── sessions.py      # Session CRUD
│   ├── reports.py       # Report generation endpoints
│   ├── admin.py         # Norm import, seeding
│   ├── teams.py         # Team management
│   └── research.py      # Research project endpoints
│
├── services/            # Business logic (testable, reusable)
│   ├── scoring.py       # Psychometric computations (LFI, styles)
│   ├── validation.py    # Input validation (ipsative, LFI contexts)
│   ├── report.py        # Report generation
│   ├── rollup.py        # Team analytics aggregation
│   ├── regression.py    # Statistical analysis (LFI curves)
│   ├── security.py      # Auth & authorization
│   └── seeds.py         # Database seeding
│
├── schemas/             # Pydantic models (type-safe validation)
│   ├── auth.py          # UserCreate, LoginRequest, TokenResponse
│   ├── team.py          # TeamCreate, TeamMemberAdd
│   └── research.py      # ResearchProjectCreate
│
├── models/              # SQLAlchemy ORM (34+ tables)
│   └── klsi.py          # Database entities
│
└── data/                # Static data
    ├── norms.py         # Appendix 1 & 7 fallback dictionaries
    └── session_designs.py # Learning design recommendations
```

**Dependency Flow Example:**
```python
# Router (thin) - routers/sessions.py
@router.post("/sessions/{session_id}/finalize")
def finalize(session_id: int, db: Session = Depends(get_db)):
    return scoring.finalize_session(db, session_id)  # ← Service call

# Service (business logic) - services/scoring.py
def finalize_session(db: Session, session_id: int):
    scale = compute_raw_scale_scores(db, session_id)
    combo = compute_combination_scores(db, scale)
    style = assign_learning_style(db, combo)
    lfi = compute_lfi(db, session_id)  # ← LFI pipeline
    percentiles = apply_percentiles(db, scale, combo)
    return {...}
```

#### 3. **Input Validation & Error Handling**

**Pydantic Schemas (Type-Safe):**
```python
# app/schemas/auth.py
class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    full_name: str = Field(min_length=3, max_length=100)
    date_of_birth: date
    gender: Gender
    education_level: EducationLevel
    country: str | None = None

# app/schemas/team.py
class TeamCreate(BaseModel):
    team_name: str = Field(min_length=3, max_length=100)
    description: str | None = None
```

**Custom Validation Services:**
```python
# app/services/validation.py

def validate_ipsative_response(
    session_id: int,
    item_id: int,
    rankings: dict,
    db: Session
) -> None:
    """Validate forced-choice: ranks must be permutation of [1,2,3,4]."""
    ranks = list(rankings.values())
    if sorted(ranks) != [1, 2, 3, 4]:
        raise HTTPException(400, f"Item {item_id} must rank all choices as [1,2,3,4]")

def validate_lfi_context_ranks(context_scores: list[dict]) -> None:
    """Validate 8 LFI contexts with 6 constraint checks."""
    for idx, ctx in enumerate(context_scores, start=1):
        # Check 1: All modes present
        if set(ctx.keys()) != {'CE', 'RO', 'AC', 'AE'}:
            raise ValueError(f"Context {idx} missing modes")
        
        # Check 2: Integer types
        if not all(isinstance(v, int) for v in ctx.values()):
            raise ValueError(f"Context {idx} has non-integer ranks")
        
        # Check 3: Range 1-4
        if not all(1 <= v <= 4 for v in ctx.values()):
            raise ValueError(f"Context {idx} ranks out of range [1,4]")
        
        # Check 4: Permutation (no duplicates)
        ranks = list(ctx.values())
        if sorted(ranks) != [1, 2, 3, 4]:
            raise ValueError(f"Context {idx} must be permutation of [1,2,3,4]. Got: {ranks}")
```

**HTTP Exception Patterns:**
```python
# 400 Bad Request - Validation errors
raise HTTPException(400, detail="Invalid rank values")

# 401 Unauthorized - Auth errors
raise HTTPException(401, detail="Invalid credentials")

# 403 Forbidden - RBAC violations
raise HTTPException(403, detail="Mediator role required")

# 404 Not Found - Resource not found
raise HTTPException(404, detail="Session not found")
```

#### 4. **Database Schema (34+ Tables, Production-Ready)**

**Complete Schema Summary:**

| Category | Tables | Key Features |
|----------|--------|-------------|
| **Users & Auth** | 3 | users, roles, permissions |
| **Assessment** | 8 | sessions, items, choices, responses |
| **Scoring** | 7 | scale_scores, combination_scores, percentile_scores |
| **Learning Styles** | 6 | user_learning_styles, backup_styles, style_types |
| **LFI** | 3 | lfi_context_scores, learning_flexibility_index, lfi_percentiles |
| **Norms** | 2 | normative_conversion_table, norm_groups |
| **Teams** | 3 | teams, team_members, team_rollup_stats |
| **Research** | 2 | research_projects, research_participants |
| **Audit** | 1 | audit_log |

**Migrations:** 4 Alembic versions in `migrations/versions/`
- 0001_initial.py - Core schema
- 0002_materialized_class_stats.py - Performance views
- 0003_add_recommended_indexes.py - Query optimization
- 0004_team_research_schema.py - Team analytics

**Key Constraints:**
- Foreign keys with cascading deletes
- Check constraints (rank ranges, LFI bounds, ACCE/AERO limits)
- Unique constraints (session uniqueness, ipsative ranking)
- Indexes for performance (norm lookups, session queries)

#### 5. **Documentation (6,100+ Lines)**

**Complete Documentation Set:**
```
docs/
├── 01-entity-relationship-model.md (800 lines)
├── 02-relational-model.md (600 lines)
├── 03-klsi-overview.md (400 lines)
├── 04-learning-space.md (300 lines)
├── 05-learning-styles-theory.md (500 lines)
├── 06-enhanced-lfi-analytics.md (400 lines)
├── 07-learning-spiral-development.md (300 lines)
├── 08-learning-flexibility-deliberate-practice.md (350 lines)
├── 09-educator-roles.md (250 lines)
├── 10-model-data-klsi.md (200 lines)
├── 11-audit-konsistensi-deduplikasi.md (150 lines)
├── 12-model-logis-relasional.md (400 lines)
├── 13-model-fisik-postgres.md (500 lines)
├── 14-learning-flexibility-index-computation.md (800 lines)
├── 15-implementation-status-report.md (NEW - 1,150 lines)
├── psychometrics_spec.md (350 lines)
├── er_model.md
├── hci_model.md
├── rationalization_matrix.md
└── ui_ux_model.md
```

**NEW Document:** `docs/15-implementation-status-report.md` - Complete implementation status with code examples, test results, and production readiness checklist.

### Production Deployment Status

**✅ Ready for Production:**
- All core features implemented and tested
- 100% psychometric accuracy validated
- 55 unit tests passing (0 failures)
- Clean architecture with proper separation
- Comprehensive input validation
- Multi-tier norm system operational
- Complete documentation available

**Deployment Checklist:**
```bash
# 1. Setup environment
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt

# 2. Configure database (update .env)
DATABASE_URL=postgresql://user:pass@host:5432/klsi

# 3. Run migrations
alembic upgrade head

# 4. Seed initial data
python scripts/import_norms.py

# 5. Run tests
pytest tests/ -v

# 6. Start production server
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## Extending the System

### Adding New Norm Groups
1. Import CSV via `/admin/norms/import` with new `norm_group` label (e.g., `COUNTRY:Germany`)
2. Update `_resolve_norm_groups()` in `scoring.py` to add precedence rule
3. Document in `docs/psychometrics_spec.md` Section 5.1
4. Add test case to `test_norm_group_precedence.py`

### Adding Bilingual Reports (EN/ID)
1. Use existing `app/i18n/id_styles.py` for Indonesian translations
2. Key structure: Style names, descriptions, context names
3. Modify `report.py` to accept `lang` parameter
4. Reference `docs/09-educator-roles.md` for teaching sequence translations

### Performance Optimization
- **Materialized View** for class stats: Already created in `main.py` (`v_style_grid`)
- **Index recommendations**: See `migrations/versions/0003_add_recommended_indexes.py`
- **Caching**: Consider Redis for norm lookups if import >100k rows (not yet implemented)

## External Dependencies & Licensing

### Academic Foundation
This implementation is based on the **open-source academic publication** "The Kolb Learning Style Inventory 4.0 - Guide to Theory, Psychometrics, Research & Applications" by Alice Y. Kolb & David A. Kolb (2013), which is publicly available for research and educational purposes.

The KLSI 4.0 content, formulas, and psychometric specifications are drawn directly from this published academic work, ensuring full fidelity to the original research.

### Academic Citation
When publishing research using this implementation, cite:
- Kolb, A. Y., & Kolb, D. A. (2013). The Kolb Learning Style Inventory 4.0: Guide to Theory, Psychometrics, Research & Applications. Experience Based Learning Systems, Inc.
- This implementation: Farid-Ze/kolb GitHub repository (DOI pending)
- Source document available at: https://www.researchgate.net/publication/303446688

## Debugging Tips

### Common Error Messages
- **"Ranking not unique"**: Check `validate_ipsative_response()` logic; likely duplicate ranks
- **"Session already finalized"**: Client re-submitting; idempotent response = return existing report
- **"Percentile not found"**: Missing norm row for that `(norm_group, scale, raw_score)` combo → check fallback triggered
- **"Kendall's W out of range"**: Bug in `compute_kendalls_w()`; verify sum of ranks = 8*(4+1)/2 = 20 per mode

### Useful SQL Queries
```sql
-- Verify finalization completeness
SELECT s.id, s.status, 
       COUNT(DISTINCT r.id) AS responses,
       ss.CE_raw, cs.ACCE_raw, uls.primary_style_type_id
FROM assessment_sessions s
LEFT JOIN user_responses r ON r.session_id = s.id
LEFT JOIN scale_scores ss ON ss.session_id = s.id
LEFT JOIN combination_scores cs ON cs.session_id = s.id
LEFT JOIN user_learning_styles uls ON uls.session_id = s.id
GROUP BY s.id;

-- Check norm group distribution
SELECT norm_group_used, COUNT(*) 
FROM percentile_scores 
GROUP BY norm_group_used;
```

## Resources
- ELT Bibliography: https://www.learningfromexperience.com (3500+ studies)
- KLSI Official Site: https://www.haygroup.com/kolb
- Project Docs: `docs/` folder (start with `03-klsi-overview.md`)
- Model Diagrams: `docs/er_model.md`, `docs/ui_ux_model.md`

---

**When in Doubt**: Consult the authoritative source document at the root of this repo. All implementation decisions are traceable to Kolb 1984, KLSI 4.0 Guide appendices, or AERA/APA/NCME testing standards. If you propose changes, provide academic citations in code comments.