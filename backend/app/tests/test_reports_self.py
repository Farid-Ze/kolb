from __future__ import annotations

from uuid import uuid4

from fastapi.testclient import TestClient

from app.db.database import SessionLocal
from app.models.klsi.enums import SessionStatus
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
        return session.id, session.user_id


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
    flexibility = summary.get("flexibility")
    assert flexibility and flexibility.get("lfiScore") is not None
