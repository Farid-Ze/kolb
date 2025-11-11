# Engine Architecture Overview

This note captures how the assessment engine is structured, how control flows from
routers down to persistence, and where extension points (registries, pipelines,
norm providers) enter the picture. It is the companion to the psychometrics
specification and should be read alongside `docs/03-klsi-overview.md` and
`docs/15-implementation-status-report.md`.

## Layered Responsibilities

- **Routers (`app/routers/`)** – HTTP boundary. They authenticate, authorize,
	deserialize payloads, and dispatch to the service layer. No business logic
	beyond input validation or error translation lives here.
- **Services (`app/services/`)** – Orchestration layer. Each service coordinates
	repositories, engine runtime, localization, and reporting. Services are the
	API that routers call.
- **Engine (`app/engine/`)** – Assessment-agnostic runtime that handles
	instrument registration, pipeline execution, auditing, and metric reporting.
	It delegates psychometric computation to instrument plugins.
- **Assessments (`app/assessments/`)** – Instrument-specific logic and
	configuration. For KLSI 4.0 this includes forced-choice validation, style
	assignment, and percentile mapping.
- **Repositories (`app/db/repositories/`)** – Typed, testable data-access
	objects that isolate SQLAlchemy usage. Repository creation is funneled through
	`RepositoryProvider` to avoid leaking sessions across layers.
- **Models (`app/models/`)** – Declarative SQLAlchemy models. They remain
	persistence only: constructors do not perform I/O or scoring.

## Runtime Flow (Happy Path)

1. `POST /sessions/{id}/submit_all_responses` calls `runtime.finalize_with_audit`.
2. `EngineRuntime` resolves the session, looks up the registered plugin,
	 validates readiness, and invokes the plugin scorer (`finalize`).
3. The scorer calls into `app/services/scoring.finalize_session`, which in turn
	 drives the canonical pipeline defined in
	 `app/assessments/klsi_v4/definition.py` (raw modes → combination → style →
	 LFI → percentiles → longitudinal delta).
4. Each step uses repositories pulled from `RepositoryProvider` or via direct
	 constructor injection to keep DB access explicit and mockable.
5. Upon success the engine updates the session status, assembles provenance
	 snapshots, persists audit hashes, and returns a structured outcome to the
	 router, which serializes the response payload.

## Plugin Registry & Discovery

- Instrument plugins implement `InstrumentPlugin`, `EngineScorer`,
	`EngineNormProvider`, and `EngineReportBuilder` protocols.
- Registrations go through `EngineRegistry`, which stores immutable
	`RegistryEntry` objects keyed by `RegistryKey`. Thread safety is enforced with
	a re-entrant lock.
- Optional auto-discovery uses `importlib.metadata.entry_points` with the
	`kolb.instruments` group, allowing out-of-package instruments to register
	themselves without touching core code.

## Pipelines and Steps

- The declarative pipeline in `definition.py` specifies a list of step objects.
- Each step exposes a `.name` and `.depends_on` list, enabling dependency
	checking before execution. This guards against missing prerequisites when
	authors reorder steps.
- Steps are pure glue: they call functions from `app.assessments.klsi_v4.logic`
	which perform the heavy computation using immutable value types (`ScoreVector`,
	`CombinationScore`, `UserLearningStyle`).
- Future instruments can inherit this structure by providing their own
	definition module and registering it with `engine_registry`.

## Normative Data Strategy

- Norm lookups are composed via `CompositeNormProvider`, which chains the
	database-backed provider, optional external HTTP provider, and Appendix
	fallbacks.
- `app/engine/norms/factory._maybe_build_preloaded_map` creates an immutable
	`MappingProxyType` snapshot when the DB table is below configured thresholds.
	Otherwise the runtime falls back to an LRU-cached query function.
- `RepositoryProvider` ensures that all norm repositories share a single SQL
	session, preventing redundant engine creation.

## Metrics & Observability

- `app/core/metrics.py` exposes `@timeit` for latency measurement and histogram
	aggregation. `EngineRuntime.finalize` and `finalize_with_audit` are decorated
	to emit timing data for dashboards.
- Validation issues, fallback provenance, and anomaly detection outcomes are
	captured in the returned payload and persisted in audit logs to satisfy
	psychometric auditability.

## Transactions & Repository Scope

- `transactional_session` provides a basic commit/rollback wrapper for scripts
	and CLI jobs.
- `hyperatomic_session` is stricter: it flushes and commits automatically while
	rejecting nested commits, ensuring pipelines do not leak partial state.
- `repository_scope` yields a `RepositoryProvider` inside a transactional scope.
	This gives services a concise way to obtain repository instances without
	manually managing session lifetimes, keeping the I/O layer fully encapsulated.

## Extension Checklist

When adding a new assessment instrument:

1. Implement logic functions (validation, scoring, percentile conversion) in a
	 dedicated module under `app/assessments/`.
2. Define step classes and an `AssessmentDefinition` analogue mirroring the KLSI
	 blueprint.
3. Create an instrument plugin that implements the required protocols and
	 registers itself via `engine_registry` (or an entry point).
4. Add repository methods if the instrument needs bespoke persistence tables.
5. Document any new pipelines or norm strategies in this file and the main
	 implementation status report.

