import math
from app.engine.norms.cached_composite import CachedCompositeNormProvider
from app.models.klsi import NormativeConversionTable

# NOTE: Uses existing session fixture (named 'session') provided by conftest.py
# We focus on DB hit reduction: prime() performs at most one batch query per precedence
# group and subsequent percentile() calls hit the in-process cache (zero extra DB executes).


def _insert_norm_rows(db, group: str, version: str = "default"):
    """Idempotent insert/update for normative rows used by this test."""
    rows = [
        ("CE", 12, 5.0),
        ("RO", 12, 6.0),
        ("AC", 12, 7.0),
        ("AE", 12, 8.0),
        ("ACCE", 0, 50.0),
        ("AERO", 0, 55.0),
    ]
    for scale, raw, pct in rows:
        existing = db.query(NormativeConversionTable).filter(
            NormativeConversionTable.norm_group == group,
            NormativeConversionTable.norm_version == version,
            NormativeConversionTable.scale_name == scale,
            NormativeConversionTable.raw_score == raw,
        ).first()
        if existing:
            existing.percentile = pct
        else:
            db.add(
                NormativeConversionTable(
                    norm_group=group,
                    norm_version=version,
                    scale_name=scale,
                    raw_score=raw,
                    percentile=pct,
                )
            )
    db.commit()


def test_cached_composite_batch_and_cache(session):
    # Arrange: insert norms for 'Total'
    _insert_norm_rows(session, "Total")

    provider = CachedCompositeNormProvider(session, group_chain=["Total"])

    # Monkeypatch session.execute to count calls
    counts = {"exec": 0}
    original_execute = session.execute

    def counting_execute(*args, **kwargs):
        counts["exec"] += 1
        return original_execute(*args, **kwargs)

    session.execute = counting_execute  # type: ignore

    required = [
        ("CE", 12),
        ("RO", 12),
        ("AC", 12),
        ("AE", 12),
        ("ACCE", 0),
        ("AERO", 0),
    ]

    # Act: prime cache (batch load)
    provider.prime(["Total"], required)
    batch_execs = counts["exec"]

    # Assert: At least one query executed during prime (batch)
    assert batch_execs >= 1, "Expected at least one batch DB query during prime()"

    # Act: percentile() calls should be cache hits (no new DB queries)
    for scale, raw in required:
        pct, provenance, truncated = provider.percentile(["Total"], scale, raw)
        assert pct is not None and provenance.startswith("DB:"), f"Expected DB provenance for {scale}"

    post_execs = counts["exec"]
    assert post_execs == batch_execs, "No additional DB queries should occur after prime cache warm-up"

    # LFI fallback path uses appendix, should not increment DB executes
    pct_lfi, prov_lfi, trunc_lfi = provider.percentile(["Total"], "LFI", 50)
    assert prov_lfi.startswith("Appendix:"), "Expected Appendix provenance for LFI"
    assert counts["exec"] == batch_execs, "LFI lookup should not trigger DB query"

    # Clean up monkeypatch
    session.execute = original_execute  # type: ignore
