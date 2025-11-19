# Architecture Compliance & Design Decisions

This document validates compliance with the architectural requirements and documents key design decisions to prevent drift.

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

All formulas implemented in `backend/app/assessments/klsi_v4/logic.py` and `backend/app/assessments/klsi_v4/calculations.py` match `docs/psychometrics_spec.md`:

- **Raw Scale Scores:** Direct sum of ranks (1-4) per mode across 12 items
  - CE_raw = Σ(CE ranks), RO_raw = Σ(RO ranks), AC_raw = Σ(AC ranks), AE_raw = Σ(AE ranks)

## 12. References

- **PYTHONPATH:** Set `PYTHONPATH=backend` during local development to allow `app` imports to resolve.

- **Dialectic Scores:**
  - ACCE = AC_raw - CE_raw
  - AERO = AE_raw - RO_raw

- **3×3 Style Grid:** 9 learning styles via ACCE/AERO windows
  - ACCE bands: Low (≤5), Mid (6-14), High (≥15)
  - AERO bands: Low (≤0), Mid (1-11), High (≥12)

  - W = (12 × S) / (m² × (n³ - n)) where m=8 contexts, n=4 modes
  - S = Σ(Rⱼ - R̄)² where Rⱼ is total rank for mode j
**Verification:** `docs/psychometrics_spec.md` Section 1-4

**Test Coverage:** `tests/test_klsi_core.py`, `tests/test_lfi_computation.py`
## 3. Atomic Finalize Pipeline

The finalize pipeline in `backend/app/engine/finalize.py::finalize_assessment()` ensures atomicity:
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

**Verification:** See `backend/app/engine/finalize.py` lines 77-260

**Test Coverage:** `tests/test_finalize_atomicity.py`, `tests/test_engine_finalize.py`

## 4. Norm Conversion Precedence with Provenance
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

**Verification:** See `backend/app/assessments/klsi_v4/logic.py` lines 220-247

**Test Coverage:** `tests/test_norm_group_precedence.py`, `tests/test_percentile_fallback.py`

## 5. Performance Layers


### b) Batch DB Fetch
- `backend/app/engine/norms/cached_composite.py::CachedCompositeNormProvider`
- Preloads all scales for a session's norm chain in single query
- Converts to in-process LRU cache for zero-latency subsequent lookups

### c) Adaptive Preload
- `backend/app/engine/norms/factory.py::_maybe_build_preloaded_map()`

### d) Appendix Fallback

### e) Optional External Provider
**Verification:** See `backend/app/engine/norms/factory.py`, `docs/17-architecture-engine.md`


`backend/app/assessments/klsi_v4/logic.py::assign_learning_style()` uses DB windows exclusively:
3. **L1 Distance Backup:** If no containment, use Manhattan distance to nearest window edge
4. **Deterministic Ordering:** Sorts by (distance, name) for stable tie-breaking

**Key Design Decision:**
- Removes reliance on in-code `STYLE_CUTS` lambdas to avoid drift
- Changes to windows in DB are reflected immediately without code changes
- `STYLE_CUTS` remains as helper/validator only (not used for primary assignment)

**Seeding:**
- `backend/app/services/seeds.py::seed_learning_styles()` populates windows from config
- `STYLE_WINDOWS` derived from `backend/app/assessments/klsi_v4/load_config()` YAML
- Called on app startup if `settings.run_startup_seed=True`

**Verification:** See `backend/app/assessments/klsi_v4/logic.py` lines 317-382


`backend/app/assessments/klsi_v4/logic.py::STYLE_CUTS` is a **read-only helper dictionary**:
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
- `BAL_ACCE = |ACCE - 9|` (distance from median ACCE)
- `BAL_AERO = |AERO - 6|` (distance from median AERO)
- `P_BAL_ACCE = 100 × (1 - BAL_ACCE/45)` clamped to [0, 100]
- `P_BAL_AERO = 100 × (1 - BAL_AERO/42)` clamped to [0, 100]

**Critical Distinction:**
- These are **NOT population-derived percentiles**
- They are **theoretical distance metrics** scaled to 0-100 range
- Interpretation bands (≤3, 4-8, ≥9) are **heuristic**, not normative
 - `docs/psychometrics_spec.md` Section 2.1: Explicitly states "heuristik" interpretation
 - `backend/app/i18n/id_messages.py::ReportBalanceMessages.NOTE`: Contains explicit warning:
**Verification:** See `docs/psychometrics_spec.md` lines 29-40


### ✓ Ensure learning_style_type windows are seeded
- **Verification:** `tests/test_architecture_requirements.py::test_learning_style_types_seeded_with_windows`

### ✓ Balance percentiles correctly labeled non-normative
- **Status:** Documented in spec and i18n messages
- **Verification:** `tests/test_architecture_requirements.py::test_balance_percentiles_labeled_non_normative`

### ✓ Call clear_norm_db_cache after norm imports
-- **Status:** Implemented in `backend/app/routers/admin.py::import_norms()` lines 93-99
- **Mechanism:** Builds provider, calls `clear_norm_db_cache(provider._db_lookup)`
### ✓ Verify mixed-provenance/near-boundary diagnostics
- **Status:** Full provenance tracking in `PercentileScore` model
  - `CE_source`, `RO_source`, `AC_source`, `AE_source` - per-scale source
  - `ACCE_source`, `AERO_source` - dialectic sources
- **Verification:** `tests/test_architecture_requirements.py::test_provenance_fields_exist`
- **Usage:** Can be queried for audit reports, boundary diagnostics, norm coverage analysis

Recommended CI pipeline steps:

1. **Unit Tests:** `pytest tests/ -v --tb=short`
2. **Coverage Report:** `pytest tests/ --cov=backend/app --cov-report=html`
3. **Type Checking:** `mypy backend/app/`
4. **Linting:** `ruff check backend/app/ tests/`

## 10. Research Data Export Dictionary

- **Endpoint:** `GET /research/studies/{id}/data` (router delegates to `services/research.build_study_dataset`).
- **Primary Sources:** `assessment_sessions` (user/timestamps), `scale_scores` (CE/RO/AC/AE), `combination_scores` (ACCE/AERO), `user_learning_styles` + `learning_style_types` (style metadata), `percentile_scores` (norm provenance), and `research_studies` (window metadata).
- **filters_applied:** normalized ISO-8601 `start_date`/`end_date` plus optional `learning_style`, `norm_group`, `user_email` mirrors CSV export filters for reproducibility.
- **data_points columns:**
  - Identity: `session_id`, `user_id`, `user_email`, `user_name`, `generated_at`, `assessment_duration_seconds` ← `assessment_sessions`.
  - Raw modes: `ce_score`, `ro_score`, `ac_score`, `ae_score` ← `scale_scores`.
  - Dialectics: `ac_ce`, `ae_ro` ← `combination_scores`.
  - Style metadata: `learning_style`, `style_code` ← `learning_style_types` via `user_learning_styles`.
  - Norm provenance: `norm_group` ← `percentile_scores.norm_group_used`.
- **summary:** `total_sessions`, `unique_participants`, `date_range`, and `style_distribution` are derived aggregates backing both the preview table and CSV dictionary references.

## 11. Maintenance Guidelines

### When adding new norm groups:
1. Import CSV via `/admin/norms/import` endpoint
2. Verify `clear_norm_db_cache()` was called (check logs)
3. Test with session that should resolve to new group
4. Verify `norm_group_used` field reflects new group

### When modifying style windows:
1. Update `backend/app/assessments/klsi_v4/config.yaml`
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
