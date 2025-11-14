from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING, Any, Optional, Protocol

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.klsi.instrument import ScoringPipeline
from app.models.klsi.learning import CombinationScore, ScaleScore

if TYPE_CHECKING:  # pragma: no cover
    from app.models.klsi.assessment import AssessmentSession
    from app.models.klsi.instrument import ScoringPipelineNode


def _require_scale_score(db: Session, session_id: int) -> ScaleScore:
    scale = (
        db.query(ScaleScore)
        .filter(ScaleScore.session_id == session_id)
        .one_or_none()
    )
    if not scale:
        raise ValueError(f"ScaleScore missing for session_id={session_id}")
    return scale


def _require_combination_score(db: Session, session_id: int) -> CombinationScore:
    combo = (
        db.query(CombinationScore)
        .filter(CombinationScore.session_id == session_id)
        .one_or_none()
    )
    if not combo:
        raise ValueError(f"CombinationScore missing for session_id={session_id}")
    return combo


def _stage_raw_scales(db: Session, session_id: int) -> dict[str, Any]:
    from app.assessments.klsi_v4.logic import compute_raw_scale_scores

    scale = compute_raw_scale_scores(db, session_id)
    return {
        "raw_modes": {
            "CE": scale.CE_raw,
            "RO": scale.RO_raw,
            "AC": scale.AC_raw,
            "AE": scale.AE_raw,
            "entity": scale,
        }
    }


def _stage_combinations(db: Session, session_id: int) -> dict[str, Any]:
    from app.assessments.klsi_v4.logic import compute_combination_scores

    scale = _require_scale_score(db, session_id)
    combo = compute_combination_scores(db, scale)
    return {
        "combination": {
            "ACCE": combo.ACCE_raw,
            "AERO": combo.AERO_raw,
            "assimilation_accommodation": combo.assimilation_accommodation,
            "converging_diverging": combo.converging_diverging,
            "balance_acce": combo.balance_acce,
            "balance_aero": combo.balance_aero,
            "entity": combo,
        }
    }


def _stage_style_assignment(db: Session, session_id: int) -> dict[str, Any]:
    from app.assessments.klsi_v4.logic import assign_learning_style

    combo = _require_combination_score(db, session_id)
    style, intensity = assign_learning_style(db, combo)
    return {
        "style": {
            "primary_style_type_id": style.primary_style_type_id,
            "ACCE": style.ACCE_raw,
            "AERO": style.AERO_raw,
            "intensity": intensity.as_dict(),
            "intensity_metrics": intensity,
            "entity": style,
        }
    }


def _stage_lfi(db: Session, session_id: int) -> dict[str, Any]:
    from app.assessments.klsi_v4.logic import compute_lfi

    lfi = compute_lfi(db, session_id)
    return {
        "lfi": {
            "score": lfi.LFI_score,
            "W": lfi.W_coefficient,
            "entity": lfi,
        }
    }


_stage_raw_scales.__name__ = "compute_raw_scale_scores"
_stage_combinations.__name__ = "compute_combination_scores"
_stage_style_assignment.__name__ = "assign_learning_style"
_stage_lfi.__name__ = "compute_lfi"


__all__ = [
    "PipelineStage",
    "PipelineDefinition",
    "resolve_active_pipeline_version",
    "assign_pipeline_version",
    "get_klsi_pipeline_definition",
    "resolve_klsi_pipeline_from_nodes",
    "execute_pipeline_streaming",
]


class PipelineStage(Protocol):
    """Protocol for pipeline stage callables returning context fragments."""

    def __call__(self, db: Session, session_id: int) -> dict[str, Any]:
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
    
    def execute_streaming(self, db: Session, session_id: int):
        """Execute pipeline stages as a generator for memory efficiency.
        
        Yields stage results one at a time instead of accumulating them.
        Useful for pipelines processing large datasets or when incremental
        progress reporting is needed.
        
        Args:
            db: Database session.
            session_id: Assessment session ID.
            
        Yields:
            Tuple of (stage_name, stage_result) for each completed stage.
            
        Raises:
            Exception: If any stage fails.
            
        Example:
            >>> pipeline = get_klsi_pipeline_definition()
            >>> for stage_name, result in pipeline.execute_streaming(db, session_id):
            ...     print(f"Completed: {stage_name}")
            ...     # Process result incrementally
        """
        for stage in self.stages:
            stage_name = getattr(stage, "__name__", str(stage))
            try:
                stage_result = stage(db, session_id)
                yield (stage_name, stage_result)
            except Exception as exc:
                # Yield error information before re-raising
                yield (stage_name, {"error": str(exc), "ok": False})
                raise


