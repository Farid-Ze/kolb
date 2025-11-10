from __future__ import annotations

from typing import Dict

from app.engine.strategies.base import ScoringStrategy


_STRATEGIES: Dict[str, ScoringStrategy] = {}


def register_strategy(strategy: ScoringStrategy) -> None:
    _STRATEGIES[strategy.code] = strategy


def get_strategy(code: str) -> ScoringStrategy:
    if code not in _STRATEGIES:
        raise KeyError(f"Scoring strategy not registered: {code}")
    return _STRATEGIES[code]
