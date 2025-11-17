import pytest

from app.engine.dsl import DSLExecutionError, evaluate_rule
from app.models.engine import RuleType


def test_sum_rule_is_deterministic():
    expr = {"inputs": ["CE_raw", "CE_bonus"]}
    ctx = {"CE_raw": 40, "CE_bonus": 2}
    first = evaluate_rule(RuleType.sum, expr, ctx)
    second = evaluate_rule(RuleType.sum, expr, ctx)
    assert first == pytest.approx(42.0)
    assert second == pytest.approx(42.0)


def test_diff_rule_subtracts_values():
    expr = {"minuend": "AC_raw", "subtrahend": "CE_raw"}
    ctx = {"AC_raw": 50, "CE_raw": 40}
    assert evaluate_rule(RuleType.diff, expr, ctx) == pytest.approx(10.0)


def test_percentile_rule_uses_lookup_table():
    expr = {"metric": "CE_raw", "table": {40: 20.0, 41: 25.0}}
    ctx = {"CE_raw": 41}
    assert evaluate_rule(RuleType.percentile, expr, ctx) == pytest.approx(25.0)


def test_classify_rule_returns_window_label():
    expr = {
        "metric": "ACCE",
        "windows": [
            {"name": "low", "max": 5},
            {"name": "mid", "min": 6, "max": 14},
            {"name": "high", "min": 15},
        ],
    }
    ctx = {"ACCE": 10}
    assert evaluate_rule(RuleType.classify, expr, ctx) == "mid"


def test_custom_rule_rejected():
    with pytest.raises(DSLExecutionError):
        evaluate_rule(RuleType.custom, {"hook": "app.scoring.custom"}, {})


def test_expression_rejects_callables():
    with pytest.raises(DSLExecutionError):
        evaluate_rule(RuleType.sum, {"inputs": [lambda: 1]}, {"value": 1})


def test_boolean_context_not_allowed():
    with pytest.raises(DSLExecutionError):
        evaluate_rule(RuleType.sum, {"inputs": ["flag"]}, {"flag": True})