def execute_pipeline_streaming(
    pipeline: PipelineDefinition,
    db: Session,
    session_ids: list[int],
):
    """Execute pipeline for multiple sessions using generator pattern.
    
    Processes sessions one at a time to minimize memory footprint when
    batch processing large numbers of assessments.
    
    Args:
        pipeline: Pipeline definition to execute.
        db: Database session.
        session_ids: List of session IDs to process.
        
    Yields:
        Tuple of (session_id, result_dict) for each processed session.
        
    Example:
        >>> pipeline = get_klsi_pipeline_definition()
        >>> session_ids = [101, 102, 103]
        >>> for session_id, result in execute_pipeline_streaming(pipeline, db, session_ids):
        ...     if result["ok"]:
        ...         print(f"Session {session_id}: Success")
    """
    for session_id in session_ids:
        try:
            result = pipeline.execute(db, session_id)
            yield (session_id, result)
        except Exception as exc:
            yield (session_id, {"ok": False, "error": str(exc)})


def _get_klsi_stage_mapping() -> dict[str, PipelineStage]:
    """Return canonical mapping of KLSI pipeline node keys to stages.

    This helper is the single source of truth for mapping between
    declarative pipeline node keys (as stored in ``ScoringPipelineNode``)
    and the concrete callable implementations in KLSI logic.
    """

    return {
        "RAW_SCALES": _stage_raw_scales,
        "COMBINATIONS": _stage_combinations,
        "STYLE_ASSIGNMENT": _stage_style_assignment,
        "LFI": _stage_lfi,
    }


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
    
    Returns:
        Declarative pipeline definition with ordered stages.

    Pipeline stages:
        1. compute_raw_scale_scores: Sum raw ranks per learning mode
        2. compute_combination_scores: Compute dialectic (ACCE, AERO) and balance scores
        3. assign_learning_style: Assign primary learning style from 3×3 grid
        4. compute_lfi: Compute Learning Flexibility Index (Kendall's W)
    """

    mapping = _get_klsi_stage_mapping()
    ordered_keys = ["RAW_SCALES", "COMBINATIONS", "STYLE_ASSIGNMENT", "LFI"]
    stages: list[PipelineStage] = [mapping[key] for key in ordered_keys]

    return PipelineDefinition(
        code="KLSI_STANDARD",
        version="4.0",
        stages=tuple(stages),
        description=(
            "Standard KLSI 4.0 scoring pipeline: "
            "raw scales → combinations → style assignment → LFI"
        ),
    )


def resolve_klsi_pipeline_from_nodes(
    nodes: list["ScoringPipelineNode"],
) -> PipelineDefinition:
    """Resolve a KLSI pipeline definition from DB nodes.

    This function maps persisted pipeline nodes to the same ordered
    callable stages used by ``get_klsi_pipeline_definition``. It is
    intentionally conservative: unknown or unsupported node keys will
    raise ``ValueError`` rather than being ignored.

    Expected node_key values (ordered by ``execution_order``):

    - "RAW_SCALES"        → compute_raw_scale_scores
    - "COMBINATIONS"      → compute_combination_scores
    - "STYLE_ASSIGNMENT"  → assign_learning_style
    - "LFI"               → compute_lfi

    Percentiles are handled separately as part of norm resolution and
    are not currently modeled as a DB node.
    """

    # We type locally to avoid importing the full model at top level
    from app.models.klsi.instrument import ScoringPipelineNode  # type: ignore

    key_to_stage = _get_klsi_stage_mapping()

    if not nodes:
        raise ValueError("Pipeline has no nodes defined")

    # Ensure deterministic order from the DB-provided execution order
    ordered_nodes: list[ScoringPipelineNode] = sorted(
        nodes,
        key=lambda n: getattr(n, "execution_order", 0),
    )

    stages: list[PipelineStage] = []
    for node in ordered_nodes:
        key = getattr(node, "node_key", None)
        if not key:
            raise ValueError("Pipeline node missing node_key")
        try:
            stage = key_to_stage[key]
        except KeyError as exc:  # pragma: no cover - defensive branch
            raise ValueError(f"Unsupported pipeline node_key: {key}") from exc
        stages.append(stage)  # type: ignore[arg-type]

    # Compose a synthetic code/version label from the first node's pipeline
    pipeline = ordered_nodes[0].pipeline
    code = getattr(pipeline, "pipeline_code", "KLSI_STANDARD")
    version = getattr(pipeline, "version", "4.0")

    return PipelineDefinition(
        code=code,
        version=version,
        stages=tuple(stages),
        description=(
            "KLSI pipeline derived from ScoringPipelineNode sequence "
            f"for {code}:{version}"
        ),
    )
