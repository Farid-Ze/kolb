from __future__ import annotations

from app.services.report import build_report
from app.services.scoring import finalize_session
from app.tests.helpers import build_seeded_memory_db, seed_complete_session


def _finalized_session(db):
    session = seed_complete_session(db)
    result = finalize_session(db, session.id)
    assert result["ok"] is True
    return session


def test_report_balance_block_marks_heuristic():
    db = build_seeded_memory_db()
    try:
        session = _finalized_session(db)
        payload = build_report(db, session.id)
        balance_block = payload["percentiles"]["BALANCE"]
        assert balance_block["heuristic"] is True
        assert balance_block["kind"] == "heuristic_distance"
        assert "note" in balance_block and "bukan" in balance_block["note"].lower()
        assert balance_block["reference"]["centers"]["ACCE"] == 9
    finally:
        db.close()


def test_report_percentiles_include_provenance_metadata():
    db = build_seeded_memory_db()
    try:
        session = _finalized_session(db)
        payload = build_report(db, session.id)
        percentiles = payload["percentiles"]
        assert percentiles["norm_group_used"] == percentiles["source_provenance"]
        per_scale_sources = percentiles["per_scale_sources"]
        assert set(per_scale_sources.keys()) == {"CE", "RO", "AC", "AE", "ACCE", "AERO"}
        assert isinstance(percentiles["per_scale_provenance"], dict)
        assert percentiles["used_fallback_any"] is True
        assert percentiles["raw_outside_norm_range"] is True
        assert "CE" in percentiles["truncated_scales"]
    finally:
        db.close()
