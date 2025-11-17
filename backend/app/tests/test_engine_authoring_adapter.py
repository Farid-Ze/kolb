import uuid

from app.core.config import settings
from app.instruments.klsi4.plugin import KLSI4Plugin
from app.models.klsi.assessment import AssessmentSession
from app.models.klsi.enums import SessionStatus
from app.models.klsi.user import User


def _create_session(db) -> AssessmentSession:
    user = User(full_name="Adapter Tester", email=f"authoring-{uuid.uuid4()}@example.com")
    db.add(user)
    db.flush()
    session = AssessmentSession(
        user_id=user.id,
        assessment_id="KLSI",
        assessment_version="4.0",
        status=SessionStatus.started,
    )
    db.add(session)
    db.flush()
    return session


def test_fetch_items_matches_legacy_payload(monkeypatch, session):
    plugin = KLSI4Plugin()
    assessment_session = _create_session(session)

    monkeypatch.setattr(settings, "engine_authoring_items_enabled", False)
    legacy_payload = plugin.fetch_items(session, assessment_session.id)

    monkeypatch.setattr(settings, "engine_authoring_items_enabled", True)
    authoring_payload = plugin.fetch_items(session, assessment_session.id)

    assert authoring_payload == legacy_payload
