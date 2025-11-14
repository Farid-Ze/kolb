from __future__ import annotations

from typing import Any, Dict

from sqlalchemy.orm import Session

from app.assessments.klsi_v4 import definition  # noqa: F401 - ensure registration side effects
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
from app.core.logging import get_logger
from app.core.errors import SessionNotFoundError
from app.engine.finalize import finalize_assessment
from app.db.repositories import (
    NormativeConversionRepository,
    SessionRepository,
)
from app.models.klsi.assessment import AssessmentSession
from app.models.klsi.enums import SessionStatus
from app.models.klsi.learning import CombinationScore, ScaleScore, UserLearningStyle
from app.i18n.id_messages import SessionErrorMessages


logger = get_logger("kolb.services.scoring", component="services")


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
    """Aggregate forced-choice ranks into mode totals.

    KLSI instructions treat rank ``4`` as "most like me" and ``1`` as
    "least like me". The Kolb 4.0 normative tables (Appendix 1) therefore
    expect larger summed totals to indicate a stronger relative preference
    for that learning mode. We mirror that convention here by summing the
    rank values directly for each mode.
    
    Preconditions:
        - session_id must exist in database
        - session must have responses for all 12 items
    """
    assert session_id > 0, "session_id must be positive"
    return logic_compute_raw_scale_scores(db, session_id)


def compute_combination_scores(db: Session, scale: ScaleScore) -> CombinationScore:
    """Compute dialectics/balance per KLSI 4.0 Guide pp.45-48."""
    return logic_compute_combination_scores(db, scale)


def assign_learning_style(db: Session, combo: CombinationScore) -> UserLearningStyle:
    user_style, _intensity = logic_assign_learning_style(db, combo)
    return user_style


def compute_lfi(db: Session, session_id: int):
    return logic_compute_lfi(db, session_id)


def apply_percentiles(db: Session, scale: ScaleScore, combo: CombinationScore):
    """Apply percentile conversions with a pre-warmed cached provider.

    This preserves the public API surface while internally constructing a
    CachedCompositeNormProvider that batch-loads all required scale raws
    (CE/RO/AC/AE + ACCE/AERO) for the session's resolved norm precedence
    chain and primes an in-process LRU cache. Subsequent per-scale
    lookups performed inside the validated logic layer become cache hits,
    removing the N+1 query pattern without altering psychometric math.
    """
    session_id = scale.session_id
    group_chain = list(resolve_norm_groups(db, session_id))

    # Feature-flagged cached provider; fallback to default path if disabled or import fails
    if getattr(settings, "cached_norm_provider_enabled", True):
        try:
            from app.engine.norms.cached_composite import CachedCompositeNormProvider
            norm_repo = NormativeConversionRepository(db)
            provider = CachedCompositeNormProvider(
                db,
                group_chain=group_chain,
                norm_repo=norm_repo,
            )
            required = [
                ("CE", scale.CE_raw),
                ("RO", scale.RO_raw),
                ("AC", scale.AC_raw),
                ("AE", scale.AE_raw),
                ("ACCE", combo.ACCE_raw),
                ("AERO", combo.AERO_raw),
            ]
            provider.prime(group_chain, required)
            return logic_apply_percentiles(
                db,
                session_id,
                scale,
                combo,
                norm_provider=provider,
                group_chain=group_chain,
            )
        except Exception as exc:
            logger.exception(
                "cached_norm_provider_failed",
                extra={
                    "structured_data": {
                        "session_id": session_id,
                        "group_chain": group_chain,
                        "reason": str(exc),
                    }
                },
            )
    return logic_apply_percentiles(db, session_id, scale, combo, group_chain=group_chain)


def resolve_norm_groups(db: Session, session_id: int):
    return logic_resolve_norm_groups(db, session_id)


def _resolve_norm_groups(db: Session, session_id: int):  # legacy alias for tests/backwards compat
    return resolve_norm_groups(db, session_id)


def finalize_session(db: Session, session_id: int, *, skip_checks: bool = False) -> Dict[str, Any]:
    session_repo = SessionRepository(db)
    session = session_repo.get_by_id(session_id)
    if not session:
        raise SessionNotFoundError(SessionErrorMessages.NOT_FOUND)
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
        "validation": outcome.get("validation"),
    }
