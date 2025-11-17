from __future__ import annotations

import pytest
from sqlalchemy.orm import Session

from app.engine.strategy_registry import StrategyRegistry


class _DummyStrategy:
    def __init__(self, code: str):
        self.code = code

    def finalize(self, db: Session, session_id: int):  # pragma: no cover - unused
        return {}


def test_registry_returns_default_strategy_when_missing_code():
    registry = StrategyRegistry()
    default = _DummyStrategy("DEFAULT")
    registry.register(default, is_default=True)

    resolved = registry.get("UNKNOWN_CODE")

    assert resolved is default


def test_registry_respects_use_default_flag():
    registry = StrategyRegistry()
    registry.register(_DummyStrategy("DEFAULT"), is_default=True)

    with pytest.raises(KeyError):
        registry.get("MISSING", use_default=False)
