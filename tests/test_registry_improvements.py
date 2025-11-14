"""Tests for registry improvements."""

from typing import Any, MutableMapping, cast

import pytest
from app.engine import strategy_registry as registry_module
from app.engine.strategy_registry import (
    register_strategy,
    get_strategy,
    get_default_strategy,
    list_strategies,
    snapshot_strategies,
    load_strategies_from_plugins,
    _STRATEGIES,
)
from app.engine.strategies.base import ScoringStrategy
from sqlalchemy.orm import Session


class MockStrategy(ScoringStrategy):
    """Mock strategy for testing."""

    def __init__(self, code: str):
        self.code = code

    def finalize(self, db: Session, session_id: int, *, skip_checks: bool = False) -> dict[str, bool]:  # type: ignore[override]
        return {"ok": True}


def test_register_and_get_strategy():
    """Test basic strategy registration and retrieval."""
    mock = MockStrategy("TEST_STRATEGY_001")
    register_strategy(mock)
    
    retrieved = get_strategy("TEST_STRATEGY_001")
    assert retrieved is mock
    assert retrieved.code == "TEST_STRATEGY_001"


def test_list_strategies():
    """Test listing all registered strategies."""
    mock1 = MockStrategy("TEST_LIST_A")
    mock2 = MockStrategy("TEST_LIST_B")
    
    register_strategy(mock1)
    register_strategy(mock2)
    
    strategies = list_strategies()
    assert isinstance(strategies, list)
    assert "TEST_LIST_A" in strategies
    assert "TEST_LIST_B" in strategies


def test_snapshot_strategies():
    """Test getting immutable snapshot of strategies."""
    mock = MockStrategy("TEST_SNAPSHOT")
    register_strategy(mock)
    
    snapshot = snapshot_strategies()
    assert "TEST_SNAPSHOT" in snapshot
    assert snapshot["TEST_SNAPSHOT"] is mock
    
    # Snapshot should be read-only (MappingProxyType)
    immutable_snapshot = cast(MutableMapping[str, Any], snapshot)
    with pytest.raises(TypeError):
        immutable_snapshot["NEW_KEY"] = mock


def test_default_strategy_fallback():
    """Test default strategy fallback mechanism."""
    default_mock = MockStrategy("DEFAULT_STRATEGY")
    other_mock = MockStrategy("OTHER_STRATEGY")
    
    register_strategy(default_mock, is_default=True)
    register_strategy(other_mock)
    
    # Should get default when registered
    assert get_default_strategy() is default_mock
    
    # Should get specific strategy when it exists
    assert get_strategy("OTHER_STRATEGY") is other_mock
    
    # Should fall back to default when strategy not found
    result = get_strategy("NONEXISTENT_STRATEGY", use_default=True)
    assert result is default_mock


def test_strategy_not_found_error_message():
    """Test that missing strategy raises descriptive error."""
    with pytest.raises(KeyError) as exc_info:
        get_strategy("DEFINITELY_NOT_REGISTERED", use_default=False)
    
    error_message = str(exc_info.value)
    # Should mention available strategies
    assert "Available strategies" in error_message or "tidak terdaftar" in error_message


class DummyEntryPoint:
    def __init__(self, factory):
        self.name = "dummy"
        self._factory = factory

    def load(self):
        return self._factory


def test_load_strategies_from_plugins(monkeypatch):
    """Strategies exposed via entry points should be registered automatically."""
    plugin_strategy = MockStrategy("PLUGIN_STRATEGY")

    def fake_iter(group: str):  # pragma: no cover - monkeypatched lambda
        assert group == "kolb.strategies"
        return [DummyEntryPoint(lambda: plugin_strategy)]

    monkeypatch.setattr(registry_module, "_iter_strategy_entrypoints", fake_iter)
    loaded = load_strategies_from_plugins(force=True)
    assert loaded == 1
    assert get_strategy("PLUGIN_STRATEGY") is plugin_strategy


def test_register_strategy_duplicate_errors():
    """Duplicate codes without explicit override should raise ValueError."""
    code = "DUPLICATE_TEST"
    _STRATEGIES.pop(code, None)

    register_strategy(MockStrategy(code))
    with pytest.raises(ValueError):
        register_strategy(MockStrategy(code))
    _STRATEGIES.pop(code, None)
