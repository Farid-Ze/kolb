from __future__ import annotations

from datetime import datetime, timezone

from app.models.klsi.assessment import AssessmentSession
from app.models.klsi.enums import SessionStatus
from app.models.klsi.learning import (
    CombinationScore,
    LearningFlexibilityIndex,
    LearningStyleType,
    ScaleScore,
    UserLearningStyle,
)
from app.models.klsi.user import User
from app.services.assessments import get_latest_completed_assessment_summary


def test_get_latest_completed_assessment_summary_returns_none_when_absent(session):
    user = User(full_name="No Sessions", email="nosession@example.com")
    session.add(user)
    session.flush()

    assert get_latest_completed_assessment_summary(session, user.id) is None


def test_get_latest_completed_assessment_summary_serializes_latest_payload(session):
    user = User(full_name="Latest Session", email="latest@example.com")
    session.add(user)
    session.flush()

    style_type = session.query(LearningStyleType).first()
    assert style_type is not None

    completed_at = datetime(2024, 1, 2, 3, 4, 5, tzinfo=timezone.utc)
    assessment_session = AssessmentSession(
        user_id=user.id,
        status=SessionStatus.completed,
        start_time=completed_at,
        end_time=completed_at,
    )
    session.add(assessment_session)
    session.flush()

    scale = ScaleScore(
        session_id=assessment_session.id,
        CE_raw=30,
        RO_raw=28,
        AC_raw=32,
        AE_raw=26,
    )
    combo = CombinationScore(
        session_id=assessment_session.id,
        ACCE_raw=2,
        AERO_raw=-2,
        assimilation_accommodation=4,
        converging_diverging=-5,
        balance_acce=3,
        balance_aero=7,
    )
    style = UserLearningStyle(
        session_id=assessment_session.id,
        primary_style_type_id=style_type.id,
        ACCE_raw=combo.ACCE_raw,
        AERO_raw=combo.AERO_raw,
        kite_coordinates=None,
        style_intensity_score=12,
    )
    lfi = LearningFlexibilityIndex(
        session_id=assessment_session.id,
        W_coefficient=0.62,
        LFI_score=58.4,
        LFI_percentile=72.0,
        flexibility_level="Moderate",
        norm_group_used="Total",
    )

    session.add_all([scale, combo, style, lfi])
    session.commit()

    payload = get_latest_completed_assessment_summary(session, user.id)

    assert payload is not None
    assert payload["id"] == str(assessment_session.id)
    # SQLAlchemy returns naive datetimes for these columns, so offsets drop.
    assert payload["date"] == completed_at.replace(tzinfo=None).isoformat()
    assert payload["status"] == "completed"
    assert payload["results"] == {
        "ac_score": 32,
        "ce_score": 30,
        "ae_score": 26,
        "ro_score": 28,
        "acce_score": 2,
        "aero_score": -2,
        "learning_style": style_type.style_name,
        "lfi_score": 58.4,
    }
