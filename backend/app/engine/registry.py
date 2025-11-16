from __future__ import annotations

"""Assessment and instrument plugin registry.

This module provides thread-safe registries for:
1. Assessment definitions (versioned assessment configurations)
2. Instrument plugins and their collaborators (scorers, norm providers, report builders)

The registries support:
- Thread-safe operations via RLock
- Immutable data structures for safety
- Plugin discovery via importlib.metadata entry points
- Legacy dict-like interface for backward compatibility

Key Classes:
    RegistryKey: Composite key for (name, version) pairs
    RegistryEntry: Immutable container for instrument components
    AssessmentRegistry: Registry for assessment definitions
    EngineRegistry: Registry for instrument plugins and collaborators

Module-level instances:
    assessment_registry: Global registry for assessments
    engine_registry: Global registry for instrument plugins

Usage:
    >>> from app.engine.registry import engine_registry
    >>> registry.register_plugin(my_plugin)
    >>> plugin = registry.plugin(InstrumentId("KLSI", "4.0"))
"""

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
    "register_plugin",
]


logger = logging.getLogger(__name__)


class RegistryError(KeyError):
    """Raised when attempting to access an unregistered engine component.
    
    This exception is raised when attempting to retrieve a component that has not
    been registered with the engine registry. It extends KeyError to maintain
    compatibility with dict-like lookup patterns.
    """


@dataclass(frozen=True, slots=True)
class RegistryKey:
    """Hashable key used across assessment and instrument registries.
    
    Provides a composite key structure for versioned assessment instruments.
    The frozen and slots attributes ensure immutability and memory efficiency.
    
    Attributes:
        name: The instrument or assessment name (e.g., "KLSI").
        version: The version string (e.g., "4.0").
        
    Example:
        >>> key = RegistryKey("KLSI", "4.0")
        >>> key.token()
        'KLSI:4.0'
    """

    name: str
    version: str

    @classmethod
    def from_id(cls, inst: InstrumentId) -> "RegistryKey":
        """Create a RegistryKey from an InstrumentId.
        
        Args:
            inst: The instrument ID to convert.
            
        Returns:
            A new RegistryKey instance.
        """
        return cls(inst.key, inst.version)

    def token(self) -> str:
        """Generate a string token in the format 'name:version'.
        
        Returns:
            A colon-separated string representation of the key.
        """
        return f"{self.name}:{self.version}"


@dataclass(frozen=True, slots=True)
class RegistryEntry:
    """Immutable container holding instrument-specific engine components.
    
    This dataclass aggregates all pluggable components needed to process
    an assessment instrument: plugin, scorer, norm provider, and report builder.
    
    The frozen and slots attributes ensure immutability and memory efficiency.
    Components can be updated using the with_* methods which return new instances.
    
    Attributes:
        plugin: The instrument plugin implementing delivery and validation.
        scorer: The scoring strategy for computing results.
        norm_provider: Provider for normative conversion data.
        report_builder: Builder for generating assessment reports.
        
    Example:
        >>> entry = RegistryEntry()
        >>> entry = entry.with_plugin(my_plugin)
        >>> entry = entry.with_scorer(my_scorer)
    """

    plugin: InstrumentPlugin | None = None
    scorer: EngineScorer | None = None
    norm_provider: EngineNormProvider | None = None
    report_builder: EngineReportBuilder | None = None

    def with_plugin(self, plugin: InstrumentPlugin) -> "RegistryEntry":
        """Return a new entry with the plugin updated.
        
        Args:
            plugin: The instrument plugin to set.
            
        Returns:
            A new RegistryEntry with the plugin updated.
        """
        return replace(self, plugin=plugin)

    def with_scorer(self, scorer: EngineScorer) -> "RegistryEntry":
        """Return a new entry with the scorer updated.
        
        Args:
            scorer: The scoring strategy to set.
            
        Returns:
            A new RegistryEntry with the scorer updated.
        """
        return replace(self, scorer=scorer)

    def with_norm_provider(self, provider: EngineNormProvider) -> "RegistryEntry":
        """Return a new entry with the norm provider updated.
        
        Args:
            provider: The norm provider to set.
            
        Returns:
            A new RegistryEntry with the norm provider updated.
        """
        return replace(self, norm_provider=provider)

    def with_report_builder(self, builder: EngineReportBuilder) -> "RegistryEntry":
        """Return a new entry with the report builder updated.
        
        Args:
            builder: The report builder to set.
            
        Returns:
            A new RegistryEntry with the report builder updated.
        """
        return replace(self, report_builder=builder)


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

    def clear(self) -> None:
        self._registry.clear()


