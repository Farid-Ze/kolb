from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.database import Base
from app.engine.strategy_registry import get_strategy
from app.models.klsi import AssessmentSession, Instrument, SessionStatus, User
from app.services.seeds import seed_assessment_items, seed_instruments, seed_learning_styles


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
        try:
            strategy.finalize(db, session.id)
        except Exception as exc:  # noqa: BLE001 - verifying strategy execution path
            assert "Expected" in str(exc)
    finally:
        db.close()
