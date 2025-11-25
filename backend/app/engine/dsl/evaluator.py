from typing import Any, Mapping, Sequence

from app.models.engine import RuleType


class DSLExecutionError(ValueError):
    """Raised when DSL expressions violate safety or semantic guarantees."""


_SAFE_LITERAL_TYPES = (str, int, float, bool, type(None))


def evaluate_rule(rule_type: RuleType, expression: Mapping[str, Any], context: Mapping[str, Any]) -> Any:
    """Evaluate a scoring rule against an immutable context without side effects."""

    if not isinstance(expression, Mapping):
        raise DSLExecutionError("Expression must be a mapping")
    _ensure_safe_structure(expression)

    match rule_type:
        case RuleType.sum:
            return _evaluate_sum(expression, context)
        case RuleType.diff:
            return _evaluate_diff(expression, context)
        case RuleType.percentile:
            return _evaluate_percentile(expression, context)
        case RuleType.classify:
            return _evaluate_classify(expression, context)
        case RuleType.custom:
            raise DSLExecutionError("CUSTOM rules require vetted runtime hooks and cannot run in pure DSL context")
        case _:
            raise DSLExecutionError(f"Unsupported rule type: {rule_type}")


def _ensure_safe_structure(value: Any) -> None:
    if isinstance(value, Mapping):
        for key, nested in value.items():
            if not isinstance(key, (str, int, float)):
                raise DSLExecutionError("Expression keys must be str or numeric")
            _ensure_safe_structure(nested)
        return
    if isinstance(value, (list, tuple)):
        for item in value:
            _ensure_safe_structure(item)
        return
    if isinstance(value, _SAFE_LITERAL_TYPES):
        return
    raise DSLExecutionError(f"Unsupported literal in expression: {type(value).__name__}")


def _evaluate_sum(expression: Mapping[str, Any], context: Mapping[str, Any]) -> float:
    inputs = expression.get("inputs")
    if not isinstance(inputs, Sequence) or not inputs:
        raise DSLExecutionError("SUM rule requires non-empty inputs sequence")
    total = 0.0
    for ref in inputs:
        total += _resolve_numeric_reference(ref, context)
    return total


def _evaluate_diff(expression: Mapping[str, Any], context: Mapping[str, Any]) -> float:
    minuend = expression.get("minuend")
    subtrahend = expression.get("subtrahend")
    if minuend is None or subtrahend is None:
        raise DSLExecutionError("DIFF rule requires minuend and subtrahend")
    return _resolve_numeric_reference(minuend, context) - _resolve_numeric_reference(subtrahend, context)


def _evaluate_percentile(expression: Mapping[str, Any], context: Mapping[str, Any]) -> float:
    metric_key = expression.get("metric")
    table = expression.get("table")
    if metric_key is None:
        raise DSLExecutionError("PERCENTILE rule requires metric reference")
    if not isinstance(table, Mapping) or not table:
        raise DSLExecutionError("PERCENTILE rule requires lookup table mapping")
    normalized_table = _normalize_percentile_table(table)
    lookup_value = int(round(_resolve_numeric_reference(metric_key, context)))
    if lookup_value not in normalized_table:
        raise DSLExecutionError(f"Percentile table missing key: {lookup_value}")
    return normalized_table[lookup_value]


def _evaluate_classify(expression: Mapping[str, Any], context: Mapping[str, Any]) -> str | None:
    metric_key = expression.get("metric")
    windows = expression.get("windows")
    if metric_key is None:
        raise DSLExecutionError("CLASSIFY rule requires metric reference")
    if not isinstance(windows, Sequence) or not windows:
        raise DSLExecutionError("CLASSIFY rule requires ordered windows")
    value = _resolve_numeric_reference(metric_key, context)
    for window in windows:
        if not isinstance(window, Mapping):
            raise DSLExecutionError("CLASSIFY windows must be mappings")
        name = window.get("name")
        low = window.get("min")
        high = window.get("max")
        if name is None:
            raise DSLExecutionError("CLASSIFY window missing name")
        if low is not None and value < float(low):
            continue
        if high is not None and value > float(high):
            continue
        return str(name)
    return None


def _resolve_numeric_reference(reference: Any, context: Mapping[str, Any]) -> float:
    if not isinstance(reference, str):
        raise DSLExecutionError("Expression references must be strings")
    if reference not in context:
        raise DSLExecutionError(f"Missing context value: {reference}")
    return _coerce_numeric(context[reference])


def _coerce_numeric(value: Any) -> float:
    if isinstance(value, bool):
        raise DSLExecutionError("Boolean context values are not permitted in DSL execution")
    if isinstance(value, (int, float)):
        return float(value)
    if isinstance(value, (list, tuple)):
        total = 0.0
        for nested in value:
            total += _coerce_numeric(nested)
        return total
    raise DSLExecutionError(f"Context value must be numeric, got {type(value).__name__}")


def _normalize_percentile_table(table: Mapping[Any, Any]) -> dict[int, float]:
    normalized: dict[int, float] = {}
    for raw_key, value in table.items():
        try:
            key_int = int(raw_key)
        except (TypeError, ValueError) as exc:
            raise DSLExecutionError("Percentile table keys must be integers") from exc
        normalized[key_int] = float(value)
    return normalized
