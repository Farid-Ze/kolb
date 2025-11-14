from __future__ import annotations

"""Scoring strategy registry for assessment engines.

Provides a simple mapping-based registry for strategy lookup.
All error messages use centralized i18n constants for consistency.
"""

from typing import Dict

from app.engine.strategies.base import ScoringStrategy
from app.i18n.id_messages import StrategyMessages


_STRATEGIES: Dict[str, ScoringStrategy] = {}


def register_strategy(strategy: ScoringStrategy) -> None:
    """Register a scoring strategy with its code as key."""
    _STRATEGIES[strategy.code] = strategy


def get_strategy(code: str) -> ScoringStrategy:
    """Get a scoring strategy by code.
    
    Args:
        code: The strategy code to look up.
        
    Returns:
        The registered scoring strategy.
        
    Raises:
        KeyError: If the strategy is not registered.
    """
    if code not in _STRATEGIES:
        raise KeyError(StrategyMessages.STRATEGY_NOT_REGISTERED.format(code=code))
    return _STRATEGIES[code]
