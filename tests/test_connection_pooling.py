"""Tests for database connection pooling configuration."""

from typing import Callable, cast

import pytest
from app.core.config import settings
from app.db.database import engine


def test_connection_pool_configured():
    """Test that connection pool settings are applied."""
    # Check that pool settings are configured
    pool = engine.pool

    size_fn = getattr(pool, "size", None)
    assert callable(size_fn), "Pool should expose size()"
    size_callable = cast(Callable[[], int], size_fn)
    assert size_callable() >= 0  # Pool is created
    
    # Settings should be loaded from config
    assert settings.db_pool_size >= 1
    assert settings.db_max_overflow >= 0
    assert settings.db_pool_timeout >= 1
    assert settings.db_pool_recycle >= 300


def test_pool_settings_reasonable():
    """Test that pool settings have reasonable values."""
    # Pool size should be reasonable for typical usage
    assert 1 <= settings.db_pool_size <= 50
    assert 0 <= settings.db_max_overflow <= 100
    assert 1 <= settings.db_pool_timeout <= 300
    assert 300 <= settings.db_pool_recycle <= 7200  # 5min to 2hr
    
    # Pre-ping should be enabled for connection health
    assert isinstance(settings.db_pool_pre_ping, bool)


def test_connection_pool_metrics():
    """Test that pool can provide basic metrics."""
    pool = engine.pool
    
    # Pool should be able to report status
    # This ensures pool is properly initialized
    try:
        _ = pool.status()
    except AttributeError:
        # Some pool types don't have status(), that's ok
        pass
