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


def test_learning_space_and_analytics_blocks_flag_heuristics():
    db = build_seeded_memory_db()
    try:
        session = _finalized_session(db)
        payload = build_report(db, session.id)
        learning_space = payload["learning_space"]
        meta = learning_space["meta"]
        assert meta["heuristic"] is True
        assert "heuristik" in meta["note"].lower()
        analytics_meta = payload["analytics"]["meta"]
        assert analytics_meta["heuristic"] is True
        assert "regresi" in analytics_meta["note"].lower()
    finally:
        db.close()


def test_regression_predictions_do_not_mutate_core_scores(monkeypatch):
    db = build_seeded_memory_db()
    try:
        session = _finalized_session(db)
        baseline = build_report(db, session.id)
        raw_before = baseline["raw"].copy()
        percentiles_before = baseline["percentiles"].copy()
        lfi_before = baseline["lfi"].copy() if baseline["lfi"] else None

        def fake_curve(*_args, **_kwargs):
            return [{"acc_assm": -999, "pred_lfi": 0.01}]

        def fake_integrative(**_kwargs):
            return 42.42

        monkeypatch.setattr("app.services.report.predicted_curve", fake_curve)
        monkeypatch.setattr("app.services.report.predict_integrative_development", fake_integrative)

        payload = build_report(db, session.id, viewer_role="MEDIATOR")
        assert payload["raw"] == raw_before
        assert payload["percentiles"] == percentiles_before
        assert payload["lfi"] == lfi_before
        integrative = payload["enhanced_analytics"]["integrative_development"]
        assert integrative["heuristic"] is True
    finally:
        db.close()
