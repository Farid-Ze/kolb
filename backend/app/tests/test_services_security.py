from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from app.core.config import settings
from app.services.security import (
    create_access_token,
    decode_access_token,
    require_mediator,
)


def test_create_and_decode_access_token_roundtrip():
    token = create_access_token(subject="42", expires_minutes=5)
    payload = decode_access_token(token)
    assert payload["sub"] == "42"
    assert payload["iss"] == settings.jwt_issuer
    assert payload["aud"] == settings.jwt_audience


def test_require_mediator_rejects_non_mediators():
    user = SimpleNamespace(role="MAHASISWA")
    with pytest.raises(HTTPException) as excinfo:
        require_mediator(user)
    assert excinfo.value.status_code == 403
    assert "MEDIATOR" in excinfo.value.detail


def test_require_mediator_allows_mediators():
    user = SimpleNamespace(role="MEDIATOR")
    # Should not raise
    require_mediator(user)
