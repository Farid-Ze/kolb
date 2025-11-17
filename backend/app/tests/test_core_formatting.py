import pytest

from app.core.formatting import distance_to_percent, format_decimal


def test_format_decimal_handles_nullable_values():
    assert format_decimal(None) is None
    assert format_decimal(2.555, decimals=2) == pytest.approx(2.56)


def test_distance_to_percent_scales_and_clamps():
    assert distance_to_percent(0.0, max_distance=45.0) == 100.0
    assert distance_to_percent(45.0, max_distance=45.0) == 0.0
    assert distance_to_percent(90.0, max_distance=45.0) == 0.0
    assert distance_to_percent(5.0, max_distance=45.0, decimals=2) == pytest.approx(88.89, rel=1e-3)
    with pytest.raises(ValueError):
        distance_to_percent(1.0, max_distance=0.0)
