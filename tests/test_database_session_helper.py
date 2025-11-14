from __future__ import annotations

from contextlib import contextmanager
from types import SimpleNamespace

from sqlalchemy import text

from app.db import database as database_module
from app.db.database import get_session


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
