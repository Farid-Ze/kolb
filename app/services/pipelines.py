from __future__ import annotations

from typing import Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.db.repositories import InstrumentRepository, PipelineRepository
from app.models.klsi import Instrument


def _instrument_or_404(
    db: Session,
    instrument_code: str,
    instrument_version: Optional[str],
) -> Instrument:
    instrument_repo = InstrumentRepository(db)
    instrument = instrument_repo.get_by_code(instrument_code, instrument_version)
    if not instrument:
        raise HTTPException(status_code=404, detail="Instrumen tidak ditemukan")
    return instrument


def list_pipelines(
    db: Session,
    instrument_code: str,
    instrument_version: Optional[str] = None,
) -> dict:
    instrument = _instrument_or_404(db, instrument_code, instrument_version)

    pipeline_repo = PipelineRepository(db)
    pipelines = pipeline_repo.list_with_nodes(instrument.id)

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

    pipeline_repo = PipelineRepository(db)
    pipeline = pipeline_repo.get(pipeline_id, instrument.id)
    if not pipeline:
        raise HTTPException(status_code=404, detail="Pipeline tidak ditemukan")

    try:
        pipeline_repo.deactivate_all_except(instrument.id, pipeline.id)
        pipeline.is_active = True
        db.commit()
        db.refresh(pipeline)
    except Exception:
        db.rollback()
        raise

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

    pipeline_repo = PipelineRepository(db)
    source = pipeline_repo.get(pipeline_id, instrument.id, with_nodes=True)
    if not source:
        raise HTTPException(status_code=404, detail="Pipeline tidak ditemukan")

    candidate_code = new_pipeline_code or source.pipeline_code
    if pipeline_repo.exists_version(instrument.id, candidate_code, new_version):
        raise HTTPException(status_code=409, detail="Versi pipeline sudah ada")

    try:
        cloned = pipeline_repo.clone(
            source,
            instrument_id=instrument.id,
            pipeline_code=candidate_code,
            version=new_version,
            description=description or source.description,
            is_active=False,
            metadata_payload=(
                metadata_override if metadata_override is not None else source.metadata_payload
            ),
        )
        db.commit()
        db.refresh(cloned)
    except Exception:
        db.rollback()
        raise

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


def delete_pipeline(
    db: Session,
    instrument_code: str,
    pipeline_id: int,
    *,
    instrument_version: Optional[str] = None,
) -> dict:
    instrument = _instrument_or_404(db, instrument_code, instrument_version)

    pipeline_repo = PipelineRepository(db)
    pipeline = pipeline_repo.get(pipeline_id, instrument.id)
    if not pipeline:
        raise HTTPException(status_code=404, detail="Pipeline tidak ditemukan")
    if pipeline.is_active:
        raise HTTPException(status_code=409, detail="Tidak dapat menghapus pipeline aktif")

    try:
        pipeline_repo.delete(pipeline)
        db.commit()
    except Exception:
        db.rollback()
        raise

    return {
        "instrument": {
            "id": instrument.id,
            "code": instrument.code,
            "version": instrument.version,
        },
        "deleted_pipeline_id": pipeline_id,
    }
