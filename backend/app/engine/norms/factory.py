from __future__ import annotations

from functools import lru_cache
from typing import Dict, List, Optional, Tuple
from types import MappingProxyType

from sqlalchemy.orm import Session

from app.engine.norms.composite import (
    AppendixNormProvider,
    CompositeNormProvider,
    DatabaseNormProvider,
    ExternalNormProvider,
)
from app.engine.norms.provider import NormProvider
from app.engine.norms.lazy_loader import LazyNormLoader, NormDataSource
from app.core.config import settings
from app.core.logging import get_logger
from app.db.repositories import NormativeConversionRepository
from sqlalchemy import text


logger = get_logger("kolb.engine.norms", component="engine")


def _make_cached_db_lookup(db: Session):
    """Return a cached DB lookup function.

    Cache key: (group_token, scale_name, int(raw))
    Resolves norm_group|version precedence: requested version → default.
    Explicit invalidation required after norm import.
    """
    repo = NormativeConversionRepository(db)

    @lru_cache(maxsize=4096)
    def _cached(key: Tuple[str, str, int]) -> Optional[Tuple[float, str]]:
        group_token, scale_name, raw = key
        delim = "|"
        if delim in group_token:
            base_group, req_version = group_token.split(delim, 1)
        else:
            base_group, req_version = group_token, "default"
        versions = [req_version]
        if req_version != "default":
            versions.append("default")
        result = repo.fetch_first_for_versions(base_group, versions, scale_name, int(raw))
        if result:
            entry, resolved_version = result
            return entry.percentile, resolved_version
        return None

    def _lookup(group_token: str, scale_name: str, raw: int | float):
        return _cached((group_token, scale_name, int(raw)))

    # attach invalidation hook and stats accessor
    setattr(_lookup, "clear_cache", _cached.cache_clear)
    setattr(_lookup, "cache_info", _cached.cache_info)
    return _lookup


# --- Adaptive Preload Support ---

# Module-level cache for preloaded norms to persist across provider instances
_PRELOADED: MappingProxyType | None = None
_PRELOAD_STATS: Dict[str, int | bool] = {
    "enabled": False,
    "rows_loaded": 0,
    "groups": 0,
    "versions": 0,
    "scales": 0,
}


_NORM_VERSION_DELIM = "|"
_DEFAULT_VERSION = "default"


def _reset_preloaded_norms() -> None:
    global _PRELOADED, _PRELOAD_STATS
    _PRELOADED = None
    _PRELOAD_STATS = {
        "enabled": False,
        "rows_loaded": 0,
        "groups": 0,
        "versions": 0,
        "scales": 0,
    }


def _maybe_build_preloaded_map(db: Session) -> None:
    """Build in-memory map if adaptive preload is enabled and table small enough.

    Map key: (norm_group, norm_version, scale_name, raw_score) -> percentile
    """
    global _PRELOADED, _PRELOAD_STATS
    if _PRELOADED is not None:
        return
    if not settings.norms_preload_enabled:
        return
    # Count rows cheaply
    try:
        total_rows = db.execute(text("SELECT COUNT(1) FROM normative_conversion_table")).scalar() or 0
    except Exception:
        total_rows = 0
    if total_rows <= 0:
        return
    if total_rows > settings.norms_preload_row_threshold or total_rows > settings.norms_preload_max_entries:
        # Skip preload for large tables
        return
    # Load rows
    mapping: Dict[Tuple[str, str, str, int], float] = {}
    groups: set[str] = set()
    versions: set[str] = set()
    scales: set[str] = set()
    try:
        repo = NormativeConversionRepository(db)
        rows = repo.fetch_all_entries()
        for entry in rows:
            key = (
                entry.norm_group,
                str(entry.norm_version or "default"),
                entry.scale_name,
                int(entry.raw_score),
            )
            mapping[key] = float(entry.percentile)
            groups.add(entry.norm_group)
            versions.add(str(entry.norm_version or "default"))
            scales.add(entry.scale_name)
        _PRELOADED = MappingProxyType(mapping)
        _PRELOAD_STATS = {
            "enabled": True,
            "rows_loaded": len(mapping),
            "groups": len(groups),
            "versions": len(versions),
            "scales": len(scales),
        }
    except Exception:
        # Fallback silently to non-preloaded path
        _reset_preloaded_norms()


