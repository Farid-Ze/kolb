# Engine Module Architecture

## Overview

The `app/engine` module implements the core assessment execution engine for the KLSI system. It provides a pluggable architecture that separates instrument-specific logic from the runtime orchestration layer.

## Key Design Principles

1. **Separation of Concerns**: Clear boundaries between delivery, validation, scoring, and reporting
2. **Pluggability**: Instruments can be added without modifying the core engine
3. **Immutability**: Core data structures use frozen dataclasses to prevent unintended mutations
4. **Thread Safety**: All registries and shared state use locks for concurrent access
5. **Type Safety**: Comprehensive type hints enable static analysis via mypy

## Module Structure

```
app/engine/
├── __init__.py
├── README.md (this file)
├── constants.py          # Immutable constants (PRIMARY_MODE_CODES, etc.)
├── interfaces.py         # Protocol definitions for pluggable components
├── registry.py           # Thread-safe component registries
├── runtime.py            # Main orchestration layer
├── runtime_logic.py      # Pure business logic (testable without DB)
├── finalize.py           # Assessment finalization pipeline
├── pipelines.py          # Pipeline version management
├── validation.py         # Input validation logic
├── strategy_registry.py  # Legacy scoring strategy registry
├── authoring/            # Instrument manifest management
├── norms/                # Normative conversion providers
└── strategies/           # Scoring strategy implementations
```

## Core Components

### 1. Registry System (`registry.py`)

The registry system manages pluggable assessment components:

- **RegistryKey**: Composite key for (name, version) pairs
- **RegistryEntry**: Immutable container for instrument components
- **AssessmentRegistry**: Manages assessment definitions
- **EngineRegistry**: Manages instrument plugins and collaborators

**Key Features:**
- Thread-safe operations via `RLock`
- Plugin discovery via `importlib.metadata` entry points
- Immutable data structures (`frozen=True, slots=True`)
- Legacy dict-like interface for backward compatibility

**Example:**
```python
from app.engine.registry import engine_registry
from app.engine.interfaces import InstrumentId

# Register components
engine_registry.register_plugin(my_plugin)
engine_registry.register_scorer(inst_id, my_scorer)
engine_registry.register_norms(inst_id, my_norm_provider)
engine_registry.register_report(inst_id, my_report_builder)

# Retrieve components
plugin = engine_registry.plugin(InstrumentId("KLSI", "4.0"))
scorer = engine_registry.scorer(inst_id)
```

### 2. Runtime Orchestration (`runtime.py`)

The `EngineRuntime` class coordinates instrument execution:

**Responsibilities:**
- Session lifecycle management (start, submit, finalize)
- Plugin resolution and delegation
- Validation orchestration
- Audit logging and correlation tracking
- Error handling and recovery

**Key Methods:**
- `start_session()`: Initialize a new assessment session
- `fetch_delivery()`: Get instrument delivery payload
- `submit()`: Process user responses
- `finalize()`: Compute final scores and generate report
- `dry_run()`: Validate readiness without finalizing

**Execution Flow:**
```
1. Start Session → Plugin resolves instrument manifest
2. Fetch Delivery → Plugin provides item/context definitions
3. Submit Responses → Plugin validates and stores responses
4. Finalize → Scorer computes results → Norm provider converts → Report builder formats
```

### 3. Interfaces (`interfaces.py`)

Defines protocols for pluggable components:

- **InstrumentPlugin**: Delivery and validation logic
- **EngineScorer**: Scoring computation
- **EngineNormProvider**: Normative conversions
- **EngineReportBuilder**: Report formatting
- **ScoringStrategy**: Legacy scoring interface

**Protocol Benefits:**
- Structural subtyping (duck typing with type safety)
- Easy mocking in tests
- No inheritance required

### 4. Finalization Pipeline (`finalize.py`)

The finalization pipeline executes assessment-specific steps:

**Pipeline Structure:**
```python
@dataclass
class PipelineStep:
    name: str
    run: Callable[[Session, int, Dict], None]
    depends_on: list[str] = field(default_factory=list)
```

**Execution:**
- Steps run in dependency order
- Context shared across steps
- Artifacts captured for audit
- Transactional (all-or-nothing)

**Example Steps:**
1. `compute_raw_scores` → Sum ranks per mode
2. `compute_dialects` → ACCE = AC - CE, AERO = AE - RO
3. `assign_learning_style` → Map to 9-style grid
4. `compute_lfi` → Calculate flexibility index
5. `apply_percentiles` → Normative conversions

### 5. Validation (`validation.py`)

Input validation logic separated from business logic:

**Validation Types:**
- Ipsative constraints (ranks must be permutation of [1,2,3,4])
- Context completeness (all 8 LFI contexts)
- Item coverage (all 12 learning style items)
- No duplicate submissions

**Benefits:**
- Pure functions (testable without DB)
- Fail-fast error reporting
- Structured validation reports

## Data Flow

### Assessment Execution Flow

```
User → Router → EngineRuntime → Plugin → Scorer → NormProvider → ReportBuilder
  ↓        ↓          ↓            ↓        ↓         ↓              ↓
 HTTP     Auth    Orchestrate   Validate  Compute   Convert      Format
          Check   & Log         Input     Scores    Percentiles  JSON
```

### Session Lifecycle

```
START → STARTED
  ↓
SUBMIT (partial) → IN_PROGRESS
  ↓
SUBMIT (complete) → trigger validation
  ↓
FINALIZE → compute scores → COMPLETED
```

## Threading & Concurrency

### Thread Safety Guarantees

