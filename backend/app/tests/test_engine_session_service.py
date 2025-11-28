from types import SimpleNamespace
from typing import Any

import pytest

from app.assessments.klsi_v4.definition import CONTEXT_NAMES
from app.models.klsi.assessment import AssessmentSession
from app.models.klsi.user import User
from app.models.klsi.items import AssessmentItem, AssessmentItemResponse, UserResponse
from app.models.klsi.learning import LFIContextScore
from app.schemas.session import (
    AutosaveItemRank,
    ContextRank,
    ItemRank,
    ItemChoiceRank,
    SessionAutosavePayload,
    SessionSubmissionPayload,
)
from app.services.engine import EngineSessionService
from app.models.klsi.enums import ItemType, SessionStatus
from app.tests.helpers import build_seeded_memory_db, seed_complete_session
import app.services.engine as engine_module


def _build_payload() -> SessionSubmissionPayload:
    items: list[ItemRank] = []
    base_choice = 1000
    for idx in range(12):
        ranks_list = [
            ItemChoiceRank(choice_id=base_choice + idx * 10 + 1, rank=1),
            ItemChoiceRank(choice_id=base_choice + idx * 10 + 2, rank=2),
            ItemChoiceRank(choice_id=base_choice + idx * 10 + 3, rank=3),
            ItemChoiceRank(choice_id=base_choice + idx * 10 + 4, rank=4),
        ]
        items.append(ItemRank(item_id=idx + 1, ranks=ranks_list))
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
    return SessionSubmissionPayload(items=items, contexts=contexts[:8], client_duration_ms=1000)


def _seed_native_forced_choice(db, session_id: int) -> None:
    rank_map = {"CE": 4, "RO": 3, "AC": 2, "AE": 1}
    items = (
        db.query(AssessmentItem)
        .filter(AssessmentItem.item_type == ItemType.learning_style)
        .order_by(AssessmentItem.item_number.asc())
        .all()
    )
    for item in items:
        for choice in item.choices:
            db.add(
                UserResponse(
                    session_id=session_id,
                    item_id=item.id,
                    choice_id=choice.id,
                    rank_value=rank_map[choice.learning_mode.value],
                )
            )
    db.flush()


def _serialize_delivery_payload(db) -> dict[str, Any]:
    items = (
        db.query(AssessmentItem)
        .order_by(AssessmentItem.item_number.asc())
        .all()
    )
    payload = []
    for item in items:
        payload.append(
            {
                "id": item.id,
                "number": item.item_number,
                "stem": item.item_stem,
                "type": item.item_type.value,
                "options": [
                    {
                        "id": choice.id,
                        "learning_mode": choice.learning_mode.value,
                        "text": choice.choice_text,
                    }
                    for choice in item.choices
                ],
            }
        )
    return {
        "instrument": {"code": "KLSI", "version": "4.0"},
        "items": payload,
    }


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


def test_session_state_exposes_responses_and_progress(monkeypatch):
    db = build_seeded_memory_db()
    try:
        session = seed_complete_session(db)
        user = db.get(User, session.user_id)
        assert user is not None

        delivery_payload = _serialize_delivery_payload(db)

        def fake_delivery(_db, session_id, locale=None):  # noqa: ARG001
            assert session_id == session.id
            return delivery_payload

        monkeypatch.setattr(engine_module.runtime, "delivery_package", fake_delivery)

        service = EngineSessionService(db)
        state = service.session_state(session.id, user)

        assert state["total_items"] == len(delivery_payload["items"])
        assert state["completed_items"] == state["total_items"]
        assert pytest.approx(state["progress"], rel=1e-2) == 100.0
        assert len(state["responses"]) == state["total_items"]
        assert state["current_item_index"] == state["total_items"] - 1
    finally:
        db.close()


def test_autosave_responses_maps_option_codes(monkeypatch):
    db = build_seeded_memory_db()
    try:
        session = seed_complete_session(db)
        user = db.get(User, session.user_id)
        assert user is not None

        delivery_payload = _serialize_delivery_payload(db)
        submitted: list[dict[str, Any]] = []

        def fake_delivery(_db, session_id, locale=None):  # noqa: ARG001
            assert session_id == session.id
            return delivery_payload

        def fake_submit(_db, session_id, payload):  # noqa: ARG001
            submitted.append(payload)

        monkeypatch.setattr(engine_module.runtime, "delivery_package", fake_delivery)
        monkeypatch.setattr(engine_module.runtime, "submit_payload", fake_submit)

        first_item = delivery_payload["items"][0]
        ranks = {option["learning_mode"]: idx + 1 for idx, option in enumerate(first_item["options"])}
        autosave_payload = SessionAutosavePayload(
            responses=[AutosaveItemRank(item_id=first_item["id"], ranks=ranks)]
        )

        service = EngineSessionService(db)
        result = service.autosave_responses(session.id, user, autosave_payload)

        assert result == {"saved_count": 1}
        assert len(submitted) == 1
        payload = submitted[0]
        assert payload["kind"] == "item"
        assert set(payload["ranks"].keys()) == {
            option["id"] for option in first_item["options"]
        }
    finally:
        db.close()


def test_finalize_session_prefers_native_pipeline(monkeypatch):
    db = build_seeded_memory_db()
    try:
        session = seed_complete_session(db)
        user = db.get(User, session.user_id)
        assert user is not None
        # _seed_native_forced_choice(db, session.id)  # Already seeded by seed_complete_session
        db.commit()

        def fail_runtime(*args, **kwargs):  # noqa: ARG001
            raise AssertionError("runtime path should not run when native data is present")

        monkeypatch.setattr(engine_module.runtime, "finalize_with_audit", fail_runtime)

        service = EngineSessionService(db)
        result = service.finalize_session(session.id, user)
        db.refresh(session)

        assert session.is_finalized is True
        assert session.pipeline_version == "native:v1"
        assert result["override"] is False
        assert result["ACCE"] is not None
        assert session.results_json is not None
        kite = session.results_json.get("kite_coordinates") or {}
        assert kite.get("CE") == 48
        assert kite.get("AE") == 12
    finally:
        db.close()


def test_finalize_session_falls_back_to_runtime_when_native_missing(monkeypatch):
    db = build_seeded_memory_db()
    try:
        session = seed_complete_session(db)
        user = db.get(User, session.user_id)
        assert user is not None

        original_finalize = engine_module.runtime.finalize_with_audit
        call_tracker: dict[str, bool] = {}

        def tracking_finalize(*args, **kwargs):
            call_tracker["invoked"] = True
            return original_finalize(*args, **kwargs)

        monkeypatch.setattr(engine_module.runtime, "finalize_with_audit", tracking_finalize)
        monkeypatch.setattr(EngineSessionService, "_should_use_native_pipeline", lambda self, sid: False)

        service = EngineSessionService(db)
        result = service.finalize_session(session.id, user)
        db.refresh(session)

        assert call_tracker.get("invoked") is True
        assert result["override"] is False
        assert session.pipeline_version != "native:v1"
    finally:
        db.close()
