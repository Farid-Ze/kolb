from __future__ import annotations

import inspect
import logging
from collections.abc import MutableMapping
from dataclasses import dataclass, replace
from importlib.metadata import EntryPoint, entry_points
from threading import RLock
from types import MappingProxyType
from typing import Callable, Dict, Iterable, Iterator, Mapping, Tuple, cast

from app.engine.interfaces import (
    AssessmentDefinition,
    EngineNormProvider,
    EngineReportBuilder,
    EngineScorer,
    InstrumentId,
    InstrumentPlugin,
)

__all__ = [
    "RegistryError",
    "RegistryKey",
    "RegistryEntry",
    "assessment_registry",
    "register",
    "get",
    "EngineRegistry",
    "engine_registry",
]


logger = logging.getLogger(__name__)


class RegistryError(KeyError):
    """Raised when attempting to access an unregistered engine component."""


@dataclass(frozen=True, slots=True)
class RegistryKey:
    """Hashable key used across assessment and instrument registries."""

    name: str
    version: str

    @classmethod
    def from_id(cls, inst: InstrumentId) -> "RegistryKey":
        return cls(inst.key, inst.version)

    def token(self) -> str:
        return f"{self.name}:{self.version}"


@dataclass(frozen=True, slots=True)
class RegistryEntry:
    """Immutable container holding instrument-specific engine components."""

    plugin: InstrumentPlugin | None = None
    scorer: EngineScorer | None = None
    norm_provider: EngineNormProvider | None = None
    report_builder: EngineReportBuilder | None = None

    def with_plugin(self, plugin: InstrumentPlugin) -> "RegistryEntry":
        return replace(self, plugin=plugin)

    def with_scorer(self, scorer: EngineScorer) -> "RegistryEntry":
        return replace(self, scorer=scorer)

    def with_norm_provider(self, provider: EngineNormProvider) -> "RegistryEntry":
        return replace(self, norm_provider=provider)

    def with_report_builder(self, builder: EngineReportBuilder) -> "RegistryEntry":
        return replace(self, report_builder=builder)


_UNSET = object()


class _TokenMapping(MutableMapping[str, AssessmentDefinition]):
    """Legacy MutableMapping keyed by `<name>:<version>` tokens."""

    def __init__(self, registry: "AssessmentRegistry") -> None:
        self._registry = registry

    def _split(self, token: str) -> RegistryKey:
        try:
            name, version = token.split(":", 1)
        except ValueError as exc:  # pragma: no cover - defensive guard
            raise KeyError(token) from exc
        return RegistryKey(name, version)

    def __getitem__(self, token: str) -> AssessmentDefinition:
        key = self._split(token)
        try:
            return self._registry.get(key.name, key.version)
        except RegistryError as exc:
            raise KeyError(token) from exc

    def __setitem__(self, token: str, value: AssessmentDefinition) -> None:
        key = self._split(token)
        value.id = key.name
        value.version = key.version
        self._registry.register(value)

    def __delitem__(self, token: str) -> None:
        key = self._split(token)
        removed = self._registry.remove(key.name, key.version)
        if not removed:
            raise KeyError(token)

    def __iter__(self) -> Iterator[str]:
        for key in self._registry.snapshot():
            yield key.token()

    def __len__(self) -> int:
        return len(self._registry.snapshot())

    def get(self, token: str, default: object = None) -> AssessmentDefinition | object:
        try:
            return self[token]
        except KeyError:
            return default

    def pop(self, token: str, default: object = _UNSET) -> AssessmentDefinition | object:
        try:
            value = self[token]
        except KeyError:
            if default is _UNSET:
                raise
            return default
        self.__delitem__(token)
        return value

    def clear(self) -> None:
        self._registry.clear()


class AssessmentRegistry:
    """Thread-safe registry tracking assessment definitions by key."""

    def __init__(self) -> None:
        self._entries: Dict[RegistryKey, AssessmentDefinition] = {}
        self._lock = RLock()
        self._legacy_view = _TokenMapping(self)

    def register(self, assessment: AssessmentDefinition) -> RegistryKey:
        cls = type(assessment)
        cls_name = getattr(cls, "id", None)
        cls_version = getattr(cls, "version", None)
        name = cls_name if isinstance(cls_name, str) else getattr(assessment, "id", None)
        version = cls_version if isinstance(cls_version, str) else getattr(assessment, "version", None)
        if name is None or version is None:  # pragma: no cover - defensive guard
            raise RegistryError("Assessment definition must define 'id' and 'version'")
        assessment.id = name  # sync instance attributes for downstream consumers
        assessment.version = version
        key = RegistryKey(name, version)
        with self._lock:
            self._entries[key] = assessment
        return key

    def get(self, assessment_id: str, version: str) -> AssessmentDefinition:
        key = RegistryKey(assessment_id, version)
        with self._lock:
            try:
                return self._entries[key]
            except KeyError as exc:
                raise RegistryError(f"Assessment definition not registered: {key.token()}") from exc

    def snapshot(self) -> Mapping[RegistryKey, AssessmentDefinition]:
        with self._lock:
            return MappingProxyType(dict(self._entries))

    def clear(self) -> None:
        with self._lock:
            self._entries.clear()

    def remove(self, assessment_id: str, version: str) -> bool:
        key = RegistryKey(assessment_id, version)
        with self._lock:
            return self._entries.pop(key, None) is not None

    @property
    def _registry(self) -> MutableMapping[str, AssessmentDefinition]:
        """Legacy dict-like view keyed by `<name>:<version>` tokens."""

        return self._legacy_view


