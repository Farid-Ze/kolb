from uuid import uuid4, UUID
from datetime import datetime, timedelta, timezone

import pytest
from sqlalchemy.orm import joinedload

from app.assessments.klsi_v4.definition import CONTEXT_NAMES
from app.db.database import SessionLocal
from app.main import app
from app.models.klsi.enums import ItemType
from app.models.klsi.items import AssessmentItem
from app.models.klsi.user import User
from app.models.klsi.instrument import Instrument
from app.models.klsi.assessment import AssessmentSession
from app.routers.sessions import router as legacy_sessions_router
from app.services.security import create_access_token
from app.services.grant_service import GrantService


def _ensure_legacy_sessions_router() -> None:
    for route in app.router.routes:
        if getattr(route, "path", None) == "/sessions/start":
            return
    app.include_router(legacy_sessions_router)


_ensure_legacy_sessions_router()


def _create_user(role: str = "MAHASISWA") -> tuple[User, str]:
    with SessionLocal() as db:
        email = f"parity_{role.lower()}_{uuid4().hex}@kolb.dev"
        user = User(full_name=f"Parity {role.title()}", email=email, role=role)
        db.add(user)
        db.commit()
        db.refresh(user)
        
        # Allocate grant for KLSI 4.0
        instrument = db.query(Instrument).filter(Instrument.code == "KLSI", Instrument.version == "4.0").first()
        if instrument:
             GrantService.allocate_credits(db, user.id, instrument.id, grantee_id=user.id, credits=1)
             db.commit()
             
        token = create_access_token(subject=str(user.id))
             
    return user, token


def _repeat(pattern: dict[str, int], count: int) -> list[dict[str, int]]:
    return [dict(pattern) for _ in range(count)]


def _cycle(patterns: list[dict[str, int]], length: int) -> list[dict[str, int]]:
    seq: list[dict[str, int]] = []
    for idx in range(length):
        seq.append(dict(patterns[idx % len(patterns)]))
    return seq


BASELINE_ITEM_SEQUENCE = _cycle(
    [
        {"CE": 1, "RO": 2, "AC": 3, "AE": 4},
        {"CE": 2, "RO": 3, "AC": 4, "AE": 1},
        {"CE": 3, "RO": 4, "AC": 1, "AE": 2},
    ],
    12,
)

BASELINE_CONTEXT_SEQUENCE = _cycle(
    [
        {"CE": 1, "RO": 2, "AC": 3, "AE": 4},
        {"CE": 2, "RO": 3, "AC": 4, "AE": 1},
        {"CE": 3, "RO": 4, "AC": 1, "AE": 2},
        {"CE": 4, "RO": 1, "AC": 2, "AE": 3},
    ],
    8,
)

NEAR_BOUNDARY_ITEM_SEQUENCE = _repeat({"CE": 2, "RO": 1, "AC": 3, "AE": 4}, 9) + _repeat(
    {"CE": 3, "RO": 1, "AC": 2, "AE": 4},
    3,
)

TRUNCATION_ITEM_SEQUENCE = _repeat({"CE": 4, "RO": 1, "AC": 2, "AE": 3}, 12)
REPEATED_CONTEXT_SEQUENCE = _repeat({"CE": 1, "RO": 2, "AC": 3, "AE": 4}, 8)


def _build_batch_payload(item_patterns: list[dict[str, int]], context_patterns: list[dict[str, int]]):
    assert len(item_patterns) == 12
    assert len(context_patterns) == 8
    with SessionLocal() as db:
        items = (
            db.query(AssessmentItem)
            .options(joinedload(AssessmentItem.choices))
            .filter(AssessmentItem.item_type == ItemType.learning_style)
            .order_by(AssessmentItem.item_number.asc())
            .all()
        )
        payload_items: list[dict[str, object]] = []
        for idx, item in enumerate(items):
            pattern = item_patterns[idx]
            ranks = [
                {"choice_id": choice.id, "rank": pattern[choice.learning_mode.value]}
                for choice in item.choices
            ]
            payload_items.append({"item_id": item.id, "ranks": ranks})
    payload_contexts = []
    for idx, context_name in enumerate(CONTEXT_NAMES):
        pattern = context_patterns[idx]
        payload_contexts.append(
            {
                "context_name": context_name,
                "CE": pattern["CE"],
                "RO": pattern["RO"],
                "AC": pattern["AC"],
                "AE": pattern["AE"],
            }
        )
    return {"items": payload_items, "contexts": payload_contexts}


