from __future__ import annotations

from uuid import uuid4

from app.assessments.klsi_v4.definition import CONTEXT_NAMES
from app.db.database import SessionLocal
from app.i18n.id_messages import SessionErrorMessages
from app.models.klsi.assessment import AssessmentSession
from app.models.klsi.enums import ItemType, SessionStatus
from app.models.klsi.items import AssessmentItem, ItemChoice
from app.models.klsi.user import User
from app.services.security import create_access_token


def _create_user(role: str = "MAHASISWA") -> tuple[User, str]:
    with SessionLocal() as db:
        user = User(full_name=f"Test {role}", email=f"test_{uuid4().hex}@example.com", role=role)
        db.add(user)
        db.commit()
        db.refresh(user)
    return user, create_access_token(subject=str(user.id))


def _build_submission_payload() -> dict:
    with SessionLocal() as db:
        items = (
            db.query(AssessmentItem)
            .filter(AssessmentItem.item_type == ItemType.learning_style)
            .order_by(AssessmentItem.item_number.asc())
            .all()
        )
        payload_items: list[dict] = []
        for item in items:
            choices = (
                db.query(ItemChoice)
                .filter(ItemChoice.item_id == item.id)
                .order_by(ItemChoice.id.asc())
                .all()
            )
            payload_items.append(
                {
                    "item_id": item.id,
                    "ranks": {int(choice.id): idx + 1 for idx, choice in enumerate(choices)},
                }
            )

    base = [1, 2, 3, 4]
    contexts = []
    for idx, context_name in enumerate(CONTEXT_NAMES):
        rotation = base[idx % 4 :] + base[: idx % 4]
        contexts.append(
            {
                "context_name": context_name,
                "CE": rotation[0],
                "RO": rotation[1],
                "AC": rotation[2],
                "AE": rotation[3],
            }
        )

    return {"items": payload_items, "contexts": contexts}


def test_finalize_endpoint_is_idempotent(client):
    _, token = _create_user()
    headers = {"Authorization": f"Bearer {token}"}

    r_start = client.post(
        "/engine/sessions/start",
        headers=headers,
        json={"instrument_code": "KLSI", "instrument_version": "4.0"},
    )
    assert r_start.status_code == 200, r_start.text
    session_id = r_start.json()["session_id"]

    payload = _build_submission_payload()
    r_submit = client.post(
        f"/engine/sessions/{session_id}/submit_all",
        headers=headers,
        json=payload,
    )
    assert r_submit.status_code == 200, r_submit.text

    r_finalize_again = client.post(f"/engine/sessions/{session_id}/finalize", headers=headers)
    assert r_finalize_again.status_code == 409
    payload_detail = r_finalize_again.json()
    assert payload_detail["detail"]["message"] == SessionErrorMessages.ALREADY_COMPLETED
    assert payload_detail["error"] == "session_finalized"

    with SessionLocal() as db:
        sess = (
            db.query(AssessmentSession)
            .filter(AssessmentSession.id == session_id)
            .first()
        )
        assert sess is not None
        assert sess.status == SessionStatus.completed
