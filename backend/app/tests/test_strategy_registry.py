import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.database import Base
from app.engine.strategy_registry import get_strategy
from app.models.klsi.assessment import AssessmentSession
from app.models.klsi.enums import SessionStatus
from app.models.klsi.instrument import Instrument
from app.models.klsi.user import User
from app.services.seeds import seed_assessment_items, seed_instruments, seed_learning_styles
from app.core.errors import InvalidAssessmentData
from app.i18n.id_messages import LogicMessages


def _db_session():
    engine = create_engine("sqlite+pysqlite:///:memory:", future=True)
    Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()
    seed_instruments(db)
    seed_learning_styles(db)
    seed_assessment_items(db)
    return db


def test_klsi_strategy_finalize_runs_pipeline():
    db = _db_session()
    try:
        strategy = get_strategy("KLSI4.0")
        user = User(full_name="Strategist", email="strategist@example.com")
        db.add(user)
        db.flush()
        instrument = db.query(Instrument).filter(Instrument.code == "KLSI", Instrument.version == "4.0").first()
        session = AssessmentSession(
            user_id=user.id,
            status=SessionStatus.started,
            instrument_id=instrument.id if instrument else None,
        )
        db.add(session)
        db.flush()

        # No responses inserted; expect strategy to raise due to missing data
        expected_phrase = LogicMessages.LFI_CONTEXT_COUNT_MISMATCH.split("{")[0].strip()
        with pytest.raises(InvalidAssessmentData) as exc_info:
            strategy.finalize(db, session.id)
        assert expected_phrase in str(exc_info.value)
    finally:
        db.close()
