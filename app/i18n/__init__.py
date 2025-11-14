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
from typing import Any, Mapping

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
    "en": ["en"],
}
_DEFAULT_LOCALE = "id"


def _get_i18n_directory() -> Path:
    """Return the i18n directory path."""
    return Path(__file__).parent


def _load_json_file(filepath: Path) -> dict[str, Any] | None:
    """Load JSON file and return parsed content, or None if not found."""
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        logger.debug(f"i18n file not found: {filepath}")
        return None
    except json.JSONDecodeError as exc:
        logger.warning(f"Failed to parse i18n file {filepath}: {exc}")
        return None
    except Exception as exc:
        logger.error(f"Error loading i18n file {filepath}: {exc}")
        return None


def _load_resource_with_fallback(
    resource_type: str,
    locale: str,
) -> Mapping[str, Any] | None:
    """Load resource with locale fallback mechanism."""
    i18n_dir = _get_i18n_directory()
    
    # Try locale-specific files with fallback
    fallback_locales = _LOCALE_FALLBACK.get(locale, [locale])
    
    for fallback_locale in fallback_locales:
        # Try pattern: {locale}_{resource_type}.json
        filepath = i18n_dir / f"{fallback_locale}_{resource_type}.json"
        if filepath.exists():
            data = _load_json_file(filepath)
            if data is not None:
                logger.debug(
                    f"Loaded i18n resource: type={resource_type}, locale={fallback_locale}"
                )
                return MappingProxyType(data)
    
    # Try pattern: {resource_type}.json (no locale prefix)
    filepath = i18n_dir / f"{resource_type}.json"
    if filepath.exists():
        data = _load_json_file(filepath)
        if data is not None:
            logger.debug(f"Loaded i18n resource: type={resource_type} (no locale)")
            return MappingProxyType(data)
    
    logger.warning(
        f"No i18n resource found: type={resource_type}, locale={locale}, "
        f"fallbacks={fallback_locales}"
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
