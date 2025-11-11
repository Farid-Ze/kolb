import csv
from hashlib import sha256
from io import StringIO

from fastapi import APIRouter, Depends, File, Header, HTTPException, UploadFile
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.klsi import AuditLog, NormativeConversionTable
from app.engine.norms.factory import build_composite_norm_provider, clear_norm_db_cache, norm_cache_stats
from app.services.security import get_current_user
from app.services import pipelines as pipeline_service

router = APIRouter(prefix="/admin", tags=["admin"])

@router.post("/norms/import")
def import_norms(
    norm_group: str,
    file: UploadFile = File(...),
    norm_version: str = "default",
    db: Session = Depends(get_db),
    authorization: str | None = Header(default=None),
):
    user = get_current_user(authorization, db)
    if user.role != 'MEDIATOR':
        raise HTTPException(status_code=403, detail="Hanya MEDIATOR yang boleh impor norma")
    fname = file.filename or ""
    if not fname.lower().endswith('.csv'):
        raise HTTPException(status_code=400, detail="File harus CSV")
    norm_version = norm_version.strip() or "default"
    if not norm_group or len(norm_group.strip()) == 0:
        raise HTTPException(status_code=400, detail="norm_group wajib diisi")
    if len(norm_group) > 150:
        raise HTTPException(status_code=400, detail="norm_group maksimal 150 karakter")
    if len(norm_version) > 40:
        raise HTTPException(status_code=400, detail="norm_version maksimal 40 karakter")
    content = file.file.read().decode('utf-8')
    reader = csv.DictReader(StringIO(content))
    expected_cols = {"scale_name","raw_score","percentile"}
    if not reader.fieldnames or set(reader.fieldnames) != expected_cols:
        raise HTTPException(status_code=400, detail="Header CSV harus scale_name,raw_score,percentile")
    # Group rows by scale, sort by raw_score, then enforce monotonic increase
    scale_rows: dict[str, list[tuple[int, float]]] = {}
    for row in reader:
        try:
            scale_name = row['scale_name'].strip()
            raw_score = int(row['raw_score'])
            percentile = float(row['percentile'])
        except Exception:
            raise HTTPException(status_code=400, detail=f"Format baris tidak valid: {row}") from None
        scale_rows.setdefault(scale_name, []).append((raw_score, percentile))

    rows: list[tuple[str, int, float]] = []
    for scale_name, tuples in scale_rows.items():
        tuples.sort(key=lambda t: t[0])  # sort by raw_score
        last = None
        for raw_score, percentile in tuples:
            if last is not None and percentile < last:
                raise HTTPException(status_code=400, detail=f"Percentile tidak monotonic untuk skala {scale_name} pada raw {raw_score}")
            last = percentile
            rows.append((scale_name, raw_score, percentile))
    batch_hash = sha256(content.encode('utf-8')).hexdigest()
    inserted = 0
    for scale_name, raw_score, percentile in rows:
        # Idempotent upsert: check existing
        existing = db.query(NormativeConversionTable).filter(
            NormativeConversionTable.norm_group==norm_group,
            NormativeConversionTable.norm_version==norm_version,
            NormativeConversionTable.scale_name==scale_name,
            NormativeConversionTable.raw_score==raw_score
        ).first()
        if existing:
            existing.percentile = percentile  # update if changed
        else:
            db.add(NormativeConversionTable(
                norm_group=norm_group,
                norm_version=norm_version,
                scale_name=scale_name,
                raw_score=raw_score,
                percentile=percentile,
            ))
            inserted += 1
    # Invalidate in-process normative cache so subsequent lookups see fresh data
    try:
        provider = build_composite_norm_provider(db)
        if hasattr(provider, "_db_lookup"):
            clear_norm_db_cache(getattr(provider, "_db_lookup"))
    except Exception:
        # Non-fatal; cache will naturally evict eventually if invalidation fails
        pass
    db.add(AuditLog(actor=user.email, action=f'norm_import:{norm_group}:{norm_version}', payload_hash=batch_hash))
    db.commit()
    return {
        "norm_group": norm_group,
        "norm_version": norm_version,
        "rows_inserted": inserted,
        "rows_processed": len(rows),
        "hash": batch_hash,
    }


@router.get("/norms/cache-stats")
def get_norm_cache_stats(
    db: Session = Depends(get_db),
    authorization: str | None = Header(default=None),
):
    """Return in-process normative DB lookup cache statistics (Mediator only)."""
    user = get_current_user(authorization, db)
    if user.role != 'MEDIATOR':
        raise HTTPException(status_code=403, detail="Hanya MEDIATOR yang boleh melihat statistik cache")
    provider = build_composite_norm_provider(db)
    stats = {}
    if hasattr(provider, "_db_lookup"):
        stats = norm_cache_stats(getattr(provider, "_db_lookup"))
    return {"cache": stats}


@router.get("/instruments/{instrument_code}/pipelines")
def list_instrument_pipelines(
    instrument_code: str,
    instrument_version: str | None = None,
    db: Session = Depends(get_db),
    authorization: str | None = Header(default=None),
):
    user = get_current_user(authorization, db)
    if user.role != "MEDIATOR":
        raise HTTPException(status_code=403, detail="Hanya MEDIATOR yang boleh mengakses pipeline")
    return pipeline_service.list_pipelines(db, instrument_code, instrument_version)


@router.post("/instruments/{instrument_code}/pipelines/{pipeline_id}/activate")
def activate_instrument_pipeline(
    instrument_code: str,
    pipeline_id: int,
    instrument_version: str | None = None,
    db: Session = Depends(get_db),
    authorization: str | None = Header(default=None),
):
    user = get_current_user(authorization, db)
    if user.role != "MEDIATOR":
        raise HTTPException(status_code=403, detail="Hanya MEDIATOR yang boleh mengubah pipeline")
    return pipeline_service.activate_pipeline(
        db,
        instrument_code,
        pipeline_id,
        instrument_version=instrument_version,
    )


class ClonePipelineRequest(BaseModel):
    version: str = Field(min_length=1, max_length=20)
    pipeline_code: str | None = Field(default=None, max_length=60)
    description: str | None = Field(default=None, max_length=500)
    metadata: dict | None = None


@router.post("/instruments/{instrument_code}/pipelines/{pipeline_id}/clone")
def clone_instrument_pipeline(
    instrument_code: str,
    pipeline_id: int,
    payload: ClonePipelineRequest,
    instrument_version: str | None = None,
    db: Session = Depends(get_db),
    authorization: str | None = Header(default=None),
):
    user = get_current_user(authorization, db)
    if user.role != "MEDIATOR":
        raise HTTPException(status_code=403, detail="Hanya MEDIATOR yang boleh mengubah pipeline")
    return pipeline_service.clone_pipeline(
        db,
        instrument_code,
        pipeline_id,
        instrument_version=instrument_version,
        new_pipeline_code=payload.pipeline_code,
        new_version=payload.version,
        description=payload.description,
        metadata_override=payload.metadata,
    )


@router.delete("/instruments/{instrument_code}/pipelines/{pipeline_id}")
def delete_instrument_pipeline(
    instrument_code: str,
    pipeline_id: int,
    instrument_version: str | None = None,
    db: Session = Depends(get_db),
    authorization: str | None = Header(default=None),
):
    user = get_current_user(authorization, db)
    if user.role != "MEDIATOR":
        raise HTTPException(status_code=403, detail="Hanya MEDIATOR yang boleh mengubah pipeline")
    return pipeline_service.delete_pipeline(
        db,
        instrument_code,
        pipeline_id,
        instrument_version=instrument_version,
    )
