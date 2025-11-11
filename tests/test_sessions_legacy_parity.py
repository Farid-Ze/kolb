from __future__ import annotations

import pytest

# This test suite validated legacy /sessions/* parity.
# The Sessions router has been removed (breaking change in 0.2.0), so this file is retired.
pytest.skip("Legacy sessions router removed; tests retired. Use Engine endpoints tests instead.", allow_module_level=True)

from uuid import uuid4

from app.db.database import SessionLocal
from app.models.klsi import (
    AssessmentItem,
    AssessmentSession,
    ItemChoice,
    ItemType,
    LFIContextScore,
    SessionStatus,
    User,
)
from app.services.scoring import CONTEXT_NAMES
from app.services.security import create_access_token


def _create_user(role: str = "MAHASISWA") -> tuple[User, str]:
    with SessionLocal() as db:
        email = f"legacy_{role.lower()}_{uuid4().hex}@mahasiswa.unikom.ac.id"
        user = User(full_name=f"Legacy {role.title()}", email=email, role=role)
        db.add(user)
        db.commit()
        db.refresh(user)
    token = create_access_token(subject=str(user.id))
    return user, token


def _build_ranks() -> list[dict]:
    with SessionLocal() as db:
        items = (
            db.query(AssessmentItem)
            .filter(AssessmentItem.item_type == ItemType.learning_style)
            .order_by(AssessmentItem.item_number.asc())
            .all()
        )
        payloads: list[dict] = []
        for item in items:
            choices = (
                db.query(ItemChoice)
                .filter(ItemChoice.item_id == item.id)
                .order_by(ItemChoice.id.asc())
                .all()
            )
            ranks = {str(choice.id): idx + 1 for idx, choice in enumerate(choices)}
            payloads.append({"item_id": item.id, "ranks": ranks})
    return payloads


def test_legacy_sessions_finalize_includes_provenance(client):
    # Student starts session via legacy router
    _, student_token = _create_user()
    headers = {"Authorization": f"Bearer {student_token}"}

    r_start = client.post("/sessions/start", headers=headers)
    assert r_start.status_code == 200, r_start.text
    session_id = r_start.json()["session_id"]

    # Submit learning style items
    for payload in _build_ranks():
        r_submit = client.post(
            f"/sessions/{session_id}/submit_item",
            params={"item_id": payload["item_id"]},
            json=payload["ranks"],
            headers=headers,
        )
        assert r_submit.status_code == 200, r_submit.text

    base_ranks = [1, 2, 3, 4]
    for idx, context_name in enumerate(CONTEXT_NAMES):
        rotated = base_ranks[idx % 4 :] + base_ranks[: idx % 4]
        r_context = client.post(
            f"/sessions/{session_id}/submit_context",
            params={
                "context_name": context_name,
                "CE": rotated[0],
                "RO": rotated[1],
                "AC": rotated[2],
                "AE": rotated[3],
            },
            headers=headers,
        )
        assert r_context.status_code == 200, r_context.text

    r_finalize = client.post(f"/sessions/{session_id}/finalize", headers=headers)
    assert r_finalize.status_code == 200, r_finalize.text
    finalize_result = r_finalize.json()["result"]
    assert finalize_result["percentile_sources"] is not None
    assert finalize_result["override"] is False
    assert finalize_result["validation"]["ready"] is True

    with SessionLocal() as db:
        session_row = (
            db.query(AssessmentSession)
            .filter(AssessmentSession.id == session_id)
            .first()
        )
        assert session_row is not None
        assert session_row.status == SessionStatus.completed

    _, mediator_token = _create_user(role="MEDIATOR")
    mediator_headers = {"Authorization": f"Bearer {mediator_token}"}
    r_report = client.get(f"/reports/{session_id}", headers=mediator_headers)
    assert r_report.status_code == 200, r_report.text
    report = r_report.json()
    assert report["percentiles"]["per_scale_provenance"] is not None


def test_legacy_finalize_blocks_incomplete_session(client):
    _, student_token = _create_user()
    headers = {"Authorization": f"Bearer {student_token}"}

    r_start = client.post("/sessions/start", headers=headers)
    assert r_start.status_code == 200, r_start.text
    session_id = r_start.json()["session_id"]

    # Kirim hanya sebagian item (dua pertama) dan tidak mengirim konteks LFI
    partial_payloads = _build_ranks()[:2]
    for payload in partial_payloads:
        r_submit = client.post(
            f"/sessions/{session_id}/submit_item",
            params={"item_id": payload["item_id"]},
            json=payload["ranks"],
            headers=headers,
        )
        assert r_submit.status_code == 200

    r_finalize = client.post(f"/sessions/{session_id}/finalize", headers=headers)
    assert r_finalize.status_code == 400
    detail = r_finalize.json()["detail"]
    codes = {issue["code"] for issue in detail["issues"]}
    assert "ITEMS_INCOMPLETE" in codes
    assert "LFI_CONTEXT_COUNT" in codes


