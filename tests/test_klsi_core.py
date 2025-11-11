from datetime import datetime

from app.assessments.klsi_v4.logic import STYLE_CUTS, compute_raw_scale_scores
from app.db.database import SessionLocal
from app.models.klsi import (
    AssessmentItem,
    AssessmentSession,
    ItemType,
    SessionStatus,
    User,
    UserResponse,
)
from app.services.scoring import compute_kendalls_w


def test_kendalls_w_extremes():
    # identical ranks across contexts -> W=1
    ctxs_same = [{"CE":1,"RO":2,"AC":3,"AE":4} for _ in range(8)]
    w_same = compute_kendalls_w(ctxs_same)
    assert abs(w_same - 1.0) < 1e-9

    # perfectly counterbalanced ranks across contexts -> W near 0
    ctxs_var = []
    rorders = [
        {"CE":1,"RO":2,"AC":3,"AE":4},
        {"CE":2,"RO":3,"AC":4,"AE":1},
        {"CE":3,"RO":4,"AC":1,"AE":2},
        {"CE":4,"RO":1,"AC":2,"AE":3},
        {"CE":1,"RO":3,"AC":2,"AE":4},
        {"CE":2,"RO":4,"AC":3,"AE":1},
        {"CE":3,"RO":1,"AC":4,"AE":2},
        {"CE":4,"RO":2,"AC":1,"AE":3},
    ]
    ctxs_var.extend(rorders)
    w_var = compute_kendalls_w(ctxs_var)
    assert w_var <= 0.1


def test_style_cuts_boundaries():
    # Check a few boundary conditions
    # Imagining: ACCE<=5 and AERO<=0
    assert STYLE_CUTS["Imagining"](5, 0)
    # Experiencing: ACCE<=5 and 1<=AERO<=11
    assert STYLE_CUTS["Experiencing"](5, 1)
    assert STYLE_CUTS["Experiencing"](5, 11)
    # Initiating: ACCE<=5 and AERO>=12
    assert STYLE_CUTS["Initiating"](5, 12)
    # Reflecting: 6<=ACCE<=14 and AERO<=0
    assert STYLE_CUTS["Reflecting"](6, 0)
    assert STYLE_CUTS["Reflecting"](14, -5)
    # Balancing: 6<=ACCE<=14 and 1<=AERO<=11
    assert STYLE_CUTS["Balancing"](6, 1)
    assert STYLE_CUTS["Balancing"](14, 11)
    # Acting: 6<=ACCE<=14 and AERO>=12
    assert STYLE_CUTS["Acting"](10, 12)
    # Analyzing: ACCE>=15 and AERO<=0
    assert STYLE_CUTS["Analyzing"](15, 0)
    # Thinking: ACCE>=15 and 1<=AERO<=11
    assert STYLE_CUTS["Thinking"](15, 11)
    # Deciding: ACCE>=15 and AERO>=12
    assert STYLE_CUTS["Deciding"](15, 12)


def test_raw_score_rank_direction():
    ranks_by_mode = {"CE": 1, "RO": 2, "AC": 3, "AE": 4}
    with SessionLocal() as db:
        unique_email = f"rank_direction+{datetime.utcnow().timestamp()}@test"
        user = User(full_name="Rank Direction", email=unique_email, role="MAHASISWA")
        db.add(user)
        db.commit()
        db.refresh(user)

        session = AssessmentSession(
            user_id=user.id,
            status=SessionStatus.in_progress,
            assessment_id="KLSI",
            assessment_version="4.0",
        )
        db.add(session)
        db.commit()
        db.refresh(session)

        items = (
            db.query(AssessmentItem)
            .filter(AssessmentItem.item_type == ItemType.learning_style)
            .order_by(AssessmentItem.item_number.asc())
            .all()
        )
        assert len(items) == 12
        for item in items:
            choices = {choice.learning_mode.value: choice for choice in item.choices}
            for mode, rank in ranks_by_mode.items():
                choice = choices[mode]
                db.add(
                    UserResponse(
                        session_id=session.id,
                        item_id=item.id,
                        choice_id=choice.id,
                        rank_value=rank,
                    )
                )
        db.commit()

        scale = compute_raw_scale_scores(db, session.id)
        assert scale.CE_raw == 12  # 12 items * rank 1
        assert scale.RO_raw == 24  # 12 items * rank 2
        assert scale.AC_raw == 36  # 12 items * rank 3
        assert scale.AE_raw == 48  # 12 items * rank 4 -> highest preference
