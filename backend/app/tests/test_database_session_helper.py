from contextlib import contextmanager
from types import SimpleNamespace

import pytest

from sqlalchemy import text

from app.db import database as database_module
from app.db.database import get_session, hyperatomic_session, repository_scope


def test_get_session_executes_query():
    with get_session() as db:
        scalar = db.execute(text("SELECT 1")).scalar()
        assert scalar == 1


def test_get_session_closes_context(monkeypatch):
    events: list[str] = []

    @contextmanager
    def fake_session():
        events.append("enter")
        yield object()
        events.append("exit")

    monkeypatch.setattr(database_module, "database_gateway", SimpleNamespace(session=fake_session))

    with get_session() as db:
        assert db is not None

    assert events == ["enter", "exit"]


def test_hyperatomic_session_flushes_before_commit(monkeypatch):
    trace: list[str] = []

    session_obj = SimpleNamespace(
        flush=lambda: trace.append("flush"),
        commit=lambda: trace.append("commit"),
    )

    @contextmanager
    def fake_transactional(*, flush_before_commit: bool = False):
        trace.append(f"enter:{flush_before_commit}")
        try:
            yield session_obj
        finally:
            if flush_before_commit:
                session_obj.flush()
            session_obj.commit()
            trace.append("exit")

    monkeypatch.setattr(database_module, "database_gateway", SimpleNamespace(transactional=fake_transactional))

    with hyperatomic_session() as session:
        assert session is not None

    assert trace == ["enter:True", "flush", "commit", "exit"]


def test_hyperatomic_session_blocks_manual_commit(monkeypatch):
    base_session = SimpleNamespace(flush=lambda: None, commit=lambda: None, rollback=lambda: None)

    @contextmanager
    def fake_transactional(*, flush_before_commit: bool = False):
        yield base_session

    monkeypatch.setattr(database_module, "database_gateway", SimpleNamespace(transactional=fake_transactional))

    with hyperatomic_session() as session:
        with pytest.raises(RuntimeError):
            session.commit()
        with pytest.raises(RuntimeError):
            session.rollback()


def test_repository_scope_uses_hyperatomic_session(monkeypatch):
    calls: list[str] = []

    @contextmanager
    def fake_hyperatomic_session():
        calls.append("enter")
        yield SimpleNamespace()
        calls.append("exit")

    monkeypatch.setattr(database_module, "hyperatomic_session", fake_hyperatomic_session)

    with repository_scope() as provider:
        assert provider.db is not None

    assert calls == ["enter", "exit"]
