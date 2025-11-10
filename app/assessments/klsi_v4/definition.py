from __future__ import annotations

from typing import Any, Dict, List, Optional

from sqlalchemy.orm import Session

from app.assessments.klsi_v4.logic import (
    CONTEXT_NAMES,
    apply_percentiles,
    compute_combination_scores,
    compute_lfi,
    compute_longitudinal_delta,
    compute_raw_scale_scores,
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
from app.models.klsi import AssessmentSession
class LFIContextRule:
    code = "LFI_CONTEXT_COUNT"

    def validate(self, db: Session, session_id: int) -> List[ValidationIssue]:
        from app.models.klsi import LFIContextScore

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
    name = "raw_modes"
    depends_on: List[str] = []

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
    name = "combination"
    depends_on = ["raw_modes"]

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
    name = "style"
    depends_on = ["combination"]

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
    name = "lfi"
    depends_on = ["raw_modes"]

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
    name = "percentiles"
    depends_on = ["combination", "style"]

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
    name = "delta"
    depends_on = ["style", "lfi"]

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


def assign_style(db: Session, combo_entity) -> tuple[Any, Dict[str, float]]:
    from app.assessments.klsi_v4.logic import assign_learning_style

    return assign_learning_style(db, combo_entity)


class KLSIReportComposer:
    def build(self, db: Session, session_id: int, viewer_role: Optional[str], locale: str = "id") -> Dict[str, Any]:
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
    id = "KLSI"
    version = "4.0"
    item_count = 12
    context_count = len(CONTEXT_NAMES)
    steps: List[ScoringStep] = [
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
