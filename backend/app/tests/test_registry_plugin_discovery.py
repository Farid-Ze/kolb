import types

from app.core.config import settings
from app.engine.registry import engine_registry
from app.main import _auto_discover_plugins


def test_auto_discover_plugins_invokes_registry(monkeypatch):
    calls = {"count": 0}

    def fake_discover():
        calls["count"] += 1
        return ("KLSI:4.0",)

    monkeypatch.setattr(engine_registry, "discover_plugins", fake_discover)
    monkeypatch.setattr(settings, "registry_auto_discover_enabled", True)

    stats = _auto_discover_plugins()

    assert calls["count"] == 1
    assert stats["enabled"] is True
    assert stats["discovered"] == 1


def test_auto_discover_plugins_skips_when_disabled(monkeypatch):
    def fake_discover():  # pragma: no cover - should not be called
        raise AssertionError("discover_plugins should not be invoked when disabled")

    monkeypatch.setattr(engine_registry, "discover_plugins", fake_discover)
    monkeypatch.setattr(settings, "registry_auto_discover_enabled", False)

    stats = _auto_discover_plugins()

    assert stats == {"enabled": False, "discovered": 0}