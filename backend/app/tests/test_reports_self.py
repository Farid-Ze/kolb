from uuid import uuid4

from fastapi.testclient import TestClient

from app.db.database import SessionLocal
from app.models.klsi.enums import SessionStatus
from app.models.klsi.user import User
from app.services.scoring import finalize_session
from app.services.security import create_access_token
from app.tests.helpers import seed_complete_session


def _create_completed_session() -> tuple[int, int]:
    with SessionLocal() as db:
        email = f"student+{uuid4().hex}@example.com"
        session = seed_complete_session(db, user_email=email, user_name="Student Self")
        finalize_session(db, session.id)
        session.status = SessionStatus.completed
        db.commit()
        assert session.user_id is not None
        return session.id, session.user_id


def _create_completed_session_with_history() -> tuple[int, int, int]:
    with SessionLocal() as db:
        email = f"history+{uuid4().hex}@example.com"
        first = seed_complete_session(db, user_email=email, user_name="Student History")
        finalize_session(db, first.id)
        first.status = SessionStatus.completed
        db.commit()
        db.refresh(first)

        user = db.get(User, first.user_id)
        assert user is not None
        second = seed_complete_session(db, user=user)
        finalize_session(db, second.id)
        second.status = SessionStatus.completed
        db.commit()
        return second.id, user.id, first.id


def test_reports_self_requires_auth(client: TestClient):
    response = client.get("/reports/self")
    assert response.status_code == 401


def test_reports_self_returns_camel_case_summaries(client: TestClient):
    session_id, user_id = _create_completed_session()
    token = create_access_token(subject=str(user_id))

    response = client.get(
        "/reports/self",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200, response.text
    payload = response.json()
    assert isinstance(payload, list)
    assert payload, "Expected at least one summary entry"
    summary = payload[0]
    assert summary["sessionId"] == session_id
    assert "session_id" not in summary  # camelCase enforcement
    assert summary["generatedAt"]
    learning_style = summary.get("learningStyle")
    assert learning_style and learning_style.get("styleCode")
    assert learning_style.get("description")
    flexibility = summary.get("flexibility")
    assert flexibility and flexibility.get("lfiScore") is not None
    assert "longitudinal" in summary


def test_reports_self_includes_longitudinal_metrics_when_available(client: TestClient):
    session_id, user_id, previous_session_id = _create_completed_session_with_history()
    token = create_access_token(subject=str(user_id))

    response = client.get(
        "/reports/self",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200, response.text
    payload = response.json()
    summary = next(item for item in payload if item["sessionId"] == session_id)
    longitudinal = summary.get("longitudinal")
    assert longitudinal, "Expected longitudinal metrics for latest session"
    assert longitudinal["previousSessionId"] == previous_session_id
    assert longitudinal.get("deltaAcce") is not None
    assert longitudinal.get("timeElapsedDays") is not None
