# KLSI 4.0 API Development Guidelines

This FastAPI application implements the **Kolb Learning Style Inventory 4.0** with strict adherence to Experiential Learning Theory (ELT) and psychometric standards. All implementations must be validated against the authoritative source: **"The Kolb Learning Style Inventory 4.0 - Guide to Theory, Psychometrics, Research & Applications.md"** in the project root.

## Core Principles (Non-Negotiable)

# Architecture Compliance & Design Decisions

## 1. Clean Separation: Engine, Logic, and Persistence

### Architecture Layers

```
routers/        → HTTP boundary (authentication, authorization, request/response)
  ↓
services/       → Orchestration (coordinates engine, DB, i18n, reporting)
  ↓
engine/         → Assessment-agnostic runtime (registration, pipeline execution, audit)
  ↓
assessments/    → Instrument-specific logic (KLSI 4.0 psychometric calculations)
  ↓
db/repositories/ → Data access (typed, testable, SQLAlchemy abstraction)
  ↓
models/         → Declarative ORM (persistence only, no business logic)
```

**Verification:** See `docs/17-architecture-engine.md` for complete layer responsibilities.

**Test Coverage:** `tests/test_architecture_requirements.py` validates layer separation.

## 2. Psychometric Math Matches Specification

All formulas implemented in `app/assessments/klsi_v4/logic.py` and `app/assessments/klsi_v4/calculations.py` match `docs/psychometrics_spec.md`:

- **Raw Scale Scores:** Direct sum of ranks (1-4) per mode across 12 items
  - CE_raw = Σ(CE ranks), RO_raw = Σ(RO ranks), AC_raw = Σ(AC ranks), AE_raw = Σ(AE ranks)

- **Dialectic Scores:**
  - ACCE = AC_raw - CE_raw
  - AERO = AE_raw - RO_raw

- **3×3 Style Grid:** 9 learning styles via ACCE/AERO windows
  - ACCE bands: Low (≤5), Mid (6-14), High (≥15)
  - AERO bands: Low (≤0), Mid (1-11), High (≥12)

