from __future__ import annotations

"""Scoring strategy registry for assessment engines.

Provides a simple mapping-based registry for strategy lookup.
All error messages use centralized i18n constants for consistency.

The registry is a locked dictionary that maps strategy codes to strategy instances.
After initial registration, the registry is read-only for thread-safety.
"""

import logging
from threading import RLock
from types import MappingProxyType
from typing import Dict, Mapping

from app.engine.strategies.base import ScoringStrategy
from app.i18n.id_messages import StrategyMessages

__all__ = [
    "register_strategy",
    "get_strategy",
    "get_default_strategy",
    "list_strategies",
    "snapshot_strategies",
]

logger = logging.getLogger(__name__)

_STRATEGIES: Dict[str, ScoringStrategy] = {}
_DEFAULT_STRATEGY_CODE: str | None = None
_lock = RLock()


def register_strategy(strategy: ScoringStrategy, *, is_default: bool = False) -> None:
    """Register a scoring strategy with its code as key.
    
    Args:
        strategy: The scoring strategy to register.
        is_default: If True, set this as the default fallback strategy.
    """
    global _DEFAULT_STRATEGY_CODE
    with _lock:
        _STRATEGIES[strategy.code] = strategy
        if is_default:
            _DEFAULT_STRATEGY_CODE = strategy.code
            logger.info(f"Set default strategy: {strategy.code}")


def get_strategy(code: str, *, use_default: bool = True) -> ScoringStrategy:
    """Get a scoring strategy by code with optional fallback to default.
    
    Args:
        code: The strategy code to look up.
        use_default: If True and code not found, try default strategy.
        
    Returns:
        The registered scoring strategy.
        
    Raises:
        KeyError: If the strategy is not registered and no default available.
    """
    with _lock:
        if code in _STRATEGIES:
            return _STRATEGIES[code]

        # Try default fallback if enabled
        if use_default and _DEFAULT_STRATEGY_CODE and _DEFAULT_STRATEGY_CODE in _STRATEGIES:
            logger.warning(
                f"Strategy '{code}' not found, falling back to default '{_DEFAULT_STRATEGY_CODE}'"
            )
            return _STRATEGIES[_DEFAULT_STRATEGY_CODE]

        # No strategy found and no default available
        available = list(_STRATEGIES.keys()) if _STRATEGIES else ["none"]
        default_info = (
            f" default='{_DEFAULT_STRATEGY_CODE}'" if _DEFAULT_STRATEGY_CODE else ""
        )
        raise KeyError(
            f"{StrategyMessages.STRATEGY_NOT_REGISTERED.format(code=code)}. "
            f"Available strategies: {', '.join(available)};" f"{default_info}"
        )


def get_default_strategy() -> ScoringStrategy | None:
    """Get the default fallback strategy if one is registered.
    
    Returns:
        The default strategy, or None if no default is set.
    """
    with _lock:
        if _DEFAULT_STRATEGY_CODE and _DEFAULT_STRATEGY_CODE in _STRATEGIES:
            return _STRATEGIES[_DEFAULT_STRATEGY_CODE]
        return None


def list_strategies() -> list[str]:
    """List all registered strategy codes.
    
    Returns:
        List of strategy codes sorted alphabetically.
    """
    with _lock:
        return sorted(_STRATEGIES.keys())


def snapshot_strategies() -> Mapping[str, ScoringStrategy]:
    """Get an immutable snapshot of all registered strategies.
    
    Returns:
        Read-only mapping of strategy codes to strategy instances.
    """
    with _lock:
        return MappingProxyType(dict(_STRATEGIES))