def _make_preloaded_db_lookup(db: Session):
    """Return a lookup callable bound to the preloaded in-memory map.

    Fallback behavior: try requested version, then 'default'.
    """
    _maybe_build_preloaded_map(db)

    def _lookup(group_token: str, scale_name: str, raw: int | float):
        global _PRELOADED
        if _PRELOADED is None:
            return None
        delim = "|"
        if delim in group_token:
            base_group, req_version = group_token.split(delim, 1)
        else:
            base_group, req_version = group_token, "default"
        key_exact = (base_group, req_version or "default", scale_name, int(raw))
        val = _PRELOADED.get(key_exact) if _PRELOADED else None
        if val is not None:
            return (val, req_version or "default")
        key_default = (base_group, "default", scale_name, int(raw))
        val2 = _PRELOADED.get(key_default) if _PRELOADED else None
        if val2 is not None:
            return (val2, "default")
        return None

    # Attach cache-like hooks for admin invalidation & stats
    def _clear_cache():
        _reset_preloaded_norms()

    def _cache_info():
        return type("_Stats", (), {
            "hits": 0,
            "misses": 0,
            "maxsize": 0,
            "currsize": _PRELOAD_STATS.get("rows_loaded", 0),
        })()

    setattr(_lookup, "clear_cache", _clear_cache)
    setattr(_lookup, "cache_info", _cache_info)
    return _lookup


def clear_norm_db_cache(db_lookup) -> None:
    """Invalidate the normative DB LRU cache (called after imports)."""
    try:
        clear_cache = getattr(db_lookup, "clear_cache", None)
        if callable(clear_cache):
            clear_cache()
    except Exception as exc:
        logger.exception(
            "norm_db_cache_clear_failed",
            extra={"structured_data": {"source": "db_lookup", "error": str(exc)}},
        )
    # Also invalidate preloaded map if present
    try:
        _reset_preloaded_norms()
    except Exception as exc:
        logger.exception(
            "norm_preload_reset_failed",
            extra={"structured_data": {"source": "preload", "error": str(exc)}},
        )


def norm_cache_stats(db_lookup) -> dict:
    """Return statistics for the normative DB lookup cache."""
    try:
        cache_info = getattr(db_lookup, "cache_info", None)
        if cache_info is None:
            raise AttributeError
        info = cache_info()
        return {
            "hits": info.hits,
            "misses": info.misses,
            "maxsize": info.maxsize,
            "currsize": info.currsize,
        }
    except Exception:
        return {"hits": 0, "misses": 0, "maxsize": 0, "currsize": 0}


def preload_cache_stats() -> dict:
    """Return statistics for the adaptive preloaded norms map."""
    return {
        "enabled": bool(_PRELOAD_STATS.get("enabled", False)),
        "rows_loaded": int(_PRELOAD_STATS.get("rows_loaded", 0)),
        "groups": int(_PRELOAD_STATS.get("groups", 0)),
        "versions": int(_PRELOAD_STATS.get("versions", 0)),
        "scales": int(_PRELOAD_STATS.get("scales", 0)),
        "preload_config": {
            "enabled_flag": settings.norms_preload_enabled,
            "row_threshold": settings.norms_preload_row_threshold,
            "max_entries": settings.norms_preload_max_entries,
        },
    }


def build_composite_norm_provider(db: Session):
    """Build the default composite norm provider chain: DB → External (optional) → Appendix.

    Adds an LRU cache for DB lookups to reduce repeated queries under load.
    """
    # Try adaptive preloaded map first (if enabled and table small), else LRU DB lookup
    _maybe_build_preloaded_map(db)
    if _PRELOADED is not None:
        db_lookup = _make_preloaded_db_lookup(db)
    elif settings.norms_lazy_loader_enabled:
        db_lookup = _make_lazy_db_lookup(db)
    else:
        db_lookup = _make_cached_db_lookup(db)
    providers: List[NormProvider] = [DatabaseNormProvider(db_lookup)]
    if settings.external_norms_enabled and settings.external_norms_base_url:
        providers.append(get_external_provider())
    providers.append(AppendixNormProvider())
    composite = CompositeNormProvider(providers)
    # expose db lookup for invalidation from admin import
    composite._db_lookup = db_lookup
    # expose adaptive preload stats
    composite._preload_stats = preload_cache_stats()
    # expose external provider for stats
    try:
        composite._external_provider = get_external_provider()
    except Exception:
        composite._external_provider = None
    return composite


