from datetime import date, datetime

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.database import Base
from app.models.klsi.assessment import AssessmentSession
from app.models.klsi.enums import SessionStatus
from app.models.klsi.learning import (
    CombinationScore,
    LearningFlexibilityIndex,
    LearningStyleType,
    ScaleScore,
    UserLearningStyle,
)
from app.models.klsi.team import Team, TeamMember
from app.models.klsi.user import User
from app.services.rollup import build_team_rollup_snapshot, compute_team_rollup


def _make_db():
    engine = create_engine("sqlite:///:memory:")
    SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    Base.metadata.create_all(bind=engine)
    return SessionLocal


def _seed_user_team(db):
    user = User(full_name="Tester", email="tester@example.com")
    db.add(user)
    db.commit()
    db.refresh(user)

    team = Team(name="Team Test")
    db.add(team)
    db.commit()
    db.refresh(team)

    db.add(TeamMember(team_id=team.id, user_id=user.id))
    db.commit()
    return user, team


def _seed_style(db):
    style = LearningStyleType(
        style_name="Balancing",
        style_code="BAL",
        ACCE_min=6,
        ACCE_max=14,
        AERO_min=1,
        AERO_max=11,
        quadrant="Mid",
        description=None,
    )
    db.add(style)
    db.commit()
    db.refresh(style)
    return style


def _seed_completed_session(db, user_id: int, style_id: int):
    completed_at = datetime(2025, 1, 2)
    session = AssessmentSession(
        user_id=user_id,
        status=SessionStatus.completed,
        start_time=completed_at,
        end_time=completed_at,
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    db.add(
        LearningFlexibilityIndex(
            session_id=session.id,
            W_coefficient=0.5,
            LFI_score=0.5,
            LFI_percentile=None,
            flexibility_level=None,
        )
    )
    db.add(
        ScaleScore(
            session_id=session.id,
            CE_raw=30,
            RO_raw=28,
            AC_raw=32,
            AE_raw=34,
        )
    )
    db.add(
        CombinationScore(
            session_id=session.id,
            ACCE_raw=10,
            AERO_raw=6,
            assimilation_accommodation=0,
            converging_diverging=0,
            balance_acce=5,
            balance_aero=4,
        )
    )
    db.add(
        UserLearningStyle(
            session_id=session.id,
            primary_style_type_id=style_id,
            ACCE_raw=10,
            AERO_raw=6,
            kite_coordinates=None,
            style_intensity_score=16,
        )
    )
    db.commit()
    return session


def test_team_rollup_single_session():
    SessionLocal = _make_db()
    db = SessionLocal()

    user, team = _seed_user_team(db)
    style = _seed_style(db)

    session = AssessmentSession(
        user_id=user.id,
        status=SessionStatus.completed,
        start_time=datetime(2025, 1, 2),
        end_time=datetime(2025, 1, 2),
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    db.add(
        LearningFlexibilityIndex(
            session_id=session.id,
            W_coefficient=0.5,
            LFI_score=0.5,
            LFI_percentile=None,
            flexibility_level=None,
        )
    )
    db.add(
        UserLearningStyle(
            session_id=session.id,
            primary_style_type_id=style.id,
            ACCE_raw=10,
            AERO_raw=6,
            kite_coordinates=None,
            style_intensity_score=16,
        )
    )
    db.commit()

    with db.begin():
        roll = compute_team_rollup(db, team_id=team.id, for_date=date(2025, 1, 2))

    assert roll.total_sessions == 1
    assert roll.avg_lfi is not None and abs(roll.avg_lfi - 0.5) < 1e-9
    assert roll.style_counts is not None and roll.style_counts.get("Balancing") == 1
    db.close()


def test_team_rollup_snapshot_payload_contains_points():
    SessionLocal = _make_db()
    db = SessionLocal()

    user, team = _seed_user_team(db)
    style = _seed_style(db)
    _seed_completed_session(db, user.id, style.id)

    snapshot = build_team_rollup_snapshot(db, team.id)

    assert snapshot["team_id"] == team.id
    assert snapshot["summary"]["members_with_data"] == 1
    # data_points and legacy_members removed in Audit Round 2
    assert snapshot["summary"]["avg_ac_ce"] == 10.0
    assert snapshot["balance_metrics"]["CE_percentage"] > 0
    db.close()


def test_team_rollup_snapshot_marks_members_without_sessions():
    SessionLocal = _make_db()
    db = SessionLocal()

    user, team = _seed_user_team(db)
    style = _seed_style(db)
    _seed_completed_session(db, user.id, style.id)

    legacy_user = User(full_name="Legacy", email="legacy@example.com")
    db.add(legacy_user)
    db.commit()
    db.refresh(legacy_user)

    db.add(TeamMember(team_id=team.id, user_id=legacy_user.id))
    db.commit()

    snapshot = build_team_rollup_snapshot(db, team.id)
    
    # Verify that the snapshot correctly counts members with and without data
    # legacy_members list was removed, so we check the summary counts
    assert snapshot["summary"]["total_members"] == 2
    assert snapshot["summary"]["members_with_data"] == 1
    db.close()

