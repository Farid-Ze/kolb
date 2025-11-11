from __future__ import annotations

from sqlalchemy.orm import Session
from typing import List, Tuple, Optional
from functools import lru_cache

from app.engine.norms.composite import (
    AppendixNormProvider,
    CompositeNormProvider,
    DatabaseNormProvider,
    ExternalNormProvider,
)
from app.core.config import settings


def _make_cached_db_lookup(db: Session):
    """Return a cached DB lookup function.

    Cache key: (group_token, scale_name, int(raw))
    Resolves norm_group|version precedence: requested version → default.
    Explicit invalidation required after norm import.
    """
    from sqlalchemy import text

    @lru_cache(maxsize=4096)
    def _cached(key: Tuple[str, str, int]) -> Optional[Tuple[float, str]]:
        group_token, scale_name, raw = key
        delim = "|"
        if delim in group_token:
            base_group, req_version = group_token.split(delim, 1)
        else:
            base_group, req_version = group_token, "default"
        for version in (req_version, "default"):
            row = db.execute(
                text(
                    "SELECT percentile, norm_version FROM normative_conversion_table "
                    "WHERE norm_group=:g AND norm_version=:v AND scale_name=:s AND raw_score=:r LIMIT 1"
                ),
                {"g": base_group, "v": version, "s": scale_name, "r": int(raw)},
            ).fetchone()
            if row:
                return float(row[0]), (row[1] or version)
        return None

    def _lookup(group_token: str, scale_name: str, raw: int | float):
        return _cached((group_token, scale_name, int(raw)))

    # attach invalidation hook and stats accessor
    _lookup.clear_cache = _cached.cache_clear  # type: ignore[attr-defined]
    _lookup.cache_info = _cached.cache_info  # type: ignore[attr-defined]
    return _lookup


def clear_norm_db_cache(db_lookup) -> None:
    """Invalidate the normative DB LRU cache (called after imports)."""
    try:
        db_lookup.clear_cache()  # type: ignore[attr-defined]
    except Exception:
        pass


def norm_cache_stats(db_lookup) -> dict:
    """Return statistics for the normative DB lookup cache."""
    try:
        info = db_lookup.cache_info()  # type: ignore[attr-defined]
        return {
            "hits": info.hits,
            "misses": info.misses,
            "maxsize": info.maxsize,
            "currsize": info.currsize,
        }
    except Exception:
        return {"hits": 0, "misses": 0, "maxsize": 0, "currsize": 0}


def build_composite_norm_provider(db: Session):
    """Build the default composite norm provider chain: DB → External (optional) → Appendix.

    Adds an LRU cache for DB lookups to reduce repeated queries under load.
    """
    db_lookup = _make_cached_db_lookup(db)
    providers: List[object] = [DatabaseNormProvider(db_lookup)]
    if settings.external_norms_enabled and settings.external_norms_base_url:
        providers.append(get_external_provider())
    providers.append(AppendixNormProvider())
    composite = CompositeNormProvider(providers)  # type: ignore[arg-type]
    # expose db lookup for invalidation from admin import
    composite._db_lookup = db_lookup  # type: ignore[attr-defined]
    # expose external provider for stats
    try:
        composite._external_provider = get_external_provider()  # type: ignore[attr-defined]
    except Exception:
        pass
    return composite

# Singleton external provider to persist TTL cache across requests
_EXTERNAL_PROVIDER: ExternalNormProvider | None = None
_EXTERNAL_PROVIDER_KEY: tuple[str, int, str | None] | None = None


def get_external_provider() -> ExternalNormProvider:
    global _EXTERNAL_PROVIDER, _EXTERNAL_PROVIDER_KEY
    key = (
        settings.external_norms_base_url.rstrip("/") if settings.external_norms_base_url else "",
        int(settings.external_norms_timeout_ms or 1500),
        settings.external_norms_api_key or None,
    )
    if _EXTERNAL_PROVIDER is None or _EXTERNAL_PROVIDER_KEY != key:
        _EXTERNAL_PROVIDER = ExternalNormProvider(
            base_url=settings.external_norms_base_url,
            timeout_ms=settings.external_norms_timeout_ms,
            api_key=settings.external_norms_api_key,
        )
        _EXTERNAL_PROVIDER_KEY = key
    return _EXTERNAL_PROVIDER


def external_cache_stats() -> dict:
    prov = get_external_provider()
    return prov.cache_stats() if hasattr(prov, "cache_stats") else {}
