# Workspace Structure: Kolb (KLSI 4.0)

This document maps the repository structure and explains the purpose of major folders and files so engineering and product teams quickly orient themselves.

---

## Root

- `.git/`, `.github/` — repository metadata and GitHub workflows
- `Dockerfile`, `docker-compose.yml` — containerization for local development and deployment
- `requirements.txt` — Python dependencies
- `README.md` — project overview
- `CHANGELOG.md` — change history
- `TODO.md` — project-level TODOs and roadmap
- `alembic.ini`, `migrations/` — DB migration config and scripts
- `klsi.db` — sample database (used for local dev/testing)
- `scripts/import_norms.py` — helper to import norms into DB

---

## `app/`
This is the application source (FastAPI backend). Key subfolders:

- `app/main.py` — FastAPI app entrypoint (routers, static mounts, middleware)
- `app/routers/` — HTTP routers and endpoints
  - `auth.py` — registration/login
  - `sessions.py` — legacy session APIs
  - `engine.py` — generic engine (start session, delivery, finalize, report)
  - `reports.py` — report endpoints
  - `teams.py` — team & class management
  - `research.py` — research mode APIs
  - `admin.py` — admin operations (norm imports, seeding)
  - `telemetry.py` — new telemetry endpoints (`POST /telemetry/guide-open`)
- `app/assessments/` — instrument definition and code
  - `klsi_v4` — specific klsi 4.0 support: calculations, logic, config.yaml
- `app/engine/` — runtime engine (authoring, registry, finalize pipeline)
- `app/services/` — orchestration & domain services
  - `scoring.py`, `report.py`, `rollup.py`, `provenance.py`, `seeds.py`
- `app/models/` — SQLAlchemy models
- `app/db/` — database layer & repositories
- `app/core/` — utilities like `metrics.py`, `config.py`, `formatting.py`.
- `app/data/` — normative tables (Appendix fallback) and LFI session designs

---

## `docs/`
Project documentation, design notes, and psychometric specification.
Key documents:

- `frontend_readiness.md` — frontend readiness checklist, API contract, privacy, psychometrics notes
- `frontend_blueprint.md` — the plan for a React frontend with Apple-inspired Liquid Glass visuals
- `SITEMAP.md` — mapping of API → UI routes (primary source for frontend mapping)
- `psychometrics_spec.md` — math: raw scores, dialectics, LFI, Kendall W, and normative tables
- `guides/` — user-facing guides served as static assets at `/static/guides`
  - `student_profile.md(.en)` — student help guide
  - `educator_responsible_use.md(.en)` — educator/mediator help guide
- `UI/UX` docs: `ui_ux_model.md`, `frontend_readiness.md`, `03-klsi-overview.md` etc.

---

## `tests/`
Unit and integration tests. Notable tests:

- `test_engine_finalize.py`, `test_engine_*` tests — engine pipeline & runtime logic
- `test_klsi_core.py` — psychometrics computations (raw scales, ACCE, AERO)
- `test_lfi_computation.py` — LFI/Kendall W tests
- `test_telemetry_router.py` — tests telemetry endpoint
- `test_teams_*` — team and rollup behavior

---

## `migrations/` and `env.py`
- Alembic migrations live under `migrations/versions` (schema changes, normative data columns, etc.)
- `README.md` and `MIGRATION_QUICKSTART.md` provide guidance for DB upgrades

---

## `docs/guides` & Static Guides
- The guides are stored in `docs/guides/` and are served by the backend as Markdown static files at `/static/guides` when `app/main.py` mounts the folder.
- Frontend should fetch `{guide}.${locale}.md` and fallback to default if missing.
- Telemetry: frontends should call `POST /telemetry/guide-open` when a guide is opened (this writes to internal metrics counters).

---

## Telemetry & Metrics
- `app/core/metrics.py` — in-process metrics registry; used by `/telemetry` router and other server metrics
- `tests/test_telemetry_router.py` — checks `POST /telemetry/guide-open` increments counters

---

## CI / Local Development
- `pytest.ini`, `mypy.ini`, `ruff.toml` — test and lint configurations
- Use `py -3 -m pytest` to run tests locally. If running into missing dependencies, install via `py -3 -m pip install -r requirements.txt`.

---

## Where to add new frontend mapping or update
- New frontend codebases should reference `docs/SITEMAP.md` and `docs/frontend_blueprint.md` as the single source-of-truth for API contract and UI expectations.
- `docs/guides` must be copied into the final build artifact or bundled by the frontend as static files (CI step: `COPY docs/guides /app/docs/guides`).

---

## Quick reference: most important files
- `app/main.py` — app bootstrap
- `docs/SITEMAP.md` — API ↔ UI mapping
- `docs/frontend_blueprint.md` — UI architectural pattern with Liquid Glass
- `docs/frontend_readiness.md` — psychometrics, privacy, contract
- `app/assessments/klsi_v4/*` — calculation & psychometric core
- `app/engine/*` — engine runtime & finalize pipeline
- `app/routers/telemetry.py` + `tests/test_telemetry_router.py` — guides/telemetry contract

---

If you want, I can add a sitemap CSV or a JSON file that frontend teams can import to seed routing and guides mapping (e.g., `frontend/routes.json`).