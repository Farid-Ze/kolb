import pytest
from app.assessments.klsi_v4.calculations import calculate_lfi_variance

class TestLFIVarianceEdgeCases:
    """Validate LFI computation against Master Plan requirements."""
    
    def test_perfect_consistency_lfi_equals_one(self):
        """User ranks identically across all contexts -> LFI = 1.0 (Variance ~ 0)"""
        # Same ranking (CE=4, RO=3, AC=2, AE=1) in all 9 contexts
        # Input format: List of dictionaries representing rankings for each context
        ctx = {"CE": 4, "RO": 3, "AC": 2, "AE": 1}
        ranks = [ctx] * 9
        variance = calculate_lfi_variance(ranks)
        # Variance should be 0 for identical rankings
        assert variance < 0.01, f"Perfect consistency should yield near-zero variance, got {variance}"
    
    def test_maximum_inconsistency_lfi_near_zero(self):
        """Random contradictory rankings -> High Variance"""
        # Create a set of highly contradictory rankings
        ranks = [
            {"CE": 4, "RO": 1, "AC": 1, "AE": 4},
            {"CE": 1, "RO": 4, "AC": 4, "AE": 1},
            {"CE": 4, "RO": 1, "AC": 1, "AE": 4},
            {"CE": 1, "RO": 4, "AC": 4, "AE": 1},
            {"CE": 2, "RO": 3, "AC": 3, "AE": 2},
            {"CE": 3, "RO": 2, "AC": 2, "AE": 3},
            {"CE": 4, "RO": 1, "AC": 4, "AE": 1},
            {"CE": 1, "RO": 4, "AC": 1, "AE": 4},
            {"CE": 2, "RO": 3, "AC": 2, "AE": 3}
        ]
        variance = calculate_lfi_variance(ranks)
        # Theoretical max variance is high. 
        # We just assert it's significant to distinguish from consistent.
        assert variance > 2.0, f"High inconsistency should yield high variance, got {variance}"

    def test_calculate_lfi_variance_empty_input(self):
        """Handle empty input gracefully."""
        assert calculate_lfi_variance([]) == 0.0

    def test_calculate_lfi_variance_single_input(self):
        """Single context has zero variance."""
        ctx = {"CE": 4, "RO": 3, "AC": 2, "AE": 1}
        assert calculate_lfi_variance([ctx]) == 0.0
