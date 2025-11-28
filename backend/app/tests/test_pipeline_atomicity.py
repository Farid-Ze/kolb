import pytest
from collections.abc import Iterator
from itertools import count
from uuid import UUID

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.db.database import Base
from app.engine.pipelines import PipelineDefinition, execute_pipeline_streaming
from app.models.klsi.assessment import AssessmentSession
from app.models.klsi.enums import SessionStatus
from app.models.klsi.learning import ScaleScore
from app.models.klsi.user import User


_email_counter = count()


@pytest.fixture()
def db_session() -> Iterator[Session]:
    engine = create_engine("sqlite+pysqlite:///:memory:", future=True)
    Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(bind=engine, future=True)
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _new_session(db: Session) -> AssessmentSession:
    suffix = next(_email_counter)
    user = User(full_name="Pipeline User", email=f"pipeline+{suffix}@example.com")
    db.add(user)
    db.flush()
    session = AssessmentSession(
        user_id=user.id,
        status=SessionStatus.started,
        assessment_id="KLSI",
        assessment_version="4.0",
    )
    db.add(session)
    db.flush()
    return session


def _stage_insert_then_maybe_fail(failing_session_id: UUID | None):
    def _stage(db: Session, session_id: UUID) -> dict:
        db.add(
            ScaleScore(
                session_id=session_id,
                CE_raw=11,
                RO_raw=22,
                AC_raw=33,
                AE_raw=44,
            )
        )
        db.flush()
        if session_id == failing_session_id:
            raise RuntimeError("stage failure")
        return {"ok": True}

    _stage.__name__ = "stage_insert"
    return _stage


def test_pipeline_execute_rolls_back_stage_failure(db_session: Session):
    session = _new_session(db_session)
    stage = _stage_insert_then_maybe_fail(failing_session_id=session.id)
    pipeline = PipelineDefinition(code="TEST", version="1.0", stages=(stage,))

    with pytest.raises(RuntimeError, match="stage failure"):
        pipeline.execute(db_session, session.id)

    assert db_session.query(ScaleScore).filter_by(session_id=session.id).count() == 0


def test_streaming_pipeline_rolls_back_failed_session_only(db_session: Session):
    good_session = _new_session(db_session)
    failing_session = _new_session(db_session)
    stage = _stage_insert_then_maybe_fail(failing_session_id=failing_session.id)
    pipeline = PipelineDefinition(code="BATCH", version="1.0", stages=(stage,))

    results = list(
        execute_pipeline_streaming(
            pipeline,
            db_session,
            [good_session.id, failing_session.id],
        )
    )

    assert results[0][0] == good_session.id
    assert results[0][1]["ok"] is True
    assert results[1][0] == failing_session.id
    assert results[1][1]["ok"] is False
    assert "error" in results[1][1]

    db_session.commit()

    assert db_session.query(ScaleScore).filter_by(session_id=good_session.id).count() == 1
    assert db_session.query(ScaleScore).filter_by(session_id=failing_session.id).count() == 0
