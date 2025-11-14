from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING, Any, Optional, Protocol

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.klsi.instrument import ScoringPipeline

if TYPE_CHECKING:  # pragma: no cover
    from app.models.klsi.assessment import AssessmentSession


__all__ = [
    "PipelineStage",
    "PipelineDefinition",
    "resolve_active_pipeline_version",
    "assign_pipeline_version",
    "get_klsi_pipeline_definition",
]


class PipelineStage(Protocol):
    """Protocol for pipeline stage callables.
    
    Each stage is a callable that takes db and session_id and returns a result dict.
    """
    
    def __call__(self, db: Session, session_id: int) -> dict[str, Any]:
        """Execute pipeline stage.
        
        Args:
            db: Database session.
            session_id: Assessment session ID.
            
        Returns:
            Result dictionary with stage outcomes.
        """
        ...


@dataclass(frozen=True, slots=True)
class PipelineDefinition:
    """Declarative definition of a scoring pipeline.
    
    A pipeline is an ordered sequence of stages that execute sequentially.
    Each stage is a callable that processes the assessment session.
    
    Attributes:
        code: Pipeline code identifier (e.g., "KLSI_STANDARD").
        version: Pipeline version string (e.g., "1.0").
        stages: Ordered sequence of stage callables.
        description: Human-readable description.
        
    Example:
        >>> from app.assessments.klsi_v4.logic import (
        ...     compute_raw_scale_scores,
        ...     compute_combination_scores,
        ...     assign_learning_style,
        ...     compute_lfi,
        ... )
        >>> pipeline = PipelineDefinition(
        ...     code="KLSI_STANDARD",
        ...     version="1.0",
        ...     stages=(
        ...         compute_raw_scale_scores,
        ...         compute_combination_scores,
        ...         assign_learning_style,
        ...         compute_lfi,
        ...     ),
        ...     description="Standard KLSI 4.0 pipeline"
        ... )
    """
    
    code: str
    version: str
    stages: tuple[PipelineStage, ...]
    description: str = ""
    
    def execute(self, db: Session, session_id: int) -> dict[str, Any]:
        """Execute all pipeline stages sequentially.
        
        Args:
            db: Database session.
            session_id: Assessment session ID.
            
        Returns:
            Merged results from all stages.
            
        Raises:
            Exception: If any stage fails.
        """
        results: dict[str, Any] = {"ok": True, "stages_completed": []}
        
        for stage in self.stages:
            stage_name = getattr(stage, "__name__", str(stage))
            try:
                stage_result = stage(db, session_id)
                if isinstance(stage_result, dict):
                    # Merge stage results, preserving previous results
                    for key, value in stage_result.items():
                        if key not in results:
                            results[key] = value
                results["stages_completed"].append(stage_name)
            except Exception as exc:
                results["ok"] = False
                results["failed_stage"] = stage_name
                results["error"] = str(exc)
                raise
        
        return results


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


def get_klsi_pipeline_definition() -> PipelineDefinition:
    """Get the declarative pipeline definition for KLSI 4.0.
    
    This function lazily imports the KLSI stages to avoid circular dependencies.
    The pipeline stages are defined in assessment-specific logic modules.
    
    Returns:
        Declarative pipeline definition with ordered stages.
        
    Pipeline stages:
        1. compute_raw_scale_scores: Sum raw ranks per learning mode
        2. compute_combination_scores: Compute dialectic (ACCE, AERO) and balance scores
        3. assign_learning_style: Assign primary learning style from 3×3 grid
        4. compute_lfi: Compute Learning Flexibility Index (Kendall's W)
        5. apply_percentiles: Convert raw scores to percentiles via norm tables
    """
    # Lazy import to avoid circular dependencies
    from app.assessments.klsi_v4.logic import (
        assign_learning_style,
        compute_combination_scores,
        compute_lfi,
        compute_raw_scale_scores,
    )
    
    # Note: apply_percentiles is handled separately in finalize logic
    # as it requires norm provider access
    
    return PipelineDefinition(
        code="KLSI_STANDARD",
        version="4.0",
        stages=(
            compute_raw_scale_scores,
            compute_combination_scores,
            assign_learning_style,
            compute_lfi,
        ),
        description=(
            "Standard KLSI 4.0 scoring pipeline: "
            "raw scales → combinations → style assignment → LFI"
        ),
    )
