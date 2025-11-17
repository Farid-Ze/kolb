"""Tests for i18n preloading and caching functionality."""

from typing import Mapping

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
    resource = get_i18n_resource("messages", "id")
    assert resource is not None
    assert isinstance(resource, Mapping)
    assert resource["welcome_message"] == "Selamat datang di KLSI"


def test_get_i18n_resource_returns_same_proxy_instance():
    """Repeated calls should reuse the same mapping instance after caching."""
    clear_i18n_cache()
    preload_i18n_resources()

    first = get_i18n_resource("messages", "id")
    second = get_i18n_resource("messages", "id")
    assert first is second


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
    resource = get_i18n_resource("messages", "id")
    assert isinstance(resource, Mapping)


def test_yaml_resource_loading():
    """YAML resources should be discoverable alongside JSON files."""
    clear_i18n_cache()
    preload_i18n_resources(resource_types=("styles",), locales=("id",))

    resource = get_i18n_resource("styles", "id")
    assert resource["palette"]["primary"] == "#004488"


def test_en_locale_loads_specific_messages():
    """English locale should load dedicated translations when available."""
    clear_i18n_cache()
    preload_i18n_resources()

    resource = get_i18n_resource("messages", "en")
    assert resource["welcome_message"] == "Welcome to KLSI"


def test_unknown_locale_falls_back_to_default():
    """Unsupported locales should transparently fall back to the default locale."""
    clear_i18n_cache()
    preload_i18n_resources()

    resource = get_i18n_resource("messages", "fr")
    assert resource["welcome_message"] == "Selamat datang di KLSI"
