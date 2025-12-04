from app.data.norms import AERO_PERCENTILES, CE_PERCENTILES, lookup_percentile


def test_ce_out_of_range_uses_boundary_percentiles():
    """Values outside normative range return boundary percentiles (0.0 or 100.0)."""
    # Below minimum CE raw (min key 11) → 0.0 (0th percentile)
    assert lookup_percentile(10, CE_PERCENTILES) == 0.0
    # Above maximum CE raw (max key 44) → 100.0 (100th percentile)
    assert lookup_percentile(45, CE_PERCENTILES) == 100.0


def test_aero_missing_key_uses_nearest_lower():
    # -32 absent in AERO table, nearest lower is -33 present with 0.0
    assert -32 not in AERO_PERCENTILES
    assert lookup_percentile(-32, AERO_PERCENTILES) == AERO_PERCENTILES[-33]
