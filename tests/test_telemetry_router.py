from app.core.metrics import get_counters, metrics_registry


def test_guide_open_increments_counters(client):
    metrics_registry.reset()
    payload = {
        "guide_id": "student_profile",
        "language": "en",
        "surface": "modal",
    }
    response = client.post("/telemetry/guide-open", json=payload)
    assert response.status_code == 202
    assert response.json()["ok"] is True

    counters = get_counters()
    assert counters["guides.open.total"] == 1
    assert counters["guides.open.guide.student_profile"] == 1
    assert counters["guides.open.surface.modal"] == 1
    assert counters["guides.open.lang.en"] == 1

    # Reset to avoid leaking state into other tests
    metrics_registry.reset()
