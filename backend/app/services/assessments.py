from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, Optional, TYPE_CHECKING

from sqlalchemy.orm import Session

from app.db.repositories import SessionRepository
from app.models.klsi.items import AssessmentItemResponse
from app.schemas.session import AssessmentItemResponsePayload

__all__ = [
    "build_kite_coordinates",
    "detect_blindspots",
    "detect_strengths",
    "get_latest_assessment_results",
    "get_latest_completed_assessment_summary",
    "upsert_responses",
]

if TYPE_CHECKING:  # pragma: no cover
    from app.models.klsi.assessment import AssessmentSession
    from app.models.klsi.norms import PercentileScore


def _serialize_timestamp(value: datetime | None) -> Optional[str]:
    if value is None:
        return None
    return value.isoformat()


def _resolve_learning_style_name(session) -> str:
    style = getattr(session, "learning_style", None)
    if not style or not getattr(style, "style_type", None):
        return "Unknown"
    style_type = style.style_type
    return getattr(style_type, "style_name", "Unknown") or "Unknown"


def get_latest_completed_assessment_summary(db: Session, user_id: int) -> Optional[Dict[str, Any]]:
    """Return the latest completed assessment summary for a user.

    Routers should call this helper instead of hitting repositories directly so that
    the service layer owns the persistence boundary. The payload matches the
    AssessmentSessionResponse contract declared by the public API.
    """

    repo = SessionRepository(db)
    session = repo.get_latest_completed_for_user(user_id)
    if not session:
        return None

    scale = getattr(session, "scale_score", None)
    combo = getattr(session, "combination_score", None)
    if not scale or not combo:
        return None

    learning_style = _resolve_learning_style_name(session)
    lfi_score = getattr(getattr(session, "lfi_index", None), "LFI_score", None)
    timestamp = session.end_time or session.start_time

    results = {
        "ac_score": scale.AC_raw,
        "ce_score": scale.CE_raw,
        "ae_score": scale.AE_raw,
        "ro_score": scale.RO_raw,
        "acce_score": combo.ACCE_raw,
        "aero_score": combo.AERO_raw,
        "learning_style": learning_style,
        "lfi_score": lfi_score,
    }

    return {
        "id": str(session.id),
        "date": _serialize_timestamp(timestamp) or "",
        "status": "completed",
        "results": results,
    }


def build_kite_coordinates(session: "AssessmentSession") -> dict[str, float] | None:
    style = getattr(session, "learning_style", None)
    kite = getattr(style, "kite_coordinates", None) if style else None
    if isinstance(kite, dict) and kite:
        return {k.upper(): float(v) for k, v in kite.items() if isinstance(v, (int, float))}

    scale = getattr(session, "scale_score", None)
    if not scale:
        return None
    return {
        "CE": float(scale.CE_raw),
        "RO": float(scale.RO_raw),
        "AC": float(scale.AC_raw),
        "AE": float(scale.AE_raw),
    }


def detect_blindspots(kite_coordinates: dict[str, float] | None, *, limit: int = 2) -> list[str]:
    if not kite_coordinates:
        return []
    ordered = sorted(kite_coordinates.items(), key=lambda item: item[1])
    return [dimension for dimension, _ in ordered[:limit]]


def detect_strengths(kite_coordinates: dict[str, float] | None, *, limit: int = 2) -> list[str]:
    if not kite_coordinates:
        return []
    ordered = sorted(kite_coordinates.items(), key=lambda item: item[1], reverse=True)
    return [dimension for dimension, _ in ordered[:limit]]


def _serialize_percentiles(model: Optional["PercentileScore"]) -> Optional[dict[str, float | str | None]]:
    if not model:
        return None
    return {
        "CE": model.CE_percentile,
        "RO": model.RO_percentile,
        "AC": model.AC_percentile,
        "AE": model.AE_percentile,
        "ACCE": model.ACCE_percentile,
        "AERO": model.AERO_percentile,
        "norm_group": model.norm_group_used,
        "norm_version": model.norm_version_used,
    }


def get_latest_assessment_results(db: Session, user_id: int) -> Optional[Dict[str, Any]]:
    repo = SessionRepository(db)
    session = repo.get_latest_completed_for_user(user_id)
    if not session:
        return None

    snapshot = session.results_json or {}
    kite = snapshot.get("kite_coordinates") or build_kite_coordinates(session)
    blindspots = snapshot.get("blindspots") or detect_blindspots(kite)
    strengths = snapshot.get("strengths") or detect_strengths(kite)
    percentiles = snapshot.get("percentiles") or _serialize_percentiles(getattr(session, "percentile_score", None))
    lfi_score = snapshot.get("lfi_score") or getattr(getattr(session, "lfi_index", None), "LFI_score", None)

    return {
        "session_id": session.id,
        "finalized_at": session.end_time or session.start_time,
        "kite_coordinates": kite,
        "blindspots": blindspots,
        "strengths": strengths,
        "lfi_score": lfi_score,
        "percentiles": percentiles,
    }


def upsert_responses(db: Session, session_id: int, responses: list[AssessmentItemResponsePayload]):
    for resp in responses:
        existing = db.query(AssessmentItemResponse).filter_by(
            session_id=session_id, item_id=resp.item_id
        ).first()

        telemetry_data = {"blur_events": resp.blur_events} if resp.blur_events is not None else {}

        if existing:
            existing.response_rank = resp.response_rank
            existing.response_latency_ms = resp.response_latency_ms
            # Merge telemetry if needed, or overwrite. Blueprint says "telemetry (aggregated blur events, etc.)"
            # For now, overwrite or update.
            existing.telemetry = telemetry_data
        else:
            new_resp = AssessmentItemResponse(
                session_id=session_id,
                item_id=resp.item_id,
                response_rank=resp.response_rank,
                response_latency_ms=resp.response_latency_ms,
                telemetry=telemetry_data
            )
            db.add(new_resp)
    db.commit()
