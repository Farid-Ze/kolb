# Assessment Engine Overview

This document outlines the phased migration from a KLSI-specific backend to a reusable, declarative assessment engine while preserving psychometric fidelity.

## Goals
- Keep KLSI 4.0 formulas and validations authoritative (see `docs/psychometrics_spec.md`).
- Introduce generic authoring tables (instrument → form → page → item → option) and declarative scoring rules.
- Maintain current API behavior and report outputs during migration.

## Current Architecture Snapshot
- Runtime: `app/engine/runtime.py` orchestrates pluggable instruments via registry.
- KLSI plugin: `app/instruments/klsi4/plugin.py` provides item delivery, submission validation, scoring, norms, and reports.
- Norms: Composite provider with precedence Database → External → Appendix. Provenance is stored per-scale.
- Finalization: Transactional, with readiness checks and audit logging.

## New Engine Authoring Models
File: `app/models/engine.py`
- EngineInstrument(code, version, name, status)
- EngineForm(form_code, ordering)
- EnginePage(page_code, page_order)
- EngineItem(item_code, item_type, stem, sequence_order, metadata_payload)
- EngineItemOption(option_code, option_text, learning_mode, value)
- EngineScale(scale_code, name)
- EngineScoringRule(rule_code, rule_type, target, expression, config, position)

These tables are additive and do not alter existing KLSI tables.

## Phased Migration Plan
1. Seed KLSI authoring data into engine tables (read-only mirror).
2. Add a runtime adapter to read items/scales/rules from engine tables while delegating scoring to existing services.
3. Incrementally move safe computations (e.g., raw sums) into rules DSL with test parity.
4. Retain dialectics, style windows, and LFI in service layer until parity and citations are documented.

## DSL Sketch (non-binding)
- Rule types: SUM, DIFF, PERCENTILE, CLASSIFY, CUSTOM.
- Expression format: JSON or compact function strings, e.g., `sum(item.rank[CE])` or `{ "op": "sum", "of": ["CE"] }`.
- Execution will be deterministic and side-effect free; persistence handled by orchestrator steps.

## Compatibility & Tests
- All existing tests remain green (see CI). New engine tables are created in tests via `tests/conftest.py` import.
- Any change to behavior must be accompanied by boundary tests (happy path + edge cases).

## Next Steps
- Seeder for KLSI → engine authoring tables.
- Minimal runtime reader for engine items (behind a feature flag).
- JWT hardening and engine security guidelines.
