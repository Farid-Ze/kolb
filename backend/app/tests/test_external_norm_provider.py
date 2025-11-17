import httpx

from app.core.config import settings
from app.engine.norms.factory import build_composite_norm_provider
import app.engine.norms.composite as composite_module


class _MockResponse:
    def __init__(self, status_code: int, data: dict | None = None):
        self.status_code = status_code
        self._data = data or {}

    def json(self):
        return self._data


def test_external_norms_fallback_to_appendix(monkeypatch, session):
    # Enable external norms but return 404 so the chain should fall through to Appendix
    monkeypatch.setattr(settings, "external_norms_enabled", True)
    monkeypatch.setattr(settings, "external_norms_base_url", "https://example.test")

    def _fake_get(url, headers=None, timeout=None):
        return _MockResponse(404)

    monkeypatch.setattr(httpx, "get", _fake_get)

    provider = build_composite_norm_provider(session)
    result = provider.percentile(["Total"], "AC", 20)
    assert result.percentile is not None
    assert result.provenance.startswith("Appendix:")


def test_external_norms_success_precedence(monkeypatch, session):
    # External returns a value; should label as External: and not be truncated
    monkeypatch.setattr(settings, "external_norms_enabled", True)
    monkeypatch.setattr(settings, "external_norms_base_url", "https://example.test")
    monkeypatch.setattr(settings, "external_norms_timeout_ms", 500)

    def _fake_get(url, headers=None, timeout=None):
        return _MockResponse(200, {"percentile": 42.5, "version": "v9"})

    monkeypatch.setattr(httpx, "get", _fake_get)

    provider = build_composite_norm_provider(session)
    result = provider.percentile(["Total"], "AC", 20)
    assert result.percentile == 42.5
    assert result.provenance.startswith("External:")
    assert not result.truncated


def test_external_norm_provider_normalizes_float_keys(monkeypatch):
    monkeypatch.setattr(settings, "external_norms_enabled", True)
    provider = composite_module.ExternalNormProvider("https://example.test")
    monkeypatch.setattr(
        composite_module.ExternalNormProvider,
        "_schedule_background_fetch",
        lambda *args, **kwargs: None,
    )

    calls: list[str] = []

    def _fake_get(url, headers=None, timeout=None):
        calls.append(url)
        return _MockResponse(404)

    monkeypatch.setattr(composite_module.httpx, "get", _fake_get)

    result_float = provider.percentile(["Total"], "AC", 20.7)
    assert result_float.percentile is None
    assert calls and calls[0].endswith("/20"), "raw values should be normalized to int keys"

    result_int = provider.percentile(["Total"], "AC", 20)
    assert result_int.percentile is None
    assert len(calls) == 1, "cached negative result should prevent second HTTP call"

    stats = provider.cache_stats()
    assert stats["hits"] == 1
    assert stats["misses"] == 1


def test_external_norm_provider_ttl_and_cache_limit(monkeypatch):
    monkeypatch.setattr(settings, "external_norms_enabled", True)
    monkeypatch.setattr(settings, "external_norms_ttl_sec", 5)
    monkeypatch.setattr(settings, "external_norms_cache_size", 2)
    provider = composite_module.ExternalNormProvider("https://example.test")
    monkeypatch.setattr(
        composite_module.ExternalNormProvider,
        "_schedule_background_fetch",
        lambda *args, **kwargs: None,
    )

    fake_time = {"now": 1000.0}
    monkeypatch.setattr(composite_module.time, "time", lambda: fake_time["now"])

    calls: list[str] = []

    def _fake_get(url, headers=None, timeout=None):
        calls.append(url)
        return _MockResponse(200, {"percentile": float(len(calls)), "version": "v1"})

    monkeypatch.setattr(composite_module.httpx, "get", _fake_get)

    provider.percentile(["Total"], "AC", 10)  # miss -> cache entry 1
    provider.percentile(["Total"], "AC", 11)  # miss -> cache entry 2

    stats = provider.cache_stats()
    assert stats["cache_size"] <= stats["cache_limit"] == 2

    provider.percentile(["Total"], "AC", 10)  # hit within TTL
    assert len(calls) == 2

    fake_time["now"] += 10  # expire TTL
    provider.percentile(["Total"], "AC", 10)
    assert len(calls) == 3, "expired TTL should trigger new HTTP call"

    provider.percentile(["Total"], "AC", 12)  # exceed cache limit -> evict oldest
    stats_after = provider.cache_stats()
    assert stats_after["cache_size"] <= stats_after["cache_limit"] == 2
    assert stats_after["positive_entries"] + stats_after["negative_entries"] == stats_after["cache_size"]


def test_external_norm_provider_background_fetch_swallows_exceptions(monkeypatch):
    monkeypatch.setattr(settings, "external_norms_enabled", True)
    provider = composite_module.ExternalNormProvider("https://example.test")

    created_threads: list["_ThreadShim"] = []

    class _ThreadShim:
        def __init__(self, target, name=None, daemon=None):
            self._target = target
            self.name = name
            self.daemon = daemon
            self.exception: Exception | None = None
            created_threads.append(self)

        def start(self):
            try:
                self._target()
            except Exception as exc:  # pragma: no cover - purposely triggered
                self.exception = exc

    monkeypatch.setattr(composite_module.threading, "Thread", _ThreadShim)

    call_count = {"value": 0}

    def _fake_fetch(group_token, scale, raw):
        call_count["value"] += 1
        if call_count["value"] == 1:
            return (None, None)
        raise RuntimeError("boom")

    provider._fetch = _fake_fetch  # type: ignore[attr-defined]

    result = provider.percentile(["Total"], "AC", 10)
    assert result.percentile is None
    assert created_threads, "background fetch should spawn thread"
    assert isinstance(created_threads[0].exception, RuntimeError)
