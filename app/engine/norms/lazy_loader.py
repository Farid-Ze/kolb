"""Lazy loading strategy for large normative datasets.

This module provides on-demand loading of norm data to reduce memory footprint
and startup time when dealing with large norm tables.
"""

from __future__ import annotations

import logging
from threading import RLock
from typing import Protocol

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
        self._cache: dict[tuple[str, str], dict[int, float]] = {}
        self._lock = RLock()
        self._hits = 0
        self._misses = 0
        self._chunks_loaded = 0
    
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
            # Check if chunk is already cached
            if cache_key in self._cache:
                self._hits += 1
                return self._cache[cache_key].get(raw_score)
            
            # Cache miss - need to load chunk
            self._misses += 1
            
            # Evict oldest entry if cache is full (simple FIFO)
            if len(self._cache) >= self._max_cache:
                # Remove first entry (oldest in insertion order)
                oldest_key = next(iter(self._cache))
                del self._cache[oldest_key]
                logger.debug(f"Evicted norm cache entry: {oldest_key}")
            
            # Load chunk from source
            chunk_data = self._source.fetch_chunk(
                db, norm_group, scale_name, offset=0, limit=self._chunk_size
            )
            
            # Build lookup dict for this chunk
            lookup_dict = {raw: pct for raw, pct in chunk_data}
            self._cache[cache_key] = lookup_dict
            self._chunks_loaded += 1
            
            logger.debug(
                f"Loaded norm chunk: group={norm_group}, scale={scale_name}, "
                f"size={len(chunk_data)}"
            )
            
            return lookup_dict.get(raw_score)
    
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
            }
    
    def clear_cache(self) -> None:
        """Clear the cache and reset statistics."""
        with self._lock:
            self._cache.clear()
            self._hits = 0
            self._misses = 0
            self._chunks_loaded = 0
