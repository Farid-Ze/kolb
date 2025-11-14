"""Scoring strategy registry with optional plugin discovery."""

from __future__ import annotations

import importlib
import logging
from dataclasses import dataclass, field
from importlib import metadata
from threading import RLock
from types import MappingProxyType
from typing import Callable, Dict, Iterable, Mapping, Protocol, cast

from typing import TYPE_CHECKING
from typing import Protocol

from app.i18n.id_messages import StrategyMessages

if TYPE_CHECKING:  # pragma: no cover - typing only
    from app.engine.strategies.base import ScoringStrategy as _ScoringStrategy
else:

    class _ScoringStrategy(Protocol):
        code: str

        def finalize(self, db, session_id): ...  # pragma: no cover - typing stub

ScoringStrategy = _ScoringStrategy

__all__ = [
    "StrategyRegistry",
    "register_strategy",
    "get_strategy",
    "get_default_strategy",
    "list_strategies",
    "snapshot_strategies",
    "load_strategies_from_plugins",
    "ensure_default_strategies_loaded",
]

logger = logging.getLogger(__name__)


class EntryPointLike(Protocol):
    """Minimal interface for importlib.metadata.EntryPoint used in tests."""

    name: str

    def load(self) -> Callable[[], ScoringStrategy] | ScoringStrategy: ...


def _iter_strategy_entrypoints(group: str) -> Iterable[EntryPointLike]:
    """Yield entry points for the given group, handling importlib compat."""

    try:  # Python 3.10+ API
        eps = metadata.entry_points()
    except Exception as exc:  # pragma: no cover - very defensive
        logger.warning("Failed to enumerate strategy entry points: %s", exc)
        return []

    if hasattr(eps, "select"):
        return eps.select(group=group)
    return eps.get(group, [])  # type: ignore[index]


def _instantiate_strategy(candidate: Callable[[], ScoringStrategy] | ScoringStrategy) -> ScoringStrategy:
    """Instantiate strategy candidates coming from entry points."""

    if isinstance(candidate, type):  # Strategy class provided
        return candidate()
    if callable(candidate) and not hasattr(candidate, "code"):
        return candidate()  # Factory function
    return cast(ScoringStrategy, candidate)


@dataclass(slots=True)
class StrategyRegistry:
    """Thread-safe registry for scoring strategies."""

    _strategies: Dict[str, ScoringStrategy] = field(default_factory=dict)
    _default_strategy_code: str | None = None
    _lock: RLock = field(default_factory=RLock)
    _plugins_loaded: bool = False

    def register(
        self,
        strategy: ScoringStrategy,
        *,
        is_default: bool = False,
        allow_replace: bool = False,
    ) -> None:
        with self._lock:
            if not allow_replace and strategy.code in self._strategies:
                raise ValueError(
                    f"Strategy '{strategy.code}' already registered; "
                    "set allow_replace=True to override"
                )
            self._strategies[strategy.code] = strategy
            if is_default:
                self._default_strategy_code = strategy.code
                logger.info("Set default strategy: %s", strategy.code)

    def get(self, code: str, *, use_default: bool = True) -> ScoringStrategy:
        with self._lock:
            if code in self._strategies:
                return self._strategies[code]

            default_code = self._default_strategy_code
            if (
                use_default
                and default_code
                and default_code in self._strategies
            ):
                logger.warning(
                    "Strategy '%s' not found, falling back to default '%s'",
                    code,
                    default_code,
                )
                return self._strategies[default_code]

            available = list(self._strategies.keys()) or ["none"]
            default_info = f" default='{default_code}'" if default_code else ""
            raise KeyError(
                f"{StrategyMessages.STRATEGY_NOT_REGISTERED.format(code=code)}. "
                f"Available strategies: {', '.join(available)};{default_info}"
            )

    def get_default(self) -> ScoringStrategy | None:
        with self._lock:
            default_code = self._default_strategy_code
            if default_code and default_code in self._strategies:
                return self._strategies[default_code]
            return None

    def list(self) -> list[str]:
        with self._lock:
            return sorted(self._strategies.keys())

    def snapshot(self) -> Mapping[str, ScoringStrategy]:
        with self._lock:
            return MappingProxyType(dict(self._strategies))

    def load_from_plugins(
        self,
        *,
        group: str = "kolb.strategies",
        force: bool = False,
    ) -> int:
        with self._lock:
            if self._plugins_loaded and not force:
                return 0

        loaded = 0
        for entry_point in _iter_strategy_entrypoints(group):
            strategy_obj = entry_point.load()
            strategy = _instantiate_strategy(strategy_obj)
            self.register(strategy)
            loaded += 1

        with self._lock:
            self._plugins_loaded = True
        logger.info("Loaded %s strategy plugin(s)", loaded)
        return loaded


_REGISTRY = StrategyRegistry()
_STRATEGIES: Dict[str, ScoringStrategy] = _REGISTRY._strategies  # Back-compat for tests
_DEFAULTS_LOADED = False


def ensure_default_strategies_loaded() -> None:
    """Lazily import default strategy registrations when needed."""

    global _DEFAULTS_LOADED
    if _DEFAULTS_LOADED or _STRATEGIES:
        return
    try:
        importlib.import_module("app.engine.strategies")
        _DEFAULTS_LOADED = True
    except ImportError as exc:  # pragma: no cover - defensive guard
        logger.warning("Failed to import default strategies: %s", exc)


def register_strategy(
    strategy: ScoringStrategy,
    *,
    is_default: bool = False,
    allow_replace: bool = False,
) -> None:
    _REGISTRY.register(strategy, is_default=is_default, allow_replace=allow_replace)


def get_strategy(code: str, *, use_default: bool = True) -> ScoringStrategy:
    return _REGISTRY.get(code, use_default=use_default)


def get_default_strategy() -> ScoringStrategy | None:
    return _REGISTRY.get_default()


def list_strategies() -> list[str]:
    return _REGISTRY.list()


def snapshot_strategies() -> Mapping[str, ScoringStrategy]:
    return _REGISTRY.snapshot()


def load_strategies_from_plugins(*, group: str = "kolb.strategies", force: bool = False) -> int:
    """Discover and register strategies exposed via entry points."""

    return _REGISTRY.load_from_plugins(group=group, force=force)
