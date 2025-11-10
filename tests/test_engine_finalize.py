from __future__ import annotations

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.assessments.klsi_v4.definition import CONTEXT_NAMES  # noqa: F401 ensures registration
from app.db.database import Base
from app.models.klsi import (
    AssessmentItem,
    AssessmentSession,
    LFIContextScore,
    ScaleProvenance,
    SessionStatus,
    User,
    UserResponse,
)
from app.services.scoring import finalize_session
from app.services.seeds import seed_assessment_items, seed_learning_styles


def _db_session():
    engine = create_engine("sqlite+pysqlite:///:memory:", future=True)
    Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()
    seed_learning_styles(db)
    seed_assessment_items(db)
    return db


def test_finalize_records_truncation_and_artifacts():
    db = _db_session()
    try:
        user = User(full_name="Tester", email="tester@example.com")
        db.add(user)
        db.flush()

        session = AssessmentSession(
            user_id=user.id,
            assessment_id="KLSI",
            assessment_version="4.0",
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

        result = finalize_session(db, session.id)
        assert result["ok"] is True

        percentile_entity = result["percentiles"]
        assert percentile_entity.raw_outside_norm_range is True
        assert "CE" in percentile_entity.truncated_scales
        assert percentile_entity.truncated_scales["CE"]["raw"] == 48

        artifacts = result["artifacts"]["percentiles"]
        assert artifacts["raw_outside_norm_range"] is True
        assert "CE" in artifacts["truncated"]
        assert artifacts["truncated"]["CE"]["raw"] == 48
        assert artifacts["norm_group_used"] == "Appendix:Fallback"

        scale_rows = (
            db.query(ScaleProvenance)
            .filter(ScaleProvenance.session_id == session.id)
            .order_by(ScaleProvenance.scale_code.asc())
            .all()
        )
        assert len(scale_rows) == 6
        ce_row = next(row for row in scale_rows if row.scale_code == "CE")
        assert ce_row.truncated is True
        assert ce_row.provenance_tag == "Appendix:CE"
        assert ce_row.source_kind == "appendix"
        assert ce_row.norm_group == "CE"
    finally:
        db.close()