class AssessmentRegistry:
    """Thread-safe registry tracking assessment definitions by key.
    
    This registry manages assessment definitions indexed by (name, version) pairs.
    All operations are thread-safe through the use of RLock.
    
    The registry supports both modern RegistryKey-based access and legacy
    string token access for backward compatibility.
    
    Example:
        >>> registry = AssessmentRegistry()
        >>> key = registry.register(my_assessment)
        >>> assessment = registry.get("KLSI", "4.0")
    """

    def __init__(self) -> None:
        """Initialize an empty assessment registry."""
        self._entries: Dict[RegistryKey, AssessmentDefinition] = {}
        self._lock = RLock()
        self._legacy_view = _TokenMapping(self)

    def register(self, assessment: AssessmentDefinition) -> RegistryKey:
        """Register an assessment definition.
        
        Extracts the assessment ID and version from the definition and stores it
        in the registry. The ID and version can be either class attributes or
        instance attributes.
        
        Args:
            assessment: The assessment definition to register.
            
        Returns:
            The RegistryKey under which the assessment was registered.
            
        Raises:
            RegistryError: If the assessment lacks 'id' or 'version' attributes.
        """
        cls = type(assessment)
        cls_name = getattr(cls, "id", None)
        cls_version = getattr(cls, "version", None)
        name = cls_name if isinstance(cls_name, str) else getattr(assessment, "id", None)
        version = (
            cls_version if isinstance(cls_version, str)
            else getattr(assessment, "version", None)
        )
        if name is None or version is None:  # pragma: no cover - defensive guard
            raise RegistryError("Assessment definition must define 'id' and 'version'")
        assessment.id = name  # sync instance attributes for downstream consumers
        assessment.version = version
        key = RegistryKey(name, version)
        with self._lock:
            self._entries[key] = assessment
        return key

    def get(self, assessment_id: str, version: str) -> AssessmentDefinition:
        """Retrieve an assessment definition by ID and version.
        
        Args:
            assessment_id: The assessment identifier.
            version: The version string.
            
        Returns:
            The registered assessment definition.
            
        Raises:
            RegistryError: If no assessment is registered with the given key.
        """
        key = RegistryKey(assessment_id, version)
        with self._lock:
            try:
                return self._entries[key]
            except KeyError as exc:
                raise RegistryError(f"Assessment definition not registered: {key.token()}") from exc

    def snapshot(self) -> Mapping[RegistryKey, AssessmentDefinition]:
        """Return an immutable snapshot of all registered assessments.
        
        Returns:
            A read-only mapping of registry keys to assessment definitions.
        """
        with self._lock:
            return MappingProxyType(dict(self._entries))

    def clear(self) -> None:
        """Remove all registered assessments.
        
        This is primarily used in testing to reset the registry state.
        """
        with self._lock:
            self._entries.clear()

    def remove(self, assessment_id: str, version: str) -> bool:
        """Remove an assessment from the registry.
        
        Args:
            assessment_id: The assessment identifier.
            version: The version string.
            
        Returns:
            True if the assessment was removed, False if it wasn't registered.
        """
        key = RegistryKey(assessment_id, version)
        with self._lock:
            return self._entries.pop(key, None) is not None

    @property
    def _registry(self) -> MutableMapping[str, AssessmentDefinition]:
        """Legacy dict-like view keyed by `<name>:<version>` tokens.
        
        Provided for backward compatibility with code expecting a dict-like interface.
        New code should use the register() and get() methods directly.
        """
        return self._legacy_view


assessment_registry = AssessmentRegistry()

# Legacy alias for callers expecting module-level `_registry`
_registry = assessment_registry._registry


def register(assessment: AssessmentDefinition) -> None:
    """Register an assessment definition in the global registry.
    
    This is a convenience function that delegates to the global assessment_registry.
    
    Args:
        assessment: The assessment definition to register.
    """
    assessment_registry.register(assessment)


