import csv
from hashlib import sha256
from io import StringIO

from fastapi import APIRouter, Depends, File, Header, HTTPException, UploadFile
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.repositories import NormativeConversionRepository
from app.models.klsi.audit import AuditLog
from app.engine.norms.factory import (
    build_composite_norm_provider,
    clear_norm_db_cache,
    norm_cache_stats,
    external_cache_stats,
    get_external_provider,
    preload_cache_stats,
)
from app.assessments.klsi_v4.logic import clear_percentile_cache
from app.core.config import settings
from app.services.security import get_current_user
from app.services import pipelines as pipeline_service
from app.core.metrics import get_metrics, get_counters
from app.i18n.id_messages import AdminMessages, AuthorizationMessages

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
        raise HTTPException(status_code=403, detail=AuthorizationMessages.MEDIATOR_NORM_IMPORT_ONLY)
    fname = file.filename or ""
    if not fname.lower().endswith('.csv'):
        raise HTTPException(status_code=400, detail=AdminMessages.FILE_MUST_BE_CSV)
    norm_version = norm_version.strip() or "default"
    if not norm_group or len(norm_group.strip()) == 0:
        raise HTTPException(status_code=400, detail=AdminMessages.NORM_GROUP_REQUIRED)
    if len(norm_group) > 150:
        raise HTTPException(status_code=400, detail=AdminMessages.NORM_GROUP_MAX_LENGTH)
    if len(norm_version) > 40:
        raise HTTPException(status_code=400, detail=AdminMessages.NORM_VERSION_MAX_LENGTH)
    content = file.file.read().decode('utf-8')
    reader = csv.DictReader(StringIO(content))
    expected_cols = {"scale_name","raw_score","percentile"}
    if not reader.fieldnames or set(reader.fieldnames) != expected_cols:
        raise HTTPException(status_code=400, detail=AdminMessages.CSV_HEADER_INVALID)
    # Group rows by scale, sort by raw_score, then enforce monotonic increase
    scale_rows: dict[str, list[tuple[int, float]]] = {}
    for row in reader:
        try:
            scale_name = row['scale_name'].strip()
            raw_score = int(row['raw_score'])
            percentile = float(row['percentile'])
        except Exception:
            raise HTTPException(
                status_code=400,
                detail=AdminMessages.ROW_FORMAT_INVALID.format(row=row),
            ) from None
        scale_rows.setdefault(scale_name, []).append((raw_score, percentile))

    rows: list[tuple[str, int, float]] = []
    for scale_name, tuples in scale_rows.items():
        tuples.sort(key=lambda t: t[0])  # sort by raw_score
        last = None
        for raw_score, percentile in tuples:
            if last is not None and percentile < last:
                raise HTTPException(
                    status_code=400,
                    detail=AdminMessages.PERCENTILE_NOT_MONOTONIC.format(
                        scale_name=scale_name,
                        raw_score=raw_score,
                    ),
                )
            last = percentile
            rows.append((scale_name, raw_score, percentile))
    batch_hash = sha256(content.encode('utf-8')).hexdigest()
    norm_repo = NormativeConversionRepository(db)
    inserted = 0
    with db.begin():
        for scale_name, raw_score, percentile in rows:
            _, created = norm_repo.upsert(norm_group, norm_version, scale_name, raw_score, percentile)
            if created:
                inserted += 1
        db.add(AuditLog(actor=user.email, action=f'norm_import:{norm_group}:{norm_version}', payload_hash=batch_hash))
    # Invalidate in-process normative cache so subsequent lookups see fresh data
    try:
        provider = build_composite_norm_provider(db)
        if hasattr(provider, "_db_lookup"):
            clear_norm_db_cache(getattr(provider, "_db_lookup"))
            clear_percentile_cache()
    except Exception:
        # Non-fatal; cache will naturally evict eventually if invalidation fails
        pass
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
        raise HTTPException(
            status_code=403,
            detail=AuthorizationMessages.MEDIATOR_CACHE_STATS_ONLY,
        )
    provider = build_composite_norm_provider(db)
    stats = {}
    if hasattr(provider, "_db_lookup"):
        stats = norm_cache_stats(getattr(provider, "_db_lookup"))
    preload = preload_cache_stats()
    return {"cache": stats, "preload": preload}


@router.get("/norms/external-cache-stats")
def get_external_norm_cache_stats(
    db: Session = Depends(get_db),
    authorization: str | None = Header(default=None),
):
    """Statistik cache penyedia norma eksternal (Mediator only).

    Mengembalikan hit/miss, ukuran cache, TTL, dan metrik jaringan dasar.
    """
    user = get_current_user(authorization, db)
    if user.role != 'MEDIATOR':
        raise HTTPException(
            status_code=403,
            detail=AuthorizationMessages.MEDIATOR_EXTERNAL_CACHE_STATS_ONLY,
        )
    if not (settings.external_norms_enabled and settings.external_norms_base_url):
        return {"enabled": False, "message": AdminMessages.EXTERNAL_NORMS_DISABLED}
    stats = external_cache_stats()
    return {"external_cache": stats}


@router.get("/perf-metrics")
def get_perf_metrics(
    reset: bool = False,
    db: Session = Depends(get_db),
    authorization: str | None = Header(default=None),
):
    """Return lightweight performance metrics (Mediator only).

    Includes timing counters and norm provider cache stats.
    Use `reset=true` to clear counters after reading.
    """
    user = get_current_user(authorization, db)
    if user.role != 'MEDIATOR':
        raise HTTPException(
            status_code=403,
            detail=AuthorizationMessages.MEDIATOR_METRICS_ONLY,
        )
    timing = get_metrics(reset=reset)
    counters = get_counters(reset=reset)
    # Toggle visibility for ops
    from app.core.config import settings as _settings
    toggles = {
        "environment": _settings.environment,
        "disable_legacy_submission": _settings.disable_legacy_submission,
        "disable_legacy_router": _settings.disable_legacy_router,
        "legacy_sunset": _settings.legacy_sunset,
    }
    # Compose provider cache stats if available
    provider = build_composite_norm_provider(db)
    db_cache = {}
    if hasattr(provider, "_db_lookup"):
        db_cache = norm_cache_stats(getattr(provider, "_db_lookup"))
    ext_cache = external_cache_stats()
    preload = getattr(provider, "_preload_stats", preload_cache_stats())
    return {
        "timings": timing,
        "counters": counters,
        "norm_db_cache": db_cache,
        "external_norm_cache": ext_cache,
        "norm_preload": preload,
        "toggles": toggles,
    }


@router.get("/instruments/{instrument_code}/pipelines")
def list_instrument_pipelines(
    instrument_code: str,
    instrument_version: str | None = None,
    db: Session = Depends(get_db),
    authorization: str | None = Header(default=None),
):
    user = get_current_user(authorization, db)
    if user.role != "MEDIATOR":
        raise HTTPException(
            status_code=403,
            detail=AuthorizationMessages.MEDIATOR_PIPELINE_ACCESS_ONLY,
        )
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
        raise HTTPException(
            status_code=403,
            detail=AuthorizationMessages.MEDIATOR_PIPELINE_MUTATION_ONLY,
        )
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
        raise HTTPException(
            status_code=403,
            detail=AuthorizationMessages.MEDIATOR_PIPELINE_MUTATION_ONLY,
        )
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
        raise HTTPException(
            status_code=403,
            detail=AuthorizationMessages.MEDIATOR_PIPELINE_MUTATION_ONLY,
        )
    return pipeline_service.delete_pipeline(
        db,
        instrument_code,
        pipeline_id,
        instrument_version=instrument_version,
    )
