from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.assessments.klsi_v4.logic import compute_longitudinal_delta
from app.assessments.klsi_v4.types import StyleIntensityMetrics
from app.db.database import Base
from app.models.klsi.assessment import AssessmentSession
from app.models.klsi.enums import SessionStatus
from app.models.klsi.learning import (
    CombinationScore,
    LearningFlexibilityIndex,
    LearningStyleType,
    UserLearningStyle,
)
from app.models.klsi.user import User


def _memory_db():
    engine = create_engine("sqlite+pysqlite:///:memory:", future=True)
    Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(bind=engine)
    return SessionLocal()


def _make_session(db, user_id: int) -> AssessmentSession:
    session = AssessmentSession(
        user_id=user_id,
        assessment_id="KLSI",
        assessment_version="4.0",
        status=SessionStatus.completed,
        end_time=datetime.now(timezone.utc),
    )
    db.add(session)
    db.flush()
    return session


def _combo(session_id: UUID, acce: int, aero: int) -> CombinationScore:
    combo = CombinationScore(
        session_id=session_id,
        ACCE_raw=acce,
        AERO_raw=aero,
        assimilation_accommodation=0,
        converging_diverging=0,
        balance_acce=0,
        balance_aero=0,
    )
    return combo


def test_compute_longitudinal_delta_handles_missing_lfi():
    db = _memory_db()
    try:
        user = User(full_name="Delta", email="delta@example.com")
        db.add(user)
        db.flush()

        previous = _make_session(db, user.id)
        current = _make_session(db, user.id)

        prev_combo = _combo(previous.id, 8, 4)
        db.add(prev_combo)

        current_combo = _combo(current.id, 10, 6)
        db.add(current_combo)

        lfi_current = LearningFlexibilityIndex(
            session_id=current.id,
            W_coefficient=0.4,
            LFI_score=0.6,
            LFI_percentile=55.0,
            flexibility_level="Moderate",
            norm_group_used="Total",
        )
        db.add(lfi_current)
        db.commit()

        intensity = StyleIntensityMetrics(manhattan=20, euclidean=10.0)
        delta = compute_longitudinal_delta(db, current.id, current_combo, lfi_current, intensity)
        assert delta is not None
        assert delta.delta_acce == 2
        assert delta.delta_aero == 2
        assert delta.delta_lfi is None
    finally:
        db.close()


def test_compute_longitudinal_delta_handles_missing_combination():
    db = _memory_db()
    try:
        user = User(full_name="LFI", email="lfi@example.com")
        db.add(user)
        db.flush()

        previous = _make_session(db, user.id)
        current = _make_session(db, user.id)

        style_type = LearningStyleType(
            style_name="Balancing",
            style_code="BAL",
            ACCE_min=-5,
            ACCE_max=5,
            AERO_min=-5,
            AERO_max=5,
            quadrant="Q1",
            description="",
        )
        db.add(style_type)
        db.flush()

        prev_style = UserLearningStyle(
            session_id=previous.id,
            primary_style_type_id=style_type.id,
            ACCE_raw=0,
            AERO_raw=0,
            kite_coordinates=None,
            style_intensity_score=18,
        )
        db.add(prev_style)

        prev_lfi = LearningFlexibilityIndex(
            session_id=previous.id,
            W_coefficient=0.5,
            LFI_score=0.5,
            LFI_percentile=45.0,
            flexibility_level="Moderate",
            norm_group_used="Total",
        )
        db.add(prev_lfi)

        current_combo = _combo(current.id, 6, -2)
        db.add(current_combo)
        current_lfi = LearningFlexibilityIndex(
            session_id=current.id,
            W_coefficient=0.3,
            LFI_score=0.7,
            LFI_percentile=70.0,
            flexibility_level="High",
            norm_group_used="Total",
        )
        db.add(current_lfi)
        db.commit()

        intensity = StyleIntensityMetrics(manhattan=14, euclidean=9.8)
        delta = compute_longitudinal_delta(db, current.id, current_combo, current_lfi, intensity)
        assert delta is not None
        assert delta.delta_acce is None
        assert delta.delta_aero is None
        assert round(delta.delta_lfi or 0.0, 2) == 0.20
        assert delta.delta_intensity == -4
    finally:
        db.close()