def _split_group_token(token: str) -> tuple[str, str]:
    if _NORM_VERSION_DELIM in token:
        base, version = token.split(_NORM_VERSION_DELIM, 1)
        return base, version or _DEFAULT_VERSION
    return token, _DEFAULT_VERSION


def _make_lazy_db_lookup(db: Session):
    repo = NormativeConversionRepository(db)
    source = _RepositoryNormDataSource(repo)
    loader = LazyNormLoader(
        source,
        chunk_size=int(settings.norms_lazy_loader_chunk_size),
        max_cache_entries=int(settings.norms_lazy_loader_cache_entries),
    )

    def _lookup(group_token: str, scale_name: str, raw: int | float):
        base_group, requested_version = _split_group_token(group_token)
        versions = [requested_version]
        if requested_version != _DEFAULT_VERSION:
            versions.append(_DEFAULT_VERSION)
        for version in versions:
            token = f"{base_group}{_NORM_VERSION_DELIM}{version}" if version else base_group
            value = loader.lookup(db, token, scale_name, int(raw))
            if value is not None:
                return (value, version)
        return None

    def _cache_info():
        stats = loader.get_stats()
        return _LazyCacheInfo(
            hits=int(stats.get("hits", 0)),
            misses=int(stats.get("misses", 0)),
            maxsize=settings.norms_lazy_loader_cache_entries,
            currsize=int(stats.get("cache_size", 0)),
        )

    setattr(_lookup, "clear_cache", loader.clear_cache)
    setattr(_lookup, "cache_info", _cache_info)
    setattr(_lookup, "lazy_loader", loader)
    return _lookup


class _LazyCacheInfo:
    def __init__(self, *, hits: int, misses: int, maxsize: int, currsize: int):
        self.hits = hits
        self.misses = misses
        self.maxsize = maxsize
        self.currsize = currsize


class _RepositoryNormDataSource(NormDataSource):
    def __init__(self, repo: NormativeConversionRepository):
        self._repo = repo

    def fetch_chunk(
        self,
        db: Session,
        norm_group: str,
        scale_name: str,
        offset: int = 0,
        limit: int = 100,
    ) -> list[tuple[int, float]]:
        base_group, version = _split_group_token(norm_group)
        rows = self._repo.fetch_scale_chunk(
            base_group,
            version or _DEFAULT_VERSION,
            scale_name,
            offset=offset,
            limit=limit,
        )
        return [(row.raw_score, row.percentile) for row in rows]

# Singleton external provider to persist TTL cache across requests
_EXTERNAL_PROVIDER: ExternalNormProvider | None = None
_EXTERNAL_PROVIDER_KEY: tuple[str, int, str | None] | None = None


def get_external_provider() -> ExternalNormProvider:
    global _EXTERNAL_PROVIDER, _EXTERNAL_PROVIDER_KEY
    base_url_setting = ""
    if settings.external_norms_base_url:
        base_url_setting = str(settings.external_norms_base_url).rstrip("/")
    key = (
        base_url_setting,
        int(settings.external_norms_timeout_ms or 1500),
        settings.external_norms_api_key or None,
    )
    if _EXTERNAL_PROVIDER is None or _EXTERNAL_PROVIDER_KEY != key:
        _EXTERNAL_PROVIDER = ExternalNormProvider(
            base_url=base_url_setting,
            timeout_ms=settings.external_norms_timeout_ms,
            api_key=settings.external_norms_api_key,
        )
        _EXTERNAL_PROVIDER_KEY = key
    return _EXTERNAL_PROVIDER


def external_cache_stats() -> dict:
    prov = get_external_provider()
    return prov.cache_stats() if hasattr(prov, "cache_stats") else {}
