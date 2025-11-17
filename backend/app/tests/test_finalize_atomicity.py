from __future__ import annotations

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.database import Base
from app.models.klsi.assessment import AssessmentSession
from app.models.klsi.audit import AuditLog
from app.models.klsi.enums import SessionStatus
from app.models.klsi.user import User
from app.engine.finalize import finalize_assessment
from app.engine.strategies.klsi4 import KLSI4Strategy
from app.engine.strategy_registry import register_strategy, _STRATEGIES
from app.services.seeds import seed_instruments, seed_learning_styles, seed_assessment_items


def _db_session():
    engine = create_engine("sqlite+pysqlite:///:memory:", future=True)
    Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()
    seed_instruments(db)
    seed_learning_styles(db)
    seed_assessment_items(db)
    return db


def _new_session(db) -> AssessmentSession:
    user = User(full_name="Atomic User", email="atomic@example.com")
    db.add(user)
    db.flush()
    sess = AssessmentSession(
        user_id=user.id,
        assessment_id="KLSI",
        assessment_version="4.0",
        status=SessionStatus.started,
    )
    db.add(sess)
    db.flush()
    return sess


class FaultyStrategy(KLSI4Strategy):
    def finalize(self, db, session_id):  # type: ignore[override]
        # Simulate unexpected failure during scoring
        raise RuntimeError("Injected failure to test transactional rollback")


def test_finalize_is_atomic_on_failure():
    db = _db_session()
    original = _STRATEGIES.get("KLSI4.0")
    try:
        # Register a faulty strategy under the KLSI key to force an exception
        register_strategy(FaultyStrategy(), allow_replace=True)

        sess = _new_session(db)

        with pytest.raises(RuntimeError, match="Injected failure"):
            finalize_assessment(
                db,
                sess.id,
                assessment_id="KLSI",
                assessment_version="4.0",
                salt="test",
                skip_checks=True,  # Skip completeness checks to hit the strategy fast
            )

        # Verify nothing was persisted from the failed finalize call
        assert db.query(AuditLog).count() == 0
        # No Scale/Combo/Style/LFI/Percentiles rows should exist for this session
        from app.models.klsi.learning import (
            CombinationScore,
            LearningFlexibilityIndex,
            ScaleProvenance,
            ScaleScore,
            UserLearningStyle,
        )
        from app.models.klsi.norms import PercentileScore

        assert db.query(ScaleScore).filter_by(session_id=sess.id).count() == 0
        assert db.query(CombinationScore).filter_by(session_id=sess.id).count() == 0
        assert db.query(UserLearningStyle).filter_by(session_id=sess.id).count() == 0
        assert db.query(LearningFlexibilityIndex).filter_by(session_id=sess.id).count() == 0
        assert db.query(PercentileScore).filter_by(session_id=sess.id).count() == 0
        assert db.query(ScaleProvenance).filter_by(session_id=sess.id).count() == 0
    finally:
        # Restore original strategy to avoid side effects
        if original is not None:
            _STRATEGIES["KLSI4.0"] = original
        else:
            _STRATEGIES.pop("KLSI4.0", None)
        db.close()
