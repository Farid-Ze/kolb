"""Tests for runtime modular components."""

from types import SimpleNamespace
from typing import Any, Dict, List, Tuple, cast
from uuid import UUID, uuid4

from sqlalchemy.orm import Session

from app.engine.runtime import EngineRuntime
from app.engine.runtime_components import (
    RuntimeErrorReporter,
    RuntimeScheduler,
    RuntimeStateTracker,
)


class StubScheduler(RuntimeScheduler):
    def __init__(self, session_obj: object):
        super().__init__(lambda db: None)  # type: ignore[arg-type]
        self._session = session_obj
        self.calls: List[Tuple[Session | None, UUID]] = []

    def resolve_session(self, db: Session | None, session_id: UUID):  # type: ignore[override]
        self.calls.append((db, session_id))
        return self._session


class StubReporter(RuntimeErrorReporter):
    def __init__(self):
        class _DummyLogger:
            def exception(self, *args, **kwargs):
                pass

        super().__init__(_DummyLogger())
        self.calls: List[Dict[str, Any]] = []

    def report(self, **kwargs):  # type: ignore[override]
        self.calls.append(kwargs)


def test_resolve_session_uses_scheduler_when_components_enabled():
    fake_session = SimpleNamespace(id=123)
    scheduler = StubScheduler(fake_session)
    runtime = EngineRuntime(components_enabled=True, scheduler=scheduler)

    sid = uuid4()
    result = runtime._resolve_session(cast(Session, None), sid)

    assert result is fake_session
    assert scheduler.calls == [(None, sid)]


def test_log_runtime_error_uses_reporter_when_enabled():
    scheduler = StubScheduler(SimpleNamespace(id=1))
    reporter = StubReporter()
    runtime = EngineRuntime(components_enabled=True, scheduler=scheduler, error_reporter=reporter)

    sid = uuid4()
    runtime._log_runtime_error(
        event="test_event",
        session_id=sid,
        user_id=2,
        exc=RuntimeError("boom"),
        correlation_id="cid-123",
        metadata={"extra": True},
    )

    assert reporter.calls
    call = reporter.calls[0]
    assert call["event"] == "test_event"
    assert call["session_id"] == sid
    assert call["metadata"] == {"extra": True}


def test_runtime_state_tracker_reports_duration():
    tracker = RuntimeStateTracker("test")
    assert tracker.duration_ms() >= 0.0


def test_log_runtime_error_logs_structured_data_when_disabled(monkeypatch):
    class CaptureLogger:
        def __init__(self):
            self.calls: List[Tuple[str, Dict[str, Any] | None]] = []

        def exception(self, event: str, *, extra: Dict[str, Any] | None = None):
            self.calls.append((event, extra))

    capture_logger = CaptureLogger()
    monkeypatch.setattr("app.engine.runtime.logger", capture_logger)

    scheduler = StubScheduler(SimpleNamespace(id=1))
    runtime = EngineRuntime(components_enabled=False, scheduler=scheduler)

    sid = uuid4()
    runtime._log_runtime_error(
        event="runtime_event",
        session_id=sid,
        user_id=88,
        exc=RuntimeError("boom"),
        correlation_id="cid-77",
        metadata={"actor_email": "user@example.com"},
    )

    assert capture_logger.calls
    event, extra = capture_logger.calls[0]
    assert event == "runtime_event"
    assert extra is not None
    structured = extra.get("structured_data", {})
    assert structured["session_id"] == sid
    assert structured["user_id"] == 88
    assert structured["correlation_id"] == "cid-77"
    assert structured["pipeline_event"] == "runtime_event"
    assert structured["actor_email"] == "user@example.com"
    assert structured["error"] == "boom"
