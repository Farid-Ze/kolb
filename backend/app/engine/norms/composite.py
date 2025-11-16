from __future__ import annotations

from typing import Any, Callable, Dict, List, Optional
import time
import threading

import httpx

from app.core.sentinels import UNKNOWN
from app.data.norms import APPENDIX_TABLES, lookup_lfi
from app.engine.norms.provider import NormProvider
from app.engine.norms.value_objects import PercentileResult
from app.core.config import settings
from app.core.metrics import count_calls, measure_time, timer, metrics_registry

_NORM_VERSION_DELIM = "|"
_DEFAULT_NORM_VERSION = "default"


def _split_norm_token(token: str) -> tuple[str, str]:
    if _NORM_VERSION_DELIM in token:
        base, version = token.split(_NORM_VERSION_DELIM, 1)
        return base, version or _DEFAULT_NORM_VERSION
    return token, _DEFAULT_NORM_VERSION


class DatabaseNormProvider:
    """DB-backed norm lookup provider.

    Expects a callable db_lookup(group_token, scale, raw)->(value, resolved_version) or None.
    Returns (percentile, label, truncated=False) when found, else (None, "DB:None", False).
    """

    def __init__(self, db_lookup):
        self.db_lookup = db_lookup

    @count_calls("norms.db.percentile.calls")
    @measure_time("norms.db.percentile", histogram=True)
    def percentile(
        self, group_chain: List[str], scale: str, raw: int | float
    ) -> PercentileResult:
        with timer(f"norms.db.percentile.{scale}"):
            for group_token in group_chain:
                base_group, requested_version = _split_norm_token(group_token)
                token_has_version = _NORM_VERSION_DELIM in group_token
                result = self.db_lookup(group_token, scale, raw)
                value: Optional[float]
                version: Optional[str]
                if isinstance(result, tuple):
                    value = result[0]
                    version = result[1] if len(result) > 1 else None
                else:
                    value = result
                    version = None
                if value is not None:
                    version_token = version or requested_version or _DEFAULT_NORM_VERSION
                    include_version = token_has_version or version_token != _DEFAULT_NORM_VERSION
                    normalized = f"{base_group}{_NORM_VERSION_DELIM}{version_token}" if include_version else base_group
                    return PercentileResult(value, f"DB:{normalized}", False)
        return PercentileResult(None, "DB:None", False)


class AppendixNormProvider:
    """Appendix fallback provider for KLSI 4.0 norm tables."""

    @count_calls("norms.appendix.percentile.calls")
    @measure_time("norms.appendix.percentile", histogram=True)
    def percentile(
        self, group_chain: List[str], scale: str, raw: int | float
    ) -> PercentileResult:
        with timer(f"norms.appendix.percentile.{scale}"):
            table = APPENDIX_TABLES.get(scale)
            if table:
                raw_value = int(raw)
                value = table.lookup(raw_value)
                truncated = raw_value < table.min_key or raw_value > table.max_key
                return PercentileResult(value, f"Appendix:{table.name}", truncated)
            if scale == "LFI":
                lfi_value = raw / 100 if isinstance(raw, (int, float)) else raw
                value = lookup_lfi(lfi_value)
                return PercentileResult(value, "Appendix:LFI", False)
            return PercentileResult(None, UNKNOWN.capitalize(), False)


