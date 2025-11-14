# Quick Start: Registry, Pipeline, and i18n

## Quick Reference for New Features

### 1. Register a Plugin

```python
from app.engine.registry import register_plugin
from app.engine.interfaces import InstrumentPlugin, InstrumentId

class MyPlugin(InstrumentPlugin):
    def id(self) -> InstrumentId:
        return InstrumentId("TEST", "1.0")
    
    # ... other methods

# Register at module level
register_plugin(MyPlugin())
```

### 2. Register a Strategy with Fallback

```python
from app.engine.strategy_registry import register_strategy

# Register as default fallback
register_strategy(my_strategy, is_default=True)

# Get strategy with automatic fallback
strategy = get_strategy("PREFERRED", use_default=True)
```

### 3. Define a Pipeline

```python
from app.engine.pipelines import PipelineDefinition

def stage1(db, session_id):
    # Do work
    return {"stage1_result": "value"}

def stage2(db, session_id):
    # Do more work
    return {"stage2_result": "value"}

pipeline = PipelineDefinition(
    code="MY_PIPELINE",
    version="1.0",
    stages=(stage1, stage2),
    description="My custom pipeline"
)

# Execute
result = pipeline.execute(db, session_id)
if result["ok"]:
    print(f"Success! Stages: {result['stages_completed']}")
```

### 4. Use i18n Resources

```python
from app.i18n import get_i18n_resource

# Get messages with automatic fallback
messages = get_i18n_resource("messages", "id")
text = messages.get("key", "default")

# Preload at startup (done automatically)
from app.i18n import preload_i18n_resources
stats = preload_i18n_resources()
```

### 5. List Available Strategies

```python
from app.engine.strategy_registry import list_strategies, snapshot_strategies

# Get list of codes
codes = list_strategies()
print(f"Available: {codes}")

# Get full snapshot
snapshot = snapshot_strategies()
for code, strategy in snapshot.items():
    print(f"{code}: {strategy}")
```

### 6. Use KLSI Pipeline

```python
from app.engine.pipelines import get_klsi_pipeline_definition

pipeline = get_klsi_pipeline_definition()

# Stages included:
# 1. compute_raw_scale_scores
# 2. compute_combination_scores
# 3. assign_learning_style
# 4. compute_lfi

result = pipeline.execute(db, session_id)
```

## Configuration

### Enable i18n Preload
```bash
I18N_PRELOAD_ENABLED=true  # default
```

### Check Startup Logs
```
INFO startup_preload_i18n {"i18n_preload_enabled": true}
INFO i18n_preload_complete {"loaded_count": 4, "failed_count": 0, "cache_size": 4}
```

## Testing

### Clear Caches Between Tests

```python
from app.i18n import clear_i18n_cache

def test_something():
    clear_i18n_cache()
    # ... test code
```

### Mock Pipeline Stages

```python
class MockStage:
    def __init__(self, name, return_value):
        self._name = name
        self._return_value = return_value
        self.called = False
    
    def __call__(self, db, session_id):
        self.called = True
        return self._return_value
    
    @property
    def __name__(self):
        return self._name
```

## Common Patterns

### Graceful Strategy Fallback

```python
try:
    strategy = get_strategy("SPECIFIC")
except KeyError:
    strategy = get_strategy("DEFAULT")
```

### Pipeline Error Recovery

```python
pipeline = get_klsi_pipeline_definition()
try:
    result = pipeline.execute(db, session_id)
except Exception as exc:
    logger.error(f"Pipeline failed: {exc}")
    # Handle error
```

### Locale Fallback Chain

```
Requested: "id"
  ↓
Try: id_messages.json
  ↓ (not found)
Try: en_messages.json
  ↓ (not found)
Try: messages.json
  ↓ (not found)
Raise: KeyError
```

## Migration Checklist

- [ ] Run `alembic upgrade head` for new indexes
- [ ] Verify `I18N_PRELOAD_ENABLED=true` in production
- [ ] Check startup logs for i18n stats
- [ ] Update tests to use new registry functions
- [ ] Replace manual strategy lookups with `get_strategy()`
- [ ] Use `register_plugin()` for new plugins

## Troubleshooting

### i18n Not Preloading
```bash
# Check config
echo $I18N_PRELOAD_ENABLED

# Check startup logs
grep "startup_preload_i18n" app.log
```

### Strategy Not Found
```python
# List available strategies
from app.engine.strategy_registry import list_strategies
print(list_strategies())
```

### Pipeline Stage Failing
```python
# Check result for failed stage
result = pipeline.execute(db, session_id)
if not result["ok"]:
    print(f"Failed at: {result['failed_stage']}")
    print(f"Error: {result['error']}")
```

## Performance Tips

1. **i18n**: Always preload in production
2. **Registry**: Use default fallback to avoid try-catch
3. **Pipeline**: Keep stages small and focused
4. **DB**: Ensure indexes are created via migration

## Further Reading

- [Full Documentation](./18-registry-pipeline-i18n-improvements.md)
- [Architecture Overview](./17-architecture-engine.md)
- [Test Examples](../tests/test_pipeline_declarative.py)
