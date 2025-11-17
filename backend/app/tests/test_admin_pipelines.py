from __future__ import annotations

from typing import Dict

from sqlalchemy import select

from app.db.database import SessionLocal
from app.models.klsi.instrument import Instrument, ScoringPipeline, ScoringPipelineNode
from app.models.klsi.user import User
from app.services.security import create_access_token


def _create_user(role: str, email: str) -> User:
    with SessionLocal() as db:
        user = User(full_name="Admin User", email=email, role=role)
        db.add(user)
        db.commit()
        db.refresh(user)
        return user


def _auth_header(user: User) -> Dict[str, str]:
    token = create_access_token(str(user.id))
    return {"Authorization": f"Bearer {token}"}


def test_pipelines_requires_auth(client):
    response = client.get("/admin/instruments/KLSI/pipelines")
    assert response.status_code == 401


def test_pipelines_requires_mediator_role(client):
    user = _create_user("MAHASISWA", "student@example.com")
    response = client.get(
        "/admin/instruments/KLSI/pipelines",
        headers=_auth_header(user),
    )
    assert response.status_code == 403


def test_pipelines_returns_pipeline_graph(client):
    mediator = _create_user("MEDIATOR", "mediator@example.com")
    response = client.get(
        "/admin/instruments/KLSI/pipelines",
        headers=_auth_header(mediator),
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["instrument"]["code"] == "KLSI"
    assert payload["pipelines"]
    default_pipeline = payload["pipelines"][0]
    assert default_pipeline["version"] == "v1"
    assert default_pipeline["pipeline_code"] == "KLSI4.0"
    assert len(default_pipeline["nodes"]) >= 5
    first_node = default_pipeline["nodes"][0]
    assert first_node["node_key"] == "compute_raw_scale_scores"
    assert first_node["order"] == 1


def test_activate_pipeline_requires_mediator(client):
    mediator = _create_user("MEDIATOR", "mediator-activate@example.com")
    response = client.post(
        "/admin/instruments/KLSI/pipelines/999/activate",
        headers=_auth_header(mediator),
    )
    assert response.status_code == 404

    mahasiswa = _create_user("MAHASISWA", "student-activate@example.com")
    response = client.post(
        "/admin/instruments/KLSI/pipelines/1/activate",
        headers=_auth_header(mahasiswa),
    )
    assert response.status_code == 403


def _default_pipeline() -> tuple[ScoringPipeline, str]:
    with SessionLocal() as db:
        row = db.execute(
            select(ScoringPipeline, Instrument.code)
            .join(Instrument, ScoringPipeline.instrument_id == Instrument.id)
            .order_by(ScoringPipeline.id.asc())
        ).first()
        if not row:
            raise AssertionError("Pipeline table empty")
        pipeline, code = row
        db.expunge(pipeline)
        return pipeline, code


def _clone_pipeline_via_api(client, mediator: User, version: str = "v2") -> Dict:
    pipeline, instrument_code = _default_pipeline()
    response = client.post(
        f"/admin/instruments/{instrument_code}/pipelines/{pipeline.id}/clone",
        headers=_auth_header(mediator),
        json={
            "version": version,
            "pipeline_code": pipeline.pipeline_code,
            "description": "Experimental pipeline",
        },
    )
    assert response.status_code == 200, response.text
    return response.json()


def test_activate_pipeline_switches_active(client):
    mediator = _create_user("MEDIATOR", "mediator-switch@example.com")
    clone_payload = _clone_pipeline_via_api(client, mediator)
    variant_id = clone_payload["pipeline"]["id"]

    response = client.post(
        f"/admin/instruments/KLSI/pipelines/{variant_id}/activate",
        headers=_auth_header(mediator),
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["pipeline"]["is_active"] is True

    with SessionLocal() as db:
        active_ids = [
            row.id
            for row in db.query(ScoringPipeline)
            .filter(ScoringPipeline.is_active.is_(True))
            .all()
        ]
    assert variant_id in active_ids
    assert len(active_ids) == 1


def test_clone_pipeline_requires_mediator(client):
    student = _create_user("MAHASISWA", "student-clone@example.com")
    pipeline, instrument_code = _default_pipeline()
    response = client.post(
        f"/admin/instruments/{instrument_code}/pipelines/{pipeline.id}/clone",
        headers=_auth_header(student),
        json={"version": "v9"},
    )
    assert response.status_code == 403


def test_clone_pipeline_copies_nodes(client):
    mediator = _create_user("MEDIATOR", "mediator-clone@example.com")
    pipeline, instrument_code = _default_pipeline()

    response = client.post(
        f"/admin/instruments/{instrument_code}/pipelines/{pipeline.id}/clone",
        headers=_auth_header(mediator),
        json={
            "version": "v99",
            "metadata": {"strategy_code": "EXPERIMENT"},
        },
    )
    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload["pipeline"]["version"] == "v99"
    assert payload["pipeline"]["metadata"] == {"strategy_code": "EXPERIMENT"}

    new_pipeline_id = payload["pipeline"]["id"]
    with SessionLocal() as db:
        original_count = db.query(ScoringPipelineNode).filter(
            ScoringPipelineNode.pipeline_id == pipeline.id
        ).count()
        cloned_count = db.query(ScoringPipelineNode).filter(
            ScoringPipelineNode.pipeline_id == new_pipeline_id
        ).count()
        assert cloned_count == original_count


def test_clone_pipeline_rejects_duplicate_version(client):
    mediator = _create_user("MEDIATOR", "mediator-dup@example.com")
    pipeline, instrument_code = _default_pipeline()

    duplicate = client.post(
        f"/admin/instruments/{instrument_code}/pipelines/{pipeline.id}/clone",
        headers=_auth_header(mediator),
        json={"version": pipeline.version},
    )
    assert duplicate.status_code == 409


def test_delete_pipeline_requires_mediator(client):
    student = _create_user("MAHASISWA", "student-delete@example.com")
    pipeline, instrument_code = _default_pipeline()
    response = client.delete(
        f"/admin/instruments/{instrument_code}/pipelines/{pipeline.id}",
        headers=_auth_header(student),
    )
    assert response.status_code == 403


def test_delete_pipeline_rejects_active(client):
    mediator = _create_user("MEDIATOR", "mediator-delete-active@example.com")
    pipeline, instrument_code = _default_pipeline()
    client.post(
        f"/admin/instruments/{instrument_code}/pipelines/{pipeline.id}/activate",
        headers=_auth_header(mediator),
    )
    response = client.delete(
        f"/admin/instruments/{instrument_code}/pipelines/{pipeline.id}",
        headers=_auth_header(mediator),
    )
    assert response.status_code == 409


def test_delete_pipeline_removes_clone(client):
    mediator = _create_user("MEDIATOR", "mediator-delete@example.com")
    clone_payload = _clone_pipeline_via_api(client, mediator, version="v77")
    clone_id = clone_payload["pipeline"]["id"]
    instrument_code = clone_payload["instrument"]["code"]

    response = client.delete(
        f"/admin/instruments/{instrument_code}/pipelines/{clone_id}",
        headers=_auth_header(mediator),
    )
    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload["deleted_pipeline_id"] == clone_id

    with SessionLocal() as db:
        exists = db.query(ScoringPipeline).filter(ScoringPipeline.id == clone_id).first()
        assert exists is None
        node_exists = db.query(ScoringPipelineNode).filter(ScoringPipelineNode.pipeline_id == clone_id).count()
        assert node_exists == 0
