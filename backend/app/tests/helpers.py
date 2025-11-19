from __future__ import annotations

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.assessments.klsi_v4.definition import CONTEXT_NAMES
from app.db.database import Base
from app.models.klsi.assessment import AssessmentSession
from app.models.klsi.enums import SessionStatus
from app.models.klsi.instrument import Instrument
from app.models.klsi.items import AssessmentItem, UserResponse
from app.models.klsi.learning import LFIContextScore
from app.models.klsi.user import User
from app.services.seeds import (
    seed_assessment_items,
    seed_engine_authoring,
    seed_instruments,
    seed_learning_styles,
)


def build_seeded_memory_db():
    engine = create_engine("sqlite+pysqlite:///:memory:", future=True)
    Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()
    seed_instruments(db)
    seed_learning_styles(db)
    seed_assessment_items(db)
    seed_engine_authoring(db)
    return db


def seed_complete_session(
    db,
    *,
    assessment_id: str = "KLSI",
    assessment_version: str = "4.0",
    user_email: str | None = None,
    user_name: str = "Tester",
) -> AssessmentSession:
    email = user_email or "tester@example.com"
    user = User(full_name=user_name, email=email)
    db.add(user)
    db.flush()

    instrument = (
        db.query(Instrument)
        .filter(Instrument.code == assessment_id, Instrument.version == assessment_version)
        .first()
    )

    session = AssessmentSession(
        user_id=user.id,
        assessment_id=assessment_id,
        assessment_version=assessment_version,
        instrument_id=instrument.id if instrument else None,
        status=SessionStatus.started,
    )
    db.add(session)
    db.flush()

    mode_ranks = {"CE": 4, "RO": 3, "AC": 2, "AE": 1}
    items = db.query(AssessmentItem).order_by(AssessmentItem.item_number.asc()).all()
    for item in items:
        choice_map = {choice.learning_mode.value: choice.id for choice in item.choices}
        for mode, rank in mode_ranks.items():
            db.add(
                UserResponse(
                    session_id=session.id,
                    item_id=item.id,
                    choice_id=choice_map[mode],
                    rank_value=rank,
                )
            )

    rotations = [
        (1, 2, 3, 4),
        (2, 3, 4, 1),
        (3, 4, 1, 2),
        (4, 1, 2, 3),
    ]
    for idx, context_name in enumerate(CONTEXT_NAMES):
        ranks = rotations[idx % len(rotations)]
        db.add(
            LFIContextScore(
                session_id=session.id,
                context_name=context_name,
                CE_rank=ranks[0],
                RO_rank=ranks[1],
                AC_rank=ranks[2],
                AE_rank=ranks[3],
            )
        )

    db.flush()
    return session
