from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy.orm import Session

from app.assessments.klsi_v4.logic import (
    CONTEXT_NAMES,
    apply_percentiles,
    compute_combination_scores,
    compute_lfi,
    compute_longitudinal_delta,
    compute_raw_scale_scores,
    assign_learning_style,
)
from app.engine.interfaces import (
    AssessmentDefinition,
    ReportComposer,
    ScoringContext,
    ScoringStep,
    ValidationIssue,
    ValidationRule,
)
from app.engine.registry import register
from app.models.klsi.assessment import AssessmentSession
from app.models.klsi.learning import CombinationScore, UserLearningStyle

__all__ = [
    "LFIContextRule",
    "RawModesStep",
    "CombinationStep",
    "StyleClassificationStep",
    "LfiStep",
    "PercentileStep",
    "DeltaStep",
    "KLSIReportComposer",
    "KLSIAssessmentDefinition",
]


class LFIContextRule:
    """Validation rule ensuring all LFI contexts are submitted."""

    __slots__ = ("code",)
    code: str

    def __init__(self) -> None:
        self.code = "LFI_CONTEXT_COUNT"

    def validate(self, db: Session, session_id: int) -> List[ValidationIssue]:
        from app.models.klsi.learning import LFIContextScore

        count = (
            db.query(LFIContextScore)
            .filter(LFIContextScore.session_id == session_id)
            .count()
        )
        if count != len(CONTEXT_NAMES):
            return [
                ValidationIssue(
                    self.code,
                    f"Butuh {len(CONTEXT_NAMES)} konteks LFI, baru {count}",
                    fatal=True,
                )
            ]
        return []


class RawModesStep:
    """Aggregate forced-choice ranks into per-mode totals."""

    __slots__ = ("name", "depends_on")
    name: str
    depends_on: List[str]

    def __init__(self) -> None:
        self.name = "raw_modes"
        self.depends_on = []

    def run(self, db: Session, session_id: int, ctx: ScoringContext) -> None:
        scale = compute_raw_scale_scores(db, session_id)
        ctx[self.name] = {
            "CE": scale.CE_raw,
            "RO": scale.RO_raw,
            "AC": scale.AC_raw,
            "AE": scale.AE_raw,
            "entity": scale,
        }
class CombinationStep:
    """Derive dialectical metrics (ACCE/AERO) and balance deltas."""

    __slots__ = ("name", "depends_on")
    name: str
    depends_on: List[str]

    def __init__(self) -> None:
        self.name = "combination"
        self.depends_on = ["raw_modes"]

    def run(self, db: Session, session_id: int, ctx: ScoringContext) -> None:
        scale_entity = ctx["raw_modes"]["entity"]
        combo = compute_combination_scores(db, scale_entity)
        ctx[self.name] = {
            "ACCE": combo.ACCE_raw,
            "AERO": combo.AERO_raw,
            "assimilation_accommodation": combo.assimilation_accommodation,
            "converging_diverging": combo.converging_diverging,
            "balance_acce": combo.balance_acce,
            "balance_aero": combo.balance_aero,
            "entity": combo,
        }
class StyleClassificationStep:
    """Assign primary and backup learning styles from combination scores."""

    __slots__ = ("name", "depends_on")
    name: str
    depends_on: List[str]

    def __init__(self) -> None:
        self.name = "style"
        self.depends_on = ["combination"]

    def run(self, db: Session, session_id: int, ctx: ScoringContext) -> None:
        combo_entity = ctx["combination"]["entity"]
        user_style, intensities = assign_style(db, combo_entity)
        ctx[self.name] = {
            "primary_style_type_id": user_style.primary_style_type_id,
            "ACCE": user_style.ACCE_raw,
            "AERO": user_style.AERO_raw,
            "intensity": intensities,
            "entity": user_style,
        }
class LfiStep:
    """Compute Learning Flexibility Index and related provenance."""

    __slots__ = ("name", "depends_on")
    name: str
    depends_on: List[str]

    def __init__(self) -> None:
        self.name = "lfi"
        self.depends_on = ["raw_modes"]

    def run(self, db: Session, session_id: int, ctx: ScoringContext) -> None:
        lfi_entity = compute_lfi(db, session_id)
        ctx[self.name] = {
            "W": lfi_entity.W_coefficient,
            "score": lfi_entity.LFI_score,
            "percentile": lfi_entity.LFI_percentile,
            "level": lfi_entity.flexibility_level,
            "provenance": lfi_entity.norm_group_used,
            "entity": lfi_entity,
        }