assessment_registry = AssessmentRegistry()

# Legacy alias for callers expecting module-level `_registry`
_registry = assessment_registry._registry


def register(assessment: AssessmentDefinition) -> None:
    assessment_registry.register(assessment)


def get(assessment_id: str, version: str) -> AssessmentDefinition:
    return assessment_registry.get(assessment_id, version)


class EngineRegistry:
    """Thread-safe registry for instrument plugins and their collaborators."""

    def __init__(self) -> None:
        self._entries: Dict[RegistryKey, RegistryEntry] = {}
        self._lock = RLock()

    def _resolve_key(self, inst: InstrumentId) -> RegistryKey:
        return RegistryKey.from_id(inst)

    def _update_entry(self, key: RegistryKey, updater) -> None:
        with self._lock:
            current = self._entries.get(key, RegistryEntry())
            self._entries[key] = updater(current)

    def register_plugin(self, plugin: InstrumentPlugin) -> None:
        key = self._resolve_key(plugin.id())

        def _apply(entry: RegistryEntry) -> RegistryEntry:
            return entry.with_plugin(plugin)

        self._update_entry(key, _apply)

    def register_scorer(self, inst: InstrumentId, scorer: EngineScorer) -> None:
        key = self._resolve_key(inst)
        self._update_entry(key, lambda entry: entry.with_scorer(scorer))

    def register_norms(self, inst: InstrumentId, provider: EngineNormProvider) -> None:
        key = self._resolve_key(inst)
        self._update_entry(key, lambda entry: entry.with_norm_provider(provider))

    def register_report(self, inst: InstrumentId, builder: EngineReportBuilder) -> None:
        key = self._resolve_key(inst)
        self._update_entry(key, lambda entry: entry.with_report_builder(builder))

    def _entry(self, inst: InstrumentId) -> RegistryEntry:
        key = self._resolve_key(inst)
        try:
            return self._entries[key]
        except KeyError as exc:
            raise RegistryError(f"Instrument components not registered: {key.token()}") from exc

    def plugin(self, inst: InstrumentId) -> InstrumentPlugin:
        entry = self._entry(inst)
        if entry.plugin is None:
            raise RegistryError(f"Instrument plugin not registered: {inst.key}:{inst.version}")
        return entry.plugin

    def scorer(self, inst: InstrumentId) -> EngineScorer:
        entry = self._entry(inst)
        if entry.scorer is None:
            raise RegistryError(f"Scorer not registered: {inst.key}:{inst.version}")
        return entry.scorer

    def norm_provider(self, inst: InstrumentId) -> EngineNormProvider:
        entry = self._entry(inst)
        if entry.norm_provider is None:
            raise RegistryError(f"Norm provider not registered: {inst.key}:{inst.version}")
        return entry.norm_provider

    def report_builder(self, inst: InstrumentId) -> EngineReportBuilder:
        entry = self._entry(inst)
        if entry.report_builder is None:
            raise RegistryError(f"Report builder not registered: {inst.key}:{inst.version}")
        return entry.report_builder

    def snapshot(self) -> Mapping[RegistryKey, RegistryEntry]:
        with self._lock:
            return MappingProxyType(dict(self._entries))

    def clear(self) -> None:
        with self._lock:
            self._entries.clear()
        assessment_registry.clear()

    def discover_plugins(self, group: str = "kolb.instruments") -> Tuple[RegistryKey, ...]:
        """Load plugins from entry points and register them.

        Entry points must return either an ``InstrumentPlugin`` instance or a class
        that can be instantiated without arguments.
        """

        discovered: list[RegistryKey] = []
        try:
            eps_any = entry_points(group=group)
        except TypeError:
            eps_any = entry_points().select(group=group)
        except Exception:
            logger.debug("No entry points group '%s' found for discovery", group)
            return tuple()
        eps = cast(Iterable[EntryPoint], eps_any)
        for ep in eps:
            try:
                candidate = ep.load()
            except Exception:  # pragma: no cover - defensive logging
                logger.exception("Failed loading entry point %s", ep.name)
                continue
            plugin = self._coerce_plugin(candidate)
            if plugin is None:
                logger.warning("Entry point %s does not provide an InstrumentPlugin", ep.name)
                continue
            self.register_plugin(plugin)
            key = self._resolve_key(plugin.id())
            discovered.append(key)
        return tuple(discovered)

    @staticmethod
    def _coerce_plugin(candidate: object) -> InstrumentPlugin | None:
        instance = candidate
        if inspect.isclass(candidate):
            ctor = cast(Callable[[], object], candidate)
            try:
                instance = ctor()
            except Exception:
                logger.exception("Unable to instantiate plugin class %s", candidate)
                return None
        elif callable(candidate) and not hasattr(candidate, "id"):
            try:
                instance = candidate()
            except Exception:
                logger.exception("Unable to call plugin factory %s", candidate)
                return None
        required_attrs = ("id", "delivery", "fetch_items", "validate_submit")
        if all(hasattr(instance, attr) for attr in required_attrs):
            return cast(InstrumentPlugin, instance)
        return None


engine_registry = EngineRegistry()
