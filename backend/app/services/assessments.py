from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, Optional

from sqlalchemy.orm import Session

from app.db.repositories import SessionRepository


__all__ = ["get_latest_completed_assessment_summary"]


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
