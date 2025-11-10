from uuid import uuid4

from app.db.database import SessionLocal
from app.models.klsi import AssessmentSession, SessionStatus, User
from app.services.scoring import CONTEXT_NAMES
from app.services.security import create_access_token


def _create_user() -> tuple[User, str]:
    with SessionLocal() as db:
        email = f"engine_{uuid4().hex}@mahasiswa.unikom.ac.id"
        user = User(full_name="Engine Tester", email=email, role="MAHASISWA")
        db.add(user)
        db.commit()
        db.refresh(user)
    token = create_access_token(subject=str(user.id))
    return user, token


def _ensure_mediator() -> tuple[User, str]:
    with SessionLocal() as db:
        email = f"mediator_{uuid4().hex}@mahasiswa.unikom.ac.id"
        mediator = User(full_name="Mediator", email=email, role="MEDIATOR")
        db.add(mediator)
        db.commit()
        db.refresh(mediator)
    token = create_access_token(subject=str(mediator.id))
    return mediator, token


def test_engine_klsi_end_to_end(client):
    user, token = _create_user()
    headers = {"Authorization": f"Bearer {token}"}

    # Start session via engine runtime
    r_start = client.post(
        "/engine/sessions/start",
        json={"instrument_code": "KLSI"},
        headers=headers,
    )
    assert r_start.status_code == 200, r_start.text
    session_id = r_start.json()["session_id"]

    # Fetch delivery package (items + delivery metadata)
    r_delivery = client.get(f"/engine/sessions/{session_id}/delivery", headers=headers)
    assert r_delivery.status_code == 200, r_delivery.text
    delivery = r_delivery.json()
    items = delivery["items"]
    assert len(items) == 12

    # Submit forced-choice ranks for each learning style item
    for item in items:
        ranks = {option["id"]: idx + 1 for idx, option in enumerate(item["options"])}
        r_submit = client.post(
            f"/engine/sessions/{session_id}/interactions",
            json={
                "kind": "item",
                "item_id": item["id"],
                "ranks": ranks,
            },
            headers=headers,
        )
        assert r_submit.status_code == 200, r_submit.text
        assert r_submit.json()["ok"] is True

    # Submit context rankings for Learning Flexibility Index
    base_ranks = [1, 2, 3, 4]
    for idx, context_name in enumerate(CONTEXT_NAMES):
        # Rotate ranks to avoid identical patterns (still valid permutation)
        rotated = base_ranks[idx % 4 :] + base_ranks[: idx % 4]
        payload = {
            "kind": "context",
            "context_name": context_name,
            "CE": rotated[0],
            "RO": rotated[1],
            "AC": rotated[2],
            "AE": rotated[3],
        }
        r_ctx = client.post(
            f"/engine/sessions/{session_id}/interactions",
            json=payload,
            headers=headers,
        )
        assert r_ctx.status_code == 200, r_ctx.text
        assert r_ctx.json()["ok"] is True

    # Finalize session and ensure scoring artifacts are returned
    r_finalize = client.post(f"/engine/sessions/{session_id}/finalize", headers=headers)
    assert r_finalize.status_code == 200, r_finalize.text
    finalize_data = r_finalize.json()["result"]
    assert finalize_data["ACCE"] is not None
    assert finalize_data["AERO"] is not None
    assert finalize_data["LFI"] is not None
    assert finalize_data["percentile_sources"] is not None

    # Confirm session marked completed in database
    with SessionLocal() as db:
        sess = db.query(AssessmentSession).filter(AssessmentSession.id == session_id).first()
        assert sess is not None
        assert sess.status == SessionStatus.completed

    # Fetch report and validate core blocks present
    r_report = client.get(f"/engine/sessions/{session_id}/report", headers=headers)
    assert r_report.status_code == 200, r_report.text
    report = r_report.json()
    assert report["session_id"] == session_id
    assert report["raw"]["ACCE"] is not None
    assert report["percentiles"] is not None
    assert report["percentiles"]["per_scale_provenance"] is not None
    # Non-mediator viewer should not receive enhanced analytics
    assert report["enhanced_analytics"] is None


def test_engine_klsi_mediator_report_enhanced(client):
    user, token = _create_user()
    headers = {"Authorization": f"Bearer {token}"}

    r_start = client.post(
        "/engine/sessions/start",
        json={"instrument_code": "KLSI"},
        headers=headers,
    )
    session_id = r_start.json()["session_id"]

    delivery = client.get(f"/engine/sessions/{session_id}/delivery", headers=headers).json()
    for item in delivery["items"]:
        ranks = {option["id"]: idx + 1 for idx, option in enumerate(item["options"])}
        client.post(
            f"/engine/sessions/{session_id}/interactions",
            json={"kind": "item", "item_id": item["id"], "ranks": ranks},
            headers=headers,
        )

    base_ranks = [1, 2, 3, 4]
    for idx, context_name in enumerate(CONTEXT_NAMES):
        rotated = base_ranks[idx % 4 :] + base_ranks[: idx % 4]
        client.post(
            f"/engine/sessions/{session_id}/interactions",
            json={
                "kind": "context",
                "context_name": context_name,
                "CE": rotated[0],
                "RO": rotated[1],
                "AC": rotated[2],
                "AE": rotated[3],
            },
            headers=headers,
        )

    client.post(f"/engine/sessions/{session_id}/finalize", headers=headers)

    _, mediator_token = _ensure_mediator()
    mediator_headers = {"Authorization": f"Bearer {mediator_token}"}
    r_report = client.get(f"/engine/sessions/{session_id}/report", headers=mediator_headers)
    assert r_report.status_code == 200, r_report.text
    report = r_report.json()
    assert report["enhanced_analytics"] is not None
    assert report["percentiles"]["per_scale_provenance"] is not None
