from __future__ import annotations

from typing import Optional, TYPE_CHECKING

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.klsi import ScoringPipeline

if TYPE_CHECKING:  # pragma: no cover
    from app.models.klsi import AssessmentSession


def _compose_version(pipeline: ScoringPipeline) -> str:
    return f"{pipeline.pipeline_code}:{pipeline.version}"[:40]


def resolve_active_pipeline_version(
    db: Session,
    instrument_id: Optional[int],
    pipeline_code: Optional[str] = None,
) -> Optional[str]:
    if not instrument_id:
        return None

    base_stmt = (
        select(ScoringPipeline)
        .where(
            ScoringPipeline.instrument_id == instrument_id,
            ScoringPipeline.is_active.is_(True),
        )
    )

    if pipeline_code:
        preferred = (
            base_stmt.where(ScoringPipeline.pipeline_code == pipeline_code)
            .order_by(ScoringPipeline.version.desc())
        )
        pipeline = db.execute(preferred).scalars().first()
        if pipeline:
            return _compose_version(pipeline)

    fallback = base_stmt.order_by(
        ScoringPipeline.version.desc(), ScoringPipeline.pipeline_code.asc()
    )
    pipeline = db.execute(fallback).scalars().first()
    if pipeline:
        return _compose_version(pipeline)
    return None


def assign_pipeline_version(
    db: Session,
    session: "AssessmentSession",
    pipeline_code: Optional[str] = None,
    *,
    overwrite: bool = False,
) -> Optional[str]:
    if session.pipeline_version and not overwrite:
        return session.pipeline_version

    resolved = resolve_active_pipeline_version(db, session.instrument_id, pipeline_code)
    if resolved:
        session.pipeline_version = resolved
    return resolved
