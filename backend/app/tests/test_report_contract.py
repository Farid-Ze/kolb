import json
from pathlib import Path
from typing import Any

import pytest

from app.i18n.id_messages import ReportBandLabels
from app.schemas.report import as_report_payload
from app.services.report import build_report
from app.services.scoring import finalize_session
from app.tests.helpers import build_seeded_memory_db, seed_complete_session


SAMPLE_PATH = Path(__file__).resolve().parents[3] / "docs" / "sample_api_payloads" / "report.sample.json"
OPTIONAL_SUBTREES = {
    "root.percentiles.truncated_scales",
    "root.enhancedAnalytics.contextual_profile.style_frequency",
}


def _build_payload(*, viewer_role: str | None = None):
    db = build_seeded_memory_db()
    session = seed_complete_session(db)
    finalize_session(db, session.id)
    db.refresh(session)
    payload = build_report(db, session.id, viewer_role=viewer_role)
    model = as_report_payload(payload)
    return db, session, model.model_dump(by_alias=True)


def _assert_subset_structure(sample: Any, actual: Any, path: str = "root") -> None:
    if isinstance(sample, dict):
        assert isinstance(actual, dict), f"{path} expected dict"
        for key, sample_value in sample.items():
            if key not in actual:
                if path in OPTIONAL_SUBTREES:
                    continue
                raise AssertionError(f"{path} missing key '{key}'")
            next_path = f"{path}.{key}" if path else key
            _assert_subset_structure(sample_value, actual[key], next_path)
        return
    if isinstance(sample, list):
        assert isinstance(actual, list), f"{path} expected list"
        assert len(actual) >= len(sample), f"{path} shorter than sample"
        for idx, sample_item in enumerate(sample):
            next_path = f"{path}[{idx}]"
            if idx < len(actual):
                _assert_subset_structure(sample_item, actual[idx], next_path)
        return
    if isinstance(sample, (int, float)):
        assert isinstance(actual, (int, float)), f"{path} expected numeric value"
        return
    if isinstance(sample, str):
        assert isinstance(actual, str) and actual.strip(), f"{path} expected non-empty string"
        return
    if sample is None:
        assert actual is None or actual == [] or actual == {}, f"{path} expected nullable slot"
        return
    assert actual is not None, f"{path} expected value"


def test_report_payload_matches_sample_structure():
    if not SAMPLE_PATH.exists():
        pytest.skip("sample payload missing")

    sample_data = json.loads(SAMPLE_PATH.read_text(encoding="utf-8"))
    db, _session, payload = _build_payload(viewer_role="MEDIATOR")
    try:
        _assert_subset_structure(sample_data, payload)
    finally:
        db.close()


def test_report_contract_marks_truncation_and_mixed_provenance():
    db, session, _ = _build_payload()
    try:
        p = session.percentile_score
        assert p is not None
        p.raw_outside_norm_range = True
        p.truncated_scales = {"AC": {"raw": 50, "min": 11, "max": 44}}
        p.CE_source = "DB:EDU"
        p.AC_source = "DB:EDU"
        p.AE_source = "Appendix:AE"
        p.ACCE_source = "DB:EDU"
        p.AERO_source = "Appendix:AERO"
        p.norm_provenance = {
            "CE": {"source": p.CE_source, "truncated": False},
            "AE": {"source": p.AE_source, "truncated": True},
            "AERO": {"source": p.AERO_source, "truncated": True},
        }
        db.commit()
        payload = build_report(db, session.id)
    finally:
        db.close()

    percentiles = payload["percentiles"]
    assert percentiles["raw_outside_norm_range"] is True
    assert percentiles["truncated_scales"]["AC"]["raw"] == 50
    assert percentiles["per_scale_sources"]["CE"].startswith("DB")
    assert percentiles["per_scale_sources"]["AE"].startswith("Appendix")
    assert percentiles["per_scale_sources"]["AERO"].startswith("Appendix")


def test_report_contract_near_band_edges_classification():
    db, session, _ = _build_payload()
    try:
        combo = session.combination_score
        assert combo is not None
        combo.ACCE_raw = 5  # boundary between low and mid
        combo.AERO_raw = 11  # boundary between mid and high
        db.commit()
        payload = build_report(db, session.id)
    finally:
        db.close()

    bands = payload["percentiles"]["bands"]
    assert bands["ACCE"] == ReportBandLabels.LOW
    assert bands["AERO"] == ReportBandLabels.MID
