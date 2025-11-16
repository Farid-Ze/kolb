"""i18n resource preloading and caching.

This module provides:
1. In-memory preloading of i18n resources at startup
2. Locale fallback mechanism (id -> en -> default)
3. Zero disk I/O per request after preload
4. Thread-safe access to cached resources

Usage:
    >>> from app.i18n import get_i18n_resource
    >>> messages = get_i18n_resource("messages", "id")
"""

from __future__ import annotations

import json
import logging
from functools import lru_cache
from pathlib import Path
from threading import RLock
from types import MappingProxyType
from typing import Any, Callable, Mapping

try:  # Lazy optional dependency for YAML support
    from yaml import safe_load
except Exception:  # pragma: no cover - optional dependency guard
    safe_load = None

__all__ = [
    "preload_i18n_resources",
    "get_i18n_resource",
    "clear_i18n_cache",
]

logger = logging.getLogger(__name__)

# Thread-safe in-memory cache for preloaded resources
_resource_cache: dict[tuple[str, str], Mapping[str, Any]] = {}
_cache_lock = RLock()

# Supported locales with fallback order
_LOCALE_FALLBACK: dict[str, list[str]] = {
    "id": ["id", "en"],
    "en": ["en", "id"],
}
_DEFAULT_LOCALE = "id"
_RESOURCE_SUFFIXES: tuple[str, ...] = (".json", ".yaml", ".yml")


def _load_json_data(filepath: Path) -> dict[str, Any] | None:
    with open(filepath, "r", encoding="utf-8") as file_obj:
        return json.load(file_obj)


def _load_yaml_data(filepath: Path) -> dict[str, Any] | None:
    if safe_load is None:  # pragma: no cover - PyYAML missing in some envs
        logger.warning("PyYAML not installed; skipping YAML load for %s", filepath)
        return None
    with open(filepath, "r", encoding="utf-8") as file_obj:
        return safe_load(file_obj)


_STRUCTURED_LOADERS: dict[str, Callable[[Path], dict[str, Any] | None]] = {
    ".json": _load_json_data,
    ".yaml": _load_yaml_data,
    ".yml": _load_yaml_data,
}


def _get_i18n_directory() -> Path:
    """Return the i18n directory path."""
    return Path(__file__).parent


def _load_structured_file(filepath: Path) -> Mapping[str, Any] | None:
    """Load JSON/YAML resource, returning immutable mapping when successful."""

    loader = _STRUCTURED_LOADERS.get(filepath.suffix.lower())
    if not loader:
        logger.debug("Unsupported i18n file suffix: %s", filepath.suffix)
        return None
    try:
        data = loader(filepath)
    except FileNotFoundError:
        logger.debug("i18n file not found: %s", filepath)
        return None
    except (json.JSONDecodeError, ValueError) as exc:
        logger.warning("Failed to parse i18n file %s: %s", filepath, exc)
        return None
    except Exception as exc:  # pragma: no cover - defensive guard
        logger.error("Error loading i18n file %s: %s", filepath, exc)
        return None

    if data is None:
        logger.warning("Empty i18n file: %s", filepath)
        return None
    if not isinstance(data, Mapping):
        logger.warning("i18n file %s must contain a mapping root", filepath)
        return None
    return MappingProxyType(dict(data))


