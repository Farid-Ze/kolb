from fastapi.testclient import TestClient
from uuid import uuid4

from app.db.database import SessionLocal
from app.models.klsi.enums import SessionStatus
from app.models.klsi.user import User
from app.services.scoring import finalize_session
from app.services.security import create_access_token
from app.tests.helpers import seed_complete_session


def _bootstrap_completed_session() -> tuple[int, int, int, str, str]:
    with SessionLocal() as db:
        unique_email = f"tester+{uuid4().hex}@example.com"
        session = seed_complete_session(db, user_email=unique_email, user_name="Tester Share")
        finalize_session(db, session.id)
        session.status = SessionStatus.completed
        owner_id = session.user_id
        assert owner_id is not None
        mediator_email = f"mediator+{uuid4().hex}@example.com"
        mediator = User(full_name="Mediator Share", email=mediator_email, role="MEDIATOR")
        db.add(mediator)
        db.commit()
        db.refresh(mediator)
        return session.id, owner_id, mediator.id, mediator.email, unique_email


def _create_mediator(email: str) -> tuple[int, str]:
    with SessionLocal() as db:
        mediator = User(full_name="Extra Mediator", email=email, role="MEDIATOR")
        db.add(mediator)
        db.commit()
        db.refresh(mediator)
        return mediator.id, mediator.email


def test_student_can_generate_share_link(client: TestClient):
    session_id, owner_id, mediator_id, mediator_email, owner_email = _bootstrap_completed_session()
    student_token = create_access_token(subject=str(owner_id))

    response = client.post(
        f"/reports/{session_id}/share",
        json={"mediator_email": mediator_email, "expires_in_hours": 24},
        headers={"Authorization": f"Bearer {student_token}"},
    )

    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload["mediatorEmail"] == mediator_email
    assert payload["sessionId"] == session_id
    assert isinstance(payload["shareToken"], str) and len(payload["shareToken"]) > 20
    assert payload["mediatorName"]


def test_shared_report_requires_intended_mediator(client: TestClient):
    session_id, owner_id, mediator_id, mediator_email, owner_email = _bootstrap_completed_session()
    student_token = create_access_token(subject=str(owner_id))

    share_resp = client.post(
        f"/reports/{session_id}/share",
        json={"mediator_email": mediator_email, "expires_in_hours": 4},
        headers={"Authorization": f"Bearer {student_token}"},
    )
    assert share_resp.status_code == 200
    share_token = share_resp.json()["shareToken"]

    mediator_token = create_access_token(subject=str(mediator_id))
    shared_report = client.get(
        f"/reports/shared/{share_token}",
        headers={"Authorization": f"Bearer {mediator_token}"},
    )
    assert shared_report.status_code == 200, shared_report.text
    report_payload = shared_report.json()
    assert report_payload["shareContext"]["mediatorEmail"] == mediator_email
    assert report_payload["shareContext"]["ownerEmail"] == owner_email
    assert report_payload["responsibleUseNotice"]

    # Alternate mediator should receive 403
    other_id, other_email = _create_mediator("other.mediator@example.com")
    other_token = create_access_token(subject=str(other_id))
    forbidden = client.get(
        f"/reports/shared/{share_token}",
        headers={"Authorization": f"Bearer {other_token}"},
    )
    assert forbidden.status_code == 403
