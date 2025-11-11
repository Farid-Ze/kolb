# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- Cached composite norm provider with batch pre-warm and in-process LRU cache for percentile lookups. New metrics: 
  - timings: `norms.cached.batch.percentile_many`
  - counters: `norms.cached.prime`, `norms.cached.batch.query`, `norms.cached.cache_hit`, `norms.cached.appendix_fallback`, `norms.cached.single.lookup`
- Adaptive preload for normative conversion table: optional in-memory map when table is small. Config via:
  - `NORMS_PRELOAD_ENABLED` (default 1)
  - `NORMS_PRELOAD_ROW_THRESHOLD` (default 200000)
  - `NORMS_PRELOAD_MAX_ENTRIES` (default 400000)
- Admin metrics now expose `norm_preload` and `/admin/norms/cache-stats` returns `preload` stats.

### Deprecated
- Legacy Sessions endpoints:
  - `POST /sessions/{id}/submit_item`
  - `POST /sessions/{id}/submit_context`
  These include Deprecation headers and optional `Sunset` and can be disabled at runtime with `DISABLE_LEGACY_SUBMISSION=1`.

### Planned Breaking Change
- The legacy Sessions router `/sessions/*` is planned for removal in a future minor release.
  - Migration path: use batch endpoint `POST /sessions/{id}/submit_all_responses` or the Engine endpoints (`/engine/sessions/*`).
  - Runtime preparation: set `DISABLE_LEGACY_ROUTER=1` (non-dev/test) to validate that no clients depend on legacy routes.
  - Test suite update: `tests/test_sessions_legacy_parity.py` will be retired. For now, the file skips automatically when `DISABLE_LEGACY_ROUTER=1`.
  - Documentation: QUICK_REFERENCE.md contains the deprecation plan and counters guidance under Remove Legacy Flow.

### Monitoring & Rollout Guidance
- Monitor `deprecated.*` counters via `GET /admin/perf-metrics`.
- When counts approach zero:
  1) Staging: `DISABLE_LEGACY_SUBMISSION=1` (and optionally `DISABLE_LEGACY_ROUTER=1`).
  2) Production: apply the same toggles once confirmed.
  3) Next release: remove `app/routers/sessions.py` and retire legacy tests; add migration notes here.


## [0.2.0] - 2025-11-11

### Removed (Breaking)
- Legacy Sessions router `/sessions/*` removed. Use the Engine endpoints instead:
  - Start/delivery/interactions/finalize/report under `/engine/sessions/*`
  - Batch submit: `POST /engine/sessions/{id}/submit_all`

### Migration Notes
- Replace any usage of `/sessions/start`, `/sessions/{id}/items`, `/sessions/{id}/submit_item`, `/sessions/{id}/submit_context`,
  `/sessions/{id}/submit_all_responses`, `/sessions/{id}/finalize`, etc., with the corresponding Engine endpoints.
- Legacy tests have been retired. If you need to keep historical references, pin to a prior tag < 0.2.0.

