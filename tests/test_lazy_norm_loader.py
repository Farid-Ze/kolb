"""Tests for lazy norm loader functionality."""

from typing import cast

import pytest
from sqlalchemy.orm import Session
from app.engine.norms.lazy_loader import LazyNormLoader, NormDataSource


_DUMMY_SESSION = cast(Session, None)


class MockNormSource:
    """Mock norm data source for testing."""
    
    def __init__(self):
        self.fetch_count = 0
        # Simulate norm data: CE scale with raw_score -> percentile
        self._data = {
            ("Total", "CE"): [(i, float(i * 2.5)) for i in range(12, 49)],
            ("Total", "RO"): [(i, float(i * 2.0)) for i in range(12, 49)],
        }
    
    def fetch_chunk(
        self,
        db: Session,
        norm_group: str,
        scale_name: str,
        offset: int = 0,
        limit: int = 100
    ) -> list[tuple[int, float]]:
        self.fetch_count += 1
        key = (norm_group, scale_name)
        if key in self._data:
            return self._data[key][offset:offset+limit]
        return []


def test_lazy_loader_basic_lookup():
    """Test basic lazy loading and caching."""
    source = MockNormSource()
    loader = LazyNormLoader(source, chunk_size=50, max_cache_entries=10)
    
    # First lookup - should trigger load
    result = loader.lookup(_DUMMY_SESSION, "Total", "CE", 28)
    assert result == 70.0  # 28 * 2.5
    assert source.fetch_count == 1
    
    # Second lookup - should hit cache
    result2 = loader.lookup(_DUMMY_SESSION, "Total", "CE", 30)
    assert result2 == 75.0  # 30 * 2.5
    assert source.fetch_count == 1  # No additional fetch
    
    # Stats should show hit
    stats = loader.get_stats()
    assert stats["hits"] == 1
    assert stats["misses"] == 1
    assert stats["chunks_loaded"] == 1


def test_lazy_loader_cache_miss():
    """Test cache miss behavior."""
    source = MockNormSource()
    loader = LazyNormLoader(source, chunk_size=50, max_cache_entries=10)
    
    # Lookup in CE scale
    loader.lookup(_DUMMY_SESSION, "Total", "CE", 28)
    
    # Lookup in RO scale - different cache entry
    result = loader.lookup(_DUMMY_SESSION, "Total", "RO", 28)
    assert result == 56.0  # 28 * 2.0
    assert source.fetch_count == 2  # Two different chunks loaded


def test_lazy_loader_cache_eviction():
    """Test cache eviction when limit reached."""
    source = MockNormSource()
    loader = LazyNormLoader(source, chunk_size=50, max_cache_entries=2)
    
    # Fill cache with 2 entries
    loader.lookup(_DUMMY_SESSION, "Total", "CE", 28)
    loader.lookup(_DUMMY_SESSION, "Total", "RO", 28)
    
    # Add third entry - should evict oldest (CE)
    source._data[("Total", "AC")] = [(i, float(i * 3.0)) for i in range(12, 49)]
    loader.lookup(_DUMMY_SESSION, "Total", "AC", 28)
    
    stats = loader.get_stats()
    assert stats["cache_size"] == 2
    assert source.fetch_count == 3
    assert stats["evictions"] == 1
    assert stats["eviction_reasons"]["capacity"] == 1


def test_lazy_loader_not_found():
    """Test behavior when score not in norm table."""
    source = MockNormSource()
    loader = LazyNormLoader(source, chunk_size=50, max_cache_entries=10)
    
    # Lookup score outside range
    result = loader.lookup(_DUMMY_SESSION, "Total", "CE", 999)
    assert result is None


def test_lazy_loader_clear_cache():
    """Test cache clearing."""
    source = MockNormSource()
    loader = LazyNormLoader(source, chunk_size=50, max_cache_entries=10)
    
    loader.lookup(_DUMMY_SESSION, "Total", "CE", 28)
    assert loader.get_stats()["cache_size"] == 1
    
    loader.clear_cache()
    stats = loader.get_stats()
    assert stats["cache_size"] == 0
    assert stats["hits"] == 0
    assert stats["misses"] == 0
    assert stats["bytes_loaded"] == 0
    assert stats["evictions"] == 0


def test_lazy_loader_hit_rate():
    """Test hit rate calculation."""
    source = MockNormSource()
    loader = LazyNormLoader(source, chunk_size=50, max_cache_entries=10)
    
    # 1 miss (initial load)
    loader.lookup(_DUMMY_SESSION, "Total", "CE", 28)
    # 3 hits (same chunk)
    loader.lookup(_DUMMY_SESSION, "Total", "CE", 29)
    loader.lookup(_DUMMY_SESSION, "Total", "CE", 30)
    loader.lookup(_DUMMY_SESSION, "Total", "CE", 31)
    
    stats = loader.get_stats()
    assert stats["hits"] == 3
    assert stats["misses"] == 1
    assert stats["hit_rate"] == 75.0  # 3/4 * 100


def test_lazy_loader_reports_bytes_and_timestamp():
    source = MockNormSource()
    loader = LazyNormLoader(source, chunk_size=50, max_cache_entries=10)

    loader.lookup(_DUMMY_SESSION, "Total", "CE", 28)
    stats = loader.get_stats()
    assert stats["bytes_loaded"] > 0
    assert stats["last_chunk_loaded_at"] is not None