1. **Registries**: Use `RLock` for all operations
2. **Metrics**: Atomic counters and timers
3. **DB Sessions**: One session per request (request-scoped)
4. **Immutable Data**: Frozen dataclasses prevent mutation races

### Not Thread-Safe

- Individual assessment sessions (single-threaded by design)
- In-memory caches without explicit locking
- Module-level mutable state (avoid entirely)

## Performance Considerations

### Optimizations

1. **LRU Caching**: `@lru_cache` on expensive lookups
2. **Lazy Loading**: Import heavy modules only when needed
3. **Generator Pipelines**: Stream data instead of materializing lists
4. **Immutable Structures**: Avoid defensive copies
5. **Connection Pooling**: SQLAlchemy engine handles DB connections

### Profiling Hooks

- `@timeit` decorator: Function-level timing
- `@measure_time` decorator: Aggregate metrics
- `@count_calls` decorator: Invocation counting
- Correlation IDs: Trace requests across services

## Error Handling

### Error Hierarchy

```
DomainError (base)
├── ValidationError
│   └── InvalidAssessmentData
├── NotFoundError
│   ├── SessionNotFoundError
│   ├── InstrumentNotFoundError
│   └── PipelineNotFoundError
├── ConflictError
│   ├── SessionFinalizedError
│   └── PipelineConflictError
└── ConfigurationError
```

### Error Handling Strategy

1. **Domain Errors**: Recoverable, user-facing
2. **Configuration Errors**: Server-side issues, logged
3. **Validation Errors**: Input problems, clear feedback
4. **Fatal Errors**: Unhandled exceptions, 500 status

All error messages use centralized i18n constants (`app/i18n/id_messages.py`).

## Testing Strategy

### Unit Tests

- Pure logic functions (no DB, no HTTP)
- Mock protocols for dependencies
- Property-based testing for formulas

### Integration Tests

- Full engine runtime with test DB
- Actual plugins and scorers
- End-to-end session lifecycle

### Test Fixtures

```python
from tests.conftest import db_session, test_user, test_instrument

def test_finalize_session(db_session, test_user, test_instrument):
    runtime = EngineRuntime()
    session = runtime.start_session(db_session, test_user, test_instrument)
    # Submit responses...
    result = runtime.finalize(db_session, session.id)
    assert result["ready"] is True
```

## Extension Points

### Adding a New Instrument

1. **Create Plugin**: Implement `InstrumentPlugin` protocol
2. **Create Scorer**: Implement `EngineScorer` protocol
3. **Create Norm Provider**: Implement `EngineNormProvider` protocol
4. **Create Report Builder**: Implement `EngineReportBuilder` protocol
5. **Register Components**: In plugin module `__init__.py`

```python
from app.engine.registry import engine_registry

class MyPlugin:
    def id(self) -> InstrumentId:
        return InstrumentId("MyInstrument", "1.0")
    
    def delivery(self, db, session_id, locale):
        # Return item definitions
        pass
    
    def fetch_items(self, db, session_id):
        # Return user responses
        pass
    
    def validate_submit(self, db, session_id, payload):
        # Validate and store response
        pass

# Register
plugin = MyPlugin()
engine_registry.register_plugin(plugin)
engine_registry.register_scorer(plugin.id(), plugin)  # If scorer same as plugin
```

### Adding Pipeline Steps

Extend assessment definition with new steps:

```python
@dataclass
class MyAssessment:
    id = "MyInstrument"
    version = "1.0"
    steps = [
        PipelineStep("compute_scores", compute_my_scores),
        PipelineStep("apply_norms", apply_my_norms, depends_on=["compute_scores"]),
    ]
```

## Best Practices

### DO:

✅ Use protocol types for pluggable components
✅ Keep business logic pure and testable
✅ Use immutable data structures
✅ Add comprehensive docstrings to public APIs
✅ Log with correlation IDs for tracing
✅ Fail fast with clear error messages
✅ Use type hints everywhere

### DON'T:

❌ Mutate shared state without locking
❌ Mix I/O with business logic
❌ Hardcode instrument-specific logic in engine
❌ Swallow exceptions silently
❌ Use global mutable variables
❌ Skip validation on user input
❌ Forget to handle edge cases

## Future Enhancements

Potential improvements:

1. **Async/Await**: Convert to async for I/O-bound operations
2. **Event Sourcing**: Record all state changes as events
3. **Plugin Sandboxing**: Isolate plugin execution
4. **Caching Layer**: Redis for distributed caching
5. **Metrics Export**: Prometheus-compatible metrics
6. **Circuit Breakers**: Fault tolerance for external services

## Related Documentation

- `/docs/psychometrics_spec.md` - Mathematical specifications
- `/docs/02-relational-model.md` - Database schema
- `/docs/hci_model.md` - User experience principles
- `app/i18n/README.md` - Localization guidelines
- `app/assessments/klsi_v4/README.md` - KLSI 4.0 implementation

## Glossary

- **Assessment**: A versioned instrument configuration
- **Instrument**: A specific assessment tool (e.g., KLSI 4.0)
- **Plugin**: Instrument-specific delivery and validation logic
- **Scorer**: Component that computes raw and derived scores
- **Norm Provider**: Component that converts raw scores to percentiles
- **Report Builder**: Component that formats results for presentation
- **Session**: A user's in-progress assessment instance
- **Finalization**: The process of computing final scores and generating a report
- **Ipsative**: Forced-choice ranking where each option gets a unique rank

---

**Maintained by**: Farid-Ze
**Last Updated**: 2025-11-13
**Version**: 1.0
