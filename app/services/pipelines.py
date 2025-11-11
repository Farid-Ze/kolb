from __future__ import annotations

from typing import Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload

from app.models.klsi import Instrument, ScoringPipeline, ScoringPipelineNode


def _instrument_or_404(
    db: Session,
    instrument_code: str,
    instrument_version: Optional[str],
) -> Instrument:
    query = db.query(Instrument).filter(Instrument.code == instrument_code)
    if instrument_version:
        query = query.filter(Instrument.version == instrument_version)
    instrument = query.order_by(Instrument.version.desc()).first()
    if not instrument:
        raise HTTPException(status_code=404, detail="Instrumen tidak ditemukan")
    return instrument


def list_pipelines(
    db: Session,
    instrument_code: str,
    instrument_version: Optional[str] = None,
) -> dict:
    instrument = _instrument_or_404(db, instrument_code, instrument_version)

    pipelines = (
        db.query(ScoringPipeline)
        .options(joinedload(ScoringPipeline.nodes))
        .filter(ScoringPipeline.instrument_id == instrument.id)
        .order_by(ScoringPipeline.pipeline_code.asc(), ScoringPipeline.version.asc())
        .all()
    )

    payload = []
    for pipeline in pipelines:
        payload.append(
            {
                "id": pipeline.id,
                "pipeline_code": pipeline.pipeline_code,
                "version": pipeline.version,
                "description": pipeline.description,
                "is_active": pipeline.is_active,
                "metadata": pipeline.metadata_payload,
                "created_at": pipeline.created_at.isoformat() if pipeline.created_at else None,
                "nodes": [
                    {
                        "id": node.id,
                        "node_key": node.node_key,
                        "node_type": node.node_type,
                        "order": node.execution_order,
                        "config": node.config,
                        "next": node.next_node_key,
                        "is_terminal": node.is_terminal,
                        "created_at": node.created_at.isoformat() if node.created_at else None,
                    }
                    for node in sorted(pipeline.nodes, key=lambda n: n.execution_order)
                ],
            }
        )

    return {
        "instrument": {
            "id": instrument.id,
            "code": instrument.code,
            "version": instrument.version,
            "name": instrument.name,
        },
        "pipelines": payload,
    }


def activate_pipeline(
    db: Session,
    instrument_code: str,
    pipeline_id: int,
    *,
    instrument_version: Optional[str] = None,
) -> dict:
    instrument = _instrument_or_404(db, instrument_code, instrument_version)

    pipeline = (
        db.query(ScoringPipeline)
        .filter(
            ScoringPipeline.id == pipeline_id,
            ScoringPipeline.instrument_id == instrument.id,
        )
        .first()
    )
    if not pipeline:
        raise HTTPException(status_code=404, detail="Pipeline tidak ditemukan")

    db.query(ScoringPipeline).filter(
        ScoringPipeline.instrument_id == instrument.id,
        ScoringPipeline.id != pipeline.id,
    ).update({"is_active": False}, synchronize_session=False)

    pipeline.is_active = True
    db.commit()
    db.refresh(pipeline)

    return {
        "instrument": {
            "id": instrument.id,
            "code": instrument.code,
            "version": instrument.version,
        },
        "pipeline": {
            "id": pipeline.id,
            "pipeline_code": pipeline.pipeline_code,
            "version": pipeline.version,
            "is_active": pipeline.is_active,
        },
    }


def clone_pipeline(
    db: Session,
    instrument_code: str,
    pipeline_id: int,
    *,
    instrument_version: Optional[str] = None,
    new_pipeline_code: Optional[str] = None,
    new_version: str,
    description: Optional[str] = None,
    metadata_override: Optional[dict] = None,
) -> dict:
    instrument = _instrument_or_404(db, instrument_code, instrument_version)

    source = (
        db.query(ScoringPipeline)
        .options(joinedload(ScoringPipeline.nodes))
        .filter(
            ScoringPipeline.id == pipeline_id,
            ScoringPipeline.instrument_id == instrument.id,
        )
        .first()
    )
    if not source:
        raise HTTPException(status_code=404, detail="Pipeline tidak ditemukan")

    candidate_code = new_pipeline_code or source.pipeline_code
    existing = (
        db.query(ScoringPipeline)
        .filter(
            ScoringPipeline.instrument_id == instrument.id,
            ScoringPipeline.pipeline_code == candidate_code,
            ScoringPipeline.version == new_version,
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=409, detail="Versi pipeline sudah ada")

    cloned = ScoringPipeline(
        instrument_id=instrument.id,
        pipeline_code=candidate_code,
        version=new_version,
        description=description or source.description,
        is_active=False,
        metadata_payload=metadata_override if metadata_override is not None else source.metadata_payload,
    )
    db.add(cloned)
    db.flush()

    for node in sorted(source.nodes, key=lambda n: n.execution_order):
        db.add(
            ScoringPipelineNode(
                pipeline_id=cloned.id,
                node_key=node.node_key,
                node_type=node.node_type,
                execution_order=node.execution_order,
                config=node.config,
                next_node_key=node.next_node_key,
                is_terminal=node.is_terminal,
            )
        )

    db.commit()
    db.refresh(cloned)

    return {
        "instrument": {
            "id": instrument.id,
            "code": instrument.code,
            "version": instrument.version,
        },
        "pipeline": {
            "id": cloned.id,
            "pipeline_code": cloned.pipeline_code,
            "version": cloned.version,
            "description": cloned.description,
            "is_active": cloned.is_active,
            "metadata": cloned.metadata_payload,
        },
    }
