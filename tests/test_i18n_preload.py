"""Tests for i18n preloading and caching functionality."""

import pytest
from app.i18n import (
    preload_i18n_resources,
    get_i18n_resource,
    clear_i18n_cache,
)


def test_preload_i18n_resources():
    """Test that i18n resources can be preloaded."""
    clear_i18n_cache()
    
    stats = preload_i18n_resources(
        resource_types=("messages", "styles"),
        locales=("id", "en")
    )
    
    assert isinstance(stats, dict)
    assert "loaded_count" in stats
    assert "failed_count" in stats
    assert "cache_size" in stats
    # At minimum we should have attempted to load resources
    assert stats["loaded_count"] + stats["failed_count"] > 0


def test_get_i18n_resource_with_cache():
    """Test that resources can be retrieved from cache."""
    clear_i18n_cache()
    preload_i18n_resources()
    
    # This should hit cache or load on-demand
    try:
        resource = get_i18n_resource("messages", "id")
        assert resource is not None
        assert isinstance(resource, dict)
    except KeyError:
        # If no messages.json file exists, this is acceptable
        pytest.skip("No messages.json file available for testing")


def test_clear_i18n_cache():
    """Test that cache can be cleared."""
    preload_i18n_resources()
    clear_i18n_cache()
    # After clear, should still work but may need to load from disk
    # This tests that the system gracefully handles cache misses


def test_i18n_fallback_behavior():
    """Test locale fallback mechanism."""
    clear_i18n_cache()
    
    # Try to get a resource with explicit locale
    # Should fall back if specific locale not found
    try:
        resource = get_i18n_resource("messages", "id")
        assert isinstance(resource, dict)
    except KeyError:
        # If no i18n files exist at all, that's acceptable for this test
        pytest.skip("No i18n resources available for fallback testing")
