from __future__ import annotations

from datetime import datetime, timezone

from app.models.klsi import (
    AssessmentSession,
    CombinationScore,
    Instrument,
    PercentileScore,
    ScaleProvenance,
    ScaleScore,
    SessionStatus,
    User,
)
from app.services.provenance import backfill_scale_provenance


def _create_session(db):
    user = User(full_name="Seed User", email="seed@example.com")
    db.add(user)
    db.flush()

    instrument = (
        db.query(Instrument)
        .filter(Instrument.code == "KLSI", Instrument.version == "4.0")
        .first()
    )

    sess = AssessmentSession(
        user_id=user.id,
        status=SessionStatus.completed,
        start_time=datetime(2025, 1, 1, tzinfo=timezone.utc),
        end_time=datetime(2025, 1, 2, tzinfo=timezone.utc),
        instrument_id=instrument.id if instrument else None,
    )
    db.add(sess)
    db.flush()
    return sess


def _insert_scores(db, session_id: int) -> None:
    scale = ScaleScore(
        session_id=session_id,
        CE_raw=30,
        RO_raw=22,
        AC_raw=18,
        AE_raw=16,
    )
    combo = CombinationScore(
        session_id=session_id,
        ACCE_raw=scale.AC_raw - scale.CE_raw,
        AERO_raw=scale.AE_raw - scale.RO_raw,
        assimilation_accommodation=(scale.AC_raw + scale.RO_raw) - (scale.AE_raw + scale.CE_raw),
        converging_diverging=(scale.AC_raw + scale.AE_raw) - (scale.CE_raw + scale.RO_raw),
        balance_acce=abs(scale.AC_raw - (scale.CE_raw + 9)),
        balance_aero=abs(scale.AE_raw - (scale.RO_raw + 6)),
    )
    percentile = PercentileScore(
        session_id=session_id,
        norm_group_used="Appendix:Fallback",
        CE_percentile=5.0,
        RO_percentile=55.0,
        AC_percentile=40.0,
        AE_percentile=35.0,
        ACCE_percentile=25.0,
        AERO_percentile=20.0,
        CE_source="Appendix:CE",
        RO_source="DB:Total",
        AC_source="DB:Total",
        AE_source="DB:Total",
        ACCE_source="Appendix:ACCE",
        AERO_source="DB:Total",
        used_fallback_any=True,
        norm_provenance={
            "CE": "Appendix:CE",
            "RO": "DB:Total",
            "AC": "DB:Total",
            "AE": "DB:Total",
            "ACCE": "Appendix:ACCE",
            "AERO": "DB:Total",
        },
        raw_outside_norm_range=True,
        truncated_scales={
            "CE": {"raw": 30, "min": 11, "max": 44},
            "ACCE": {"raw": combo.ACCE_raw, "min": -29, "max": 33},
        },
    )
    db.add_all([scale, combo, percentile])


def test_backfill_scale_provenance(session):
    sess = _create_session(session)
    _insert_scores(session, sess.id)
    session.commit()

    # Ensure table empty prior to backfill
    assert session.query(ScaleProvenance).count() == 0

    backfill_scale_provenance(session)
    session.commit()

    rows = (
        session.query(ScaleProvenance)
        .filter(ScaleProvenance.session_id == sess.id)
        .order_by(ScaleProvenance.scale_code)
        .all()
    )
    assert len(rows) == 6

    ce = next(r for r in rows if r.scale_code == "CE")
    assert ce.source_kind == "appendix"
    assert ce.norm_group == "CE"
    assert ce.truncated is True
    assert ce.raw_score == 30.0
    assert ce.percentile_value == 5.0

    ro = next(r for r in rows if r.scale_code == "RO")
    assert ro.source_kind == "database"
    assert ro.norm_group == "Total"
    assert ro.truncated is False
    assert ro.percentile_value == 55.0

    acce = next(r for r in rows if r.scale_code == "ACCE")
    assert acce.source_kind == "appendix"
    assert acce.norm_group == "ACCE"
    assert acce.truncated is True
