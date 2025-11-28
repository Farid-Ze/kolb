from types import SimpleNamespace
from typing import Any, cast
from uuid import UUID, uuid4

import pytest
from sqlalchemy.orm import Session

from app.engine.runtime import EngineRuntime, FinalizeContext
from app.engine.runtime_logic import ValidationReport, build_finalize_payload
from app.engine.runtime_components import RuntimeScheduler
from app.core.errors import SessionNotFoundError
from app.models.klsi.assessment import AssessmentSession


class DummyDB:
    pass


class DummySession:
    def __init__(self, session_id: UUID):
        self.id = session_id
        self.status = None
        self.user_id = 1


class RecorderScheduler(RuntimeScheduler):
    def __init__(self, session):
        super().__init__(lambda db: cast(Any, None))  # type: ignore[arg-type]
        self.session = session
        self.calls: list[tuple[object, UUID]] = []

    def resolve_session(self, db, session_id):  # pragma: no cover - simple delegate
        self.calls.append((db, session_id))
        return self.session


class RecorderProvider:
    def __init__(self, session):
        self.session = session
        self.calls: list[UUID] = []
        self.sessions = SimpleNamespace(get_by_id=self._get)

    def _get(self, session_id: UUID):
        self.calls.append(session_id)
        return self.session


def test_resolve_session_uses_scheduler_when_components_enabled(monkeypatch):
    sid = uuid4()
    dummy_session = DummySession(sid)
    scheduler = RecorderScheduler(dummy_session)

    def _fail_provider(db):  # pragma: no cover - ensure not called
        raise AssertionError("repository provider path should not be used")

    monkeypatch.setattr("app.engine.runtime.get_repository_provider", _fail_provider)
    runtime = EngineRuntime(components_enabled=True, scheduler=scheduler)
    resolved = runtime._resolve_session(cast(Session, DummyDB()), sid)
    assert resolved is dummy_session
    assert len(scheduler.calls) == 1
    called_db, called_id = scheduler.calls[0]
    assert isinstance(called_db, DummyDB)
    assert called_id == sid


def test_resolve_session_uses_repository_when_components_disabled(monkeypatch):
    sid = uuid4()
    dummy_session = DummySession(sid)
    provider = RecorderProvider(dummy_session)

    class NeverScheduler(RecorderScheduler):
        def resolve_session(self, db, session_id):  # pragma: no cover - should not run
            raise AssertionError("scheduler path should be disabled")

    monkeypatch.setattr("app.engine.runtime.get_repository_provider", lambda db: provider)
    runtime = EngineRuntime(components_enabled=False, scheduler=NeverScheduler(dummy_session))
    resolved = runtime._resolve_session(cast(Session, DummyDB()), sid)
    assert resolved is dummy_session
    assert provider.calls == [sid]


def test_resolve_session_raises_when_not_found(monkeypatch):
    provider = RecorderProvider(None)
    monkeypatch.setattr("app.engine.runtime.get_repository_provider", lambda db: provider)
    runtime = EngineRuntime(components_enabled=False, scheduler=RecorderScheduler(None))
    with pytest.raises(SessionNotFoundError):
        runtime._resolve_session(cast(Session, DummyDB()), uuid4())


def test_phase_validate_always_runs_session_validations(monkeypatch):
    captured: dict[str, tuple[object, UUID]] = {}

    def _fake_validations(db, session_id):
        captured["args"] = (db, session_id)
        return {"ready": True, "issues": [], "diagnostics": {"source": "engine"}}

    monkeypatch.setattr("app.engine.runtime.run_session_validations", _fake_validations)
    runtime = EngineRuntime(components_enabled=False)
    sid = uuid4()
    context = FinalizeContext(
        db=cast(Session, DummyDB()),
        session_id=sid,
        skip_validation=False,
        tracker=None,
        correlation_id="cid-11",
    )
    session = DummySession(sid)
    report = runtime._phase_validate(
        context,
        cast(AssessmentSession, session),
        failure_event="validation_failed",
    )
    assert captured["args"] == (context.db, session.id)
    assert isinstance(report, ValidationReport)
    assert report.ready is True
    assert report.diagnostics_dict()["source"] == "engine"


def test_build_finalize_payload_merges_validation_sections():
    runtime_validation = ValidationReport.from_mapping(
        {
            "ready": True,
            "issues": [{"code": "ENGINE_CHECK"}],
            "diagnostics": {"source": "runtime"},
        }
    )
    scorer_result = {
        "ok": True,
        "validation": {
            "structural": {"item_completeness": {"missing": 0}},
            "provenance": {"norm_group_used": "Appendix"},
            "anomalies": ["RAW_OUTSIDE_NORM_RANGE"],
            "issues": [{"code": "SCORER"}],
        },
    }

    payload = build_finalize_payload(scorer_result, runtime_validation, override=False).as_dict()

    merged = payload["validation"]
    assert merged["ready"] is True
    assert merged["structural"]["item_completeness"]["missing"] == 0
    assert merged["provenance"]["norm_group_used"] == "Appendix"
    assert "RAW_OUTSIDE_NORM_RANGE" in merged["anomalies"]
    codes = {issue["code"] for issue in merged["issues"]}
    assert codes == {"ENGINE_CHECK", "SCORER"}


def test_emit_scorer_issue_log_includes_metadata(monkeypatch):
    captured: dict[str, Any] = {}

    def fake_warning(message, *args, **kwargs):
        captured["message"] = message
        captured["kwargs"] = kwargs

    monkeypatch.setattr("app.engine.runtime.logger.warning", fake_warning)

    sid = uuid4()
    payload = EngineRuntime._emit_scorer_issue_log(
        event="test_event",
        session_id=sid,
        user_id=22,
        issues=[{"code": "X"}],
        correlation_id="cid-test",
    )

    assert payload["session_id"] == sid
    assert payload["user_id"] == 22
    assert payload["issues"] == [{"code": "X"}]
    assert payload["correlation_id"] == "cid-test"
    assert payload["pipeline_event"] == "test_event"
    assert captured["message"] == "test_event"
    assert captured["kwargs"]["extra"]["structured_data"] == payload