def get(assessment_id: str, version: str) -> AssessmentDefinition:
    """Retrieve an assessment definition from the global registry.
    
    This is a convenience function that delegates to the global assessment_registry.
    
    Args:
        assessment_id: The assessment identifier.
        version: The version string.
        
    Returns:
        The registered assessment definition.
        
    Raises:
        RegistryError: If no assessment is registered with the given key.
    """
    return assessment_registry.get(assessment_id, version)


class EngineRegistry:
    """Thread-safe registry for instrument plugins and their collaborators.
    
    This registry manages the pluggable components needed to execute assessment
    instruments: plugins (delivery & validation), scorers (computation), norm
    providers (normative conversions), and report builders (result formatting).
    
    All operations are thread-safe through the use of RLock. Components are stored
    in immutable RegistryEntry instances to prevent unintended mutations.
    
    The registry supports plugin discovery via importlib.metadata entry points,
    allowing external packages to register instruments dynamically.
    
    Example:
        >>> registry = EngineRegistry()
        >>> registry.register_plugin(my_plugin)
        >>> registry.register_scorer(my_plugin.id(), my_scorer)
        >>> plugin = registry.plugin(InstrumentId("KLSI", "4.0"))
    """

    def __init__(self) -> None:
        """Initialize an empty engine registry."""
        self._entries: Dict[RegistryKey, RegistryEntry] = {}
        self._lock = RLock()

    def _resolve_key(self, inst: InstrumentId) -> RegistryKey:
        return RegistryKey.from_id(inst)

    def _update_entry(self, key: RegistryKey, updater) -> None:
        with self._lock:
            current = self._entries.get(key, RegistryEntry())
            self._entries[key] = updater(current)

    def _available_tokens(self) -> tuple[str, ...]:
        with self._lock:
            return tuple(sorted(token.token() for token in self._entries.keys()))

    def _describe_available(self) -> str:
        tokens = self._available_tokens()
        if not tokens:
            return "none registered"
        return ", ".join(tokens)

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
            raise RegistryError(
                (
                    f"Instrument components not registered: {key.token()}. "
                    f"Registered instruments: {self._describe_available()}"
                )
            ) from exc

    def plugin(self, inst: InstrumentId) -> InstrumentPlugin:
        entry = self._entry(inst)
        if entry.plugin is None:
            raise RegistryError(
                (
                    f"Instrument plugin not registered: {inst.key}:{inst.version}. "
                    "Call register_plugin(...) during startup before requesting runtime components."
                )
            )
        return entry.plugin

    def scorer(self, inst: InstrumentId) -> EngineScorer:
        entry = self._entry(inst)
        if entry.scorer is None:
            raise RegistryError(
                (
                    f"Scoring strategy not registered: {inst.key}:{inst.version}. "
                    "Ensure EngineRegistry.register_scorer() is invoked for this instrument."
                )
            )
        return entry.scorer

    def norm_provider(self, inst: InstrumentId) -> EngineNormProvider:
        entry = self._entry(inst)
        if entry.norm_provider is None:
            raise RegistryError(
                (
                    f"Norm provider not registered: {inst.key}:{inst.version}. "
                    "Ensure register_norms() is called or provide a CompositeNormProvider."
                )
            )
        return entry.norm_provider

    def report_builder(self, inst: InstrumentId) -> EngineReportBuilder:
        entry = self._entry(inst)
        if entry.report_builder is None:
            raise RegistryError(
                (
                    f"Report builder not registered: {inst.key}:{inst.version}. "
                    "Register a report builder via register_report() for this instrument."
                )
            )
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


def register_plugin(plugin: InstrumentPlugin) -> RegistryKey:
    """Convenience function to register a plugin in the global engine registry.
    
    This is the recommended way to register plugins at module import time.
    
    Args:
        plugin: The instrument plugin to register.
        
    Returns:
        The RegistryKey under which the plugin was registered.
        
    Example:
        >>> from app.engine.registry import register_plugin
        >>> from app.engine.interfaces import InstrumentPlugin
        >>> 
        >>> class MyPlugin(InstrumentPlugin):
        ...     def id(self): return InstrumentId("TEST", "1.0")
        ...     # ... other methods
        >>> 
        >>> register_plugin(MyPlugin())
    """
    engine_registry.register_plugin(plugin)
    return RegistryKey.from_id(plugin.id())
