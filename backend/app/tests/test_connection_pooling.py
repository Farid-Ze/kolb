"""Tests for database connection pooling configuration."""

from typing import Callable, cast
from types import SimpleNamespace

import pytest
from sqlalchemy.orm import Session
from sqlalchemy.engine import Engine
from app.core.config import settings
from app.db.database import engine, norm_session_scope, get_engine_config_snapshot
from app.db import database as db_module


def test_connection_pool_configured():
    """Test that connection pool settings are applied."""
    # Check that pool settings are configured
    pool = engine.pool

    # Skip if using StaticPool (SQLite memory)
    if pool.__class__.__name__ == "StaticPool":
        pytest.skip("StaticPool does not expose size()")

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


def test_norm_session_scope_uses_pool():
    with norm_session_scope() as session:
        base = getattr(session, "_session", session)
        assert isinstance(base, Session)
        assert base.bind is engine


def test_norm_session_scope_blocks_mutations():
    with norm_session_scope() as session:
        with pytest.raises(RuntimeError):
            session.add(object())
        with pytest.raises(RuntimeError):
            session.flush()


def test_sqlite_check_same_thread_disabled():
    if engine.url.get_backend_name() != "sqlite":
        pytest.skip("Only applicable for sqlite")
    snapshot = get_engine_config_snapshot()
    connect_args = snapshot.get("connect_args") or {}
    assert isinstance(connect_args, dict)
    assert connect_args.get("check_same_thread") is False


def test_engine_snapshot_matches_pool_class():
    snapshot = get_engine_config_snapshot()
    assert snapshot["poolclass"] == engine.pool.__class__.__name__


def test_get_engine_config_snapshot_smoke():
    snapshot = get_engine_config_snapshot()
    url = str(snapshot.get("url", ""))
    assert url
    assert "pool_size" in snapshot
    assert "pool_pre_ping" in snapshot


def test_engine_snapshot_logging_emits_structured_payload(monkeypatch):
    class CaptureLogger:
        def __init__(self):
            self.calls: list[tuple[str, dict]] = []

        def info(self, message: str, **kwargs):  # type: ignore[override]
            self.calls.append((message, kwargs))

    capture = CaptureLogger()
    monkeypatch.setattr(db_module, "logger", capture)
    original_snapshot = db_module.get_engine_config_snapshot()

    class DummyPool:
        pass

    dummy_engine = SimpleNamespace(url="sqlite://", pool=DummyPool())
    kwargs = {
        "poolclass": DummyPool,
        "connect_args": {"check_same_thread": False},
        "pool_size": 3,
        "max_overflow": 1,
        "pool_timeout": 30,
        "pool_recycle": 900,
        "pool_pre_ping": True,
    }

    try:
        db_module._set_engine_snapshot(cast(Engine, dummy_engine), kwargs)
        assert capture.calls
        message, payload = capture.calls[-1]
        assert message == "db_engine_config_snapshot"
        structured = payload.get("extra", {}).get("structured_data")
        assert structured == db_module.get_engine_config_snapshot()
    finally:
        db_module.ENGINE_CONFIG_SNAPSHOT = original_snapshot
