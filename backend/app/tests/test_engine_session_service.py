from __future__ import annotations

from types import SimpleNamespace

from app.assessments.klsi_v4.definition import CONTEXT_NAMES
from app.models.klsi.assessment import AssessmentSession
from app.models.klsi.user import User
from app.models.klsi.items import UserResponse
from app.models.klsi.learning import LFIContextScore
from app.schemas.session import ContextRank, ItemRank, SessionSubmissionPayload
from app.services.engine import EngineSessionService
from app.models.klsi.enums import SessionStatus
from app.tests.helpers import build_seeded_memory_db


def _build_payload() -> SessionSubmissionPayload:
    items: list[ItemRank] = []
    base_choice = 1000
    for idx in range(12):
        ranks = {
            base_choice + idx * 10 + 1: 1,
            base_choice + idx * 10 + 2: 2,
            base_choice + idx * 10 + 3: 3,
            base_choice + idx * 10 + 4: 4,
        }
        items.append(ItemRank(item_id=idx + 1, ranks=ranks))
    contexts: list[ContextRank] = []
    for idx, name in enumerate(CONTEXT_NAMES):
        contexts.append(
            ContextRank(
                context_name=name,
                CE=((idx % 4) + 1),
                RO=((idx + 1) % 4) + 1,
                AC=((idx + 2) % 4) + 1,
                AE=((idx + 3) % 4) + 1,
            )
        )
    return SessionSubmissionPayload(items=items, contexts=contexts[:8])


def test_persist_batch_payload_uses_repositories():
    db = build_seeded_memory_db()
    try:
        user = User(full_name="Repo User", email="repo@example.com")
        db.add(user)
        db.flush()
        session = AssessmentSession(user_id=user.id, status=SessionStatus.started)
        db.add(session)
        db.flush()

        service = EngineSessionService(db)
        payload = _build_payload()
        service._persist_batch_payload(session.id, payload)
        db.flush()

        responses = db.query(UserResponse).filter(UserResponse.session_id == session.id).all()
        contexts = db.query(LFIContextScore).filter(LFIContextScore.session_id == session.id).all()
        assert len(responses) == 48
        assert len(contexts) == 8
    finally:
        db.close()


def test_transform_finalize_result_preserves_validation_sections():
    db = build_seeded_memory_db()
    try:
        service = EngineSessionService(db)
        combination = SimpleNamespace(ACCE_raw=9, AERO_raw=3)
        style = SimpleNamespace(primary_style_type_id=7)
        lfi = SimpleNamespace(LFI_score=68.5)
        percentiles = SimpleNamespace(norm_provenance={"AC": {"source": "Appendix"}})
        runtime_result = {
            "combination": combination,
            "style": style,
            "lfi": lfi,
            "percentiles": percentiles,
            "validation": {
                "ready": True,
                "issues": [{"code": "ENGINE_CHECK"}],
                "anomalies": ["MIXED_PROVENANCE"],
                "structural": {"item_completeness": {"missing": 0}},
            },
        }

        payload = service._transform_finalize_result(runtime_result, override=False)

        assert payload["ACCE"] == 9
        assert payload["AERO"] == 3
        assert payload["style_primary_id"] == 7
        assert payload["LFI"] == 68.5
        assert payload["percentile_sources"] == {"AC": {"source": "Appendix"}}
        assert "MIXED_PROVENANCE" in payload["validation"].get("anomalies", [])
    finally:
        db.close()


def test_validation_snapshot_includes_context_status():
    db = build_seeded_memory_db()
    try:
        user = User(full_name="Snapshot User", email="snapshot@example.com")
        db.add(user)
        db.flush()

        session = AssessmentSession(user_id=user.id, status=SessionStatus.started)
        db.add(session)
        db.flush()

        service = EngineSessionService(db)
        payload = _build_payload()
        service._persist_batch_payload(session.id, payload)
        db.commit()

        snapshot = service.validation_snapshot(session.id, user)
        contexts = snapshot["diagnostics"]["contexts"]
        assert contexts["expected_total"] == len(CONTEXT_NAMES)
        assert all(entry["present"] for entry in contexts["status"])
        assert snapshot["ready"] is True
    finally:
        db.close()