def test_legacy_finalize_blocks_invalid_lfi_ranks(client):
    _, student_token = _create_user()
    headers = {"Authorization": f"Bearer {student_token}"}

    r_start = client.post("/sessions/start", headers=headers)
    assert r_start.status_code == 200, r_start.text
    session_id = r_start.json()["session_id"]

    for payload in _build_ranks():
        r_submit = client.post(
            f"/sessions/{session_id}/submit_item",
            params={"item_id": payload["item_id"]},
            json=payload["ranks"],
            headers=headers,
        )
        assert r_submit.status_code == 200, r_submit.text

    with SessionLocal() as db:
        for idx, context_name in enumerate(CONTEXT_NAMES):
            ranks = [1, 2, 3, 4]
            if idx == len(CONTEXT_NAMES) - 1:
                ranks = [1, 1, 3, 4]  # duplicate rank to violate permutation rule
            db.add(
                LFIContextScore(
                    session_id=session_id,
                    context_name=context_name,
                    CE_rank=ranks[0],
                    RO_rank=ranks[1],
                    AC_rank=ranks[2],
                    AE_rank=ranks[3],
                )
            )
        db.commit()

    r_finalize = client.post(f"/sessions/{session_id}/finalize", headers=headers)
    assert r_finalize.status_code == 400, r_finalize.text
    detail = r_finalize.json()["detail"]
    codes = {issue["code"] for issue in detail["issues"]}
    assert "LFI_CONTEXT_RANK_INVALID" in codes
    diagnostics = detail.get("diagnostics", {})
    assert diagnostics.get("items", {}).get("ready_to_complete") is True


def test_legacy_submit_duplicate_context_rejected(client):
    _, student_token = _create_user()
    headers = {"Authorization": f"Bearer {student_token}"}

    r_start = client.post("/sessions/start", headers=headers)
    assert r_start.status_code == 200, r_start.text
    session_id = r_start.json()["session_id"]

    # Submit one context successfully
    r_first = client.post(
        f"/sessions/{session_id}/submit_context",
        params={
            "context_name": CONTEXT_NAMES[0],
            "CE": 1,
            "RO": 2,
            "AC": 3,
            "AE": 4,
        },
        headers=headers,
    )
    assert r_first.status_code == 200, r_first.text

    # Re-submit the same context should be rejected
    r_second = client.post(
        f"/sessions/{session_id}/submit_context",
        params={
            "context_name": CONTEXT_NAMES[0],
            "CE": 4,
            "RO": 3,
            "AC": 2,
            "AE": 1,
        },
        headers=headers,
    )
    assert r_second.status_code == 400
    assert "sudah dinilai" in r_second.text


def test_legacy_force_finalize_by_mediator(client):
    _, student_token = _create_user()
    headers = {"Authorization": f"Bearer {student_token}"}

    r_start = client.post("/sessions/start", headers=headers)
    session_id = r_start.json()["session_id"]

    # Only submit one item
    payload = _build_ranks()[0]
    client.post(
        f"/sessions/{session_id}/submit_item",
        params={"item_id": payload["item_id"]},
        json=payload["ranks"],
        headers=headers,
    )

    base_ranks = [1, 2, 3, 4]
    for idx, context_name in enumerate(CONTEXT_NAMES):
        rotated = base_ranks[idx % 4 :] + base_ranks[: idx % 4]
        client.post(
            f"/sessions/{session_id}/submit_context",
            params={
                "context_name": context_name,
                "CE": rotated[0],
                "RO": rotated[1],
                "AC": rotated[2],
                "AE": rotated[3],
            },
            headers=headers,
        )

    _, mediator_token = _create_user(role="MEDIATOR")
    mediator_headers = {"Authorization": f"Bearer {mediator_token}"}
    r_force = client.post(
        f"/sessions/{session_id}/force_finalize",
        json={"reason": "Urgent cohort report"},
        headers=mediator_headers,
    )
    assert r_force.status_code == 200, r_force.text
    result = r_force.json()["result"]
    assert result["override"] is True
    assert result["validation"]["ready"] is False
    codes = {issue["code"] for issue in result["validation"]["issues"]}
    assert "ITEMS_INCOMPLETE" in codes

    with SessionLocal() as db:
        sess = (
            db.query(AssessmentSession)
            .filter(AssessmentSession.id == session_id)
            .first()
        )
        assert sess is not None
        assert sess.status == SessionStatus.completed
