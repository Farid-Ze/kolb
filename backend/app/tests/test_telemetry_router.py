from datetime import datetime, timezone

from app.core.metrics import get_counters, metrics_registry
from app.main import app
from app.models.klsi.assessment import AssessmentSession
from app.models.klsi.enums import SessionStatus
from app.models.klsi.items import AssessmentItemResponse
from app.models.klsi.user import User
from app.services.security import get_current_user


def setup_function():
    metrics_registry.reset()


def teardown_function():
    metrics_registry.reset()


def test_guide_open_increments_counters(client):
    payload = {
        "guide_id": "student_profile",
        "language": "en",
        "surface": "modal",
        "context": "assessment_start",
        "consent": True,
    }
    response = client.post("/telemetry/guide-open", json=payload)
    assert response.status_code == 202
    assert response.json()["ok"] is True

    counters = get_counters()
    assert counters["guides.open.total"] == 1
    assert counters["guides.open.guide.student_profile"] == 1
    assert counters["guides.open.surface.modal"] == 1
    assert counters["guides.open.lang.en"] == 1
    assert counters["guides.open.context.assessment_start"] == 1
    assert counters["guides.open.consent.granted"] == 1


def test_page_view_tracks_locale_and_consent(client):
    payload = {
        "page_path": "/report/123",
        "page_title": "Report",
        "referrer": "/assessment/complete",
        "locale": "id",
        "consent": True,
    }
    response = client.post("/telemetry/page-view", json=payload)
    assert response.status_code == 202
    counters = get_counters()
    assert counters["page.view.total"] == 1
    assert counters["page.view.path./report/123"] == 1
    assert counters["page.view.locale.id"] == 1
    assert counters["page.view.with_referrer"] == 1
    assert counters["page.view.consent.granted"] == 1


def test_action_event_counts_roles_and_consent(client):
    payload = {
        "action_type": "share",
        "action_target": "report",
        "action_value": "123",
        "metadata": {"channel": "link"},
        "consent": False,
        "actor_role": "MEDIATOR",
    }
    response = client.post("/telemetry/action", json=payload)
    assert response.status_code == 202
    counters = get_counters()
    assert counters["action.total"] == 1
    assert counters["action.type.share"] == 1
    assert counters["action.target.report"] == 1
    assert counters["action.consent.denied"] == 1
    assert counters["action.role.MEDIATOR"] == 1


def test_assessment_telemetry_updates_existing_response(client, session):
    user = User(full_name="Telemetry User", email="telemetry@example.com", nim="11112222", kelas="IF-01")
    session.add(user)
    session.commit()
    session.refresh(user)

    assessment_session = AssessmentSession(
        user_id=user.id,
        status=SessionStatus.started,
        start_time=datetime.now(timezone.utc),
    )
    session.add(assessment_session)
    session.commit()
    session.refresh(assessment_session)

    item_response = AssessmentItemResponse(
        session_id=assessment_session.id,
        item_id=1,
        response_rank=2,
        response_latency_ms=1000,
    )
    session.add(item_response)
    session.commit()
    session.refresh(item_response)

    app.dependency_overrides[get_current_user] = lambda: user

    payload = {
        "sessionId": str(assessment_session.id),
        "itemId": 1,
        "responseRank": 3,
        "responseLatencyMs": 8450,
        "blurEvents": 2,
        "meta": {"tabHiddenMs": 1200},
    }
    response = client.post("/telemetry/assessment", json=payload)
    assert response.status_code == 202
    assert response.json()["ok"] is True

    session.refresh(item_response)
    assert item_response.response_rank == 3
    assert item_response.response_latency_ms == 8450
    assert item_response.telemetry == {"blur_events": 2, "meta": {"tabHiddenMs": 1200}}

    app.dependency_overrides.pop(get_current_user, None)


def test_assessment_telemetry_rejects_foreign_session(client, session):
    owner = User(full_name="Owner", email="owner@example.com", nim="33334444", kelas="IF-02")
    outsider = User(full_name="Outsider", email="outsider@example.com", nim="55556666", kelas="IF-03")
    session.add_all([owner, outsider])
    session.commit()
    session.refresh(owner)
    session.refresh(outsider)

    assessment_session = AssessmentSession(
        user_id=owner.id,
        status=SessionStatus.started,
        start_time=datetime.now(timezone.utc),
    )
    session.add(assessment_session)
    session.commit()
    session.refresh(assessment_session)

    app.dependency_overrides[get_current_user] = lambda: outsider

    payload = {
        "sessionId": str(assessment_session.id),
        "itemId": 1,
        "responseRank": 2,
        "responseLatencyMs": 900,
    }
    response = client.post("/telemetry/assessment", json=payload)
    assert response.status_code == 403
    assert "detail" in response.json()

    app.dependency_overrides.pop(get_current_user, None)