- **LFI Computation:** LFI = 1 - W (Kendall's W coefficient)
  - W = (12 × S) / (m² × (n³ - n)) where m=8 contexts, n=4 modes
  - S = Σ(Rⱼ - R̄)² where Rⱼ is total rank for mode j

**Verification:** `docs/psychometrics_spec.md` Section 1-4

**Test Coverage:** `tests/test_klsi_core.py`, `tests/test_lfi_computation.py`

## 3. Atomic Finalize Pipeline

The finalize pipeline in `app/engine/finalize.py::finalize_assessment()` ensures atomicity:

1. **Nested Transaction:** Uses `db.begin_nested()` to create SAVEPOINT
2. **Validation First:** Runs all validation rules before computing
3. **Sequential Steps:** Executes pipeline steps with dependency checking
4. **Artifact Snapshots:** Persists immutable snapshots at each stage
5. **Audit Hash:** SHA-256 hash of serialized artifacts + salt for tamper resistance
6. **Rollback on Error:** Any exception rolls back all changes

**Provenance Tracking:**
- `PercentileScore.norm_group_used` - which norm group was applied
- `PercentileScore.norm_provenance` - per-scale source (DB/External/Appendix)
- `PercentileScore.used_fallback_any` - whether any fallback was used
- `PercentileScore.raw_outside_norm_range` - truncation detection
- `PercentileScore.truncated_scales` - which scales were truncated

**Verification:** See `app/engine/finalize.py` lines 77-260

**Test Coverage:** `tests/test_finalize_atomicity.py`, `tests/test_engine_finalize.py`

## 4. Norm Conversion Precedence with Provenance

Multi-tier fallback strategy implemented in `app/assessments/klsi_v4/logic.py::resolve_norm_groups()`:

```
1. Education Level  → "EDU:University Degree" (from users.education_level)
2. Country         → "COUNTRY:Indonesia" (from users.country)
3. Age Band        → "AGE:19-24" (computed from users.date_of_birth)
4. Gender          → "GENDER:Male" (from users.gender)
5. Total           → "Total" (global norms)
6. Appendix        → Appendix 1 & 7 dictionaries (app/data/norms.py)
```

**Truncation Detection:**
- Raw scores outside norm table range trigger `raw_outside_norm_range=True`
- Nearest-lower fallback used for mode scales (conservative, avoids over-estimation)
- Nearest absolute match for LFI (continuous two-decimal values)
- `truncated_scales` dict records which scales needed boundary handling

**Verification:** See `app/assessments/klsi_v4/logic.py` lines 220-247

**Test Coverage:** `tests/test_norm_group_precedence.py`, `tests/test_percentile_fallback.py`

## 5. Performance Layers

### a) LRU Cache (DB Lookup)
- `app/engine/norms/factory.py::_make_cached_db_lookup()`
- `@lru_cache(maxsize=4096)` on `(group_token, scale_name, raw_score)` tuples
- Invalidation via `clear_norm_db_cache()` after imports

### b) Batch DB Fetch
- `app/engine/norms/cached_composite.py::CachedCompositeNormProvider`
- Preloads all scales for a session's norm chain in single query
- Converts to in-process LRU cache for zero-latency subsequent lookups

### c) Adaptive Preload
- `app/engine/norms/factory.py::_maybe_build_preloaded_map()`
- Loads entire norm table into immutable `MappingProxyType` if row count < threshold
- Feature-flagged via `settings.norms_preload_enabled`
- Skips if table > `norms_preload_row_threshold` (default: 50,000 rows)

### d) Appendix Fallback
- `app/data/norms.py` - hardcoded Appendix 1 & 7 dictionaries
- 11-44 entries per mode scale, 63 ACCE entries, 67 AERO entries, 89 LFI entries
- Used when DB lookup returns `None`

### e) Optional External Provider
- `app/engine/norms/composite.py::ExternalNormProvider`
- HTTP-based norm service integration (configurable endpoint)
- Falls between DB and Appendix in precedence chain

**Verification:** See `app/engine/norms/factory.py`, `docs/17-architecture-engine.md`

**Test Coverage:** `tests/test_cached_composite_norm_provider.py`, `tests/test_external_norm_provider.py`

## 6. Style Assignment: DB Windows with L1 Backup

`app/assessments/klsi_v4/logic.py::assign_learning_style()` uses DB windows exclusively:

1. **Load Windows from DB:** Query `learning_style_types` table for ACCE_min/max, AERO_min/max
2. **Primary by Containment:** First style where (ACCE, AERO) point lies within window
3. **L1 Distance Backup:** If no containment, use Manhattan distance to nearest window edge
4. **Deterministic Ordering:** Sorts by (distance, name) for stable tie-breaking

**Key Design Decision:**
- Removes reliance on in-code `STYLE_CUTS` lambdas to avoid drift
- Changes to windows in DB are reflected immediately without code changes
- `STYLE_CUTS` remains as helper/validator only (not used for primary assignment)

**Seeding:**
- `app/services/seeds.py::seed_learning_styles()` populates windows from config
- `STYLE_WINDOWS` derived from `app/assessments/klsi_v4/load_config()` YAML
- Called on app startup if `settings.run_startup_seed=True`

**Verification:** See `app/assessments/klsi_v4/logic.py` lines 317-382

**Test Coverage:** `tests/test_backup_style_determinism.py`, `tests/test_architecture_requirements.py::test_learning_style_windows_prevent_drift`

## 7. STYLE_CUTS Helper Only

`app/assessments/klsi_v4/logic.py::STYLE_CUTS` is a **read-only helper dictionary**:

```python
STYLE_CUTS = _build_style_cuts()  # Dict[str, Callable[[int, int], bool]]
```

**Purpose:**
- Exposes simple boundary-check functions for validation/testing
- Each entry is a lambda: `(acce: int, aero: int) -> bool`
- Built from config windows at module load time

**NOT used for:**
- Primary style assignment (uses DB windows instead)
- Runtime classification (uses `assign_learning_style()`)

**Test Coverage:** `tests/test_architecture_requirements.py::test_style_cuts_are_helpers_only`

## 8. Balance Percentiles: Heuristic and Non-Normative

### Formula
Balance scores measure distance to normative centers:
- `BAL_ACCE = |ACCE - 9|` (distance from median ACCE)
- `BAL_AERO = |AERO - 6|` (distance from median AERO)

### Pseudo-Percentiles (Heuristic)
- `P_BAL_ACCE = 100 × (1 - BAL_ACCE/45)` clamped to [0, 100]
- `P_BAL_AERO = 100 × (1 - BAL_AERO/42)` clamped to [0, 100]

**Critical Distinction:**
- These are **NOT population-derived percentiles**
- They are **theoretical distance metrics** scaled to 0-100 range
- Interpretation bands (≤3, 4-8, ≥9) are **heuristic**, not normative

### Documentation & Labeling
- `docs/psychometrics_spec.md` Section 2.1: Explicitly states "heuristik" interpretation
- `app/i18n/id_messages.py::ReportBalanceMessages.NOTE`: Contains explicit warning:
  > "BALANCE percentiles bersifat turunan teoritis dari jarak ke pusat normatif (ACCE≈9, AERO≈6); **ini bukan persentil normatif populasi**."

**Verification:** See `docs/psychometrics_spec.md` lines 29-40

**Test Coverage:** `tests/test_architecture_requirements.py::test_balance_percentiles_labeled_non_normative`

## 9. Required Actions from Problem Statement

### ✓ Ensure learning_style_type windows are seeded
- **Status:** Implemented in `app/services/seeds.py::seed_learning_styles()`
- **Startup:** Called in `app/main.py` if `settings.run_startup_seed=True`
- **Verification:** `tests/test_architecture_requirements.py::test_learning_style_types_seeded_with_windows`

### ✓ Balance percentiles correctly labeled non-normative
- **Status:** Documented in spec and i18n messages
- **Verification:** `tests/test_architecture_requirements.py::test_balance_percentiles_labeled_non_normative`

### ✓ Call clear_norm_db_cache after norm imports
- **Status:** Implemented in `app/routers/admin.py::import_norms()` lines 93-99
- **Mechanism:** Builds provider, calls `clear_norm_db_cache(provider._db_lookup)`
- **Fallback:** Non-fatal; cache naturally evicts if invalidation fails
- **Verification:** `tests/test_architecture_requirements.py::test_clear_norm_db_cache_functionality`

### ✓ Verify mixed-provenance/near-boundary diagnostics
- **Status:** Full provenance tracking in `PercentileScore` model
- **Fields:**
  - `norm_group_used` - resolved norm group name
  - `CE_source`, `RO_source`, `AC_source`, `AE_source` - per-scale source
  - `ACCE_source`, `AERO_source` - dialectic sources
  - `used_fallback_any` - boolean flag
  - `norm_provenance` - JSON dict with detailed per-scale info
  - `raw_outside_norm_range` - truncation flag
  - `truncated_scales` - JSON dict of truncated scales
- **Verification:** `tests/test_architecture_requirements.py::test_provenance_fields_exist`
- **Usage:** Can be queried for audit reports, boundary diagnostics, norm coverage analysis

## 10. Continuous Integration Checks

Recommended CI pipeline steps:

1. **Unit Tests:** `pytest tests/ -v --tb=short`
2. **Coverage Report:** `pytest tests/ --cov=app --cov-report=html`
3. **Type Checking:** `mypy app/`
4. **Linting:** `ruff check app/ tests/`
5. **Architecture Compliance:** `pytest tests/test_architecture_requirements.py -v`

## 11. Maintenance Guidelines

### When adding new norm groups:
1. Import CSV via `/admin/norms/import` endpoint
2. Verify `clear_norm_db_cache()` was called (check logs)
3. Test with session that should resolve to new group
4. Verify `norm_group_used` field reflects new group

### When modifying style windows:
1. Update `app/assessments/klsi_v4/config.yaml`
2. Re-seed database via startup or migration script
3. Run `tests/test_architecture_requirements.py::test_learning_style_types_seeded_with_windows`
4. Verify `STYLE_CUTS` still matches (helper consistency)

### When debugging provenance issues:
1. Query `percentile_scores` table for session
2. Check `norm_provenance` JSON for per-scale source chain
3. Verify `truncated_scales` if near boundaries
4. Check `used_fallback_any` to detect Appendix usage

## 12. References

- **Kolb & Kolb (2013):** KLSI 4.0 Guide to Theory, Psychometrics, Research & Applications
- **AERA/APA/NCME (1999):** Standards for Educational and Psychological Testing
- **Kendall (1948):** Rank Correlation Methods (W coefficient definition)
- **Internal Docs:**
  - `docs/psychometrics_spec.md` - Formula specification
  - `docs/17-architecture-engine.md` - Engine overview
  - `docs/15-implementation-status-report.md` - Implementation checklist


## Resources
- ELT Bibliography: https://www.learningfromexperience.com (3500+ studies)
- KLSI Official Site: https://www.haygroup.com/kolb
- Project Docs: `docs/` folder (start with `03-klsi-overview.md`)
- Model Diagrams: `docs/er_model.md`, `docs/ui_ux_model.md`

---

**When in Doubt**: Consult the authoritative source document at the root of this repo. All implementation decisions are traceable to Kolb 1984, KLSI 4.0 Guide appendices, or AERA/APA/NCME testing standards. If you propose changes, provide academic citations in code comments.