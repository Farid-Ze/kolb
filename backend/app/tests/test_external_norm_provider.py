import json
from types import SimpleNamespace

import httpx

from app.core.config import settings
from app.engine.norms.factory import build_composite_norm_provider


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
