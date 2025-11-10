from __future__ import annotations

from typing import Any, Dict

from sqlalchemy.orm import Session

from app.assessments.klsi_v4 import definition  # noqa: F401 - ensure registration side effects
import app.engine.strategies  # noqa: F401 - register scoring strategies
from app.assessments.klsi_v4.logic import (
    CONTEXT_NAMES,
    STYLE_CUTS,
    apply_percentiles as logic_apply_percentiles,
    assign_learning_style as logic_assign_learning_style,
    compute_combination_scores as logic_compute_combination_scores,
    compute_kendalls_w,
    compute_lfi as logic_compute_lfi,
    compute_raw_scale_scores as logic_compute_raw_scale_scores,
    resolve_norm_groups as logic_resolve_norm_groups,
    validate_lfi_context_ranks,
)
from app.core.config import settings
from app.engine.finalize import finalize_assessment
from app.models.klsi import AssessmentSession, CombinationScore, ScaleScore, SessionStatus, UserLearningStyle


__all__ = [
    "STYLE_CUTS",
    "CONTEXT_NAMES",
    "validate_lfi_context_ranks",
    "compute_kendalls_w",
    "compute_raw_scale_scores",
    "compute_combination_scores",
    "assign_learning_style",
    "compute_lfi",
    "apply_percentiles",
    "finalize_session",
    "resolve_norm_groups",
    "_resolve_norm_groups",
]


def compute_raw_scale_scores(db: Session, session_id: int) -> ScaleScore:
    return logic_compute_raw_scale_scores(db, session_id)


def compute_combination_scores(db: Session, scale: ScaleScore) -> CombinationScore:
    return logic_compute_combination_scores(db, scale)


def assign_learning_style(db: Session, combo: CombinationScore) -> UserLearningStyle:
    user_style, _intensity = logic_assign_learning_style(db, combo)
    return user_style


def compute_lfi(db: Session, session_id: int):
    return logic_compute_lfi(db, session_id)


def apply_percentiles(db: Session, scale: ScaleScore, combo: CombinationScore):
    return logic_apply_percentiles(db, scale.session_id, scale, combo)


def resolve_norm_groups(db: Session, session_id: int):
    return logic_resolve_norm_groups(db, session_id)


def _resolve_norm_groups(db: Session, session_id: int):  # legacy alias for tests/backwards compat
    return resolve_norm_groups(db, session_id)


def finalize_session(db: Session, session_id: int, *, skip_checks: bool = False) -> Dict[str, Any]:
    session = (
        db.query(AssessmentSession)
        .filter(AssessmentSession.id == session_id)
        .first()
    )
    if not session:
        raise ValueError("Sesi tidak ditemukan")
    assessment_id = session.assessment_id or "KLSI"
    assessment_version = session.assessment_version or "4.0"
    outcome = finalize_assessment(
        db,
        session_id,
        assessment_id,
        assessment_version,
        settings.audit_salt,
        skip_checks=skip_checks,
    )
    if not outcome.get("ok"):
        return outcome
    ctx: Dict[str, Any] = outcome["context"]
    artifacts = outcome["artifacts"]

    # Persist longitudinal deltas if available
    combo_entity = ctx["combination"]["entity"]
    lfi_entity = ctx["lfi"]["entity"]
    return {
        "ok": True,
        "scale": ctx["raw_modes"]["entity"],
        "combination": combo_entity,
        "style": ctx["style"]["entity"],
        "lfi": lfi_entity,
        "percentiles": ctx["percentiles"]["entity"],
        "delta": ctx.get("delta"),
        "artifacts": artifacts,
    }
