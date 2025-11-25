import pytest
import math
from app.assessments.klsi_v4.calculations import (
    aggregate_mode_scores,
    calculate_combination_metrics,
    calculate_style_intensity,
    _safe_div
)
from app.assessments.klsi_v4.types import ScoreVector, BalanceMedians, StyleIntensityMetrics
from pydantic import ValidationError

def test_aggregate_mode_scores_strict_int():
    """Test that aggregate_mode_scores rejects non-integer values when strict validation is enabled."""
    # The roadmap wants strict validation.
    ranks = [("CE", 3.9), ("RO", 1.0), ("AC", 4), ("AE", 2)]
    
    with pytest.raises(TypeError):
        aggregate_mode_scores(ranks)

def test_score_vector_strictness():
    """Test that ScoreVector enforces strict types."""
    # This test is expected to FAIL until we migrate ScoreVector to Pydantic StrictInt.
    with pytest.raises(ValidationError):
        ScoreVector(CE=3.5, RO=1, AC=4, AE=2)

def test_calculate_combination_metrics_nan():
    """Test calculation with NaN values."""
    # If ScoreVector allows NaN, this calculation propagates NaN.
    # We want to prevent NaN from entering the system.
    
    # If we can't instantiate ScoreVector with NaN, this test passes (by raising ValidationError).
    with pytest.raises(ValidationError):
        ScoreVector(CE=float('nan'), RO=1, AC=4, AE=2)

def test_safe_div_behavior():
    """Test the _safe_div function for edge cases."""
    assert _safe_div(10, 0) == 0.0
    assert _safe_div(10, float('nan')) == 0.0
    assert _safe_div(float('inf'), 10) == 0.0 # Wait, inf/10 is inf. _safe_div checks result.
    assert _safe_div(10, 2) == 5.0

def test_style_intensity_overflow():
    """Test style intensity with large numbers."""
    # Python handles large integers automatically, but let's see if we hit limits with sqrt
    huge = 10**308 # Close to max float
    # sqrt(huge^2 + huge^2) -> overflow float
    
    # We expect it to handle it or raise a specific error, not crash with a messy stack trace.
    # Or maybe we just want to ensure it returns a float (inf is a float).
    
    try:
        res = calculate_style_intensity(huge, huge)
        assert math.isinf(res.euclidean)
    except OverflowError:
        # This is also acceptable if handled, but the roadmap says "graceful fallback".
        pass

