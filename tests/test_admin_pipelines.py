from __future__ import annotations

from typing import Dict

from app.db.database import SessionLocal
from app.models.klsi import (
    ScoringPipeline,
    ScoringPipelineNode,
    User,
)
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


def _ensure_pipeline_variant() -> ScoringPipeline:
    with SessionLocal() as db:
        instrument = db.query(ScoringPipeline.instrument_id, ScoringPipeline.pipeline_code).first()
        if instrument is None:
            raise AssertionError("Default pipeline missing")
        existing = db.query(ScoringPipeline).filter(ScoringPipeline.version == "v2").first()
        if existing:
            return existing

        reference_pipeline = db.query(ScoringPipeline).first()
        if reference_pipeline is None:
            raise AssertionError("Pipeline table empty")

        variant = ScoringPipeline(
            instrument_id=reference_pipeline.instrument_id,
            pipeline_code=reference_pipeline.pipeline_code,
            version="v2",
            description="Experimental pipeline",
            is_active=False,
            metadata_payload=reference_pipeline.metadata_payload,
        )
        db.add(variant)
        db.flush()

        for node in reference_pipeline.nodes:
            db.add(
                ScoringPipelineNode(
                    pipeline_id=variant.id,
                    node_key=node.node_key,
                    node_type=node.node_type,
                    execution_order=node.execution_order,
                    config=node.config,
                    next_node_key=node.next_node_key,
                    is_terminal=node.is_terminal,
                )
            )
        db.commit()
        db.refresh(variant)
        return variant


def test_activate_pipeline_switches_active(client):
    mediator = _create_user("MEDIATOR", "mediator-switch@example.com")
    variant = _ensure_pipeline_variant()

    response = client.post(
        f"/admin/instruments/KLSI/pipelines/{variant.id}/activate",
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
    assert variant.id in active_ids
    assert len(active_ids) == 1
