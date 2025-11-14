"""Lazy loading strategy for large normative datasets.

This module provides on-demand loading of norm data to reduce memory footprint
and startup time when dealing with large norm tables.
"""

from __future__ import annotations

import logging
from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime, timezone
from threading import RLock
from typing import Protocol
from sys import getsizeof

from sqlalchemy.orm import Session

__all__ = [
    "LazyNormLoader",
    "NormDataSource",
]

logger = logging.getLogger(__name__)


class NormDataSource(Protocol):
    """Protocol for norm data sources that support lazy loading."""
    
    def fetch_chunk(
        self, 
        db: Session, 
        norm_group: str, 
        scale_name: str,
        offset: int = 0,
        limit: int = 100
    ) -> list[tuple[int, float]]:
        """Fetch a chunk of norm data (raw_score, percentile) pairs.
        
        Args:
            db: Database session.
            norm_group: Norm group identifier.
            scale_name: Scale name (e.g., "CE", "RO", "ACCE").
            offset: Starting row offset.
            limit: Maximum rows to fetch.
            
        Returns:
            List of (raw_score, percentile) tuples.
        """
        ...


class LazyNormLoader:
    """Lazy loader for normative data with LRU caching.
    
    This loader fetches norm data on-demand in chunks rather than preloading
    entire tables. Useful for large norm datasets (>50k rows) where memory
    footprint is a concern.
    
    Features:
    - On-demand chunk loading
    - Thread-safe caching
    - Automatic cache eviction when limit reached
    - Metrics tracking for cache hits/misses
    
    Example:
        >>> loader = LazyNormLoader(max_cache_entries=1000)
        >>> percentile = loader.lookup(db, "Total", "CE", 28)
    """
    
    def __init__(
        self, 
        data_source: NormDataSource,
        *,
        chunk_size: int = 100,
        max_cache_entries: int = 5000
    ):
        """Initialize lazy loader.
        
        Args:
            data_source: Source for fetching norm data chunks.
            chunk_size: Number of rows to fetch per chunk.
            max_cache_entries: Maximum cached (norm_group, scale) chunks.
        """
        self._source = data_source
        self._chunk_size = chunk_size
        self._max_cache = max_cache_entries
        self._cache: dict[tuple[str, str], _ChunkCacheEntry] = {}
        self._lock = RLock()
        self._hits = 0
        self._misses = 0
        self._chunks_loaded = 0
        self._evictions = 0
        self._bytes_loaded = 0
        self._eviction_reasons: dict[str, int] = defaultdict(int)
        self._last_chunk_loaded_at: str | None = None
    
    def lookup(
        self,
        db: Session,
        norm_group: str,
        scale_name: str,
        raw_score: int,
    ) -> float | None:
        """Look up percentile for raw score with lazy loading.
        
        Args:
            db: Database session.
            norm_group: Norm group identifier.
            scale_name: Scale name.
            raw_score: Raw score value.
            
        Returns:
            Percentile value or None if not found.
        """
        cache_key = (norm_group, scale_name)
        
        with self._lock:
            state = self._cache.get(cache_key)

            if state and raw_score in state.rows:
                self._hits += 1
                return state.rows.get(raw_score)

            if state is None:
                # Evict oldest entry if cache is full (simple FIFO)
                if len(self._cache) >= self._max_cache:
                    oldest_key = next(iter(self._cache))
                    del self._cache[oldest_key]
                    self._evictions += 1
                    self._eviction_reasons["capacity"] += 1
                    logger.debug("Evicted norm cache entry: %s", oldest_key)
                state = _ChunkCacheEntry(rows={})
                self._cache[cache_key] = state

            self._misses += 1

            while not state.exhausted:
                chunk_data = self._source.fetch_chunk(
                    db,
                    norm_group,
                    scale_name,
                    offset=state.next_offset,
                    limit=self._chunk_size,
                )

                if not chunk_data:
                    state.exhausted = True
                    break

                state.next_offset += len(chunk_data)
                if len(chunk_data) < self._chunk_size:
                    state.exhausted = True

                for raw, pct in chunk_data:
                    state.rows[int(raw)] = float(pct)

                self._chunks_loaded += 1
                self._bytes_loaded += self._estimate_chunk_bytes(chunk_data)
                self._last_chunk_loaded_at = datetime.now(timezone.utc).isoformat()

                logger.debug(
                    "Loaded norm chunk: group=%s, scale=%s, size=%s, offset=%s",
                    norm_group,
                    scale_name,
                    len(chunk_data),
                    state.next_offset,
                )

                value = state.rows.get(raw_score)
                if value is not None:
                    return value

            return state.rows.get(raw_score)

    def _estimate_chunk_bytes(self, chunk: list[tuple[int, float]]) -> int:
        size = getsizeof(chunk)
        for row in chunk:
            size += getsizeof(row)
        return size
    
    def get_stats(self) -> dict[str, int | float]:
        """Get cache statistics.
        
        Returns:
            Dict with hits, misses, hit_rate, chunks_loaded, cache_size.
        """
        with self._lock:
            total = self._hits + self._misses
            hit_rate = (self._hits / total * 100) if total > 0 else 0.0
            
            return {
                "hits": self._hits,
                "misses": self._misses,
                "hit_rate": hit_rate,
                "chunks_loaded": self._chunks_loaded,
                "cache_size": len(self._cache),
                "evictions": self._evictions,
                "eviction_reasons": dict(self._eviction_reasons),
                "bytes_loaded": self._bytes_loaded,
                "last_chunk_loaded_at": self._last_chunk_loaded_at,
            }
    
    def clear_cache(self) -> None:
        """Clear the cache and reset statistics."""
        with self._lock:
            self._cache.clear()
            self._hits = 0
            self._misses = 0
            self._chunks_loaded = 0
            self._evictions = 0
            self._bytes_loaded = 0
            self._eviction_reasons.clear()
            self._last_chunk_loaded_at = None


@dataclass(slots=True)
class _ChunkCacheEntry:
    rows: dict[int, float]
    next_offset: int = 0
    exhausted: bool = False