def _load_resource_with_fallback(
    resource_type: str,
    locale: str,
) -> Mapping[str, Any] | None:
    """Load resource with locale fallback mechanism."""
    i18n_dir = _get_i18n_directory()

    def _try_load(base_name: str) -> Mapping[str, Any] | None:
        for suffix in _RESOURCE_SUFFIXES:
            candidate = i18n_dir / f"{base_name}{suffix}"
            if candidate.exists():
                data = _load_structured_file(candidate)
                if data is not None:
                    logger.debug(
                        "Loaded i18n resource: type=%s base=%s file=%s",
                        resource_type,
                        base_name,
                        candidate.name,
                    )
                    return data
        return None

    fallback_locales = list(_LOCALE_FALLBACK.get(locale, [locale]))
    if _DEFAULT_LOCALE not in fallback_locales:
        fallback_locales.append(_DEFAULT_LOCALE)
    for fallback_locale in fallback_locales:
        base_name = f"{fallback_locale}_{resource_type}"
        resource = _try_load(base_name)
        if resource is not None:
            return resource

    # Fallback without locale prefix
    resource = _try_load(resource_type)
    if resource is not None:
        return resource

    logger.warning(
        "No i18n resource found: type=%s, locale=%s, fallbacks=%s",
        resource_type,
        locale,
        fallback_locales,
    )
    return None


def preload_i18n_resources(
    *,
    resource_types: tuple[str, ...] = ("messages", "styles"),
    locales: tuple[str, ...] = ("id", "en"),
) -> dict[str, int]:
    """Preload i18n resources into memory at application startup.
    
    Args:
        resource_types: Types of resources to preload (e.g., "messages", "styles")
        locales: Locales to preload
        
    Returns:
        Dict with preload statistics (loaded_count, failed_count)
        
    Example:
        >>> stats = preload_i18n_resources(
        ...     resource_types=("messages", "styles"),
        ...     locales=("id", "en")
        ... )
        >>> print(f"Loaded {stats['loaded_count']} resources")
    """
    loaded_count = 0
    failed_count = 0
    
    with _cache_lock:
        for resource_type in resource_types:
            for locale in locales:
                cache_key = (resource_type, locale)
                
                # Skip if already cached
                if cache_key in _resource_cache:
                    logger.debug(f"i18n resource already cached: {cache_key}")
                    continue
                
                # Load with fallback
                resource = _load_resource_with_fallback(resource_type, locale)
                
                if resource is not None:
                    _resource_cache[cache_key] = resource
                    loaded_count += 1
                else:
                    failed_count += 1
    
    logger.info(
        f"i18n preload complete: loaded={loaded_count}, failed={failed_count}, "
        f"cache_size={len(_resource_cache)}"
    )
    
    return {
        "loaded_count": loaded_count,
        "failed_count": failed_count,
        "cache_size": len(_resource_cache),
    }


@lru_cache(maxsize=128)
def get_i18n_resource(
    resource_type: str,
    locale: str = _DEFAULT_LOCALE,
) -> Mapping[str, Any]:
    """Get i18n resource from cache with fallback.
    
    This function is cached at the function level for even faster access
    after the initial cache lookup.
    
    Args:
        resource_type: Type of resource (e.g., "messages", "styles")
        locale: Locale code (e.g., "id", "en")
        
    Returns:
        Immutable mapping of i18n resource data
        
    Raises:
        KeyError: If resource not found even after fallback attempts
        
    Example:
        >>> messages = get_i18n_resource("messages", "id")
        >>> print(messages.get("welcome_message"))
    """
    cache_key = (resource_type, locale)
    
    # Try cache first (thread-safe read)
    with _cache_lock:
        if cache_key in _resource_cache:
            return _resource_cache[cache_key]
    
    # Cache miss: load on-demand with fallback
    logger.info(
        f"i18n cache miss, loading on-demand: type={resource_type}, locale={locale}"
    )
    resource = _load_resource_with_fallback(resource_type, locale)
    
    if resource is not None:
        with _cache_lock:
            _resource_cache[cache_key] = resource
        return resource
    
    # No resource found even with fallback
    raise KeyError(
        f"i18n resource not found: type={resource_type}, locale={locale}"
    )


def clear_i18n_cache() -> None:
    """Clear the i18n resource cache.
    
    This is primarily used in testing to reset the cache state.
    """
    with _cache_lock:
        _resource_cache.clear()
    get_i18n_resource.cache_clear()
    logger.debug("i18n cache cleared")
