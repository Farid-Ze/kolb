import pytest
import time
from unittest.mock import patch

from app.engine.dsl import DSLExecutionError, DSLTimeoutError, evaluate_rule
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


def test_evaluate_rule_timeout():
    # Create a huge expression that would take time if we could simulate it,
    # or mock time.time to jump forward.
    
    expr = {"inputs": ["val"]}
    ctx = {"val": 1}
    
    # Mock time.time to return start_time then start_time + 3
    with patch('time.time') as mock_time:
        mock_time.side_effect = [1000.0, 1003.0, 1004.0] # Start, Check 1, Check 2
        
        # If default timeout is 2.0, this should fail
        with pytest.raises(DSLTimeoutError):
            evaluate_rule(RuleType.sum, expr, ctx)


def test_evaluate_rule_custom_timeout():
    expr = {"inputs": ["val"]}
    ctx = {"val": 1}
    
    # Mock time.time to return start_time then start_time + 0.5
    with patch('time.time') as mock_time:
        mock_time.side_effect = [1000.0, 1000.5, 1000.6]
        
        # If we set timeout to 0.1, this should fail
        with pytest.raises(DSLTimeoutError):
            evaluate_rule(RuleType.sum, expr, ctx, timeout_sec=0.1)


def test_evaluate_rule_pure_no_globals():
    # This test is more about the signature change.
    # We want to ensure we can pass timeout_sec.
    expr = {"inputs": ["val"]}
    ctx = {"val": 1}
    result = evaluate_rule(RuleType.sum, expr, ctx, timeout_sec=5.0)
    assert result == 1.0