class ExternalNormProvider:
    """HTTP-backed external norms provider.

    Contract (assumed): GET {base_url}/norms/{norm_group}/{scale}/{raw}
    Response JSON: {"percentile": float, "version": "vX"}
    404 means not found for that (group, scale, raw) tuple.
    """

    def __init__(self, base_url: str, timeout_ms: int = 1500, api_key: str | None = None):
        self.base_url = base_url.rstrip("/")
        self.timeout = max(100, int(timeout_ms)) / 1000.0  # seconds
        self.api_key = api_key
        # Cache: key -> (value, version, timestamp, found_flag)
        self._cache: dict[tuple[str, str, int], tuple[Optional[float], Optional[str], float, bool]] = {}
        # Track recently scheduled background fetches to avoid flooding
        self._scheduled: dict[tuple[str, str, int], float] = {}
        self._lock = threading.Lock()
        # Counters
        self._hits = 0
        self._misses = 0
        self._net_success = 0
        self._net_404 = 0
        self._net_error = 0

    def _headers(self) -> dict:
        headers = {"Accept": "application/json"}
        if self.api_key:
            headers["X-API-Key"] = self.api_key
        return headers

    def _fetch(self, group_token: str, scale: str, raw: int | float) -> tuple[Optional[float], Optional[str]]:
        key = (group_token, scale, int(raw))
        # TTL cache (positive and negative results)
        ttl = getattr(settings, "external_norms_ttl_sec", 60) or 60
        now = time.time()
        cached = self._cache.get(key)
        if cached is not None:
            val, version, ts, found = cached
            if now - ts <= ttl:
                self._hits += 1
                return (val, version) if found else (None, None)
        self._misses += 1
        url = f"{self.base_url}/norms/{group_token}/{scale}/{int(raw)}"
        # Simple retry loop (2 attempts)
        last_exc: Exception | None = None
        for _ in range(2):
            try:
                with timer("norms.external.fetch"):  # includes network time
                    resp = httpx.get(url, headers=self._headers(), timeout=self.timeout)
                if resp.status_code == 200:
                    data = resp.json()
                    percentile = data.get("percentile")
                    version = data.get("version")
                    if isinstance(percentile, (int, float)):
                        result = (float(percentile), str(version) if version else None)
                        # Cache with cap + timestamp
                        self._cache[key] = (result[0], result[1], now, True)
                        self._evict_if_needed()
                        self._net_success += 1
                        return result
                    # Negative cache for TTL window
                    self._cache[key] = (None, None, now, False)
                    self._net_success += 1  # 200 but no valid percentile
                    return None, None
                if resp.status_code == 404:
                    self._cache[key] = (None, None, now, False)
                    self._net_404 += 1
                    return None, None
            except Exception as exc:  # network errors/timeouts
                last_exc = exc
                self._net_error += 1
                continue
        # On repeated failure, negative cache for TTL window
        self._cache[key] = (None, None, now, False)
        return None, None

    def _evict_if_needed(self) -> None:
        max_size = getattr(settings, "external_norms_cache_size", 512) or 512
        if len(self._cache) <= max_size:
            return
        # Pop arbitrary items until within size cap (simple policy)
        while len(self._cache) > max_size:
            try:
                self._cache.pop(next(iter(self._cache)))
            except StopIteration:
                break

    @count_calls("norms.external.percentile.calls")
    @measure_time("norms.external.percentile", histogram=True)
    def percentile(
        self, group_chain: List[str], scale: str, raw: int | float
    ) -> PercentileResult:
        with timer(f"norms.external.percentile.{scale}"):
            if not self.base_url:
                return PercentileResult(None, "External:Disabled", False)
            for group_token in group_chain:
                # First, try cached/TTL path via _fetch; if no cached value and network slow,
                # schedule a background fetch and return immediately (non-blocking fallback).
                value, version = self._fetch(group_token, scale, raw)
                if value is not None:
                    label = f"External:{group_token}"
                    if version:
                        label = f"{label}{_NORM_VERSION_DELIM}{version}"
                    return PercentileResult(value, label, False)
                # If no value, opportunistically schedule a background refresh
                self._schedule_background_fetch(group_token, scale, raw)
        return PercentileResult(None, UNKNOWN.capitalize(), False)

    def _schedule_background_fetch(self, group_token: str, scale: str, raw: int | float) -> None:
        key = (group_token, scale, int(raw))
        cooldown = max(1, int(getattr(settings, "external_norms_ttl_sec", 60) // 12))  # ~5s default when ttl=60
        now = time.time()
        with self._lock:
            last = self._scheduled.get(key, 0)
            if now - last < cooldown:
                return
            self._scheduled[key] = now

        def _runner():
            try:
                self._fetch(group_token, scale, raw)
            finally:
                # allow re-scheduling after cooldown expires naturally
                pass

        t = threading.Thread(target=_runner, name=f"ext-norm-fetch-{group_token}-{scale}-{int(raw)}", daemon=True)
        t.start()

    def cache_stats(self) -> dict:
        ttl = getattr(settings, "external_norms_ttl_sec", 60) or 60
        limit = getattr(settings, "external_norms_cache_size", 512) or 512
        size = len(self._cache)
        pos = sum(1 for _, _, _, found in self._cache.values() if found)
        neg = size - pos
        return {
            "hits": self._hits,
            "misses": self._misses,
            "network_success": self._net_success,
            "network_404": self._net_404,
            "network_error": self._net_error,
            "cache_size": size,
            "cache_limit": limit,
            "positive_entries": pos,
            "negative_entries": neg,
            "scheduled_keys": len(self._scheduled),
            "ttl_sec": ttl,
            "enabled": bool(self.base_url),
        }


class CompositeNormProvider:
    providers: List[NormProvider]
    _db_lookup: Optional[Callable[..., Any]]
    _preload_stats: Optional[Dict[str, Any]]
    _external_provider: Optional["ExternalNormProvider"]

    def __init__(self, providers: List[NormProvider]):
        self.providers = providers
        self._db_lookup = None
        self._preload_stats = None
        self._external_provider = None

    def percentile(
        self, group_chain: List[str], scale: str, raw: int | float
    ) -> PercentileResult:
        for provider in self.providers:
            result = provider.percentile(group_chain, scale, raw)
            if result.percentile is not None:
                return result
        return PercentileResult(None, UNKNOWN.capitalize(), False)
