from __future__ import annotations

from typing import Any

from sqlalchemy.orm import Session

from app.db.repositories import SessionRepository
from app.i18n.id_styles import LFI_LABEL_ID, STYLE_BRIEF_ID
from app.models.klsi.assessment import AssessmentSession
from app.services.style_labels import get_style_label


def _scale_lfi_score(value: float | None) -> float | None:
    """Return LFI score on a 0-100 scale to match frontend expectations.

    Specification (docs/14-learning-flexibility-index-computation.md) defines LFI=1-W,
    resulting in a 0-1 range. Historic payloads exposed 0-100, so we normalize values ≤1.
    """

    if value is None:
        return None
    scaled = value * 100 if value <= 1 else value
    return round(max(0.0, min(scaled, 100.0)), 2)


def _build_style_summary(session: AssessmentSession) -> dict[str, Any] | None:
    learning_style = session.learning_style
    if not learning_style or not learning_style.style_type:
        return None

    style = learning_style.style_type
    description = style.description or STYLE_BRIEF_ID.get(style.style_name)
    return {
        "style_code": style.style_code,
        "style_name": get_style_label(style.style_name),
        "description": description,
        "quadrant": style.quadrant,
    }


def _build_flexibility_summary(session: AssessmentSession) -> dict[str, Any] | None:
    lfi = session.lfi_index
    if not lfi:
        return None

    level_label = LFI_LABEL_ID.get(lfi.flexibility_level) if lfi.flexibility_level else None
    return {
        "lfi_score": _scale_lfi_score(lfi.LFI_score),
        "percentile": lfi.LFI_percentile,
        "level": lfi.flexibility_level,
        "level_label": level_label,
    }


def _build_dialectic_summary(session: AssessmentSession) -> dict[str, Any] | None:
    combo = session.combination_score
    if not combo:
        return None

    intensity = None
    if combo.ACCE_raw is not None and combo.AERO_raw is not None:
        intensity = abs(combo.ACCE_raw) + abs(combo.AERO_raw)

    return {
        "acce": combo.ACCE_raw,
        "aero": combo.AERO_raw,
        "intensity": intensity,
    }


def build_report_summary(session: AssessmentSession) -> dict[str, Any]:
    """Serialize a completed session into the lightweight report summary payload."""

    style_summary = _build_style_summary(session)
    flexibility = _build_flexibility_summary(session)
    dialectic = _build_dialectic_summary(session)
    timestamp = session.end_time or session.start_time

    return {
        "session_id": session.id,
        "generated_at": timestamp,
        "learning_style": style_summary,
        # Nine-style grid mirrors learning style for now; DB windows ensure deterministic mapping.
        "nine_style": style_summary,
        "flexibility": flexibility,
        "dialectic": dialectic,
    }


def list_report_summaries(db: Session, *, user_id: int) -> list[dict[str, Any]]:
    """Fetch and serialize all completed sessions for the given user."""

    repo = SessionRepository(db)
    sessions = repo.list_completed_for_user(user_id)
    return [build_report_summary(sess) for sess in sessions]


__all__ = [
    "build_report_summary",
    "list_report_summaries",
]
