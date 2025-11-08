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

## Extending the System

### Adding New Norm Groups
1. Import CSV via `/admin/norms/import` with new `norm_group` label (e.g., `COUNTRY:Germany`)
2. Update `_resolve_norm_groups()` in `scoring.py` to add precedence rule
3. Document in `docs/psychometrics_spec.md` Section 5.1
4. Add test case to `test_norm_group_precedence.py`

### Adding Bilingual Reports (EN/ID)
1. Create `app/i18n/` folder with JSON files: `en.json`, `id.json`
2. Key structure: `{"style_descriptions": {"Imagining": "...", ...}}`
3. Modify `report.py` to accept `lang` parameter, load from JSON
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