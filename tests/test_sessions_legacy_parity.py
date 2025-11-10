from __future__ import annotations

from uuid import uuid4

from app.db.database import SessionLocal
from app.models.klsi import AssessmentItem, AssessmentSession, ItemChoice, ItemType, SessionStatus, User
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
