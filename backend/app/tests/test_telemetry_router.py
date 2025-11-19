from app.core.metrics import get_counters, metrics_registry


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
