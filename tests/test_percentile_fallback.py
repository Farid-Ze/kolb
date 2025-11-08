from app.data.norms import AERO_PERCENTILES, CE_PERCENTILES, lookup_percentile


def test_ce_out_of_range_uses_nearest_bounds():
    # Below minimum CE raw (min key 11) → nearest higher (11)
    assert lookup_percentile(10, CE_PERCENTILES) == CE_PERCENTILES[11]
    # Above maximum CE raw (max key 44) → nearest lower (44)
    assert lookup_percentile(45, CE_PERCENTILES) == CE_PERCENTILES[44]


def test_aero_missing_key_uses_nearest_lower():
    # -32 absent in AERO table, nearest lower is -33 present with 0.0
    assert -32 not in AERO_PERCENTILES
    assert lookup_percentile(-32, AERO_PERCENTILES) == AERO_PERCENTILES[-33]