class PercentileStep:
    """Convert raw scores and dialectics into percentile ranks."""

    __slots__ = ("name", "depends_on")
    name: str
    depends_on: List[str]

    def __init__(self) -> None:
        self.name = "percentiles"
        self.depends_on = ["combination", "style"]

    def run(self, db: Session, session_id: int, ctx: ScoringContext) -> None:
        scale_entity = ctx["raw_modes"]["entity"]
        combo_entity = ctx["combination"]["entity"]
        percentiles = apply_percentiles(db, session_id, scale_entity, combo_entity)
        ctx[self.name] = {
            "CE": percentiles.CE_percentile,
            "RO": percentiles.RO_percentile,
            "AC": percentiles.AC_percentile,
            "AE": percentiles.AE_percentile,
            "ACCE": percentiles.ACCE_percentile,
            "AERO": percentiles.AERO_percentile,
            "sources": percentiles.norm_provenance,
            "truncated": percentiles.truncated_scales,
            "raw_outside_norm_range": percentiles.raw_outside_norm_range,
            "used_fallback_any": percentiles.used_fallback_any,
            "norm_group_used": percentiles.norm_group_used,
            "entity": percentiles,
        }
class DeltaStep:
    """Capture longitudinal deltas against the most recent session."""

    __slots__ = ("name", "depends_on")
    name: str
    depends_on: List[str]

    def __init__(self) -> None:
        self.name = "delta"
        self.depends_on = ["style", "lfi"]

    def run(self, db: Session, session_id: int, ctx: ScoringContext) -> None:
        combo_entity = ctx["combination"]["entity"]
        lfi_entity = ctx["lfi"]["entity"]
        intensities = ctx["style"]["intensity"]
        delta = compute_longitudinal_delta(db, session_id, combo_entity, lfi_entity, intensities)
        if delta:
            ctx[self.name] = {
                "previous_session_id": delta.previous_session_id,
                "delta_acce": delta.delta_acce,
                "delta_aero": delta.delta_aero,
                "delta_lfi": delta.delta_lfi,
                "delta_intensity": delta.delta_intensity,
            }


def assign_style(db: Session, combo_entity: CombinationScore) -> Tuple[UserLearningStyle, Dict[str, float]]:
    """Delegate style assignment to logic layer while preserving typing."""

    return assign_learning_style(db, combo_entity)


@dataclass(frozen=True)
class KLSIReportComposer:
    """Minimal report composer; extended narratives handled in services layer."""

    def build(
        self,
        db: Session,
        session_id: int,
        viewer_role: Optional[str],
        locale: str = "id",
    ) -> Dict[str, Any]:
        session = (
            db.query(AssessmentSession)
            .filter(AssessmentSession.id == session_id)
            .first()
        )
        return {
            "session_id": session_id,
            "user_id": session.user_id if session else None,
            "assessment": "KLSI",
            "version": "4.0",
        }


class KLSIAssessmentDefinition:
    """Declarative configuration for the Kolb Learning Style Inventory 4.0."""

    __slots__ = ("id", "version", "item_count", "context_count", "steps")
    id: str
    version: str
    item_count: int
    context_count: int
    steps: List[ScoringStep]

    def __init__(self) -> None:
        self.id = "KLSI"
        self.version = "4.0"
        self.item_count = 12
        self.context_count = len(CONTEXT_NAMES)
        self.steps = [
            RawModesStep(),
            CombinationStep(),
            StyleClassificationStep(),
            LfiStep(),
            PercentileStep(),
            DeltaStep(),
        ]

    def validation_rules(self) -> List[ValidationRule]:
        return [LFIContextRule()]

    def norm_scales(self) -> List[str]:
        return ["CE", "RO", "AC", "AE", "ACCE", "AERO", "LFI"]

    def report_composer(self) -> ReportComposer:
        return KLSIReportComposer()


register(KLSIAssessmentDefinition())
