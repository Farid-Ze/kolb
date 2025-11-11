from datetime import date, datetime

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.database import Base
from app.models.klsi import (
    AssessmentSession,
    LearningFlexibilityIndex,
    LearningStyleType,
    SessionStatus,
    Team,
    TeamMember,
    User,
    UserLearningStyle,
)
from app.services.rollup import compute_team_rollup


def _make_db():
    engine = create_engine("sqlite:///:memory:")
    SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    Base.metadata.create_all(bind=engine)
    return SessionLocal


def test_team_rollup_single_session():
    SessionLocal = _make_db()
    db = SessionLocal()
    # Create user, team, member
    u = User(full_name="U", email="u@mahasiswa.unikom.ac.id")
    db.add(u)
    db.commit()
    db.refresh(u)
    t = Team(name="Team X")
    db.add(t)
    db.commit()
    db.refresh(t)
    tm = TeamMember(team_id=t.id, user_id=u.id)
    db.add(tm)
    db.commit()

    # Seed a style type used in user style
    st = LearningStyleType(
        style_name="Balancing",
        style_code="BAL",
        ACCE_min=6,
        ACCE_max=14,
        AERO_min=1,
        AERO_max=11,
        quadrant="Mid",
        description=None,
    )
    db.add(st)
    db.commit()
    db.refresh(st)

    # Create completed session with LFI and style on a specific date
    d = datetime(2025, 1, 2)
    s = AssessmentSession(user_id=u.id, status=SessionStatus.completed, start_time=d, end_time=d)
    db.add(s)
    db.commit()
    db.refresh(s)
    db.add(
        LearningFlexibilityIndex(
            session_id=s.id,
            W_coefficient=0.5,
            LFI_score=0.5,
            LFI_percentile=None,
            flexibility_level=None,
        )
    )
    db.add(
        UserLearningStyle(
            session_id=s.id,
            primary_style_type_id=st.id,
            ACCE_raw=10,
            AERO_raw=6,
            kite_coordinates=None,
            style_intensity_score=16,
        )
    )
    db.commit()

    with db.begin():
        roll = compute_team_rollup(db, team_id=t.id, for_date=date(2025, 1, 2))
    assert roll.total_sessions == 1
    assert roll.avg_lfi is not None and abs(roll.avg_lfi - 0.5) < 1e-9
    assert roll.style_counts is not None and roll.style_counts.get("Balancing") == 1
    db.close()
