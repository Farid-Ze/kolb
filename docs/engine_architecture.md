# Assessment Engine Extension Roadmap

This document outlines the target architecture for evolving the KLSI implementation into a generalized assessment engine capable of hosting multiple instruments while preserving psychometric fidelity.

## Objectives

- Support multiple assessment instruments (e.g., KLSI 4.0, Likert-based surveys, situational judgement tests).
- Provide a pluggable scoring strategy interface.
- Maintain audit-ready provenance for raw scores, derived metrics, and normative conversions.
- Enable versioned normative datasets with subgroup precedence.
- Facilitate longitudinal analytics (retest, developmental trajectories).

## Core Concepts

### Instrument
Represents a distinct assessment configuration. Key attributes include `code`, `name`, `version`, default `scoring_strategy`, and supported `response_modes`.

### Scoring Strategy
Encapsulates instrument-specific transformations. Each strategy must expose a `finalize(db, session_id)` method that computes raw scores, derived metrics, classifications, and norm conversions. Strategies register themselves through `app.engine.strategy_registry`.

### Item Bank
Unified catalog of assessment items with metadata describing response format, scoring weights, and locale-specific stems. Forced-choice, Likert, and other formats share a common ingestion and validation pipeline.

### Norm Set
Versioned normative conversions stored with subgroup identifiers (education level, country, age band, gender) and effective date ranges. Strategies resolve percentiles by consulting the norm repository using the established precedence chain.

### Provenance
Per-scale lineage captured in the `scale_provenance` table. Each entry records raw score, percentile, source kind (`database`, `appendix`, `unknown`), applied norm group, and whether the raw score falls outside the normative range.

## Layered Transformation Pipeline

1. **Response Validation** – Ensure ipsative or Likert constraints are satisfied per item format.
2. **Raw Score Extraction** – Aggregate mode totals or sum Likert values.
3. **Derived Metrics** – Compute dialectics, balance measures, and continuous indicators.
4. **Classification** – Assign primary/backup styles or trait categories based on derived metrics.
5. **Normative Conversion** – Apply subgroup precedence to convert raw/derived metrics to percentiles.
6. **Reporting** – Compose heuristics, educator recommendations, and analytics narratives.

## Current Progress

- Per-scale provenance persistence (`scale_provenance` table) with backfill migration.
- Age-band resolution anchored to session timestamps for reproducible subgroup routing.
- Initial scoring strategy scaffolding (`KLSI4Strategy`) registered through `app.engine.strategy_registry`.
- Finalize flow delegates to registered scoring strategies while preserving artifact snapshots and validation fallbacks.
- Instrument catalog (`instruments`, `instrument_scales`) established with sessions linked to instrument metadata and strategy tracking.

## Next Steps

1. Externalize regression coefficients, balance medians, and style windows into configuration files to support instrument updates without code edits.
2. Extend norm ingestion to accept metadata (version labels, effective dates, reliability indicators).
3. Implement generic response ingestion endpoint supporting multiple item types with pluggable validators.
4. Add longitudinal analytics (session relations, automatic test–retest reports).
5. Persist richer instrument metadata (e.g., locale variants, active windows) and expose strategy selection per session via reporting APIs.

Maintaining alignment with the Kolb Learning Style Inventory 4.0 psychometric specification remains mandatory. Each new instrument must document its theoretical framework and validation evidence in `docs/` before activation.