def _legacy_submit_all(client, payload):
    _, token = _create_user()
    headers = {"Authorization": f"Bearer {token}"}
    r_start = client.post("/sessions/start", json={"instrument_code": "KLSI"}, headers=headers)
    assert r_start.status_code == 200, r_start.text
    session_id_str = r_start.json()["sessionId"]
    session_id = UUID(session_id_str)

    # [Fix] Age the session to bypass "too fast" validation
    with SessionLocal() as db:
        sess = db.query(AssessmentSession).filter(AssessmentSession.id == session_id).first()
        if sess:
            sess.start_time = datetime.now(timezone.utc) - timedelta(minutes=2)
            db.commit()

    r_batch = client.post(
        f"/sessions/{session_id}/submit_all_responses",
        json=payload,
        headers=headers,
    )
    assert r_batch.status_code == 200, r_batch.text
    return r_batch.json()["result"]


def _engine_submit_all(client, payload):
    _, token = _create_user()
    headers = {"Authorization": f"Bearer {token}"}
    r_start = client.post(
        "/engine/sessions/start",
        json={"instrument_code": "KLSI"},
        headers=headers,
    )
    assert r_start.status_code == 200, r_start.text
    session_id_str = r_start.json()["sessionId"]
    session_id = UUID(session_id_str)

    # [Fix] Age the session to bypass "too fast" validation
    with SessionLocal() as db:
        sess = db.query(AssessmentSession).filter(AssessmentSession.id == session_id).first()
        if sess:
            sess.start_time = datetime.now(timezone.utc) - timedelta(minutes=2)
            db.commit()

    r_batch = client.post(
        f"/engine/sessions/{session_id}/submit_all",
        json=payload,
        headers=headers,
    )
    assert r_batch.status_code == 200, r_batch.text
    return r_batch.json()["result"]


def _assert_parity(legacy_result, engine_result):
    # Remove internal keys that might differ
    legacy_keys = {k for k in legacy_result.keys() if not k.startswith("_")}
    engine_keys = {k for k in engine_result.keys() if not k.startswith("_")}
    
    assert legacy_keys == engine_keys
    for key in legacy_keys:
        assert legacy_result[key] == engine_result[key]


@pytest.mark.parametrize(
    "item_patterns,context_patterns",
    [
        (BASELINE_ITEM_SEQUENCE, BASELINE_CONTEXT_SEQUENCE),
        (NEAR_BOUNDARY_ITEM_SEQUENCE, BASELINE_CONTEXT_SEQUENCE),
        (TRUNCATION_ITEM_SEQUENCE, REPEATED_CONTEXT_SEQUENCE),
    ],
)
def test_engine_and_legacy_batch_submit_match(client, item_patterns, context_patterns):
    payload = _build_batch_payload(item_patterns, context_patterns)
    legacy_result = _legacy_submit_all(client, payload)
    engine_result = _engine_submit_all(client, payload)
    _assert_parity(legacy_result, engine_result)


def test_near_boundary_anomalies_match(client):
    payload = _build_batch_payload(NEAR_BOUNDARY_ITEM_SEQUENCE, BASELINE_CONTEXT_SEQUENCE)
    legacy_result = _legacy_submit_all(client, payload)
    engine_result = _engine_submit_all(client, payload)
    _assert_parity(legacy_result, engine_result)
    acce_value = legacy_result["ACCE"]
    assert acce_value in (5, 6, 14, 15)
    anomalies = legacy_result["validation"].get("anomalies", [])
    assert "NEAR_STYLE_BOUNDARY" in anomalies
    assert anomalies == engine_result["validation"].get("anomalies", [])


def test_truncation_and_lfi_anomalies_match(client):
    payload = _build_batch_payload(TRUNCATION_ITEM_SEQUENCE, REPEATED_CONTEXT_SEQUENCE)
    legacy_result = _legacy_submit_all(client, payload)
    engine_result = _engine_submit_all(client, payload)
    _assert_parity(legacy_result, engine_result)
    percentile_sources = legacy_result["percentile_sources"]
    assert percentile_sources["CE"]["truncated"] is True
    anomalies = legacy_result["validation"].get("anomalies", [])
    assert "RAW_OUTSIDE_NORM_RANGE" in anomalies
    assert "HIGH_W_UNIFORMITY" in anomalies
    assert "LFI_REPEATED_PATTERN_7PLUS" in anomalies
    assert anomalies == engine_result["validation"].get("anomalies", [])